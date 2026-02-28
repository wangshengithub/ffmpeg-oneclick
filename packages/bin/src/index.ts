import { createWriteStream, existsSync, mkdirSync, readdirSync, unlinkSync, statSync, readFileSync, rmSync } from 'fs';
import { dirname, join, basename, resolve } from 'path';
import { fileURLToPath } from 'url';
import { promisify } from 'util';
import { pipeline } from 'stream';
import { createHash } from 'crypto';
import { HttpsProxyAgent } from 'https-proxy-agent';
import extract from 'extract-zip';
import * as tar from 'tar';
import { execa } from 'execa';

const streamPipeline = promisify(pipeline);

/**
 * 获取 fetch 函数
 */
async function getFetch() {
  // 优先使用 node-fetch
  try {
    const nodeFetch = await import('node-fetch');
    return nodeFetch.default || nodeFetch;
  } catch {
    // 回退到 Node.js 18+ 原生 fetch
    if (typeof globalThis.fetch === 'function') {
      return globalThis.fetch.bind(globalThis);
    }
    throw new Error('No fetch implementation available. Please install node-fetch');
  }
}

/**
 * 验证下载文件
 */
async function verifyDownload(
  filePath: string,
  expectedSize?: number,
  expectedChecksum?: string
): Promise<boolean> {
  // 检查文件是否存在
  if (!existsSync(filePath)) {
    return false;
  }

  // 检查文件大小
  if (expectedSize) {
    const stats = statSync(filePath);
    if (stats.size !== expectedSize) {
      console.warn(`File size mismatch: expected ${expectedSize}, got ${stats.size}`);
      return false;
    }
  }

  // 检查校验和
  if (expectedChecksum) {
    const hash = createHash('sha256');
    const fileBuffer = readFileSync(filePath);
    hash.update(fileBuffer);
    const actualChecksum = hash.digest('hex');

    if (actualChecksum !== expectedChecksum) {
      console.warn(`Checksum mismatch: expected ${expectedChecksum}, got ${actualChecksum}`);
      return false;
    }
  }

  return true;
}

/**
 * 平台信息
 */
export interface PlatformInfo {
  platform: string;
  arch: string;
  ffmpegPath: string;
  downloadUrl: string;
  checksumUrl?: string;
}

/**
 * 下载选项
 */
export interface DownloadOptions {
  /** 使用 aria2 加速下载 */
  useAria2?: boolean;

  /** 代理 URL */
  proxy?: string;

  /** 超时时间（毫秒） */
  timeout?: number;

  /** 下载进度回调 */
  onProgress?: (percent: number) => void;
}

/**
 * 平台配置映射
 */
interface PlatformConfig {
  ffmpegBinary: string;
  ffprobeBinary: string;
  getUrl: (arch: string) => string | null;
}

/**
 * 获取平台配置
 */
function getPlatformConfig(platform: string): PlatformConfig | null {
  const configs: Record<string, PlatformConfig> = {
    win32: {
      ffmpegBinary: 'ffmpeg.exe',
      ffprobeBinary: 'ffprobe.exe',
      getUrl: (arch: string) => {
        const urls: Record<string, string> = {
          x64: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win64-gpl.zip',
          ia32: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-win32-gpl.zip',
        };
        return urls[arch] || null;
      },
    },
    darwin: {
      ffmpegBinary: 'ffmpeg',
      ffprobeBinary: 'ffprobe',
      getUrl: (arch: string) => {
        const urls: Record<string, string> = {
          x64: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-macos64-gpl.zip',
          arm64: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-macos-arm64-gpl.zip',
        };
        return urls[arch] || null;
      },
    },
    linux: {
      ffmpegBinary: 'ffmpeg',
      ffprobeBinary: 'ffprobe',
      getUrl: (arch: string) => {
        const urls: Record<string, string> = {
          x64: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux64-gpl.tar.xz',
          arm64: 'https://github.com/BtbN/FFmpeg-Builds/releases/download/latest/ffmpeg-master-latest-linux-arm64-gpl.tar.xz',
        };
        return urls[arch] || null;
      },
    },
  };

  return configs[platform] || null;
}

/**
 * 获取当前平台信息
 */
