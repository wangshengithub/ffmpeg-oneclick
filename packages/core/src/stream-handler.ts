import { Readable, Writable, Transform } from 'stream';
import { EventEmitter } from 'events';
import { createFFmpegError, ErrorCode } from './error';

/**
 * 流类型
 */
export type StreamType = 'readable' | 'writable' | 'duplex' | 'transform';

/**
 * 流处理器配置
 */
export interface StreamHandlerOptions {
  /** 高水位标记 */
  highWaterMark?: number;

  /** 是否自动结束 */
  autoEnd?: boolean;

  /** 是否自动销毁 */
  autoDestroy?: boolean;

  /** 编码 */
  encoding?: BufferEncoding;

  /** 超时时间（毫秒） */
  timeout?: number;
}

/**
 * 事件监听器记录
 */
interface EventListenerRecord {
  emitter: EventEmitter;
  event: string;
  listener: Function;
}

/**
 * 流处理器
 * 独立的流处理模块，负责处理输入输出流
 */
export class StreamHandler {
  private options: Required<StreamHandlerOptions>;
  private inputStreams: Readable[] = [];
  private outputStreams: Writable[] = [];
  private eventListeners: EventListenerRecord[] = [];

  constructor(options: StreamHandlerOptions = {}) {
    this.options = {
      highWaterMark: options.highWaterMark || 16384, // 16KB
      autoEnd: options.autoEnd !== false,
      autoDestroy: options.autoDestroy !== false,
      encoding: options.encoding || 'binary',
      timeout: options.timeout || 0,
    };
  }

  /**
   * 检测输入类型
   */
  detectInputType(input: any): 'file' | 'buffer' | 'stream' | 'url' | 'unknown' {
    if (typeof input === 'string') {
      // 检测是否为 URL
      if (input.startsWith('http://') || input.startsWith('https://')) {
        return 'url';
      }
      // 检测是否为文件路径
      return 'file';
    }

    if (Buffer.isBuffer(input)) {
      return 'buffer';
    }

    if (input instanceof Readable) {
      return 'stream';
    }

    return 'unknown';
  }

  /**
   * 检测输出类型
   */
  detectOutputType(output: any): 'file' | 'stream' | 'unknown' {
    if (typeof output === 'string') {
      return 'file';
    }

    if (output instanceof Writable) {
      return 'stream';
    }

    return 'unknown';
  }

  /**
   * 创建输入流
   */
  async createInputStream(input: any): Promise<Readable> {
    const inputType = this.detectInputType(input);

    switch (inputType) {
      case 'file': {
        const { createReadStream } = await import('fs');
        return createReadStream(input, {
          highWaterMark: this.options.highWaterMark,
        });
      }

      case 'buffer': {
        const readable = new Readable({
          highWaterMark: this.options.highWaterMark,
        });
        readable.push(input);
        readable.push(null);
        return readable;
      }

      case 'stream': {
        return input;
      }

      case 'url': {
        // 下载 URL
        const fetch = (await import('node-fetch')).default;
        const response = await fetch(input);

        if (!response.ok) {
          throw createFFmpegError(ErrorCode.INPUT_NOT_FOUND, `Failed to download URL: ${input}`, {
            details: { status: response.status, statusText: response.statusText },
          });
        }

        return response.body as any;
      }

      default:
        throw createFFmpegError(ErrorCode.INPUT_INVALID_FORMAT, `Unsupported input type: ${typeof input}`);
    }
  }

  /**
   * 创建输出流
   */
  async createOutputStream(output: any): Promise<Writable> {
    const outputType = this.detectOutputType(output);

    switch (outputType) {
      case 'file': {
        const { createWriteStream } = await import('fs');
        return createWriteStream(output, {
          highWaterMark: this.options.highWaterMark,
        });
      }

      case 'stream': {
        return output;
      }

      default:
        throw createFFmpegError(ErrorCode.OUTPUT_PATH_INVALID, `Unsupported output type: ${typeof output}`);
    }
  }

  /**
   * 管道流
   */
  async pipeStreams(
    source: Readable,
    destination: Writable,
    options?: { end?: boolean }
  ): Promise<void> {
    return new Promise((resolve, reject) => {
      let timeoutId: NodeJS.Timeout | null = null;

      // 设置超时
      if (this.options.timeout > 0) {
        timeoutId = setTimeout(() => {
          // 清理资源
          this.cleanup();

          reject(createFFmpegError(ErrorCode.FFMPEG_TIMEOUT, 'Stream piping timeout'));
        }, this.options.timeout);
      }

      // 处理错误
      const sourceErrorHandler = (error: Error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(error);
      };

      const destinationErrorHandler = (error: Error) => {
        if (timeoutId) clearTimeout(timeoutId);
        reject(error);
      };

      // 完成时resolve
      const finishHandler = () => {
        if (timeoutId) clearTimeout(timeoutId);
        resolve();
      };

      // 添加并追踪事件监听器
      source.on('error', sourceErrorHandler);
      this.trackListener(source, 'error', sourceErrorHandler);

      destination.on('error', destinationErrorHandler);
      this.trackListener(destination, 'error', destinationErrorHandler);

      destination.on('finish', finishHandler);
      this.trackListener(destination, 'finish', finishHandler);

      // 追踪流
      this.inputStreams.push(source);
      this.outputStreams.push(destination);

      // 开始管道
      const shouldEnd = options?.end !== false && this.options.autoEnd;
      source.pipe(destination, { end: shouldEnd });
    });
  }

