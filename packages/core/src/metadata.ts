import { execa } from 'execa';
import { createFFmpegError, ErrorCode } from './error';

/**
 * 元数据信息
 */
export interface MetadataInfo {
  /** 格式信息 */
  format: {
    /** 文件名 */
    filename: string;
    /** 格式名称 */
    format_name: string;
    /** 格式长名称 */
    format_long_name: string;
    /** 时长（秒） */
    duration: number;
    /** 比特率 */
    bit_rate: number;
    /** 文件大小 */
    size: number;
    /** 标签 */
    tags?: Record<string, string>;
  };

  /** 流信息 */
  streams: StreamInfo[];

  /** 章节信息 */
  chapters?: ChapterInfo[];
}

/**
 * 流信息
 */
export interface StreamInfo {
  /** 流索引 */
  index: number;

  /** 编解码器名称 */
  codec_name: string;

  /** 编解码器长名称 */
  codec_long_name?: string;

  /** 编解码器类型 (video/audio/subtitle) */
  codec_type: 'video' | 'audio' | 'subtitle' | 'data' | 'attachment';

  /** 流索引 */
  stream_index?: number;

  /** 视频流信息 */
  width?: number;
  height?: number;
  fps?: number;
  aspect_ratio?: string;
  pix_fmt?: string;
  level?: number;
  profile?: string;
  bit_rate?: number;

  /** 音频流信息 */
  sample_rate?: number;
  channels?: number;
  channel_layout?: string;
  bits_per_sample?: number;

  /** 旋转角度 */
  rotation?: number;

  /** 标签 */
  tags?: Record<string, string>;

  /** 显示矩阵（用于旋转） */
  displaymatrix?: string;

  /** 其他字段 */
  [key: string]: any;
}

/**
 * 章节信息
 */
export interface ChapterInfo {
  /** 章节 ID */
  id: number;

  /** 开始时间（秒） */
  start_time: number;

  /** 结束时间（秒） */
  end_time: number;

  /** 标签 */
  tags?: Record<string, string>;
}

/**
 * 元数据处理器
 * 完整的元数据读取和处理功能
 */
export class MetadataProcessor {
  private ffprobePath: string;

  constructor(ffprobePath: string = 'ffprobe') {
    this.ffprobePath = ffprobePath;
  }

  /**
   * 获取完整的元数据信息
   */
  async getMetadata(input: string): Promise<MetadataInfo> {
    try {
      const result = await execa(this.ffprobePath, [
        '-v',
        'error',
        '-show_format',
        '-show_streams',
        '-show_chapters',
        '-print_format',
        'json',
        input,
      ]);

      const data = JSON.parse(result.stdout);

      // 解析格式信息
      const format = {
        filename: data.format.filename || '',
        format_name: data.format.format_name || '',
        format_long_name: data.format.format_long_name || '',
        duration: parseFloat(data.format.duration) || 0,
        bit_rate: parseInt(data.format.bit_rate) || 0,
        size: parseInt(data.format.size) || 0,
        tags: data.format.tags || {},
      };

      // 解析流信息
      const streams: StreamInfo[] = (data.streams || []).map((stream: any) => {
        const info: StreamInfo = {
          index: stream.index,
          codec_name: stream.codec_name || '',
          codec_long_name: stream.codec_long_name,
          codec_type: stream.codec_type,
          tags: stream.tags || {},
        };

        // 视频流
        if (stream.codec_type === 'video') {
          info.width = stream.width || 0;
          info.height = stream.height || 0;
          info.aspect_ratio = stream.display_aspect_ratio;
          info.pix_fmt = stream.pix_fmt;
          info.level = stream.level;
          info.profile = stream.profile;
          info.bit_rate = parseInt(stream.bit_rate) || 0;

          // 解析帧率
          if (stream.r_frame_rate) {
            const [num, den] = stream.r_frame_rate.split('/');
            info.fps = den ? parseInt(num) / parseInt(den) : parseInt(num);
          }

          // 检测旋转信息
          info.rotation = this.detectRotation(stream);
        }

        // 音频流
        if (stream.codec_type === 'audio') {
          info.sample_rate = stream.sample_rate || 0;
          info.channels = stream.channels || 0;
          info.channel_layout = stream.channel_layout;
          info.bits_per_sample = stream.bits_per_sample || 0;
          info.bit_rate = parseInt(stream.bit_rate) || 0;
        }

        return info;
      });

      // 解析章节信息
      const chapters: ChapterInfo[] = (data.chapters || []).map((chapter: any) => ({
        id: chapter.id,
        start_time: parseFloat(chapter.start_time) || 0,
        end_time: parseFloat(chapter.end_time) || 0,
        tags: chapter.tags || {},
      }));

      return {
        format,
        streams,
        chapters,
      };
    } catch (error: any) {
      throw createFFmpegError(ErrorCode.INPUT_INVALID_FORMAT, 'Failed to read metadata', {
        details: { error: error.message },
        suggestion: 'Please check if the file exists and is a valid media file',
        cause: error,
      });
    }
  }

