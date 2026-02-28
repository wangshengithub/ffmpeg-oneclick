import { execa, type ExecaChildProcess } from 'execa';
import EventEmitter from 'events';
import { createFFmpegError, ErrorCode } from './error';
import { CommandBuilder } from './command-builder';
import { ProgressParser } from './progress';
import type {
  FFmpegOptions,
  FFmpegResult,
  ProgressInfo,
  VideoMetadata,
  InputType,
  OutputType,
} from './types';

/**
 * FFmpeg 包装器
 * 核心类，负责执行 FFmpeg 命令
 */
export class FFmpegWrapper extends EventEmitter {
  private options: FFmpegOptions;
  private commandBuilder: CommandBuilder;
  private progressParser: ProgressParser;
  private process: ExecaChildProcess | null = null;
  private killed = false;
  private startTime = 0;
  private inputDuration = 0;

  constructor(options: FFmpegOptions = {}) {
    super();
    this.options = options;
    this.commandBuilder = new CommandBuilder();
    this.progressParser = new ProgressParser();
  }

  /**
   * 获取 FFmpeg 可执行文件路径
   * 如果 FFmpeg 不存在，会自动下载
   */
  private async getFFmpegPath(): Promise<string> {
    if (this.options.ffmpegPath) {
      return this.options.ffmpegPath;
    }

    // 尝试从 @ffmpeg-oneclick/bin 获取（自动下载）
    try {
      const binPackage = await import('@ffmpeg-oneclick/bin');
      // 使用异步版本，会自动下载
      if (binPackage.getFFmpegPathAsync) {
        return await binPackage.getFFmpegPathAsync();
      }
      // 回退到同步版本
      return binPackage.getFFmpegPath();
    } catch {
      // 如果没有安装，尝试使用系统 FFmpeg
      return 'ffmpeg';
    }
  }

  /**
   * 获取 FFprobe 可执行文件路径
   * 如果 FFprobe 不存在，会自动下载
   */
  private async getFFprobePath(): Promise<string> {
    if (this.options.ffprobePath) {
      return this.options.ffprobePath;
    }

    // 尝试从 @ffmpeg-oneclick/bin 获取（自动下载）
    try {
      const binPackage = await import('@ffmpeg-oneclick/bin');
      // 使用异步版本，会自动下载
      if (binPackage.getFFprobePathAsync) {
        return await binPackage.getFFprobePathAsync();
      }
      // 回退到同步版本
      return binPackage.getFFprobePath();
    } catch {
      // 如果没有安装，尝试使用系统 ffprobe
      return 'ffprobe';
    }
  }

  /**
   * 获取输入文件时长（用于进度计算）
   */
  private async getInputDuration(input: string): Promise<number> {
    try {
      const ffprobePath = await this.getFFprobePath();
      const result = await execa(ffprobePath, [
        '-v',
        'error',
        '-show_entries',
        'format=duration',
        '-of',
        'default=noprint_wrappers=1:nokey=1',
        input,
      ]);

      return parseFloat(result.stdout) || 0;
    } catch {
      return 0;
    }
  }

  /**
   * 验证输入和输出
   */
  private validateInputOutput(input: InputType, output: OutputType): void {
    if (!input) {
      throw createFFmpegError(ErrorCode.INPUT_NOT_FOUND, '输入文件不能为空', {
        suggestion: '请提供有效的输入文件路径、Buffer 或 Stream',
      });
    }

    if (!output) {
      throw createFFmpegError(ErrorCode.OUTPUT_PATH_INVALID, '输出路径不能为空', {
        suggestion: '请提供有效的输出文件路径或 Stream',
      });
    }
  }

  /**
   * 设置输入和输出配置
   */
  private async setupInputOutput(input: InputType, output: OutputType): Promise<void> {
    // 设置输入
    if (typeof input === 'string') {
      this.commandBuilder.addInput(input);
      this.inputDuration = await this.getInputDuration(input);
    } else {
      // Buffer 或 Stream 输入
      this.commandBuilder.addInput('pipe:0');
    }

    // 设置输出
    if (typeof output === 'string') {
      this.commandBuilder.setOutput(output);
      this.commandBuilder.overwrite();
    } else {
      // Stream 输出
      this.commandBuilder.setFormat('pipe:1');
    }
  }

