#!/usr/bin/env node

/**
 * FFmpeg 自动安装脚本
 * 在 npm install 时自动运行
 */

import { downloadFFmpeg, isFFmpegInstalled } from './index.js';

async function main() {
  try {
    // 检查是否已安装
    if (isFFmpegInstalled()) {
      console.log('FFmpeg is already installed');
      return;
    }

    // 下载并安装
    await downloadFFmpeg({
      onProgress: (percent) => {
        if (percent % 10 < 1) {
          console.log(`Installing FFmpeg: ${percent.toFixed(0)}%`);
        }
      },
    });
  } catch (error: any) {
    console.error('Failed to install FFmpeg:', error.message);
    console.error('You can manually download FFmpeg from: https://ffmpeg.org/download.html');
    process.exit(1);
  }
}

main();