  /**
   * 检测视频旋转角度
   */
  private detectRotation(stream: any): number {
    // 方法1: 检查 rotation 标签
    if (stream.tags && stream.tags.rotate) {
      return parseInt(stream.tags.rotate);
    }

    // 方法2: 检查 displaymatrix
    if (stream.displaymatrix) {
      const match = stream.displaymatrix.match(/rotation\s+(\d+)/);
      if (match) {
        return parseInt(match[1]);
      }
    }

    // 方法3: 检查 side_data_list
    if (stream.side_data_list) {
      for (const sideData of stream.side_data_list) {
        if (sideData.rotation !== undefined) {
          return sideData.rotation;
        }
      }
    }

    return 0;
  }

  /**
   * 获取视频流信息
   */
  async getVideoStream(input: string): Promise<StreamInfo | null> {
    const metadata = await this.getMetadata(input);
    return metadata.streams.find((s) => s.codec_type === 'video') || null;
  }

  /**
   * 获取音频流信息
   */
  async getAudioStream(input: string, index: number = 0): Promise<StreamInfo | null> {
    const metadata = await this.getMetadata(input);
    const audioStreams = metadata.streams.filter((s) => s.codec_type === 'audio');
    return audioStreams[index] || null;
  }

  /**
   * 检测是否需要自动旋转
   */
  async needsAutoRotate(input: string): Promise<boolean> {
    const videoStream = await this.getVideoStream(input);
    if (!videoStream) {
      return false;
    }

    // 检查是否有旋转元数据
    return videoStream.rotation !== undefined && videoStream.rotation !== 0;
  }

  /**
   * 获取自动旋转滤镜
   */
  async getAutoRotateFilter(input: string): Promise<string | null> {
    const videoStream = await this.getVideoStream(input);
    if (!videoStream || !videoStream.rotation) {
      return null;
    }

    const rotation = videoStream.rotation;

    // 根据旋转角度返回相应的滤镜
    if (rotation === 90 || rotation === -270) {
      return 'transpose=1'; // 顺时针90度
    } else if (rotation === 180 || rotation === -180) {
      return 'transpose=1,transpose=1'; // 180度
    } else if (rotation === 270 || rotation === -90) {
      return 'transpose=2'; // 逆时针90度
    }

    return null;
  }

  /**
   * 清除旋转元数据
   */
  getClearRotationCommand(): string[] {
    return ['-metadata:s:v:0', 'rotate=0'];
  }

  /**
   * 获取视频时长
   */
  async getDuration(input: string): Promise<number> {
    try {
      const result = await execa(this.ffprobePath, [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        input,
      ]);

      return parseFloat(result.stdout) || 0;
    } catch (error) {
      return 0;
    }
  }

  /**
   * 获取视频分辨率
   */
  async getResolution(input: string): Promise<{ width: number; height: number }> {
    const videoStream = await this.getVideoStream(input);

    if (!videoStream) {
      return { width: 0, height: 0 };
    }

    return {
      width: videoStream.width || 0,
      height: videoStream.height || 0,
    };
  }

  /**
   * 获取视频帧率
   */
  async getFrameRate(input: string): Promise<number> {
    const videoStream = await this.getVideoStream(input);
    return videoStream?.fps || 0;
  }

  /**
   * 获取音频采样率
   */
  async getAudioSampleRate(input: string): Promise<number> {
    const audioStream = await this.getAudioStream(input);
    return audioStream?.sample_rate || 0;
  }

  /**
   * 获取音频通道数
   */
  async getAudioChannels(input: string): Promise<number> {
    const audioStream = await this.getAudioStream(input);
    return audioStream?.channels || 0;
  }

  /**
   * 检查是否有音频流
   */
  async hasAudio(input: string): Promise<boolean> {
    const metadata = await this.getMetadata(input);
    return metadata.streams.some((s) => s.codec_type === 'audio');
  }

  /**
   * 检查是否有视频流
   */
  async hasVideo(input: string): Promise<boolean> {
    const metadata = await this.getMetadata(input);
    return metadata.streams.some((s) => s.codec_type === 'video');
  }

  /**
   * 获取所有音频流
   */
  async getAllAudioStreams(input: string): Promise<StreamInfo[]> {
    const metadata = await this.getMetadata(input);
    return metadata.streams.filter((s) => s.codec_type === 'audio');
  }

  /**
   * 获取所有字幕流
   */
  async getAllSubtitleStreams(input: string): Promise<StreamInfo[]> {
    const metadata = await this.getMetadata(input);
    return metadata.streams.filter((s) => s.codec_type === 'subtitle');
  }
}

/**
 * 全局元数据处理器实例
 */
let globalMetadataProcessor: MetadataProcessor | null = null;

/**
 * 获取元数据处理器实例
 */
export function getMetadataProcessor(ffprobePath?: string): MetadataProcessor {
  if (!globalMetadataProcessor) {
    globalMetadataProcessor = new MetadataProcessor(ffprobePath);
  }
  return globalMetadataProcessor;
}