  /**
   * 设置硬件加速和线程选项
   */
  private setupOptions(): void {
    if (this.options.hardwareAcceleration) {
      this.commandBuilder.setHardwareAcceleration(this.options.hardwareAcceleration);
    }

    if (this.options.threads && this.options.threads > 0) {
      this.commandBuilder.setThreads(this.options.threads);
    }
  }

  /**
   * 处理标准错误输出和进度解析
   */
  private handleStderr(data: Buffer, logs: string): string {
    const line = data.toString();
    logs += line;

    // 发送 stderr 事件
    this.emit('stderr', line);

    // 解析进度
    const progress = this.progressParser.parseLine(line);
    if (progress && progress.time !== undefined && this.inputDuration > 0) {
      const percent = this.progressParser.calculatePercent(progress.time, this.inputDuration);
      const speed = progress.fps ? progress.fps / 30 : 1; // 假设 30fps 为基准
      const eta = this.progressParser.calculateETA(progress.time, this.inputDuration, speed);

      const progressInfo: ProgressInfo = {
        percent,
        eta,
        frames: progress.frames || 0,
        time: progress.time,
        bitrate: progress.bitrate || 0,
        fps: progress.fps || 0,
        size: progress.size || 0,
      };

      this.emit('progress', progressInfo);
    }

    return logs;
  }

  /**
   * 处理输入流
   */
  private handleInputStreams(input: InputType): void {
    // 如果是 Buffer 输入，写入到 stdin
    if (Buffer.isBuffer(input) && this.process?.stdin) {
      this.process.stdin.write(input);
      this.process.stdin.end();
    }

    // 如果是 Stream 输入，管道到 stdin
    if (typeof input !== 'string' && 'pipe' in input && this.process?.stdin) {
      input.pipe(this.process.stdin);
    }
  }

  /**
   * 处理输出流
   */
  private handleOutputStreams(output: OutputType): void {
    // 如果是 Stream 输出，管道到输出
    if (typeof output !== 'string' && 'write' in output && this.process?.stdout) {
      this.process.stdout.pipe(output);
    }
  }

  /**
   * 构建执行结果
   */
  private async buildResult(
    output: OutputType,
    command: string,
    logs: string
  ): Promise<FFmpegResult> {
    const duration = Date.now() - this.startTime;

    // 获取输出文件大小
    let outputSize = 0;
    if (typeof output === 'string') {
      try {
        const fs = await import('fs/promises');
        const stats = await fs.stat(output);
        outputSize = stats.size;
      } catch {
        // 忽略错误
      }
    }

    return {
      output: typeof output === 'string' ? output : 'stream',
      duration,
      size: outputSize,
      command,
      logs,
    };
  }

  /**
   * 处理执行错误
   */
  private handleExecutionError(error: any, logs: string, command: string): never {
    if (this.killed) {
      throw createFFmpegError(ErrorCode.FFMPEG_TIMEOUT, 'FFmpeg 执行超时', {
        suggestion: '请尝试增加超时时间或处理较小的文件',
        retryable: false,
        cause: error,
      });
    }

    const ffmpegError = createFFmpegError(
      ErrorCode.FFMPEG_EXECUTION_FAILED,
      `FFmpeg 执行失败: ${error.message}`,
      {
        details: { stderr: logs, command },
        suggestion: '请检查 FFmpeg 命令参数是否正确',
        retryable: false,
        cause: error,
      }
    );

    this.emit('error', ffmpegError);
    throw ffmpegError;
  }

