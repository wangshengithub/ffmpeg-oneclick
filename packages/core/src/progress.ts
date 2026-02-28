import type { ProgressInfo } from './types';

/**
 * FFmpeg 进度解析器
 * 解析 FFmpeg 的 stderr 输出，提取进度信息
 */
export class ProgressParser {
  private lastProgress: Partial<ProgressInfo> = {};

  /**
   * 解析帧数
   */
  private parseFrames(line: string): number | undefined {
    const match = line.match(/frame=\s*(\d+)/);
    if (!match || !match[1]) return undefined;

    const frames = parseInt(match[1], 10);
    return !isNaN(frames) && frames >= 0 ? frames : undefined;
  }

  /**
   * 解析 FPS
   */
  private parseFps(line: string): number | undefined {
    const match = line.match(/fps=\s*([\d.]+)/);
    if (!match || !match[1]) return undefined;

    const fps = parseFloat(match[1]);
    // 限制合理范围 (0-1000)
    return !isNaN(fps) && fps >= 0 && fps <= 1000 ? fps : undefined;
  }

  /**
   * 解析时间
   */
  private parseTime(line: string): number | undefined {
    const match = line.match(/time=(\d{2}):(\d{2}):(\d{2})\.(\d{2})/);
    if (!match || !match[1] || !match[2] || !match[3] || !match[4]) return undefined;

    const hours = parseInt(match[1], 10);
    const minutes = parseInt(match[2], 10);
    const seconds = parseInt(match[3], 10);
    const centiseconds = parseInt(match[4], 10);

    // 验证范围
    if (isNaN(hours) || isNaN(minutes) || isNaN(seconds) || isNaN(centiseconds) ||
        hours < 0 || minutes < 0 || minutes >= 60 || seconds < 0 || seconds >= 60 || centiseconds < 0 || centiseconds >= 100) {
      console.warn(`Invalid time format in FFmpeg output: ${match[0]}`);
      return undefined;
    }

    return hours * 3600 + minutes * 60 + seconds + centiseconds / 100;
  }

  /**
   * 解析比特率
   */
  private parseBitrate(line: string): number | undefined {
    const match = line.match(/bitrate=\s*([\d.]+)(kbits\/s|Mbps)/);
    if (!match || !match[1]) return undefined;

    const value = parseFloat(match[1]);
    if (isNaN(value) || value < 0) return undefined;

    const unit = match[2];
    return unit === 'Mbps' ? value * 1000 : value;
  }

  /**
   * 解析文件大小
   */
  private parseSize(line: string): number | undefined {
    const match = line.match(/size=\s*(\d+)(kB|MB|GB)/);
    if (!match || !match[1]) return undefined;

    const value = parseInt(match[1], 10);
    if (isNaN(value) || value < 0) return undefined;

    const unit = match[2];

    switch (unit) {
      case 'kB':
        return value * 1024;
      case 'MB':
        return value * 1024 * 1024;
      case 'GB':
        return value * 1024 * 1024 * 1024;
      default:
        return undefined;
    }
  }

  /**
   * 解析 FFmpeg 输出行
   */
  parseLine(line: string): Partial<ProgressInfo> | null {
    // FFmpeg 进度行格式示例:
    // frame=  123 fps= 45 q=28.0 size=    1234kB time=00:00:05.12 bitrate= 1234.5kbits/s speed=1.23x

    if (!line.includes('frame=') || !line.includes('time=')) {
      return null;
    }

    const progress: Partial<ProgressInfo> = {};

    // 解析各项指标
    const frames = this.parseFrames(line);
    if (frames !== undefined) progress.frames = frames;

    const fps = this.parseFps(line);
    if (fps !== undefined) progress.fps = fps;

    const time = this.parseTime(line);
    if (time !== undefined) progress.time = time;

    const bitrate = this.parseBitrate(line);
    if (bitrate !== undefined) progress.bitrate = bitrate;

    const size = this.parseSize(line);
    if (size !== undefined) progress.size = size;

    // 更新缓存
    this.lastProgress = { ...this.lastProgress, ...progress };

    return progress;
  }

  /**
   * 计算进度百分比
   */
  calculatePercent(currentTime: number, totalTime: number): number {
    if (totalTime <= 0) return 0;
    const percent = (currentTime / totalTime) * 100;
    return Math.min(100, Math.max(0, percent));
  }

  /**
   * 计算预计剩余时间
   */
  calculateETA(currentTime: number, totalTime: number, speed: number): number {
    if (speed <= 0 || totalTime <= 0 || currentTime >= totalTime) {
      return 0;
    }

    const remainingTime = totalTime - currentTime;
    // speed 是倍速，如 1.5x 表示处理速度是实时的 1.5 倍
    const eta = remainingTime / speed;

    return Math.max(0, eta);
  }

  /**
   * 获取最后的进度信息
   */
  getLastProgress(): Partial<ProgressInfo> {
    return this.lastProgress;
  }

  /**
   * 重置进度
   */
  reset(): void {
    this.lastProgress = {};
  }
}
