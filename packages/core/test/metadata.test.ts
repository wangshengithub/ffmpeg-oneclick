import { describe, it, expect, beforeEach } from 'vitest';
import { MetadataProcessor } from '../src/metadata';
import { execa } from 'execa';

// Mock execa
vi.mock('execa', () => ({
  execa: vi.fn(),
}));

describe('MetadataProcessor', () => {
  let processor: MetadataProcessor;

  beforeEach(() => {
    processor = new MetadataProcessor('ffprobe');
    vi.clearAllMocks();
  });

  describe('getMetadata', () => {
    it('should get video metadata', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
              width: 1920,
              height: 1080,
              r_frame_rate: '30/1',
              bit_rate: '5000000',
            },
            {
              index: 1,
              codec_type: 'audio',
              codec_name: 'aac',
              sample_rate: '48000',
              channels: 2,
              bit_rate: '128000',
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4 (MPEG-4 Part 14)',
            duration: '120.5',
            bit_rate: '5128000',
            size: '77358080',
            tags: {
              title: 'Test Video',
              encoder: 'ffmpeg',
            },
          },
        }),
      });

      const metadata = await processor.getMetadata('test.mp4');

      expect(metadata).toBeDefined();
      expect(metadata.format.duration).toBe(120.5);
      expect(metadata.streams).toHaveLength(2);

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      expect(videoStream).toBeDefined();
      expect(videoStream!.width).toBe(1920);
      expect(videoStream!.height).toBe(1080);
      expect(videoStream!.fps).toBe(30);
    });

    it('should handle missing streams', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const metadata = await processor.getMetadata('test.mp4');

      expect(metadata.format.duration).toBe(10);
      expect(metadata.streams).toHaveLength(0);
    });

    it('should parse frame rate correctly', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
              r_frame_rate: '30000/1001',
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const metadata = await processor.getMetadata('test.mp4');

      const videoStream = metadata.streams.find(s => s.codec_type === 'video');
      expect(videoStream).toBeDefined();
      // 30000/1001 ≈ 29.97
      expect(videoStream!.fps).toBeCloseTo(29.97, 1);
    });
  });

  describe('getDuration', () => {
    it('should get video duration', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: '120.5',
      });

      const duration = await processor.getDuration('test.mp4');

      expect(duration).toBe(120.5);
    });

    it('should return 0 for invalid duration', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: 'invalid',
      });

      const duration = await processor.getDuration('test.mp4');

      expect(duration).toBe(0);
    });
  });

  describe('getResolution', () => {
    it('should get video resolution', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
              width: 1920,
              height: 1080,
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const resolution = await processor.getResolution('test.mp4');

      expect(resolution.width).toBe(1920);
      expect(resolution.height).toBe(1080);
    });
  });

  describe('getFrameRate', () => {
    it('should get frame rate', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
              r_frame_rate: '30/1',
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const fps = await processor.getFrameRate('test.mp4');

      expect(fps).toBe(30);
    });
  });

  describe('getAudioSampleRate', () => {
    it('should get audio sample rate', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 1,
              codec_type: 'audio',
              codec_name: 'aac',
              sample_rate: 48000,
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const sampleRate = await processor.getAudioSampleRate('test.mp4');

      expect(sampleRate).toBe(48000);
    });
  });

  describe('getAudioChannels', () => {
    it('should get audio channels', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 1,
              codec_type: 'audio',
              codec_name: 'aac',
              channels: 2,
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const channels = await processor.getAudioChannels('test.mp4');

      expect(channels).toBe(2);
    });
  });

  describe('hasAudio', () => {
    it('should return true when audio exists', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 1,
              codec_type: 'audio',
              codec_name: 'aac',
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const hasAudio = await processor.hasAudio('test.mp4');

      expect(hasAudio).toBe(true);
    });

    it('should return false when no audio', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const hasAudio = await processor.hasAudio('test.mp4');

      expect(hasAudio).toBe(false);
    });
  });

  describe('hasVideo', () => {
    it('should return true when video exists', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const hasVideo = await processor.hasVideo('test.mp4');

      expect(hasVideo).toBe(true);
    });

    it('should return false when no video', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const hasVideo = await processor.hasVideo('test.mp4');

      expect(hasVideo).toBe(false);
    });
  });

  describe('getAllAudioStreams', () => {
    it('should get all audio streams', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            { index: 1, codec_type: 'audio', codec_name: 'aac' },
            { index: 2, codec_type: 'audio', codec_name: 'aac' },
            { index: 0, codec_type: 'video', codec_name: 'h264' },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const audioStreams = await processor.getAllAudioStreams('test.mp4');

      expect(audioStreams).toHaveLength(2);
    });
  });

  describe('getAllSubtitleStreams', () => {
    it('should get all subtitle streams', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            { index: 3, codec_type: 'subtitle', codec_name: 'srt' },
            { index: 0, codec_type: 'video', codec_name: 'h264' },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const subtitleStreams = await processor.getAllSubtitleStreams('test.mp4');

      expect(subtitleStreams).toHaveLength(1);
    });
  });

  describe('detectRotation', () => {
    it('should detect rotation from metadata tags', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
              tags: {
                rotate: '90',
              },
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const videoStream = await processor.getVideoStream('test.mp4');

      expect(videoStream).toBeDefined();
      expect(videoStream!.rotation).toBe(90);
    });

    it('should detect rotation from side_data', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
              side_data_list: [
                {
                  rotation: 180,
                },
              ],
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const videoStream = await processor.getVideoStream('test.mp4');

      expect(videoStream).toBeDefined();
      expect(videoStream!.rotation).toBe(180);
    });

    it('should return 0 when no rotation', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const videoStream = await processor.getVideoStream('test.mp4');

      expect(videoStream).toBeDefined();
      expect(videoStream!.rotation).toBe(0);
    });
  });

  describe('needsAutoRotate', () => {
    it('should return true when rotation needed', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
              tags: {
                rotate: '90',
              },
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const needs = await processor.needsAutoRotate('test.mp4');

      expect(needs).toBe(true);
    });

    it('should return false when no rotation', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const needs = await processor.needsAutoRotate('test.mp4');

      expect(needs).toBe(false);
    });
  });

  describe('getAutoRotateFilter', () => {
    it('should return transpose filter for 90 degrees', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
              tags: {
                rotate: '90',
              },
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const filter = await processor.getAutoRotateFilter('test.mp4');

      expect(filter).toContain('transpose');
    });

    it('should return null when no rotation', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [
            {
              index: 0,
              codec_type: 'video',
              codec_name: 'h264',
            },
          ],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const filter = await processor.getAutoRotateFilter('test.mp4');

      expect(filter).toBeNull();
    });
  });

  describe('getClearRotationCommand', () => {
    it('should return clear rotation command', () => {
      const command = processor.getClearRotationCommand();

      expect(command).toContain('-metadata:s:v:0');
      expect(command).toContain('rotate=0');
    });
  });

  describe('getVideoStream', () => {
    it('should get first video stream', async () => {
      const mockStream = {
        index: 0,
        codec_type: 'video',
        codec_name: 'h264',
      };

      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [mockStream],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const stream = await processor.getVideoStream('test.mp4');

      expect(stream).toBeDefined();
      expect(stream!.codec_type).toBe('video');
      expect(stream!.codec_name).toBe('h264');
    });
  });

  describe('getAudioStream', () => {
    it('should get audio stream by index', async () => {
      const mockStream = {
        index: 1,
        codec_type: 'audio',
        codec_name: 'aac',
      };

      (execa as any).mockResolvedValueOnce({
        stdout: JSON.stringify({
          streams: [mockStream],
          format: {
            filename: 'test.mp4',
            format_name: 'mp4',
            format_long_name: 'MP4',
            duration: '10',
            bit_rate: '0',
            size: '1000',
          },
        }),
      });

      const stream = await processor.getAudioStream('test.mp4', 0);

      expect(stream).toBeDefined();
      expect(stream!.codec_type).toBe('audio');
      expect(stream!.codec_name).toBe('aac');
    });
  });

  describe('Error Handling', () => {
    it('should handle ffprobe errors', async () => {
      (execa as any).mockRejectedValueOnce(new Error('ffprobe failed'));

      await expect(processor.getMetadata('test.mp4')).rejects.toThrow();
    });

    it('should handle invalid JSON', async () => {
      (execa as any).mockResolvedValueOnce({
        stdout: 'invalid json',
      });

      await expect(processor.getMetadata('test.mp4')).rejects.toThrow();
    });
  });
});