export function getPlatformInfo(): PlatformInfo {
  const platform = process.platform;
  const arch = process.arch;

  // 获取平台配置
  const config = getPlatformConfig(platform);

  if (!config) {
    throw new Error(`Unsupported platform: ${platform}`);
  }

  // 获取下载 URL
  const downloadUrl = config.getUrl(arch);

  if (!downloadUrl) {
    throw new Error(`Unsupported architecture: ${platform}-${arch}`);
  }

  const binaryDir = getBinaryDir();
  const ffmpegPath = join(binaryDir, config.ffmpegBinary);

  return {
    platform,
    arch,
    ffmpegPath,
    downloadUrl,
  };
}

/**
 * 获取二进制文件目录
 */
export function getBinaryDir(): string {
  // 兼容 CJS 和 ESM
  const currentDir = typeof __dirname !== 'undefined'
    ? __dirname
    : dirname(fileURLToPath(import.meta.url));
  return join(currentDir, '..', 'binaries');
}

/**
 * 获取 FFmpeg 可执行文件路径（同步版本）
 * 如果 FFmpeg 不存在，会抛出错误提示使用异步版本
 */
export function getFFmpegPath(): string {
  const { ffmpegPath } = getPlatformInfo();

  if (!existsSync(ffmpegPath)) {
    throw new Error(
      `FFmpeg binary not found at ${ffmpegPath}. Please use getFFmpegPathAsync() for auto-download, or run: npm install @ffmpeg-oneclick/bin`
    );
  }

  return ffmpegPath;
}

/**
 * 获取 FFmpeg 可执行文件路径（异步版本，自动下载）
 * 如果 FFmpeg 不存在，会自动下载
 */
export async function getFFmpegPathAsync(options: DownloadOptions = {}): Promise<string> {
  const { ffmpegPath } = getPlatformInfo();

  // 如果已存在，直接返回
  if (existsSync(ffmpegPath)) {
    return ffmpegPath;
  }

  // 自动下载
  console.log('FFmpeg not found, downloading automatically...');
  await downloadFFmpeg(options);

  return ffmpegPath;
}

/**
 * 获取 FFprobe 可执行文件路径（同步版本）
 */
export function getFFprobePath(): string {
  const binaryDir = getBinaryDir();
  const platform = process.platform;

  const ffprobeBinary = platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
  const ffprobePath = join(binaryDir, ffprobeBinary);

  if (!existsSync(ffprobePath)) {
    throw new Error(
      `FFprobe binary not found at ${ffprobePath}. Please use getFFprobePathAsync() for auto-download`
    );
  }

  return ffprobePath;
}

/**
 * 获取 FFprobe 可执行文件路径（异步版本，自动下载）
 * FFprobe 包含在 FFmpeg 压缩包中，会随 FFmpeg 一起下载
 */
export async function getFFprobePathAsync(options: DownloadOptions = {}): Promise<string> {
  const binaryDir = getBinaryDir();
  const platform = process.platform;
  const ffprobeBinary = platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';
  const ffprobePath = join(binaryDir, ffprobeBinary);

  // 如果已存在，直接返回
  if (existsSync(ffprobePath)) {
    return ffprobePath;
  }

  // 自动下载 FFmpeg（包含 FFprobe）
  console.log('FFprobe not found, downloading FFmpeg package (includes FFprobe)...');
  await downloadFFmpeg(options);

  return ffprobePath;
}

/**
 * 检查 FFmpeg 是否已安装
 */
export function isFFmpegInstalled(): boolean {
  try {
    const ffmpegPath = getFFmpegPath();
    return existsSync(ffmpegPath);
  } catch {
    return false;
  }
}

/**
 * 使用 aria2 下载文件
 */
async function downloadWithAria2(
  url: string,
  outputPath: string,
  options: DownloadOptions = {}
): Promise<void> {
  const { timeout = 120000, onProgress } = options;

  // 检查 aria2 是否可用
  try {
    await execa('aria2c', ['--version']);
  } catch {
    throw new Error('aria2c not found. Please install aria2 or disable aria2 acceleration.');
  }

  // 确保目录存在
  const dir = dirname(outputPath);
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true });
  }

  // 构建 aria2 参数
  const args = [
    '-x', '16',  // 16个连接
    '-s', '16',  // 16个分片
    '-k', '1M',  // 每个分片1MB
    '-o', basename(outputPath),
    '--dir', dir,
    '--timeout', Math.floor(timeout / 1000).toString(),
    '--max-tries', '5',
    '--retry-wait', '5',
  ];

  // 添加进度监听
  if (onProgress) {
    args.push('--summary-interval=1');
  }

  args.push(url);

  // 执行下载
  const process = execa('aria2c', args);

  if (onProgress) {
    process.stdout?.on('data', (data: Buffer) => {
      const line = data.toString();
      // 解析 aria2 进度输出
      const progressMatch = line.match(/(\d+)%/);
      if (progressMatch && progressMatch[1]) {
        const percent = parseInt(progressMatch[1]);
        onProgress(percent);
      }
    });
  }

  await process;
}

