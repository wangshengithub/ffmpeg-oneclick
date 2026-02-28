import { describe, it, expect, beforeAll } from 'vitest';
import { ffmpeg, getMetadata } from '../src/index';
import { existsSync, unlinkSync, writeFileSync, readFileSync } from 'fs';
import { join } from 'path';

// 跳过集成测试如果没有 FFmpeg
const skipIfNoFFmpeg = process.env.SKIP_INTEGRATION_TESTS ? describe.skip : describe;

skipIfNoFFmpeg('Integration Tests', () => {
  const testDir = join(__dirname, 'fixtures');
  const testVideo = join(testDir, 'test.mp4');
  const outputVideo = join(testDir, 'output.mp4');

  beforeAll(() => {
    // 确保测试目录存在
    if (!existsSync(testDir)) {
      const { mkdirSync } = require('fs');
      mkdirSync(testDir, { recursive: true });
    }

    // 如果没有测试视频，跳过测试
    if (!existsSync(testVideo)) {
      console.warn('Test video not found, skipping integration tests');
      return;
    }
  });

  // 清理输出文件
  afterEach(() => {
    if (existsSync(outputVideo)) {
      unlinkSync(outputVideo);
    }
  });

  describe('getMetadata', () => {
    it('should read video metadata', async () => {
      if (!existsSync(testVideo)) {
        return;
      }

      const metadata = await getMetadata(testVideo);

      expect(metadata).toBeDefined();
      expect(metadata.duration).toBeGreaterThan(0);
      expect(metadata.width).toBeGreaterThan(0);
      expect(metadata.height).toBeGreaterThan(0);
      expect(metadata.videoCodec).toBeTruthy();
    });
  });

  describe('ffmpeg', () => {
    it('should convert video with chainable API', async () => {
      if (!existsSync(testVideo)) {
        return;
      }

      const result = await ffmpeg(testVideo)
        .output(outputVideo)
        .videoCodec('libx264')
        .size('720p')
        .run();

      expect(result).toBeDefined();
      expect(result.output).toBe(outputVideo);
      expect(existsSync(outputVideo)).toBe(true);
      expect(result.size).toBeGreaterThan(0);
    }, 30000);

    it('should report progress', async () => {
      if (!existsSync(testVideo)) {
        return;
      }

      const progressReports: number[] = [];

      await ffmpeg(testVideo)
        .output(outputVideo)
        .on('progress', (progress) => {
          progressReports.push(progress.percent);
        })
        .run();

      // 应该收到至少一个进度报告
      expect(progressReports.length).toBeGreaterThan(0);
    }, 30000);

    it('should trim video', async () => {
      if (!existsSync(testVideo)) {
        return;
      }

      await ffmpeg(testVideo).output(outputVideo).trim(0, 5).run();

      const metadata = await getMetadata(outputVideo);

      // 裁剪后的视频长度应该接近 5 秒
      expect(metadata.duration).toBeCloseTo(5, 0);
    }, 30000);

    it('should add metadata', async () => {
      if (!existsSync(testVideo)) {
        return;
      }

      await ffmpeg(testVideo)
        .output(outputVideo)
        .metadata('title', 'Test Video')
        .metadata('artist', 'Test Artist')
        .run();

      // 验证元数据是否添加成功需要使用 ffprobe
      expect(existsSync(outputVideo)).toBe(true);
    }, 30000);
  });
});
