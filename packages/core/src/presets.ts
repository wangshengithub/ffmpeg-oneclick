import { ChainableFFmpeg } from './chainable';
import { ffmpeg } from './index';

/**
 * 预设配置
 */
export interface PresetConfig {
  /** 预设名称 */
  name: string;

  /** 预设描述 */
  description?: string;

  /** 视频编码器 */
  videoCodec?: string;

  /** 音频编码器 */
  audioCodec?: string;

  /** 视频比特率 */
  videoBitrate?: string | number;

  /** 音频比特率 */
  audioBitrate?: string | number;

  /** 帧率 */
  fps?: number;

  /** 分辨率 */
  size?: string | { width: number; height: number };

  /** 格式 */
  format?: string;

  /** 其他选项 */
  options?: Record<string, any>;

  /** 自定义处理器 */
  processor?: (instance: ChainableFFmpeg, options?: any) => ChainableFFmpeg;
}

/**
 * 预设管理器
 * 管理和使用各种转换预设
 */
export class PresetManager {
  private presets: Map<string, PresetConfig> = new Map();

  constructor() {
    // 注册内置预设
    this.registerBuiltInPresets();
  }

  /**
   * 注册压缩预设
   */
  private registerCompressionPresets(): void {
    this.register('compress:high', {
      name: 'High Compression',
      description: 'High compression ratio, smaller file size',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '500k',
      audioBitrate: '96k',
      fps: 24,
      size: '720p',
    });

    this.register('compress:medium', {
      name: 'Medium Compression',
      description: 'Balanced compression and quality',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '1M',
      audioBitrate: '128k',
      fps: 30,
    });

    this.register('compress:low', {
      name: 'Low Compression',
      description: 'Low compression, high quality',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '2M',
      audioBitrate: '192k',
      fps: 30,
    });
  }

  /**
   * 注册设备和平台预设
   */
  private registerPlatformPresets(): void {
    this.register('web:optimized', {
      name: 'Web Optimized',
      description: 'Optimized for web streaming',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '1.5M',
      audioBitrate: '128k',
      fps: 30,
      options: {
        preset: 'slow',
        tune: 'film',
      },
    });

    this.register('mobile:friendly', {
      name: 'Mobile Friendly',
      description: 'Optimized for mobile devices',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '800k',
      audioBitrate: '96k',
      size: '720p',
      fps: 30,
    });

    this.register('platform:youtube', {
      name: 'YouTube',
      description: 'Optimized for YouTube upload',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '8M',
      audioBitrate: '384k',
      fps: 30,
      options: {
        preset: 'slow',
        profile: 'high',
        level: '4.1',
      },
    });

    this.register('platform:tiktok', {
      name: 'TikTok',
      description: 'Optimized for TikTok upload',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '2M',
      audioBitrate: '128k',
      size: '1080p',
      fps: 30,
    });
  }

  /**
   * 注册格式转换预设
   */
  private registerFormatPresets(): void {
    this.register('gif:optimized', {
      name: 'Optimized GIF',
      description: 'Create optimized animated GIF',
      format: 'gif',
      fps: 15,
      size: '480x270',
      processor: (instance) => {
        return instance.outputOption('loop', '0');
      },
    });

    this.register('audio:extract', {
      name: 'Extract Audio',
      description: 'Extract audio track from video',
      audioCodec: 'mp3',
      audioBitrate: '192k',
      processor: (instance) => {
        return instance.outputOption('-vn'); // No video
      },
    });
  }

  /**
   * 注册流媒体预设
   */
  private registerStreamingPresets(): void {
    this.register('streaming:hls', {
      name: 'HLS Streaming',
      description: 'Create HLS streaming format (m3u8)',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '2M',
      audioBitrate: '128k',
      processor: (instance, options?: { segmentDuration?: number }) => {
        return instance.hls({
          segmentDuration: options?.segmentDuration || 10,
          playlistName: 'playlist.m3u8',
          segmentName: 'segment%03d.ts',
        });
      },
    });

    this.register('streaming:dash', {
      name: 'DASH Streaming',
      description: 'Create DASH streaming format (mpd)',
      videoCodec: 'libx264',
      audioCodec: 'aac',
      videoBitrate: '2M',
      audioBitrate: '128k',
      processor: (instance, options?: { segmentDuration?: number }) => {
        return instance.dash({
          segmentDuration: options?.segmentDuration || 10,
          manifestName: 'manifest.mpd',
        });
      },
    });
  }

