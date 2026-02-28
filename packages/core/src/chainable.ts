import { FFmpegWrapper } from './ffmpeg';
import { CommandBuilder } from './command-builder';
import { CacheManager, type CacheOptions } from './cache';
import type {
  InputType,
  OutputType,
  FFmpegOptions,
  FFmpegResult,
  FFmpegEventListeners,
  HardwareAcceleration,
  VideoFilterOptions,
  AudioFilterOptions,
} from './types';

/**
 * 链式 API 类
 * 提供流畅的链式调用接口
 */
export class ChainableFFmpeg {
  private wrapper: FFmpegWrapper;
  private commandBuilder: CommandBuilder;
  private inputValue: InputType | null = null;
  private outputValue: OutputType | null = null;
  private listeners: FFmpegEventListeners = {};
  private cacheManager?: CacheManager;
  private cacheEnabled = false;

  constructor(options: FFmpegOptions = {}) {
    this.wrapper = new FFmpegWrapper(options);
    this.commandBuilder = this.wrapper.getCommandBuilder();
  }

  /**
   * 设置输入文件
   */
  input(input: InputType): this {
    this.inputValue = input;
    return this;
  }

  /**
   * 设置输出文件
   */
  output(output: OutputType): this {
    this.outputValue = output;
    return this;
  }

  /**
   * 设置视频编码器
   */
  videoCodec(codec: string): this {
    this.commandBuilder.setVideoCodec(codec);
    return this;
  }

  /**
   * 设置音频编码器
   */
  audioCodec(codec: string): this {
    this.commandBuilder.setAudioCodec(codec);
    return this;
  }

  /**
   * 设置视频比特率
   */
  videoBitrate(bitrate: string | number): this {
    this.commandBuilder.setVideoBitrate(bitrate);
    return this;
  }

  /**
   * 设置音频比特率
   */
  audioBitrate(bitrate: string | number): this {
    this.commandBuilder.setAudioBitrate(bitrate);
    return this;
  }

  /**
   * 设置音频采样率
   */
  audioFrequency(frequency: number): this {
    this.commandBuilder.setAudioFrequency(frequency);
    return this;
  }

  /**
   * 设置音频通道数
   */
  audioChannels(channels: number): this {
    this.commandBuilder.setAudioChannels(channels);
    return this;
  }

  /**
   * 调整音量
   */
  volume(volume: number): this {
    this.commandBuilder.setVolume(volume);
    return this;
  }

  /**
   * 设置帧率
   */
  fps(fps: number): this {
    this.commandBuilder.setFPS(fps);
    return this;
  }

  /**
   * 设置分辨率
   */
  size(size: string | { width: number; height: number }): this {
    this.commandBuilder.setSize(size);
    return this;
  }

  /**
   * 设置硬件加速
   */
  hardwareAccelerate(type: HardwareAcceleration): this {
    this.commandBuilder.setHardwareAcceleration(type);
    return this;
  }

  /**
   * 设置线程数
   */
  threads(count: number): this {
    this.commandBuilder.setThreads(count);
    return this;
  }

  /**
   * 设置持续时间
   */
  duration(seconds: number): this {
    this.commandBuilder.setDuration(seconds);
    return this;
  }

  /**
   * 设置起始时间
   */
  startTime(seconds: number): this {
    this.commandBuilder.setStartTime(seconds);
    return this;
  }

  /**
   * 裁剪视频片段
   */
  trim(start: number, end: number): this {
    this.commandBuilder.setStartTime(start);
    this.commandBuilder.setDuration(end - start);
    return this;
  }

  /**
   * 拼接多个视频
   */
  concat(inputs: string[]): this {
    this.commandBuilder.concat(inputs);
    return this;
  }

  /**
   * 拼接无音频视频
   */
  concatWithoutAudio(inputs: string[]): this {
    this.commandBuilder.concatWithoutAudio(inputs);
    return this;
  }

