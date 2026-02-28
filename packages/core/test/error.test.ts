import { describe, it, expect } from 'vitest';
import { createFFmpegError, ErrorCode, getErrorSuggestion } from '../src/error';

describe('Error Handling', () => {
  describe('createFFmpegError', () => {
    it('should create FFmpeg error with code', () => {
      const error = createFFmpegError(ErrorCode.INPUT_NOT_FOUND, 'Input file not found');

      expect(error).toBeInstanceOf(Error);
      expect(error.code).toBe(ErrorCode.INPUT_NOT_FOUND);
      expect(error.message).toBe('Input file not found');
      expect(error.retryable).toBe(false);
    });

    it('should include details', () => {
      const details = { path: '/path/to/file.mp4' };
      const error = createFFmpegError(ErrorCode.INPUT_NOT_FOUND, 'Input file not found', {
        details,
      });

      expect(error.details).toEqual(details);
    });

    it('should include suggestion', () => {
      const suggestion = 'Please check the file path';
      const error = createFFmpegError(ErrorCode.INPUT_NOT_FOUND, 'Input file not found', {
        suggestion,
      });

      expect(error.suggestion).toBe(suggestion);
    });

    it('should set retryable flag', () => {
      const error = createFFmpegError(ErrorCode.FFMPEG_TIMEOUT, 'Timeout', {
        retryable: true,
      });

      expect(error.retryable).toBe(true);
    });

    it('should include cause', () => {
      const cause = new Error('Original error');
      const error = createFFmpegError(ErrorCode.FFMPEG_EXECUTION_FAILED, 'FFmpeg failed', {
        cause,
      });

      expect(error.cause).toBe(cause);
    });
  });

  describe('getErrorSuggestion', () => {
    it('should return suggestion for input not found', () => {
      const suggestion = getErrorSuggestion(ErrorCode.INPUT_NOT_FOUND);

      expect(suggestion).toContain('输入文件路径');
    });

    it('should return suggestion for FFmpeg not found', () => {
      const suggestion = getErrorSuggestion(ErrorCode.FFMPEG_NOT_FOUND);

      expect(suggestion).toContain('FFmpeg 未安装');
    });

    it('should return default suggestion for unknown error', () => {
      const suggestion = getErrorSuggestion(999999 as any);

      expect(suggestion).toContain('未知错误');
    });
  });
});
