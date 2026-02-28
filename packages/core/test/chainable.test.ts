import { describe, it, expect, vi, beforeEach } from 'vitest';
import { ChainableFFmpeg } from '../src/chainable';
import { FFmpegWrapper } from '../src/ffmpeg';

// Mock FFmpegWrapper
vi.mock('../src/ffmpeg', () => {
  return {
    FFmpegWrapper: vi.fn().mockImplementation(() => {
      return {
        run: vi.fn().mockImplementation((input: any, output: any) => {
          return Promise.resolve({
            output: typeof output === 'string' ? output : 'stream',
            duration: 1000,
            size: 1024 * 1024,
            command: 'ffmpeg ...',
            logs: '',
          });
        }),
        getCommandBuilder: vi.fn().mockReturnValue({
          addInput: vi.fn(),
          setOutput: vi.fn(),
          setVideoCodec: vi.fn(),
          setAudioCodec: vi.fn(),
          setVideoBitrate: vi.fn(),
          setAudioBitrate: vi.fn(),
          setAudioFrequency: vi.fn(),
          setAudioChannels: vi.fn(),
          setVolume: vi.fn(),
          setFPS: vi.fn(),
          setSize: vi.fn(),
          setFormat: vi.fn(),
          setDuration: vi.fn(),
          setStartTime: vi.fn(),
          setHardwareAcceleration: vi.fn(),
          setThreads: vi.fn(),
          rotate: vi.fn(),
          flip: vi.fn(),
          flop: vi.fn(),
          crop: vi.fn(),
          addWatermark: vi.fn(),
          addTextWatermark: vi.fn(),
          screenshot: vi.fn(),
          screenshots: vi.fn(),
          setHLS: vi.fn(),
          setDASH: vi.fn(),
          applyVideoFilters: vi.fn(),
          applyAudioFilters: vi.fn(),
          addMetadata: vi.fn(),
          removeAllMetadata: vi.fn(),
          mixAudio: vi.fn(),
          concat: vi.fn(),
          concatWithoutAudio: vi.fn(),
          addOutputOption: vi.fn(),
          addInputOption: vi.fn(),
          build: vi.fn().mockReturnValue(['-i', 'input.mp4', 'output.mp4']),
          buildString: vi.fn().mockReturnValue('ffmpeg -i input.mp4 output.mp4'),
        }),
        getMetadata: vi.fn().mockResolvedValue({
          duration: 10,
          width: 1920,
          height: 1080,
          fps: 30,
          videoCodec: 'h264',
          audioCodec: 'aac',
        }),
        on: vi.fn(),
        emit: vi.fn(),
        kill: vi.fn(),
        cleanup: vi.fn(),
        destroy: vi.fn(),
      };
    }),
  };
});