  /**
   * 执行 FFmpeg 命令
   */
  async run(input: InputType, output: OutputType): Promise<FFmpegResult> {
    this.startTime = Date.now();
    this.killed = false;

    // 验证输入和输出
    this.validateInputOutput(input, output);

    // 设置输入和输出配置
    await this.setupInputOutput(input, output);

    // 设置硬件加速和线程选项
    this.setupOptions();

    // 构建命令参数
    const args = this.commandBuilder.build();
    const ffmpegPath = await this.getFFmpegPath();

    // 发送开始事件
    const command = `${ffmpegPath} ${args.join(' ')}`;
    this.emit('start', command);

    let logs = '';

    try {
      // 执行 FFmpeg
      this.process = execa(ffmpegPath, args, {
        timeout: this.options.timeout || 0,
        buffer: false,
        stdin: typeof input !== 'string' ? 'pipe' : undefined,
        stdout: typeof output !== 'string' ? 'pipe' : undefined,
      });

      // 处理标准错误（FFmpeg 进度信息）
      if (this.process.stderr) {
        this.process.stderr.on('data', (data: Buffer) => {
          logs = this.handleStderr(data, logs);
        });
      }

      // 处理标准输出
      if (this.process.stdout) {
        this.process.stdout.on('data', (data: Buffer) => {
          this.emit('stdout', data.toString());
        });
      }

      // 处理输入流
      this.handleInputStreams(input);

      // 处理输出流
      this.handleOutputStreams(output);

      // 等待执行完成
      await this.process;

      // 构建结果
      const result = await this.buildResult(output, command, logs);

      this.emit('end', result);

      return result;
    } catch (error: any) {
      this.handleExecutionError(error, logs, command);
    } finally {
      this.process = null;
      this.progressParser.reset();
    }
  }

  /**
   * 终止 FFmpeg 进程
   */
  kill(): void {
    if (this.process) {
      this.killed = true;
      this.process.kill('SIGTERM');
      this.emit('stderr', 'FFmpeg 进程已终止');
    }
  }

  /**
   * 清理所有事件监听器
   */
  cleanup(): void {
    // 终止进程
    if (this.process) {
      this.kill();
    }

    // 移除所有事件监听器
    this.removeAllListeners();

    // 重置状态
    this.progressParser.reset();
    this.process = null;
    this.killed = false;
  }

  /**
   * 销毁实例
   */
  destroy(): void {
    this.cleanup();
  }

  /**
   * 获取视频元数据
   */
  async getMetadata(input: string): Promise<VideoMetadata> {
    const ffprobePath = this.options.ffprobePath || 'ffprobe';

    try {
      // 查询所有流信息
      const result = await execa(ffprobePath, [
        '-v',
        'error',
        '-show_entries',
        'stream=codec_type,codec_name,width,height,r_frame_rate,bit_rate,sample_rate,channels,channel_layout',
        '-show_entries',
        'format=duration',
        '-of',
        'json',
        input,
      ]);

      const data = JSON.parse(result.stdout);
      const format = data.format || {};

      // 找到视频流
      const videoStream = data.streams?.find((s: any) => s.codec_type === 'video') || {};
      // 找到音频流
      const audioStream = data.streams?.find((s: any) => s.codec_type === 'audio') || {};

      // 解析帧率
      let fps = 0;
      if (videoStream.r_frame_rate) {
        const [num, den] = videoStream.r_frame_rate.split('/');
        fps = den ? parseInt(num) / parseInt(den) : parseInt(num);
      }

      return {
        duration: parseFloat(format.duration) || 0,
        width: videoStream.width || 0,
        height: videoStream.height || 0,
        fps,
        videoCodec: videoStream.codec_name || '',
        audioCodec: audioStream.codec_name || '',
        videoBitrate: parseInt(videoStream.bit_rate) || 0,
        audioBitrate: parseInt(audioStream.bit_rate) || 0,
        audioSampleRate: parseInt(audioStream.sample_rate) || 0,
        audioChannels: parseInt(audioStream.channels) || 0,
      };
    } catch (error: any) {
      throw createFFmpegError(ErrorCode.INPUT_INVALID_FORMAT, '无法读取视频元数据', {
        suggestion: '请检查文件是否损坏或格式是否支持',
        cause: error,
      });
    }
  }

  /**
   * 获取命令构建器
   */
  getCommandBuilder(): CommandBuilder {
    return this.commandBuilder;
  }
}
