import type {
  HardwareAcceleration,
  VideoFilterOptions,
  AudioFilterOptions,
} from './types';

/**
 * FFmpeg 命令构建器
 * 负责构建 FFmpeg 命令行参数
 */
export class CommandBuilder {
  private inputArgs: string[] = [];
  private outputArgs: string[] = [];
  private inputFiles: string[] = [];
  private outputFiles: string[] = [];
  private complexFilters: string[] = [];
  private mappings: string[] = [];
  private metadata: Record<string, string> = {};

  /**
   * 添加输入文件
   */
  addInput(input: string): this {
    this.inputFiles.push(input);
    return this;
  }

  /**
   * 添加输入选项
   */
  addInputOption(option: string, value?: string): this {
    this.inputArgs.push(option);
    if (value !== undefined) {
      this.inputArgs.push(value);
    }
    return this;
  }

  /**
   * 设置输出文件
   */
  setOutput(output: string): this {
    this.outputFiles.push(output);
    return this;
  }

  /**
   * 添加输出选项
   */
  addOutputOption(option: string, value?: string): this {
    this.outputArgs.push(option);
    if (value !== undefined) {
      this.outputArgs.push(value);
    }
    return this;
  }

  /**
   * 设置视频编码器
   */
  setVideoCodec(codec: string): this {
    return this.addOutputOption('-c:v', codec);
  }

  /**
   * 设置音频编码器
   */
  setAudioCodec(codec: string): this {
    return this.addOutputOption('-c:a', codec);
  }

  /**
   * 设置视频比特率
   */
  setVideoBitrate(bitrate: string | number): this {
    const value = typeof bitrate === 'number' ? `${bitrate}k` : bitrate;
    return this.addOutputOption('-b:v', value);
  }

  /**
   * 设置音频比特率
   */
  setAudioBitrate(bitrate: string | number): this {
    const value = typeof bitrate === 'number' ? `${bitrate}k` : bitrate;
    return this.addOutputOption('-b:a', value);
  }

  /**
   * 设置音频采样率
   */
  setAudioFrequency(frequency: number): this {
    return this.addOutputOption('-ar', frequency.toString());
  }

  /**
   * 设置音频通道数
   */
  setAudioChannels(channels: number): this {
    return this.addOutputOption('-ac', channels.toString());
  }

  /**
   * 设置音量
   */
  setVolume(volume: number): this {
    return this.addAudioFilter(`volume=${volume}`);
  }

  /**
   * 设置帧率
   */
  setFPS(fps: number): this {
    return this.addOutputOption('-r', fps.toString());
  }

  /**
   * 设置视频大小（分辨率）
   */
  setSize(size: string | { width: number; height: number }): this {
    if (typeof size === 'string') {
      // 预设分辨率
      const presets: Record<string, string> = {
        '4k': '3840x2160',
        '1080p': '1920x1080',
        '720p': '1280x720',
        '480p': '854x480',
        '360p': '640x360',
      };
      const resolution = presets[size.toLowerCase()] || size;
      return this.addOutputOption('-s', resolution);
    } else {
      return this.addOutputOption('-s', `${size.width}x${size.height}`);
    }
  }

  /**
   * 设置硬件加速
   */
  setHardwareAcceleration(type: HardwareAcceleration): this {
    if (type === 'none') {
      return this;
    }

    if (type === 'auto') {
      // 自动检测最佳硬件加速
      // 这里只是设置标志，实际检测需要在外部进行
      return this.addInputOption('-hwaccel', 'auto');
    }

    // 特定硬件加速
    const hwAccelCodecs: Record<string, string> = {
      nvenc: 'h264_nvenc',
      qsv: 'h264_qsv',
      vce: 'h264_amf',
      videotoolbox: 'h264_videotoolbox',
    };

    const codec = hwAccelCodecs[type];
    if (codec) {
      this.setVideoCodec(codec);
    }

    return this;
  }

  /**
   * 设置线程数
   */
  setThreads(threads: number): this {
    if (threads > 0) {
      return this.addOutputOption('-threads', threads.toString());
    }
    return this;
  }

