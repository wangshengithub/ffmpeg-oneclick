// 进度追踪示例
import { ffmpeg } from '@ffmpeg-oneclick/core';

async function main() {
  console.log('=== ffmpeg-oneclick 进度追踪示例 ===\n');

  const inputFile = 'test-video.mp4';

  try {
    console.log('开始处理视频...\n');

    const result = await ffmpeg(inputFile)
      .output('output-with-progress.mp4')
      .size('720p')
      .videoBitrate('1M')
      .on('start', (command) => {
        console.log('FFmpeg 命令:');
        console.log(command);
        console.log('');
      })
      .on('progress', (progress) => {
        // 显示进度条
        const barLength = 40;
        const filledLength = Math.round((barLength * progress.percent) / 100);
        const bar = '█'.repeat(filledLength) + '░'.repeat(barLength - filledLength);

        process.stdout.write(
          `\r[${bar}] ${progress.percent.toFixed(1)}% | ` +
            `帧数: ${progress.frames} | ` +
            `速度: ${progress.fps.toFixed(1)} fps | ` +
            `ETA: ${Math.ceil(progress.eta)}秒`
        );
      })
      .on('stderr', (line) => {
        // 可以在这里记录 FFmpeg 的详细输出
        // console.log('FFmpeg:', line);
      })
      .on('end', (result) => {
        console.log('\n\n✅ 处理完成！');
        console.log(`   输出文件: ${result.output}`);
        console.log(`   文件大小: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
        console.log(`   处理时长: ${(result.duration / 1000).toFixed(2)} 秒`);
      })
      .on('error', (error) => {
        console.error('\n\n❌ 处理失败！');
        console.error(`   错误: ${error.message}`);
        if (error.suggestion) {
          console.error(`   建议: ${error.suggestion}`);
        }
      })
      .run();

    console.log('\n=== 示例完成 ===');
  } catch (error) {
    console.log('\n处理失败（请确保 test-video.mp4 存在）');
  }
}

main().catch(console.error);