  /**
   * 旋转视频
   * @param angle 旋转角度（度数）
   */
  rotate(angle: number): this {
    this.commandBuilder.rotate(angle);
    return this;
  }

  /**
   * 水平翻转
   */
  flip(): this {
    this.commandBuilder.flip();
    return this;
  }

  /**
   * 垂直翻转
   */
  flop(): this {
    this.commandBuilder.flop();
    return this;
  }

  /**
   * 视频裁剪区域
   */
  crop(x: number, y: number, width: number, height: number): this {
    this.commandBuilder.applyVideoFilters({
      crop: { x, y, width, height }
    });
    return this;
  }

  /**
   * 截取单个视频帧
   */
  screenshot(timestamp: number, output: string): this {
    this.commandBuilder.screenshot(timestamp, output);
    return this;
  }

  /**
   * 截取多个视频帧
   */
  screenshots(options: {
    timestamps: number[];
    filenameTemplate?: string;
    outputDir?: string;
    format?: 'jpg' | 'png' | 'bmp';
    quality?: number;
  }): this {
    this.commandBuilder.screenshots(options);
    return this;
  }

  /**
   * 生成缩略图
   */
  thumbnails(options: {
    count: number;
    filenameTemplate?: string;
    outputDir?: string;
    format?: 'jpg' | 'png';
    width?: number;
  }): this {
    this.commandBuilder.thumbnails(options);
    return this;
  }

  /**
   * 设置输出格式
   */
  format(format: string): this {
    this.commandBuilder.setFormat(format);
    return this;
  }

  /**
   * 生成 HLS 流媒体
   */
  hls(options?: {
    segmentDuration?: number;
    playlistName?: string;
    segmentName?: string;
    listSize?: number;
    fmp4?: boolean;
  }): this {
    this.commandBuilder.setHLS(options);
    return this;
  }

  /**
   * 生成 DASH 流媒体
   */
  dash(options?: {
    segmentDuration?: number;
    manifestName?: string;
    segmentName?: string;
    live?: boolean;
  }): this {
    this.commandBuilder.setDASH(options);
    return this;
  }

  /**
   * 生成 HLS 流媒体并立即执行
   */
  async toHLS(
    output: string,
    options?: {
      segmentDuration?: number;
      playlistName?: string;
      segmentName?: string;
      listSize?: number;
      fmp4?: boolean;
    }
  ): Promise<FFmpegResult> {
    this.commandBuilder.setHLS(options);
    this.output(output);
    return this.run();
  }

  /**
   * 生成 DASH 流媒体并立即执行
   */
  async toDASH(
    output: string,
    options?: {
      segmentDuration?: number;
      manifestName?: string;
      segmentName?: string;
      live?: boolean;
    }
  ): Promise<FFmpegResult> {
    this.commandBuilder.setDASH(options);
    this.output(output);
    return this.run();
  }

  /**
   * 应用视频滤镜
   */
  videoFilters(options: VideoFilterOptions): this {
    this.commandBuilder.applyVideoFilters(options);
    return this;
  }

  /**
   * 应用音频滤镜
   */
  audioFilters(options: AudioFilterOptions): this {
    this.commandBuilder.applyAudioFilters(options);
    return this;
  }

  /**
   * 混合多个音频轨道
   */
  mix(
    audioInputs: Array<{
      input: string | number;
      volume?: number;
      startTime?: number;
      duration?: number;
    }>,
    options?: {
      codec?: string;
      bitrate?: string | number;
    }
  ): this {
    this.commandBuilder.mixAudio(audioInputs, options);
    return this;
  }

  /**
   * 添加图片水印
   */
  watermark(
    watermarkPath: string,
    options?: {
      position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | { x: number; y: number };
      opacity?: number;
      scale?: number;
    }
  ): this {
    this.commandBuilder.addWatermark(watermarkPath, options);
    return this;
  }