  /**
   * 设置持续时间
   */
  setDuration(seconds: number): this {
    return this.addOutputOption('-t', seconds.toString());
  }

  /**
   * 设置起始时间
   */
  setStartTime(seconds: number): this {
    return this.addInputOption('-ss', seconds.toString());
  }

  /**
   * 视频拼接
   * 将多个输入文件拼接为一个输出文件
   * @param inputs 输入文件列表
   */
  concat(inputs: string[]): this {
    // 添加所有输入文件
    inputs.forEach((input) => this.addInput(input));

    // 使用 concat 协议或滤镜
    if (inputs.length > 1) {
      // 构建输入标签
      const inputLabels = inputs.map((_, i) => `[${i}:v][${i}:a]`).join('');
      const filterComplex = `${inputLabels}concat=n=${inputs.length}:v=1:a=1[outv][outa]`;

      this.complexFilters.push(filterComplex);
      this.addOutputOption('-map', '[outv]');
      this.addOutputOption('-map', '[outa]');
    }

    return this;
  }

  /**
   * 无音频拼接
   * 用于拼接没有音轨的视频
   */
  concatWithoutAudio(inputs: string[]): this {
    inputs.forEach((input) => this.addInput(input));

    if (inputs.length > 1) {
      const inputLabels = inputs.map((_, i) => `[${i}:v]`).join('');
      const filterComplex = `${inputLabels}concat=n=${inputs.length}:v=1:a=0[outv]`;

      this.complexFilters.push(filterComplex);
      this.addOutputOption('-map', '[outv]');
    }

    return this;
  }

  /**
   * 视频旋转
   * @param angle 旋转角度（度数）
   */
  rotate(angle: number): this {
    // 将角度转换为弧度
    const radians = (angle * Math.PI) / 180;
    this.addVideoFilter(`rotate=${radians}`);
    return this;
  }

  /**
   * 水平翻转
   */
  flip(): this {
    this.addVideoFilter('hflip');
    return this;
  }

  /**
   * 垂直翻转
   */
  flop(): this {
    this.addVideoFilter('vflip');
    return this;
  }

  /**
   * 添加视频滤镜
   */
  addVideoFilter(filter: string): this {
    this.complexFilters.push(filter);
    return this;
  }

  /**
   * 添加音频滤镜
   */
  addAudioFilter(filter: string): this {
    this.complexFilters.push(filter);
    return this;
  }

  /**
   * 添加图片水印
   * @param watermarkPath 水印图片路径
   * @param options 水印选项
   */
  addWatermark(
    watermarkPath: string,
    options: {
      /** 位置: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | 自定义坐标 */
      position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | { x: number; y: number };
      /** 透明度 (0-1) */
      opacity?: number;
      /** 缩放比例 (0-1) */
      scale?: number;
    } = {}
  ): this {
    // 添加水印图片作为输入
    this.addInput(watermarkPath);

    // 计算位置
    let position = '0:0';
    if (options.position) {
      if (typeof options.position === 'string') {
        const positions: Record<string, string> = {
          topLeft: '0:0',
          topRight: 'main_w-overlay_w:0',
          bottomLeft: '0:main_h-overlay_h',
          bottomRight: 'main_w-overlay_w:main_h-overlay_h',
          center: '(main_w-overlay_w)/2:(main_h-overlay_h)/2',
        };
        position = positions[options.position] || '0:0';
      } else {
        position = `${options.position.x}:${options.position.y}`;
      }
    }

    // 构建滤镜链
    let filterChain = '[0:v][1:v]';

    // 缩放水印
    if (options.scale) {
      const scaleFilter = `scale=iw*${options.scale}:ih*${options.scale}`;
      filterChain += `[1:v]${scaleFilter}[scaled];[0:v][scaled]`;
    }

    // 构建overlay滤镜
    let overlayFilter = `overlay=${position}`;

    // 添加透明度
    if (options.opacity !== undefined) {
      overlayFilter += `:format=auto:alpha=${options.opacity}`;
    }

    filterChain += overlayFilter;

    this.complexFilters.push(filterChain);

    return this;
  }