/**
 * 下载文件
 */
/**
 * 下载文件（带重试机制）
 */
async function downloadFile(
  url: string,
  outputPath: string,
  options: DownloadOptions = {}
): Promise<void> {
  const { proxy, timeout = 120000, onProgress, useAria2 = false } = options;
  const maxRetries = 3;
  const retryDelay = 2000; // 2秒

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(`下载尝试 ${attempt}/${maxRetries}...`);

      // 如果启用 aria2，优先使用 aria2
      if (useAria2) {
        try {
          await downloadWithAria2(url, outputPath, options);
          return;
        } catch (error) {
          console.warn('aria2 download failed, falling back to native download:', error);
          // 回退到原生下载
        }
      }

      // 准备请求选项
      const fetchOptions: any = {
        timeout,
      };

      if (proxy) {
        fetchOptions.agent = new HttpsProxyAgent(proxy);
      }

      // 获取 fetch 函数
      const fetch = await getFetch();

      // 发起请求
      const response = await fetch(url, fetchOptions);

  if (!response.ok) {
    throw new Error(`Failed to download ${url}: ${response.statusText}`);
  }

  const contentLength = response.headers.get('content-length');
  const totalSize = contentLength ? parseInt(contentLength, 10) : 0;
      let downloadedSize = 0;

      // 确保目录存在
      const dir = dirname(outputPath);
      if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
      }

      // 创建写入流
      const fileStream = createWriteStream(outputPath);

      // 下载并跟踪进度
      if (response.body) {
        const progressStream = new (await import('stream')).Transform({
          transform(chunk, _encoding, callback) {
            downloadedSize += chunk.length;
            if (totalSize > 0 && onProgress) {
              const percent = (downloadedSize / totalSize) * 100;
              onProgress(percent);
            }
            callback(null, chunk);
          },
        });

        await streamPipeline(response.body, progressStream, fileStream);
      }

      // 下载成功，返回
      console.log(`✅ 下载成功 (尝试 ${attempt}/${maxRetries})`);
      return;

    } catch (error: any) {
      console.error(`❌ 下载失败 (尝试 ${attempt}/${maxRetries}):`, error.message);

      // 如果是最后一次尝试，抛出错误
      if (attempt === maxRetries) {
        throw new Error(`下载失败，已重试 ${maxRetries} 次: ${error.message}`);
      }

      // 否则等待后重试
      console.log(`等待 ${retryDelay / 1000} 秒后重试...\n`);
      await new Promise(resolve => setTimeout(resolve, retryDelay));
    }
  }
}

/**
 * 解压文件
 */
async function extractFile(archivePath: string, outputDir: string): Promise<void> {
  if (archivePath.endsWith('.zip')) {
    await extract(archivePath, {
      dir: outputDir,
      // extract-zip 默认防止路径遍历
    });
  } else if (archivePath.endsWith('.tar.xz') || archivePath.endsWith('.tar.gz')) {
    // tar 需要手动验证路径安全性
    await tar.x({
      file: archivePath,
      cwd: outputDir,
      onentry: (entry) => {
        // 验证路径安全性，防止路径遍历攻击
        const resolvedPath = resolve(outputDir, entry.path);
        if (!resolvedPath.startsWith(resolve(outputDir))) {
          throw new Error(`Unsafe path in archive: ${entry.path}`);
        }
      },
    });
  } else {
    throw new Error(`Unsupported archive format: ${archivePath}`);
  }
}

/**
 * 查找二进制文件
 */
function findBinary(dir: string, binaryName: string): string | null {
  const files = readdirSync(dir, { withFileTypes: true });

  for (const file of files) {
    const fullPath = join(dir, file.name);

    if (file.isDirectory()) {
      const found = findBinary(fullPath, binaryName);
      if (found) return found;
    } else if (file.name === binaryName) {
      return fullPath;
    }
  }

  return null;
}

/**
 * 确定下载文件的扩展名
 */
function getArchiveExtension(url: string): string {
  if (url.endsWith('.zip')) return '.zip';
  if (url.endsWith('.tar.xz')) return '.tar.xz';
  if (url.endsWith('.tar.gz')) return '.tar.gz';
  return '.zip';
}