  /**
   * 添加文字水印
   */
  textWatermark(
    text: string,
    options?: {
      fontFile?: string;
      fontSize?: number;
      fontColor?: string;
      position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | { x: number; y: number };
      opacity?: number;
      borderColor?: string;
      borderWidth?: number;
      shadowColor?: string;
      shadowOffset?: number;
    }
  ): this {
    this.commandBuilder.addTextWatermark(text, options);
    return this;
  }

  /**
   * 添加元数据
   */
  metadata(key: string, value: string): this {
    this.commandBuilder.addMetadata(key, value);
    return this;
  }

  /**
   * 移除所有元数据
   */
  noMetadata(): this {
    this.commandBuilder.removeAllMetadata();
    return this;
  }

  /**
   * 自动旋转
   * 根据视频元数据自动应用旋转滤镜
   */
  async autoRotate(): Promise<this> {
    if (!this.inputValue || typeof this.inputValue !== 'string') {
      return this;
    }

    const { MetadataProcessor } = await import('./metadata');
    const processor = new MetadataProcessor();

    const needsRotate = await processor.needsAutoRotate(this.inputValue);
    if (!needsRotate) {
      return this;
    }

    const filter = await processor.getAutoRotateFilter(this.inputValue);
    if (filter) {
      this.commandBuilder.addVideoFilter(filter);
      // 清除旋转元数据
      const clearCmd = processor.getClearRotationCommand();
      clearCmd.forEach((cmd) => {
        const [key, value] = cmd.split(' ');
        if (key && value) {
          this.commandBuilder.addOutputOption(key, value);
        }
      });
    }

    return this;
  }

  /**
   * 添加自定义 FFmpeg 选项
   */
  outputOption(option: string, value?: string): this {
    this.commandBuilder.addOutputOption(option, value);
    return this;
  }

  /**
   * 添加自定义输入选项
   */
  inputOption(option: string, value?: string): this {
    this.commandBuilder.addInputOption(option, value);
    return this;
  }

  /**
   * 启用缓存
   */
  cache(options: Partial<CacheOptions> = {}): this {
    this.cacheEnabled = options.enabled !== false;
    if (this.cacheEnabled) {
      this.cacheManager = new CacheManager({
        enabled: true,
        ...options,
      });
    }
    return this;
  }

  /**
   * 注册事件监听器
   */
  on<K extends keyof FFmpegEventListeners>(
    event: K,
    listener: NonNullable<FFmpegEventListeners[K]>
  ): this {
    this.listeners[event] = listener;
    this.wrapper.on(event, listener as any);
    return this;
  }

  /**
   * 执行 FFmpeg 命令
   * 返回 Promise，同时支持事件监听
   */
  async run(): Promise<FFmpegResult> {
    if (!this.inputValue) {
      throw new Error('请先调用 input() 设置输入文件');
    }

    if (!this.outputValue) {
      throw new Error('请先调用 output() 设置输出文件');
    }

    // 检查缓存
    if (this.cacheEnabled && this.cacheManager && typeof this.inputValue === 'string') {
      const inputPath = this.inputValue;
      const options = this.commandBuilder.getOptions();
      const cacheKey = this.cacheManager.getCacheKey(inputPath, options);

      // 尝试从缓存获取
      const cachedOutput = this.cacheManager.get(cacheKey);
      if (cachedOutput) {
        // 返回缓存结果
        return {
          output: cachedOutput,
          duration: 0,
          size: 0,
          command: this.commandBuilder.buildString(),
          logs: '[从缓存加载]',
        };
      }

      // 执行转换
      const result = await this.wrapper.run(this.inputValue, this.outputValue);

      // 保存到缓存
      if (typeof this.outputValue === 'string') {
        this.cacheManager.set(cacheKey, inputPath, this.outputValue, options);
      }

      return result;
    }

    return this.wrapper.run(this.inputValue, this.outputValue);
  }

  /**
   * 获取完整的 FFmpeg 命令（用于调试）
   */
  getCommand(): string {
    return this.commandBuilder.buildString();
  }

  /**
   * 终止执行
   */
  kill(): void {
    this.wrapper.kill();
  }
}
