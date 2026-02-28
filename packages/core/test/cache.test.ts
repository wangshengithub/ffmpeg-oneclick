import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { CacheManager } from '../src/cache';
import { existsSync, rmSync, mkdirSync, writeFileSync } from 'fs';
import { join } from 'path';

describe('CacheManager', () => {
  let cacheManager: CacheManager;
  const testCacheDir = join(__dirname, '.test-cache');

  beforeEach(() => {
    // 创建测试缓存目录
    if (!existsSync(testCacheDir)) {
      mkdirSync(testCacheDir, { recursive: true });
    }

    cacheManager = new CacheManager({
      enabled: true,
      dir: testCacheDir,
      ttl: 60, // 1分钟
      maxSize: 1024 * 1024, // 1MB
    });
  });

  afterEach(() => {
    // 清理测试缓存
    cacheManager.clear();
    if (existsSync(testCacheDir)) {
      try {
        rmSync(testCacheDir, { recursive: true, force: true });
      } catch (error) {
        // 忽略清理错误
      }
    }
  });

  describe('generateParamsHash', () => {
    it('should generate consistent hash for same parameters', () => {
      const inputPath = '/path/to/input.mp4';
      const options = { bitrate: '1M', fps: 30 };

      const hash1 = cacheManager.generateParamsHash(inputPath, options);
      const hash2 = cacheManager.generateParamsHash(inputPath, options);

      expect(hash1).toBe(hash2);
    });

    it('should generate different hash for different parameters', () => {
      const inputPath = '/path/to/input.mp4';
      const options1 = { bitrate: '1M' };
      const options2 = { bitrate: '2M' };

      const hash1 = cacheManager.generateParamsHash(inputPath, options1);
      const hash2 = cacheManager.generateParamsHash(inputPath, options2);

      expect(hash1).not.toBe(hash2);
    });

    it('should handle complex options', () => {
      const inputPath = '/path/to/input.mp4';
      const options = {
        videoCodec: 'libx264',
        audioCodec: 'aac',
        bitrate: '1M',
        filters: ['fade', 'blur'],
        metadata: { title: 'Test' },
      };

      const hash = cacheManager.generateParamsHash(inputPath, options);
      expect(hash).toBeDefined();
      expect(typeof hash).toBe('string');
    });
  });

  describe('set and get', () => {
    it('should set and get cache entry', () => {
      const key = cacheManager.getCacheKey('/input.mp4', { bitrate: '1M' });

      // 创建实际的输出文件
      const outputPath = join(testCacheDir, 'output.mp4');
      writeFileSync(outputPath, 'test content', 'utf-8');

      cacheManager.set(key, '/input.mp4', outputPath, { bitrate: '1M' });

      const cached = cacheManager.get(key);
      expect(cached).toBe(outputPath);
    });

    it('should return null for non-existent key', () => {
      const cached = cacheManager.get('non-existent-key');
      expect(cached).toBeNull();
    });

    it('should not cache when disabled', () => {
      const disabledCache = new CacheManager({
        enabled: false,
        dir: testCacheDir,
      });

      const key = 'test-key';
      disabledCache.set(key, '/input.mp4', '/output.mp4', {});

      const cached = disabledCache.get(key);
      expect(cached).toBeNull();
    });
  });

  describe('has', () => {
    it('should return true for existing cache', () => {
      const key = cacheManager.getCacheKey('/input.mp4', { bitrate: '1M' });

      // 创建实际的输出文件
      const outputPath = join(testCacheDir, 'output.mp4');
      writeFileSync(outputPath, 'test content', 'utf-8');

      cacheManager.set(key, '/input.mp4', outputPath, { bitrate: '1M' });

      expect(cacheManager.has(key)).toBe(true);
    });

    it('should return false for non-existent cache', () => {
        expect(cacheManager.has('non-existent-key')).toBe(false);
      });

    it('should return false when cache is disabled', () => {
        const disabledCache = new CacheManager({
          enabled: false,
          dir: testCacheDir,
        });

        const key = 'test-key';
        disabledCache.set(key, '/input.mp4', '/output.mp4', {});

        expect(disabledCache.has(key)).toBe(false);
      });
  });

  describe('delete', () => {
    it('should delete cache entry', () => {
        const key = cacheManager.getCacheKey('/input.mp4', { bitrate: '1M' });
        cacheManager.set(key, '/input.mp4', '/output.mp4', { bitrate: '1M' });

        cacheManager.delete(key);

        expect(cacheManager.has(key)).toBe(false);
      });

    it('should handle non-existent key', () => {
        expect(() => cacheManager.delete('non-existent-key')).not.toThrow();
      });
  });

  describe('clear', () => {
    it('should clear all cache entries', () => {
        const key1 = cacheManager.getCacheKey('/input1.mp4', {});
        const key2 = cacheManager.getCacheKey('/input2.mp4', {});

        cacheManager.set(key1, '/input1.mp4', '/output1.mp4', {});
        cacheManager.set(key2, '/input2.mp4', '/output2.mp4', {});

        cacheManager.clear();

        expect(cacheManager.has(key1)).toBe(false);
        expect(cacheManager.has(key2)).toBe(false);
      });
    });

  describe('getStats', () => {
    it('should return cache statistics', () => {
        const key1 = cacheManager.getCacheKey('/input1.mp4', {});
        const key2 = cacheManager.getCacheKey('/input2.mp4', {});

        cacheManager.set(key1, '/input1.mp4', '/output1.mp4', {});
        cacheManager.set(key2, '/input2.mp4', '/output2.mp4', {});

        const stats = cacheManager.getStats();

        expect(stats.count).toBe(2);
        expect(stats.totalSize).toBeGreaterThanOrEqual(0);
      });

    it('should return zero stats for empty cache', () => {
        const stats = cacheManager.getStats();

        expect(stats.count).toBe(0);
        expect(stats.totalSize).toBe(0);
        expect(stats.oldestEntry).toBe(0);
        expect(stats.newestEntry).toBe(0);
      });
  });

  describe('cleanupExpired', () => {
    it('should remove expired entries', async () => {
        // 创建一个短 TTL 的缓存
        const shortTTLCache = new CacheManager({
          enabled: true,
          dir: testCacheDir,
          ttl: 1, // 1秒
        });

        const key = shortTTLCache.getCacheKey('/input.mp4', {});
        shortTTLCache.set(key, '/input.mp4', '/output.mp4', {});

        // 等待过期
        await new Promise(resolve => setTimeout(resolve, 1100));

        shortTTLCache.cleanupExpired();

        expect(shortTTLCache.has(key)).toBe(false);
      });
    });

  describe('LRU eviction', () => {
    it('should evict old entries when max size exceeded', () => {
      const smallCache = new CacheManager({
        enabled: true,
        dir: testCacheDir,
        maxSize: 100, // 100 bytes
      });

      // 添加多个缓存条目
      for (let i = 0; i < 10; i++) {
        const key = `key-${i}`;
        smallCache.set(key, `/input${i}.mp4`, `/output${i}.mp4`, {});
      }

      const stats = smallCache.getStats();
      // 应该已经淘汰了一些条目
      expect(stats.totalSize).toBeLessThanOrEqual(100);
    });
  });
});
