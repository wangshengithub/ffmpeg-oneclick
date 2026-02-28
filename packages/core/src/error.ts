import { ErrorCode, type FFmpegError } from './types';

// 重新导出 ErrorCode，供其他模块使用
export { ErrorCode };

/**
 * 创建 FFmpeg 错误
 */
export function createFFmpegError(
  code: ErrorCode,
  message: string,
  options: {
    details?: Record<string, unknown>;
    suggestion?: string;
    retryable?: boolean;
    cause?: Error;
  } = {}
): FFmpegError {
  const error = new Error(message) as FFmpegError;
  error.code = code;
  error.details = options.details;
  error.suggestion = options.suggestion;
  error.retryable = options.retryable ?? false;
  error.cause = options.cause;
  error.name = 'FFmpegError';

  return error;
}

/**
 * 获取错误的友好提示
 */
export function getErrorSuggestion(code: ErrorCode): string {
  const suggestions: Record<ErrorCode, string> = {
    [ErrorCode.INPUT_NOT_FOUND]: '请检查输入文件路径是否正确，文件是否存在',
    [ErrorCode.INPUT_INVALID_FORMAT]: '请检查文件格式是否受支持，或尝试使用其他编码器',
    [ErrorCode.INPUT_CORRUPTED]: '文件可能已损坏，请尝试使用其他播放器验证',
    [ErrorCode.INPUT_UNSUPPORTED]: '请检查文件编码格式，可能需要使用其他解码器',
    [ErrorCode.OUTPUT_PATH_INVALID]: '请检查输出路径是否有效，是否有写入权限',
    [ErrorCode.OUTPUT_WRITE_FAILED]: '请检查磁盘空间是否充足，路径是否可写',
    [ErrorCode.OUTPUT_ALREADY_EXISTS]: '输出文件已存在，请使用不同的文件名或删除现有文件',
    [ErrorCode.FFMPEG_NOT_FOUND]: 'FFmpeg 未安装，请运行安装命令或手动安装 FFmpeg',
    [ErrorCode.FFMPEG_EXECUTION_FAILED]: 'FFmpeg 执行失败，请检查命令参数是否正确',
    [ErrorCode.FFMPEG_TIMEOUT]: '处理超时，请尝试增加超时时间或处理较小的文件',
    [ErrorCode.FFMPEG_INVALID_COMMAND]: 'FFmpeg 命令无效，请检查所有参数是否正确',
    [ErrorCode.INVALID_PARAMETER]: '参数无效，请检查参数类型和取值范围',
    [ErrorCode.INCOMPATIBLE_OPTIONS]: '选项不兼容，请检查参数组合是否有效',
    [ErrorCode.MISSING_REQUIRED_OPTION]: '缺少必需参数，请提供所有必需的选项',
    [ErrorCode.OUT_OF_MEMORY]: '内存不足，请尝试处理较小的文件或关闭其他程序',
    [ErrorCode.INSUFFICIENT_DISK_SPACE]: '磁盘空间不足，请清理磁盘或选择其他输出路径',
    [ErrorCode.PERMISSION_DENIED]: '权限不足，请检查文件和目录的访问权限',
  };

  return suggestions[code] || '未知错误，请查看错误详情';
}
