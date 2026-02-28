// 基础用法示例
import { ffmpeg, getMetadata } from '@ffmpeg-oneclick/core';

async function main() {
  console.log('=== ffmpeg-oneclick 基础用法示例 ===\n');

  const inputFile = 'test-video.mp4';
  const outputFile = 'output.mp4';

  // 1. 读取视频元数据
  console.log('1. 读取视频元数据...');
  try {
    const metadata = await getMetadata(inputFile);
    console.log(`   时长: ${metadata.duration.toFixed(2)}秒`);
    console.log(`   分辨率: ${metadata.width}x${metadata.height}`);
    console.log(`   帧率: ${metadata.fps} fps`);
    console.log(`   视频编码: ${metadata.videoCodec}\n`);
  } catch (error) {
    console.log('   无法读取元数据（请确保 test-video.mp4 存在）\n');
  }

  // 2. 简单转换
  console.log('2. 简单视频转换...');
  try {
    const result = await ffmpeg(inputFile).output('simple-output.mp4').run();

    console.log(`   转换完成！`);
    console.log(`   输出文件: ${result.output}`);
    console.log(`   文件大小: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
    console.log(`   处理时长: ${(result.duration / 1000).toFixed(2)} 秒\n`);
  } catch (error) {
    console.log('   转换失败（请确保 test-video.mp4 存在）\n');
  }

  // 3. 设置参数
  console.log('3. 转换并设置参数...');
  try {
    await ffmpeg(inputFile)
      .output('720p-output.mp4')
      .size('720p')
      .fps(30)
      .videoBitrate('1M')
      .audioBitrate('128k')
      .run();

    console.log('   720p 转换完成！\n');
  } catch (error) {
    console.log('   转换失败（请确保 test-video.mp4 存在）\n');
  }

  // 4. 裁剪视频
  console.log('4. 裁剪视频片段（5-15秒）...');
  try {
    await ffmpeg(inputFile).output('clip-output.mp4').trim(5, 15).run();

    console.log('   裁剪完成！\n');
  } catch (error) {
    console.log('   裁剪失败（请确保 test-video.mp4 存在）\n');
  }

  // 5. 添加元数据
  console.log('5. 添加元数据...');
  try {
    await ffmpeg(inputFile)
      .output('metadata-output.mp4')
      .metadata('title', '测试视频')
      .metadata('artist', 'ffmpeg-oneclick')
      .metadata('comment', '使用 ffmpeg-oneclick 处理')
      .run();

    console.log('   元数据添加完成！\n');
  } catch (error) {
    console.log('   添加失败（请确保 test-video.mp4 存在）\n');
  }

  console.log('=== 示例完成 ===');
}

main().catch(console.error);