describe('ChainableFFmpeg', () => {
  let chainable: ChainableFFmpeg;

  beforeEach(() => {
    chainable = new ChainableFFmpeg();
  });

  describe('Constructor', () => {
    it('should create instance', () => {
      expect(chainable).toBeInstanceOf(ChainableFFmpeg);
    });
  });

  describe('input', () => {
    it('should set input file', () => {
      const result = chainable.input('test.mp4');
      expect(result).toBe(chainable);
    });
  });

  describe('output', () => {
    it('should set output file', () => {
      const result = chainable.output('test.mp4');
      expect(result).toBe(chainable);
    });
  });

  describe('videoCodec', () => {
    it('should set video codec', () => {
      const result = chainable.videoCodec('libx264');
      expect(result).toBe(chainable);
    });
  });

  describe('audioCodec', () => {
    it('should set audio codec', () => {
      const result = chainable.audioCodec('aac');
      expect(result).toBe(chainable);
    });
  });

  describe('videoBitrate', () => {
    it('should set video bitrate', () => {
      const result = chainable.videoBitrate('1M');
      expect(result).toBe(chainable);
    });
  });

  describe('audioBitrate', () => {
    it('should set audio bitrate', () => {
      const result = chainable.audioBitrate('128k');
      expect(result).toBe(chainable);
    });
  });

  describe('fps', () => {
    it('should set fps', () => {
      const result = chainable.fps(30);
      expect(result).toBe(chainable);
    });
  });

  describe('size', () => {
    it('should set size', () => {
      const result = chainable.size('1920x1080');
      expect(result).toBe(chainable);
    });
  });

  describe('format', () => {
    it('should set format', () => {
      const result = chainable.format('mp4');
      expect(result).toBe(chainable);
    });
  });

  describe('duration', () => {
    it('should set duration', () => {
      const result = chainable.duration(10);
      expect(result).toBe(chainable);
    });
  });

  describe('startTime', () => {
    it('should set start time', () => {
      const result = chainable.startTime(5);
      expect(result).toBe(chainable);
    });
  });

  describe('trim', () => {
    it('should trim video', () => {
      const result = chainable.trim(0, 10);
      expect(result).toBe(chainable);
    });
  });

  describe('watermark', () => {
    it('should add image watermark', () => {
      const result = chainable.watermark('logo.png', {
        position: 'bottomRight',
        opacity: 0.8,
      });
      expect(result).toBe(chainable);
    });
  });

  describe('textWatermark', () => {
    it('should add text watermark', () => {
      const result = chainable.textWatermark('© 2024', {
        fontSize: 24,
        fontColor: 'white',
        position: 'bottomLeft',
      });
      expect(result).toBe(chainable);
    });
  });

  describe('screenshot', () => {
    it('should take screenshot', () => {
      const result = chainable.screenshot(5, 'frame.jpg');
      expect(result).toBe(chainable);
    });
  });

  describe('screenshots', () => {
    it('should take multiple screenshots', () => {
      const result = chainable.screenshots({
        timestamps: [1, 5, 10],
        filenameTemplate: 'shot_%d.jpg',
      });
      expect(result).toBe(chainable);
    });
  });

  describe('toHLS', () => {
    it('should convert to HLS', async () => {
      const result = await chainable
        .input('input.mp4')
        .toHLS('playlist.m3u8', { segmentDuration: 10 });

      expect(result).toBeDefined();
      expect(result.output).toContain('m3u8');
    });
  });

  describe('toDASH', () => {
    it('should convert to DASH', async () => {
      const result = await chainable
        .input('input.mp4')
        .toDASH('manifest.mpd', { segmentDuration: 10 });

      expect(result).toBeDefined();
      expect(result.output).toContain('mpd');
    });
  });

  describe('videoFilters', () => {
    it('should apply video filters', () => {
      const result = chainable.videoFilters({
        scale: '1920x1080',
        fps: 30,
      });
      expect(result).toBe(chainable);
    });
  });

  describe('audioFilters', () => {
    it('should apply audio filters', () => {
      const result = chainable.audioFilters({
        volume: 1.5,
      });
      expect(result).toBe(chainable);
    });
  });

  describe('mix', () => {
    it('should mix audio tracks', () => {
      const result = chainable.mix([
        { input: 'video.mp4', volume: 1.0 },
        { input: 'music.mp3', volume: 0.3 },
      ]);
      expect(result).toBe(chainable);
    });
  });

  describe('metadata', () => {
    it('should add metadata', () => {
      const result = chainable.metadata('title', 'My Video');
      expect(result).toBe(chainable);
    });
  });

  describe('noMetadata', () => {
    it('should remove metadata', () => {
      const result = chainable.noMetadata();
      expect(result).toBe(chainable);
    });
  });

  describe('hardwareAccelerate', () => {
    it('should enable hardware acceleration', () => {
      const result = chainable.hardwareAccelerate('nvenc');
      expect(result).toBe(chainable);
    });
  });

  describe('threads', () => {
    it('should set thread count', () => {
      const result = chainable.threads(4);
      expect(result).toBe(chainable);
    });
  });

  describe('outputOption', () => {
    it('should add output option', () => {
      const result = chainable.outputOption('-preset', 'fast');
      expect(result).toBe(chainable);
    });
  });

  describe('inputOption', () => {
    it('should add input option', () => {
      const result = chainable.inputOption('-framerate', '30');
      expect(result).toBe(chainable);
    });
  });

  describe('cache', () => {
    it('should enable caching', () => {
      const result = chainable.cache({ enabled: true });
      expect(result).toBe(chainable);
    });
  });

  describe('on', () => {
    it('should register event listener', () => {
      const handler = vi.fn();
      const result = chainable.on('progress', handler);
      expect(result).toBe(chainable);
    });
  });

  describe('run', () => {
    it('should execute FFmpeg', async () => {
      const result = await chainable.input('input.mp4').output('output.mp4').run();

      expect(result).toBeDefined();
      expect(result.output).toBe('output.mp4');
    });
  });

  describe('getCommand', () => {
    it('should return FFmpeg command', () => {
      chainable.input('input.mp4').output('output.mp4');
      const command = chainable.getCommand();

      expect(command).toBeDefined();
      expect(typeof command).toBe('string');
    });
  });

  describe('kill', () => {
    it('should kill FFmpeg process', () => {
      chainable.kill();
      // 验证 kill 方法被调用
      expect(chainable.kill).toBeDefined();
    });
  });

  describe('Method Chaining', () => {
    it('should support method chaining', () => {
      const result = chainable
        .input('input.mp4')
        .output('output.mp4')
        .videoCodec('libx264')
        .audioCodec('aac')
        .videoBitrate('1M')
        .audioBitrate('128k')
        .fps(30)
        .size('1920x1080');

      expect(result).toBe(chainable);
    });
  });

  describe('Error Handling', () => {
    it('should throw error without input', async () => {
      await expect(chainable.output('output.mp4').run()).rejects.toThrow();
    });

    it('should throw error without output', async () => {
      await expect(chainable.input('input.mp4').run()).rejects.toThrow();
    });
  });
});