  /**
   * 计算水印位置坐标
   */
  private calculateTextPosition(
    position: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | { x: number; y: number }
  ): { x: string; y: string } {
    const positions: Record<string, { x: string; y: string }> = {
      topLeft: { x: '10', y: '10' },
      topRight: { x: 'w-tw-10', y: '10' },
      bottomLeft: { x: '10', y: 'h-th-10' },
      bottomRight: { x: 'w-tw-10', y: 'h-th-10' },
      center: { x: '(w-tw)/2', y: '(h-th)/2' },
    };

    if (typeof position === 'string') {
      return positions[position]! ?? positions.topLeft;
    }

    return { x: position.x.toString(), y: position.y.toString() };
  }

  /**
   * 添加文字水印
   * @param text 水印文字
   * @param options 文字水印选项
   */
  addTextWatermark(
    text: string,
    options: {
      /** 字体文件路径 */
      fontFile?: string;
      /** 字体大小 */
      fontSize?: number;
      /** 字体颜色 */
      fontColor?: string;
      /** 位置 */
      position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | { x: number; y: number };
      /** 透明度 (0-1) */
      opacity?: number;
      /** 边框颜色 */
      borderColor?: string;
      /** 边框宽度 */
      borderWidth?: number;
      /** 阴影颜色 */
      shadowColor?: string;
      /** 阴影偏移 */
      shadowOffset?: number;
    } = {}
  ): this {
    // 构建drawtext滤镜参数
    const params: string[] = [];

    // 文字内容
    params.push(`text='${text.replace(/'/g, "\\'")}'`);

    // 字体
    if (options.fontFile) {
      params.push(`fontfile='${options.fontFile}'`);
    }

    // 字体大小
    if (options.fontSize) {
      params.push(`fontsize=${options.fontSize}`);
    }

    // 字体颜色
    if (options.fontColor) {
      params.push(`fontcolor=${options.fontColor}`);
    }

    // 位置
    if (options.position) {
      const pos = this.calculateTextPosition(options.position);
      params.push(`x=${pos.x}`, `y=${pos.y}`);
    }

    // 透明度
    if (options.opacity !== undefined) {
      params.push(`alpha=${options.opacity}`);
    }

    // 边框
    if (options.borderColor) {
      params.push(`bordercolor=${options.borderColor}`);
    }
    if (options.borderWidth) {
      params.push(`borderw=${options.borderWidth}`);
    }

    // 阴影
    if (options.shadowColor) {
      params.push(`shadowcolor=${options.shadowColor}`);
    }
    if (options.shadowOffset) {
      params.push(`shadowx=${options.shadowOffset}`, `shadowy=${options.shadowOffset}`);
    }

    // 构建完整滤镜
    const filter = `drawtext=${params.join(':')}`;

    this.addVideoFilter(filter);

    return this;
  }

  /**
   * 构建缩放滤镜
   */
  private buildScaleFilter(scale: VideoFilterOptions['scale']): string | null {
    if (!scale) return null;
    if (typeof scale === 'string') {
      return `scale=${scale}`;
    }
    return `scale=${scale.width}:${scale.height}`;
  }

  /**
   * 构建裁剪滤镜
   */
  private buildCropFilter(crop: VideoFilterOptions['crop']): string | null {
    if (!crop) return null;
    return `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y}`;
  }

  /**
   * 构建颜色调整滤镜
   */
  private buildColorFilters(options: VideoFilterOptions): string[] {
    const filters: string[] = [];

    if (options.brightness !== undefined) {
      filters.push(`eq=brightness=${options.brightness}`);
    }
    if (options.contrast !== undefined) {
      filters.push(`eq=contrast=${options.contrast}`);
    }
    if (options.saturation !== undefined) {
      filters.push(`eq=saturation=${options.saturation}`);
    }

    return filters;
  }

