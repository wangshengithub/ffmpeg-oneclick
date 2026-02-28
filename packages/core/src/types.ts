/**
 * FFmpeg 进度信息
 */
export interface ProgressInfo {
  /** 完成百分比 (0-100) */
  percent: number;

  /** 预计剩余时间（秒） */
  eta: number;

  /** 当前帧数 */
  frames: number;

  /** 当前时间（秒） */
  time: number;

  /** 当前比特率 (kbps) */
  bitrate: number;

  /** 编码速度 (fps) */
  fps: number;

  /** 已处理文件大小（字节） */
  size: number;
}

/**
 * FFmpeg 执行结果
 */
export interface FFmpegResult {
  /** 输出文件路径 */
  output: string;

  /** 执行时长（毫秒） */
  duration: number;

  /** 最终文件大小（字节） */
  size: number;

  /** FFmpeg 命令 */
  command: string;

  /** FFmpeg 输出日志 */
  logs: string;
}

/**
 * 视频元数据
 */
export interface VideoMetadata {
  /** 视频时长（秒） */
  duration: number;

  /** 视频宽度 */
  width: number;

  /** 视频高度 */
  height: number;

  /** 帧率 */
  fps: number;

  /** 视频编码格式 */
  videoCodec: string;

  /** 音频编码格式 */
  audioCodec: string;

  /** 视频比特率 (kbps) */
  videoBitrate: number;

  /** 音频比特率 (kbps) */
  audioBitrate: number;

  /** 音频采样率 */
  audioSampleRate: number;

  /** 音频通道数 */
  audioChannels: number;
}

/**
 * 硬件加速类型
 */
export type HardwareAcceleration = 'auto' | 'none' | 'nvenc' | 'qsv' | 'vce' | 'videotoolbox';

/**
 * 输入类型
 */
export type InputType = string | Buffer | NodeJS.ReadableStream;

/**
 * 输出类型
 */
export type OutputType = string | NodeJS.WritableStream;

/**
 * FFmpeg 事件监听器
 */
export interface FFmpegEventListeners {
  /** 开始执行 */
  start?: (command: string) => void;

  /** 进度更新 */
  progress?: (progress: ProgressInfo) => void;

  /** 执行完成 */
  end?: (result: FFmpegResult) => void;

  /** 执行错误 */
  error?: (error: Error) => void;

  /** 收到标准输出 */
  stdout?: (data: string) => void;

  /** 收到标准错误 */
  stderr?: (data: string) => void;
}

/**
 * FFmpeg 配置选项
 */
export interface FFmpegOptions {
  /** FFmpeg 可执行文件路径 */
  ffmpegPath?: string;

  /** FFprobe 可执行文件路径 */
  ffprobePath?: string;

  /** 硬件加速模式 */
  hardwareAcceleration?: HardwareAcceleration;

  /** 线程数（0 = 自动） */
  threads?: number;

  /** 超时时间（毫秒，0 = 无限制） */
  timeout?: number;

  /** 日志级别 */
  logLevel?: 'quiet' | 'error' | 'warning' | 'info' | 'verbose' | 'debug';

  /** 缓存配置 */
  cache?: CacheOptions;
}

/**
 * 缓存配置选项
 */
export interface CacheOptions {
  /** 是否启用缓存 */
  enabled?: boolean;

  /** 缓存目录 */
  dir?: string;

  /** 缓存生存时间（秒） */
  ttl?: number;

  /** 最大缓存大小（字节） */
  maxSize?: number;
}

/**
 * 视频滤镜参数
 */
export interface VideoFilterOptions {
  /** 缩放 */
  scale?: string | { width: number; height: number };

  /** 裁剪 */
  crop?: { x: number; y: number; width: number; height: number };

  /** 旋转角度 */
  rotate?: number;

  /** 翻转（水平） */
  hflip?: boolean;

  /** 翻转（垂直） */
  vflip?: boolean;

  /** 模糊 */
  blur?: number;

  /** 锐化 */
  sharpen?: number;

  /** 亮度 (-1.0 到 1.0) */
  brightness?: number;

  /** 对比度 (-1.0 到 1.0) */
  contrast?: number;

  /** 饱和度 (-1.0 到 1.0) */
  saturation?: number;
}

/**
 * 音频滤镜参数
 */
export interface AudioFilterOptions {
  /** 音量（0.0 到 1.0） */
  volume?: number;

  /** 降噪 */
  denoise?: boolean;

  /** 归一化 */
  normalize?: boolean;
}

/**
 * 错误代码
 */
export enum ErrorCode {
  // 输入错误 (1000-1999)
  INPUT_NOT_FOUND = 1001,
  INPUT_INVALID_FORMAT = 1002,
  INPUT_CORRUPTED = 1003,
  INPUT_UNSUPPORTED = 1004,

  // 输出错误 (2000-2999)
  OUTPUT_PATH_INVALID = 2001,
  OUTPUT_WRITE_FAILED = 2002,
  OUTPUT_ALREADY_EXISTS = 2003,

  // FFmpeg 错误 (3000-3999)
  FFMPEG_NOT_FOUND = 3001,
  FFMPEG_EXECUTION_FAILED = 3002,
  FFMPEG_TIMEOUT = 3003,
  FFMPEG_INVALID_COMMAND = 3004,

  // 参数错误 (4000-4999)
  INVALID_PARAMETER = 4001,
  INCOMPATIBLE_OPTIONS = 4002,
  MISSING_REQUIRED_OPTION = 4003,

  // 系统错误 (5000-5999)
  OUT_OF_MEMORY = 5001,
  INSUFFICIENT_DISK_SPACE = 5002,
  PERMISSION_DENIED = 5003,
}

/**
 * FFmpeg 错误
 */
export interface FFmpegError extends Error {
  /** 错误代码 */
  code: ErrorCode;

  /** 详细信息 */
  details?: Record<string, unknown>;

  /** 解决建议 */
  suggestion?: string;

  /** 是否可重试 */
  retryable: boolean;
}