  /**
   * 注册截图预设
   */
  private registerScreenshotPresets(): void {
    this.register('screenshot:single', {
      name: 'Single Screenshot',
      description: 'Capture a single frame from video',
      format: 'image2',
      processor: (instance, options?: { time?: number }) => {
        const time = options?.time || 1;
        return instance.screenshot(time, 'screenshot.jpg');
      },
    });

    this.register('thumbnail:preview', {
      name: 'Preview Thumbnail',
      description: 'Create preview thumbnail image',
      format: 'image2',
      processor: (instance, options?: { time?: number }) => {
        const time = options?.time || 1;
        return instance.startTime(time).duration(0.1);
      },
    });
  }

  /**
   * 注册内置预设
   */
  private registerBuiltInPresets(): void {
    this.registerCompressionPresets();
    this.registerPlatformPresets();
    this.registerFormatPresets();
    this.registerStreamingPresets();
    this.registerScreenshotPresets();
  }

  /**
   * 注册预设
   */
  register(name: string, config: PresetConfig): void {
    // 验证配置
    if (!config.name) {
      throw new Error('Preset config must have a name property');
    }

    // 检查是否覆盖内置预设
    if (this.presets.has(name)) {
      console.warn(`Preset "${name}" already exists and will be overridden`);
    }

    // 验证视频比特率格式
    if (config.videoBitrate && !this.isValidBitrate(config.videoBitrate)) {
      throw new Error(`Invalid video bitrate: ${config.videoBitrate}`);
    }

    // 验证音频比特率格式
    if (config.audioBitrate && !this.isValidBitrate(config.audioBitrate)) {
      throw new Error(`Invalid audio bitrate: ${config.audioBitrate}`);
    }

    this.presets.set(name, config);
  }

  /**
   * 验证比特率格式
   * @private
   */
  private isValidBitrate(bitrate: string | number): boolean {
    if (typeof bitrate === 'number') return bitrate > 0;
    // 支持格式: 1500, 1500k, 1.5M, 2G
    return /^\d+(\.\d+)?[kMG]?$/.test(String(bitrate));
  }

  /**
   * 获取预设
   */
  get(name: string): PresetConfig | undefined {
    if (!name || typeof name !== 'string') {
      console.warn('Preset name must be a non-empty string');
      return undefined;
    }
    return this.presets.get(name);
  }

  /**
   * 列出所有预设
   */
  list(): Array<{ name: string; config: PresetConfig }> {
    return Array.from(this.presets.entries()).map(([name, config]) => ({
      name,
      config,
    }));
  }

  /**
   * 应用配置到实例
   */
  private applyConfig(
    instance: ChainableFFmpeg,
    config: PresetConfig
  ): void {
    // 应用基本配置
    if (config.videoCodec) instance.videoCodec(config.videoCodec);
    if (config.audioCodec) instance.audioCodec(config.audioCodec);
    if (config.videoBitrate) instance.videoBitrate(config.videoBitrate);
    if (config.audioBitrate) instance.audioBitrate(config.audioBitrate);
    if (config.fps) instance.fps(config.fps);
    if (config.size) instance.size(config.size);
    if (config.format) instance.format(config.format);

    // 应用其他选项
    if (config.options) {
      Object.entries(config.options).forEach(([key, value]) => {
        instance.outputOption(`-${key}`, String(value));
      });
    }
  }

