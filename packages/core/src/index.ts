import { ChainableFFmpeg } from './chainable';
import { FFmpegWrapper } from './ffmpeg';
import type { FFmpegOptions, InputType } from './types';

// 导出类型
export type {
  FFmpegOptions,
  FFmpegResult,
  ProgressInfo,
  VideoMetadata,
  HardwareAcceleration,
  InputType,
  OutputType,
  FFmpegEventListeners,
  VideoFilterOptions,
  AudioFilterOptions,
  FFmpegError,
  CacheOptions,
} from './types';

// 导出错误
export { ErrorCode, createFFmpegError, getErrorSuggestion } from './error';

// 导出类
export { FFmpegWrapper } from './ffmpeg';
export { ChainableFFmpeg } from './chainable';
export { CommandBuilder } from './command-builder';
export { ProgressParser } from './progress';
export { CacheManager } from './cache';
export { HardwareAccelDetector, getHardwareAccelDetector, detectBestHardwareAccel } from './hardware-accel';
export type { HardwareAccelInfo, HardwareAccelType } from './hardware-accel';
export { ConcurrentQueue } from './concurrent';
export type { Task, TaskPriority, TaskStatus, QueueOptions } from './concurrent';
export { PresetManager, presets } from './presets';
export type { PresetConfig } from './presets';
export { StreamHandler, getStreamHandler } from './stream-handler';
export type { StreamType, StreamHandlerOptions } from './stream-handler';
export { MetadataProcessor, getMetadataProcessor } from './metadata';
export type { MetadataInfo, StreamInfo, ChapterInfo } from './metadata';
export { PluginManager, getPluginManager, usePlugin } from './plugin';
export type { Plugin, PluginContext, ProcessorHandler } from './plugin';

/**
 * 创建 FFmpeg 实例（链式 API）
 * @param input 输入文件路径、Buffer 或 Stream
 * @param options FFmpeg 配置选项
 * @returns ChainableFFmpeg 实例
 *
 * @example
 * ```typescript
 * // 基础用法
 * await ffmpeg('input.mp4')
 *   .output('output.webm')
 *   .size('720p')
 *   .fps(30)
 *   .run();
 *
 * // 带进度监听
 * await ffmpeg('input.mp4')
 *   .output('output.mp4')
 *   .videoBitrate('1M')
 *   .on('progress', (progress) => {
 *     console.log(`${progress.percent}% 完成`);
 *   })
 *   .run();
 * ```
 */
export function ffmpeg(input?: InputType, options: FFmpegOptions = {}): ChainableFFmpeg {
  const instance = new ChainableFFmpeg(options);

  if (input !== undefined) {
    instance.input(input);
  }

  return instance;
}

/**
 * 获取视频元数据
 * @param input 输入文件路径
 * @param options FFmpeg 配置选项
 * @returns 视频元数据
 *
 * @example
 * ```typescript
 * const metadata = await getMetadata('video.mp4');
 * console.log(`时长: ${metadata.duration}秒`);
 * console.log(`分辨率: ${metadata.width}x${metadata.height}`);
 * ```
 */
export async function getMetadata(
  input: string,
  options: FFmpegOptions = {}
): Promise<import('./types').VideoMetadata> {
  const wrapper = new FFmpegWrapper(options);
  return wrapper.getMetadata(input);
}

// 默认导出
export default ffmpeg;