  /**
   * 追踪事件监听器
   * @private
   */
  private trackListener(emitter: EventEmitter, event: string, listener: Function): void {
    this.eventListeners.push({ emitter, event, listener });
  }

  /**
   * 清理所有监听器和流
   */
  cleanup(): void {
    // 移除所有事件监听器
    this.eventListeners.forEach(({ emitter, event, listener }) => {
      emitter.removeListener(event, listener as any);
    });
    this.eventListeners = [];

    // 销毁输入流
    this.inputStreams.forEach(stream => {
      if (!stream.destroyed) {
        stream.destroy();
      }
    });
    this.inputStreams = [];

    // 销毁输出流
    this.outputStreams.forEach(stream => {
      if (!stream.destroyed) {
        stream.destroy();
      }
    });
    this.outputStreams = [];
  }

  /**
   * 创建转换流
   */
  createTransformStream(
    transformer: (chunk: Buffer, encoding: BufferEncoding) => Buffer | string | null
  ): Transform {
    return new Transform({
      highWaterMark: this.options.highWaterMark,
      transform(chunk: Buffer, encoding: BufferEncoding, callback) {
        try {
          const result = transformer(chunk, encoding);
          if (result !== null) {
            this.push(result);
          }
          callback();
        } catch (error) {
          callback(error as Error);
        }
      },
    });
  }

  /**
   * 读取流到 Buffer
   */
  async readStreamToBuffer(stream: Readable): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      let totalSize = 0;

      stream.on('data', (chunk: Buffer) => {
        chunks.push(chunk);
        totalSize += chunk.length;
      });

      stream.on('error', reject);

      stream.on('end', () => {
        resolve(Buffer.concat(chunks, totalSize));
      });
    });
  }

  /**
   * 写入 Buffer 到流
   */
  async writeBufferToStream(buffer: Buffer, stream: Writable): Promise<void> {
    return new Promise((resolve, reject) => {
      stream.on('error', reject);
      stream.write(buffer, (error) => {
        if (error) {
          reject(error);
        } else {
          resolve();
        }
      });
    });
  }

  /**
   * 验证流
   */
  validateStream(stream: any, type: 'readable' | 'writable'): boolean {
    if (type === 'readable') {
      return stream instanceof Readable || (stream && typeof stream.pipe === 'function');
    } else {
      return stream instanceof Writable || (stream && typeof stream.write === 'function');
    }
  }

  /**
   * 等待流结束
   */
  async waitForStreamEnd(stream: Readable | Writable): Promise<void> {
    return new Promise((resolve, reject) => {
      stream.on('end', resolve);
      stream.on('finish', resolve);
      stream.on('error', reject);
    });
  }

  /**
   * 销毁流
   */
  destroyStream(stream: Readable | Writable, error?: Error): void {
    if (stream && typeof stream.destroy === 'function') {
      stream.destroy(error);
    }
  }

  /**
   * 暂停流
   */
  pauseStream(stream: Readable): void {
    if (stream && typeof stream.pause === 'function') {
      stream.pause();
    }
  }

  /**
   * 恢复流
   */
  resumeStream(stream: Readable): void {
    if (stream && typeof stream.resume === 'function') {
      stream.resume();
    }
  }

  /**
   * 获取流统计信息
   */
  getStreamStats(stream: Readable | Writable): {
    bytesRead?: number;
    bytesWritten?: number;
    isPaused?: boolean;
    isEnded?: boolean;
  } {
    const stats: any = {};

    if (stream instanceof Readable) {
      stats.bytesRead = (stream as any).bytesRead || 0;
      stats.isPaused = stream.isPaused();
      stats.isEnded = stream.readableEnded;
    }

    if (stream instanceof Writable) {
      stats.bytesWritten = (stream as any).bytesWritten || 0;
      stats.isEnded = stream.writableEnded;
    }

    return stats;
  }
}

/**
 * 全局流处理器实例
 */
let globalStreamHandler: StreamHandler | null = null;

/**
 * 获取流处理器实例
 */
export function getStreamHandler(options?: StreamHandlerOptions): StreamHandler {
  if (!globalStreamHandler) {
    globalStreamHandler = new StreamHandler(options);
  }
  return globalStreamHandler;
}