  /**
   * 验证并获取预设配置（私有辅助方法）
   */
  private validateAndGetPreset(
    input: string,
    output: string,
    presetName: string
  ): { config: PresetConfig; instance: ChainableFFmpeg } {
    // 验证输入参数
    if (!input || typeof input !== 'string') {
      throw new Error('Input file path is required and must be a string');
    }

    if (!output || typeof output !== 'string') {
      throw new Error('Output file path is required and must be a string');
    }

    if (!presetName || typeof presetName !== 'string') {
      throw new Error('Preset name is required and must be a string');
    }

    const config = this.presets.get(presetName);

    if (!config) {
      const availablePresets = Array.from(this.presets.keys()).join(', ');
      throw new Error(
        `Preset not found: ${presetName}. Available presets: ${availablePresets}`
      );
    }

    const instance = ffmpeg(input).output(output);

    // 应用配置
    this.applyConfig(instance, config);

    return { config, instance };
  }

  /**
   * 应用预设
   */
  apply(
    input: string,
    output: string,
    presetName: string,
    options?: any
  ): ChainableFFmpeg {
    const { config, instance } = this.validateAndGetPreset(input, output, presetName);

    // 应用自定义处理器
    if (config.processor) {
      try {
        const result = config.processor(instance, options);
        // 支持异步 processor
        if (result instanceof Promise) {
          throw new Error(
            `Preset "${presetName}" uses async processor. Use applyAsync() instead of apply()`
          );
        }
      } catch (error: any) {
        throw new Error(
          `Failed to apply preset processor for ${presetName}: ${error.message}`
        );
      }
    }

    return instance;
  }

  /**
   * 异步应用预设（支持异步处理器）
   */
  async applyAsync(
    input: string,
    output: string,
    presetName: string,
    options?: any
  ): Promise<ChainableFFmpeg> {
    const { config, instance } = this.validateAndGetPreset(input, output, presetName);

    // 应用自定义处理器（支持异步）
    if (config.processor) {
      try {
        const result = config.processor(instance, options);
        if (result instanceof Promise) {
          await result;
        }
      } catch (error: any) {
        throw new Error(
          `Failed to apply preset processor for ${presetName}: ${error.message}`
        );
      }
    }

    return instance;
  }

  /**
   * 快速压缩视频
   */
  async compressVideo(
    input: string,
    output: string,
    quality: 'high' | 'medium' | 'low' = 'medium'
  ): Promise<any> {
    const presetName = `compress:${quality}`;
    return this.apply(input, output, presetName).run();
  }

  /**
   * 转换为 GIF
   */
  async toGif(
    input: string,
    output: string,
    options?: { startTime?: number; duration?: number; fps?: number; size?: string }
  ): Promise<any> {
    const instance = ffmpeg(input)
      .output(output)
      .format('gif')
      .fps(options?.fps || 15);

    if (options?.startTime !== undefined) {
      instance.startTime(options.startTime);
    }

    if (options?.duration !== undefined) {
      instance.duration(options.duration);
    }

    if (options?.size) {
      instance.size(options.size);
    } else {
      instance.size('480x270');
    }

    return instance.run();
  }

  /**
   * 提取音频
   */
  async extractAudio(input: string, output: string, bitrate?: string): Promise<any> {
    const instance = ffmpeg(input)
      .output(output)
      .audioCodec('mp3')
      .outputOption('-vn'); // No video

    if (bitrate) {
      instance.audioBitrate(bitrate);
    } else {
      instance.audioBitrate('192k');
    }

    return instance.run();
  }

  /**
   * Web 优化
   */
  async webOptimized(input: string, output: string): Promise<any> {
    return this.apply(input, output, 'web:optimized').run();
  }

  /**
   * 移动设备优化
   */
  async mobileFriendly(input: string, output: string): Promise<any> {
    return this.apply(input, output, 'mobile:friendly').run();
  }

  /**
   * 创建缩略图
   */
  async createThumbnail(
    input: string,
    output: string,
    time?: number
  ): Promise<any> {
    return this.apply(input, output, 'thumbnail:preview', { time }).run();
  }
}

/**
 * 全局预设管理器实例
 */
export const presets = new PresetManager();