/**
 * 清理提取目录
 */
function cleanExtractDir(extractDir: string): void {
  if (existsSync(extractDir)) {
    // 递归删除整个目录
    rmSync(extractDir, { recursive: true, force: true });
  }
  // 重新创建空目录
  mkdirSync(extractDir, { recursive: true });
}

/**
 * 复制二进制文件并设置权限
 */
async function setupBinaries(
  extractDir: string,
  binaryDir: string,
  platform: string
): Promise<void> {
  const { copyFileSync, chmodSync } = await import('fs');
  const ffmpegBinary = platform === 'win32' ? 'ffmpeg.exe' : 'ffmpeg';
  const ffprobeBinary = platform === 'win32' ? 'ffprobe.exe' : 'ffprobe';

  const extractedFFmpeg = findBinary(extractDir, ffmpegBinary);
  const extractedFFprobe = findBinary(extractDir, ffprobeBinary);

  if (!extractedFFmpeg) {
    throw new Error('FFmpeg binary not found in extracted archive');
  }

  // 复制到目标位置
  copyFileSync(extractedFFmpeg, join(binaryDir, ffmpegBinary));

  if (extractedFFprobe) {
    copyFileSync(extractedFFprobe, join(binaryDir, ffprobeBinary));
  }

  // 设置可执行权限（Unix 系统）
  if (platform !== 'win32') {
    chmodSync(join(binaryDir, ffmpegBinary), 0o755);
    if (extractedFFprobe) {
      chmodSync(join(binaryDir, ffprobeBinary), 0o755);
    }
  }
}

/**
 * 下载并安装 FFmpeg
 */
export async function downloadFFmpeg(options: DownloadOptions = {}): Promise<string> {
  const { onProgress, useAria2 = false } = options;
  const { downloadUrl, ffmpegPath } = getPlatformInfo();
  const binaryDir = getBinaryDir();

  // 如果已安装，直接返回
  if (isFFmpegInstalled()) {
    return ffmpegPath;
  }

  console.log('Downloading FFmpeg...');
  console.log(`URL: ${downloadUrl}`);

  if (useAria2) {
    console.log('Using aria2 for faster download...');
  }

  // 确定临时文件路径
  const archiveExt = getArchiveExtension(downloadUrl);
  const archivePath = join(binaryDir, `ffmpeg${archiveExt}`);
  const extractDir = join(binaryDir, 'extracted');

  try {
    // 下载文件（支持 aria2 加速）
    await downloadFile(downloadUrl, archivePath, {
      ...options,
      useAria2,
      onProgress: (percent) => {
        if (onProgress) {
          onProgress(percent * 0.6); // 下载占 60%
        } else {
          console.log(`Downloading: ${percent.toFixed(1)}%`);
        }
      },
    });

    // 验证下载
    if (onProgress) onProgress(65);
    console.log('Verifying download...');
    const isValid = await verifyDownload(archivePath);

    if (!isValid) {
      throw new Error('Download verification failed. File may be corrupted.');
    }

    console.log('Extracting...');

    // 清理并解压文件
    cleanExtractDir(extractDir);
    // 将相对路径转换为绝对路径，因为 extract-zip 要求绝对路径
    const absoluteExtractDir = resolve(extractDir);
    await extractFile(archivePath, absoluteExtractDir);

    if (onProgress) {
      onProgress(85); // 解压占 85%
    }

    // 查找并移动二进制文件
    await setupBinaries(extractDir, binaryDir, process.platform);

    // 清理所有临时文件
    console.log('Cleaning up temporary files...');

    // 删除压缩包
    if (existsSync(archivePath)) {
      unlinkSync(archivePath);
    }

    // 删除解压目录
    if (existsSync(extractDir)) {
      rmSync(extractDir, { recursive: true, force: true });
    }

    if (onProgress) {
      onProgress(100);
    }

    console.log('FFmpeg installed successfully!');

    return ffmpegPath;
  } catch (error: any) {
    console.error('Failed to download FFmpeg:', error.message);

    // 安装失败时也清理临时文件
    try {
      if (existsSync(archivePath)) {
        unlinkSync(archivePath);
      }
      if (existsSync(extractDir)) {
        rmSync(extractDir, { recursive: true, force: true });
      }
    } catch (cleanupError: any) {
      console.error('Failed to cleanup temporary files:', cleanupError.message);
    }

    throw error;
  }
}
