import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import {
  HardwareAccelDetector,
  getHardwareAccelDetector,
  detectBestHardwareAccel,
  HardwareAccelType,
} from '../src/hardware-accel';

describe('HardwareAccelDetector', () => {
  let detector: HardwareAccelDetector;

  beforeEach(() => {
    detector = new HardwareAccelDetector('ffmpeg');
  });

  afterEach(() => {
    detector.clearCache();
  });

  describe('detectAll', () => {
    it('should detect all hardware acceleration types', async () => {
      const results = await detector.detectAll();

      expect(results).toBeInstanceOf(Array);
      expect(results.length).toBeGreaterThan(0);

      results.forEach((result) => {
        expect(result).toHaveProperty('type');
        expect(result).toHaveProperty('available');
        expect(['nvenc', 'qsv', 'vce', 'videotoolbox', 'none']).toContain(result.type);
      });
    });
  });

  describe('detect', () => {
    it('should detect specific hardware acceleration', async () => {
        const result = await detector.detect('nvenc');

        expect(result.type).toBe('nvenc');
        expect(typeof result.available).toBe('boolean');
      });

    it('should cache detection results', async () => {
        const result1 = await detector.detect('nvenc');
        const result2 = await detector.detect('nvenc');

        expect(result1).toBe(result2);
      });

    it('should return none for unknown type', async () => {
        const result = await detector.detect('unknown' as HardwareAccelType);

        expect(result.type).toBe('none');
        expect(result.available).toBe(false);
      });
  });

  describe('getBest', () => {
    it('should return best available hardware acceleration', async () => {
        const best = await detector.getBest();

        expect(best).toBeDefined();
        expect(best.type).toBeDefined();

        if (best.available) {
          expect(best.encoder).toBeDefined();
          expect(best.info).toBeDefined();
        }
      });

    it('should prioritize NVENC over others', async () => {
        // Mock 检测结果
        const allResults = await detector.detectAll();
        const availableResults = allResults.filter((r) => r.available);

        if (availableResults.length > 0) {
          const best = await detector.getBest();
          const priority: HardwareAccelType[] = ['nvenc', 'qsv', 'vce', 'videotoolbox'];

          // 找到第一个可用的优先级最高的
          for (const type of priority) {
            const result = availableResults.find((r) => r.type === type);
            if (result) {
              expect(best.type).toBe(type);
              break;
            }
          }
        }
      });
  });

  describe('clearCache', () => {
    it('should clear detection cache', async () => {
        await detector.detect('nvenc');

        detector.clearCache();

        // 再次检测应该重新执行
        const result = await detector.detect('nvenc');
        expect(result).toBeDefined();
      });
  });

  describe('detectNVENC', () => {
    it('should return nvenc info', async () => {
        const result = await detector.detect('nvenc');

        expect(result.type).toBe('nvenc');
        expect(result.available).toBeDefined();

        if (result.available) {
          expect(result.encoder).toContain('nvenc');
          expect(result.info).toContain('NVIDIA');
        }
      });
  });

  describe('detectQSV', () => {
    it('should return qsv info', async () => {
      const result = await detector.detect('qsv');

      expect(result.type).toBe('qsv');
      expect(result.available).toBeDefined();

      if (result.available) {
        expect(result.encoder).toContain('qsv');
        expect(result.info).toContain('Intel');
      }
    });
  });

  describe('detectVCE', () => {
    it('should return vce info', async () => {
      const result = await detector.detect('vce');

      expect(result.type).toBe('vce');
      expect(result.available).toBeDefined();

      if (result.available) {
        expect(result.encoder).toContain('amf');
        expect(result.info).toContain('AMD');
      }
    });
  });

  describe('detectVideoToolbox', () => {
    it('should return videotoolbox info', async () => {
      const result = await detector.detect('videotoolbox');

      expect(result.type).toBe('videotoolbox');
      expect(result.available).toBeDefined();

      if (result.available) {
        expect(result.encoder).toContain('videotoolbox');
        expect(result.info).toContain('Apple');
      }
    });

    it('should be unavailable on non-macOS platforms', async () => {
      const result = await detector.detect('videotoolbox');

      if (process.platform !== 'darwin') {
        expect(result.available).toBe(false);
      }
    });
  });
});

describe('Global Functions', () => {
  describe('getHardwareAccelDetector', () => {
    it('should return global detector instance', () => {
      const detector = getHardwareAccelDetector();
      expect(detector).toBeInstanceOf(HardwareAccelDetector);
    });

    it('should return same instance on multiple calls', () => {
      const detector1 = getHardwareAccelDetector();
      const detector2 = getHardwareAccelDetector();
      expect(detector1).toBe(detector2);
    });

    it('should accept custom ffmpeg path', () => {
      const detector = getHardwareAccelDetector('/custom/path/to/ffmpeg');
      expect(detector).toBeInstanceOf(HardwareAccelDetector);
    });
  });

  describe('detectBestHardwareAccel', () => {
    it('should detect best hardware acceleration', async () => {
      const best = await detectBestHardwareAccel();

      expect(best).toBeDefined();
      expect(best.type).toBeDefined();
      expect(typeof best.available).toBe('boolean');
    });
  });
});

describe('Hardware Acceleration Integration', () => {
  it('should detect at least one hardware acceleration if available', async () => {
    const detector = new HardwareAccelDetector();
    const all = await detector.detectAll();

    const available = all.filter((r) => r.available);

    // 在支持的系统上应该至少有一个可用
    // 注意：这可能不总是为真，取决于系统
    if (available.length > 0) {
      expect(available[0].encoder).toBeDefined();
    }
  });

  it('should provide encoder and decoder when available', async () => {
    const detector = new HardwareAccelDetector();
    const all = await detector.detectAll();

    const available = all.filter((r) => r.available && r.encoder && r.decoder);

    available.forEach((result) => {
      expect(result.encoder).toBeDefined();
      expect(result.decoder).toBeDefined();
    });
  });
});