  /**
   * 构建几何变换滤镜
   */
  private buildGeometryFilters(options: VideoFilterOptions): string[] {
    const filters: string[] = [];

    if (options.rotate !== undefined) {
      filters.push(`rotate=${options.rotate}`);
    }
    if (options.hflip) {
      filters.push('hflip');
    }
    if (options.vflip) {
      filters.push('vflip');
    }

    return filters;
  }

  /**
   * 构建模糊和锐化滤镜
   */
  private buildBlurSharpenFilters(options: VideoFilterOptions): string[] {
    const filters: string[] = [];

    if (options.blur !== undefined) {
      filters.push(`boxblur=${options.blur}:${options.blur}`);
    }
    if (options.sharpen !== undefined) {
      filters.push(`unsharp=5:5:${options.sharpen}`);
    }

    return filters;
  }

  /**
   * 应用视频滤镜选项
   */
  applyVideoFilters(options: VideoFilterOptions): this {
    const filters: string[] = [];

    // 缩放
    const scaleFilter = this.buildScaleFilter(options.scale);
    if (scaleFilter) filters.push(scaleFilter);

    // 裁剪
    const cropFilter = this.buildCropFilter(options.crop);
    if (cropFilter) filters.push(cropFilter);

    // 几何变换
    filters.push(...this.buildGeometryFilters(options));

    // 模糊和锐化
    filters.push(...this.buildBlurSharpenFilters(options));

    // 颜色调整
    filters.push(...this.buildColorFilters(options));

    // 应用所有滤镜
    if (filters.length > 0) {
      this.complexFilters.push(...filters);
    }

    return this;
  }

  /**
   * 应用音频滤镜选项
   */
  applyAudioFilters(options: AudioFilterOptions): this {
    const filters: string[] = [];

    if (options.volume !== undefined) {
      filters.push(`volume=${options.volume}`);
    }

    if (options.denoise) {
      filters.push('afftdn');
    }

    if (options.normalize) {
      filters.push('loudnorm');
    }

    if (filters.length > 0) {
      this.complexFilters.push(...filters);
    }

    return this;
  }

  /**
   * 添加元数据
   */
  addMetadata(key: string, value: string): this {
    this.metadata[key] = value;
    return this;
  }

  /**
   * 移除所有元数据
   */
  removeAllMetadata(): this {
    return this.addOutputOption('-map_metadata', '-1');
  }

  /**
   * 生成 HLS 流媒体格式
   * @param options HLS 配置选项
   */
  setHLS(options: {
    /** 分片时长（秒） */
    segmentDuration?: number;
    /** 播放列表文件名 */
    playlistName?: string;
    /** 分片文件名模板 */
    segmentName?: string;
    /** 分片数量限制 */
    listSize?: number;
    /** 是否包装为fMP4 */
    fmp4?: boolean;
  } = {}): this {
    const {
      segmentDuration = 10,
      playlistName = 'playlist.m3u8',
      segmentName = 'segment%03d.ts',
      listSize = 0,
      fmp4 = false,
    } = options;

    // 设置输出格式
    this.setFormat('hls');

    // HLS 特定选项
    this.addOutputOption('-hls_time', segmentDuration.toString());
    this.addOutputOption('-hls_list_size', listSize.toString());
    this.addOutputOption('-hls_segment_filename', segmentName);

    if (fmp4) {
      this.addOutputOption('-hls_segment_type', 'fmp4');
    }

    // 设置播放列表文件名
    this.setOutput(playlistName);

    return this;
  }

  /**
   * 生成 DASH 流媒体格式
   * @param options DASH 配置选项
   */
  setDASH(options: {
    /** 分片时长（秒） */
    segmentDuration?: number;
    /** MPD 文件名 */
    manifestName?: string;
    /** 分片文件名模板 */
    segmentName?: string;
    /** 是否启用直播模式 */
    live?: boolean;
  } = {}): this {
    const {
      segmentDuration = 10,
      manifestName = 'manifest.mpd',
      segmentName = 'chunk-stream$RepresentationID$-$Number%05d$.m4s',
      live = false,
    } = options;

    // 设置输出格式
    this.setFormat('dash');

    // DASH 特定选项
    this.addOutputOption('-seg_duration', segmentDuration.toString());
    this.addOutputOption('-init_seg_name', 'init-stream$RepresentationID$.m4s');
    this.addOutputOption('-media_seg_name', segmentName);

    if (live) {
      this.addOutputOption('-window_size', '5');
      this.addOutputOption('-extra_window_size', '10');
    }

    // 设置 MPD 文件名
    this.setOutput(manifestName);

    return this;
  }

