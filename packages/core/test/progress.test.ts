import { describe, it, expect, beforeEach } from 'vitest';
import { ProgressParser } from '../src/progress';

describe('ProgressParser', () => {
  let parser: ProgressParser;

  beforeEach(() => {
    parser = new ProgressParser();
  });

  describe('parseLine', () => {
    it('should parse FFmpeg progress line', () => {
      const line = 'frame= 123 fps= 45 q=28.0 size= 1234kB time=00:00:05.12 bitrate= 1234.5kbits/s speed=1.23x';

      const progress = parser.parseLine(line);

      expect(progress).not.toBeNull();
      expect(progress?.frames).toBe(123);
      expect(progress?.fps).toBe(45);
      expect(progress?.time).toBeCloseTo(5.12, 2);
      expect(progress?.bitrate).toBe(1234.5);
      expect(progress?.size).toBe(1234 * 1024);
    });

    it('should return null for non-progress lines', () => {
      const line = 'Input #0, mov,mp4,m4a,3gp,3g2,mj2, from \'input.mp4\':';

      const progress = parser.parseLine(line);

      expect(progress).toBeNull();
    });

    it('should parse time correctly', () => {
      const line = 'time=01:23:45.67';

      const progress = parser.parseLine(`frame=1 fps=1 q=1 size=1kB ${line} bitrate=1kbits/s speed=1x`);

      expect(progress?.time).toBe(1 * 3600 + 23 * 60 + 45 + 0.67);
    });

    it('should parse different size units', () => {
      const kBLine = 'frame=1 fps=1 q=1 size=1024kB time=00:00:01.00 bitrate=1kbits/s speed=1x';
      const MBLine = 'frame=1 fps=1 q=1 size=2MB time=00:00:01.00 bitrate=1kbits/s speed=1x';
      const GBLine = 'frame=1 fps=1 q=1 size=1GB time=00:00:01.00 bitrate=1kbits/s speed=1x';

      const kBProgress = parser.parseLine(kBLine);
      const MBProgress = parser.parseLine(MBLine);
      const GBProgress = parser.parseLine(GBLine);

      expect(kBProgress?.size).toBe(1024 * 1024);
      expect(MBProgress?.size).toBe(2 * 1024 * 1024);
      expect(GBProgress?.size).toBe(1 * 1024 * 1024 * 1024);
    });
  });

  describe('calculatePercent', () => {
    it('should calculate percentage correctly', () => {
      expect(parser.calculatePercent(50, 100)).toBe(50);
      expect(parser.calculatePercent(25, 100)).toBe(25);
      expect(parser.calculatePercent(0, 100)).toBe(0);
      expect(parser.calculatePercent(100, 100)).toBe(100);
    });

    it('should handle edge cases', () => {
      expect(parser.calculatePercent(0, 0)).toBe(0);
      expect(parser.calculatePercent(150, 100)).toBe(100);
      expect(parser.calculatePercent(-10, 100)).toBe(0);
    });
  });

  describe('calculateETA', () => {
    it('should calculate ETA correctly', () => {
      // 当前时间 10秒，总时间 100秒，速度 2x
      const eta = parser.calculateETA(10, 100, 2);

      // 剩余时间 = (100 - 10) / 2 = 45秒
      expect(eta).toBe(45);
    });

    it('should return 0 for edge cases', () => {
      expect(parser.calculateETA(100, 100, 2)).toBe(0);
      expect(parser.calculateETA(50, 100, 0)).toBe(0);
      expect(parser.calculateETA(50, 0, 2)).toBe(0);
    });
  });

  describe('getLastProgress', () => {
    it('should return last parsed progress', () => {
      parser.parseLine('frame=100 fps=30 q=28 size=1000kB time=00:00:03.33 bitrate=1000kbits/s speed=1x');

      const lastProgress = parser.getLastProgress();

      expect(lastProgress.frames).toBe(100);
      expect(lastProgress.fps).toBe(30);
    });
  });

  describe('reset', () => {
    it('should reset progress', () => {
      parser.parseLine('frame=100 fps=30 q=28 size=1000kB time=00:00:03.33 bitrate=1000kbits/s speed=1x');
      parser.reset();

      const lastProgress = parser.getLastProgress();

      expect(Object.keys(lastProgress).length).toBe(0);
    });
  });
});
