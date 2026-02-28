import { describe, it, expect, beforeEach } from 'vitest';
import { CommandBuilder } from '../src/command-builder';

describe('CommandBuilder', () => {
  let builder: CommandBuilder;

  beforeEach(() => {
    builder = new CommandBuilder();
  });

  describe('addInput', () => {
    it('should add input file', () => {
      builder.addInput('input.mp4');
      const args = builder.build();

      expect(args).toContain('-i');
      expect(args).toContain('input.mp4');
    });
  });

  describe('setOutput', () => {
    it('should set output file', () => {
      builder.addInput('input.mp4');
      builder.setOutput('output.mp4');
      const args = builder.build();

      expect(args).toContain('output.mp4');
    });
  });

  describe('setVideoCodec', () => {
    it('should set video codec', () => {
      builder.setVideoCodec('libx264');
      const args = builder.build();

      expect(args).toContain('-c:v');
      expect(args).toContain('libx264');
    });
  });

  describe('setAudioCodec', () => {
    it('should set audio codec', () => {
      builder.setAudioCodec('aac');
      const args = builder.build();

      expect(args).toContain('-c:a');
      expect(args).toContain('aac');
    });
  });

  describe('setVideoBitrate', () => {
    it('should set video bitrate with string', () => {
      builder.setVideoBitrate('1M');
      const args = builder.build();

      expect(args).toContain('-b:v');
      expect(args).toContain('1M');
    });

    it('should set video bitrate with number', () => {
      builder.setVideoBitrate(1000);
      const args = builder.build();

      expect(args).toContain('-b:v');
      expect(args).toContain('1000k');
    });
  });

  describe('setFPS', () => {
    it('should set frame rate', () => {
      builder.setFPS(30);
      const args = builder.build();

      expect(args).toContain('-r');
      expect(args).toContain('30');
    });
  });

  describe('setSize', () => {
    it('should set size with preset', () => {
      builder.setSize('720p');
      const args = builder.build();

      expect(args).toContain('-s');
      expect(args).toContain('1280x720');
    });

    it('should set size with custom dimensions', () => {
      builder.setSize({ width: 1920, height: 1080 });
      const args = builder.build();

      expect(args).toContain('-s');
      expect(args).toContain('1920x1080');
    });
  });

  describe('setStartTime', () => {
    it('should set start time', () => {
      builder.setStartTime(10);
      const args = builder.build();

      expect(args).toContain('-ss');
      expect(args).toContain('10');
    });
  });

  describe('setDuration', () => {
    it('should set duration', () => {
      builder.setDuration(30);
      const args = builder.build();

      expect(args).toContain('-t');
      expect(args).toContain('30');
    });
  });

  describe('setHardwareAcceleration', () => {
    it('should set auto hardware acceleration', () => {
      builder.setHardwareAcceleration('auto');
      const args = builder.build();

      expect(args).toContain('-hwaccel');
      expect(args).toContain('auto');
    });

    it('should not add options for none', () => {
      builder.setHardwareAcceleration('none');
      const args = builder.build();

      expect(args).not.toContain('-hwaccel');
    });
  });

  describe('addMetadata', () => {
    it('should add metadata', () => {
      builder.addMetadata('title', 'My Video');
      const args = builder.build();

      expect(args).toContain('-metadata');
      expect(args).toContain('title=My Video');
    });
  });

  describe('buildString', () => {
    it('should build command string', () => {
      builder.addInput('input.mp4');
      builder.setOutput('output.mp4');
      builder.setVideoCodec('libx264');

      const command = builder.buildString();

      expect(command).toContain('ffmpeg');
      expect(command).toContain('input.mp4');
      expect(command).toContain('output.mp4');
      expect(command).toContain('libx264');
    });
  });

  describe('reset', () => {
    it('should reset all options', () => {
      builder.addInput('input.mp4');
      builder.setOutput('output.mp4');
      builder.setVideoCodec('libx264');

      builder.reset();

      const args = builder.build();
      expect(args).not.toContain('libx264');
    });
  });
});