  /**
   * 设置格式
   */
  setFormat(format: string): this {
    return this.addOutputOption('-f', format);
  }

  /**
   * 覆盖输出文件
   */
  overwrite(): this {
    return this.addOutputOption('-y');
  }

  /**
   * 不覆盖输出文件
   */
  noOverwrite(): this {
    return this.addOutputOption('-n');
  }

  /**
   * 构建完整的命令行参数
   */
  build(): string[] {
    const args: string[] = [];

    // 覆盖输出文件
    args.push('-y');

    // 输入参数
    args.push(...this.inputArgs);

    // 输入文件
    for (const input of this.inputFiles) {
      args.push('-i', input);
    }

    // 复杂滤镜
    if (this.complexFilters.length > 0) {
      args.push('-filter_complex', this.complexFilters.join(';'));
    }

    // 映射
    args.push(...this.mappings);

    // 输出参数
    args.push(...this.outputArgs);

    // 元数据
    for (const [key, value] of Object.entries(this.metadata)) {
      args.push('-metadata', `${key}=${value}`);
    }

    // 输出文件
    const lastOutputFile = this.outputFiles[this.outputFiles.length - 1];
    if (lastOutputFile) {
      args.push(lastOutputFile);
    }

    return args;
  }

  /**
   * 构建命令字符串（用于调试）
   */
  buildString(): string {
    const args = this.build();
    return `ffmpeg ${args.map((arg) => (arg.includes(' ') ? `"${arg}"` : arg)).join(' ')}`;
  }

  /**
   * 获取当前选项（用于缓存键生成）
   */
  getOptions(): Record<string, any> {
    return {
      inputArgs: this.inputArgs,
      outputArgs: this.outputArgs,
      inputFiles: this.inputFiles,
      outputFiles: this.outputFiles,
      complexFilters: this.complexFilters,
      mappings: this.mappings,
      metadata: this.metadata,
    };
  }

  /**
   * 重置构建器
   */
  reset(): void {
    this.inputArgs = [];
    this.outputArgs = [];
    this.inputFiles = [];
    this.outputFiles = [];
    this.complexFilters = [];
    this.mappings = [];
    this.metadata = {};
  }

  /**
   * 混合多个音频轨道
   * @param audioInputs 音频输入列表
   * @param options 混合选项
   */
  mixAudio(
    audioInputs: Array<{
      /** 输入文件路径或索引 */
      input: string | number;
      /** 音量 (0.0 - 1.0 或更高) */
      volume?: number;
      /** 开始时间（秒） */
      startTime?: number;
      /** 持续时间（秒） */
      duration?: number;
    }>,
    options: {
      /** 输出音频编码器 */
      codec?: string;
      /** 输出音频比特率 */
      bitrate?: string | number;
    } = {}
  ): this {
    // 添加所有音频输入
    audioInputs.forEach((audioInput) => {
      if (typeof audioInput.input === 'string') {
        this.addInput(audioInput.input);
      }
    });

    // 构建 amix 滤镜
    const inputLabels: string[] = [];
    const filterParts: string[] = [];

    audioInputs.forEach((audioInput, index) => {
      const inputIdx = typeof audioInput.input === 'number' ? audioInput.input : this.inputFiles.length - audioInputs.length + index;

      // 构建输入标签
      let inputLabel = `[${inputIdx}:a]`;

      // 应用音量调节
      if (audioInput.volume !== undefined) {
        const volumeFilter = `volume=${audioInput.volume}`;
        inputLabel = `[audio${index}]`;
        filterParts.push(`[${inputIdx}:a]${volumeFilter}${inputLabel}`);
      }

      // 应用时间裁剪
      if (audioInput.startTime !== undefined || audioInput.duration !== undefined) {
        const trimParts: string[] = [];
        if (audioInput.startTime !== undefined) {
          trimParts.push(`start=${audioInput.startTime}`);
        }
        if (audioInput.duration !== undefined) {
          trimParts.push(`duration=${audioInput.duration}`);
        }
        const trimFilter = `atrim=${trimParts.join(':')},asetpts=PTS-STARTPTS`;
        const newLabel = `[audio_trimmed${index}]`;
        filterParts.push(`${inputLabel}${trimFilter}${newLabel}`);
        inputLabel = newLabel;
      }

      inputLabels.push(inputLabel);
    });

    // 构建 amix 滤镜
    const mixFilter = `amix=inputs=${audioInputs.length}:duration=longest:dropout_transition=2`;
    const fullFilter = filterParts.length > 0
      ? `${filterParts.join(';')};${inputLabels.join('')}${mixFilter}[audio_out]`
      : `${inputLabels.join('')}${mixFilter}[audio_out]`;

    this.complexFilters.push(fullFilter);
    this.addOutputOption('-map', '[audio_out]');

    // 设置音频编码器
    if (options.codec) {
      this.setAudioCodec(options.codec);
    }

    // 设置音频比特率
    if (options.bitrate) {
      this.setAudioBitrate(options.bitrate);
    }

    return this;
  }

