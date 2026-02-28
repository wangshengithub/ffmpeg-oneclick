// 视频滤镜示例
import { ffmpeg } from '@ffmpeg-oneclick/core';

async function main() {
  console.log('=== ffmpeg-oneclick 视频滤镜示例 ===\n');

  const inputFile = 'test-video.mp4';

  // 1. 缩放和裁剪
  console.log('1. 缩放到 1080p 并裁剪...');
  try {
    await ffmpeg(inputFile)
      .output('scaled-and-cropped.mp4')
      .videoFilters({
        scale: { width: 1920, height: 1080 },
        crop: { x: 0, y: 140, width: 1920, height: 800 },
      })
      .run();
    console.log('   完成！\n');
  } catch (error) {
    console.log('   失败（请确保 test-video.mp4 存在）\n');
  }

  // 2. 亮度和对比度调整
  console.log('2. 调整亮度和对比度...');
  try {
    await ffmpeg(inputFile)
      .output('brightness-contrast.mp4')
      .videoFilters({
        brightness: 0.1,
        contrast: 0.2,
      })
      .run();
    console.log('   完成！\n');
  } catch (error) {
    console.log('   失败（请确保 test-video.mp4 存在）\n');
  }

  // 3. 饱和度调整
  console.log('3. 增加饱和度...');
  try {
    await ffmpeg(inputFile)
      .output('saturated.mp4')
      .videoFilters({
        saturation: 0.5,
      })
      .run();
    console.log('   完成！\n');
  } catch (error) {
    console.log('   失败（请确保 test-video.mp4 存在）\n');
  }

  // 4. 模糊效果
  console.log('4. 添加模糊效果...');
  try {
    await ffmpeg(inputFile).output('blurred.mp4').videoFilters({ blur: 2 }).run();
    console.log('   完成！\n');
  } catch (error) {
    console.log('   失败（请确保 test-video.mp4 存在）\n');
  }

  // 5. 锐化
  console.log('5. 锐化视频...');
  try {
    await ffmpeg(inputFile).output('sharpened.mp4').videoFilters({ sharpen: 1 }).run();
    console.log('   完成！\n');
  } catch (error) {
    console.log('   失败（请确保 test-video.mp4 存在）\n');
  }

  // 6. 翻转和旋转
  console.log('6. 水平翻转...');
  try {
    await ffmpeg(inputFile).output('flipped.mp4').videoFilters({ hflip: true }).run();
    console.log('   完成！\n');
  } catch (error) {
    console.log('   失败（请确保 test-video.mp4 存在）\n');
  }

  // 7. 组合多个滤镜
  console.log('7. 组合多个滤镜...');
  try {
    await ffmpeg(inputFile)
      .output('multi-filter.mp4')
      .videoFilters({
        scale: { width: 1280, height: 720 },
        brightness: 0.05,
        contrast: 0.1,
        saturation: 0.3,
      })
      .run();
    console.log('   完成！\n');
  } catch (error) {
    console.log('   失败（请确保 test-video.mp4 存在）\n');
  }

  // 8. 音频滤镜
  console.log('8. 音频处理...');
  try {
    await ffmpeg(inputFile)
      .output('audio-processed.mp4')
      .audioFilters({
        volume: 0.8,
        normalize: true,
      })
      .run();
    console.log('   完成！\n');
  } catch (error) {
    console.log('   失败（请确保 test-video.mp4 存在）\n');
  }

  console.log('=== 示例完成 ===');
}

main().catch(console.error);