  /**
   * 截取单个视频帧
   * @param timestamp 截图时间点（秒）
   * @param output 输出文件路径
   */
  screenshot(timestamp: number, output: string): this {
    // 设置截图时间点
    this.setStartTime(timestamp);

    // 只截取一帧
    this.setDuration(0.1);

    // 设置输出格式为图片
    this.setFormat('image2');

    // 设置输出文件
    this.setOutput(output);

    return this;
  }

  /**
   * 截取多个视频帧
   * @param options 截图选项
   */
  screenshots(options: {
    /** 截图时间点列表（秒） */
    timestamps: number[];
    /** 输出文件名模板（使用 %d 作为序号） */
    filenameTemplate?: string;
    /** 输出目录 */
    outputDir?: string;
    /** 图片格式 */
    format?: 'jpg' | 'png' | 'bmp';
    /** 图片质量 (1-31, 仅jpg) */
    quality?: number;
  }): this {
    const {
      timestamps,
      filenameTemplate = 'screenshot_%d.jpg',
      outputDir = '.',
      format = 'jpg',
      quality = 2,
    } = options;

    // 构建 fps 滤镜参数
    const selectExpr = timestamps.map((t) => `eq(n\\,${Math.round(t * 30)})`).join('+');
    const filter = `select='${selectExpr}',scale=iw:-1`;

    this.addVideoFilter(filter);

    // 设置输出格式
    this.setFormat('image2');

    // 设置质量（仅jpg）
    if (format === 'jpg' && quality) {
      this.addOutputOption('-q:v', quality.toString());
    }

    // 设置输出文件
    const outputPath = `${outputDir}/${filenameTemplate}`;
    this.setOutput(outputPath);

    return this;
  }

  /**
   * 生成视频缩略图
   * @param options 缩略图选项
   */
  thumbnails(options: {
    /** 缩略图数量 */
    count: number;
    /** 输出文件名模板 */
    filenameTemplate?: string;
    /** 输出目录 */
    outputDir?: string;
    /** 图片格式 */
    format?: 'jpg' | 'png';
    /** 图片宽度 */
    width?: number;
  }): this {
    const {
      count,
      filenameTemplate = 'thumb_%d.jpg',
      outputDir = '.',
      format: _format = 'jpg',
      width,
    } = options;

    // 构建 fps 滤镜
    let filter = `fps=1/${count}`;
    if (width) {
      filter += `,scale=${width}:-1`;
    }

    this.addVideoFilter(filter);

    // 设置输出格式
    this.setFormat('image2');

    // 设置输出文件
    const outputPath = `${outputDir}/${filenameTemplate}`;
    this.setOutput(outputPath);

    return this;
  }
}
