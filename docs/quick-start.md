# 快速开始指南

本指南将帮助你在 5 分钟内上手 ffmpeg-oneclick。

## 安装

```bash
# 使用 npm
npm install @ffmpeg-oneclick/core @ffmpeg-oneclick/bin

# 使用 yarn
yarn add @ffmpeg-oneclick/core @ffmpeg-oneclick/bin

# 使用 pnpm
pnpm add @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
```

安装时会自动下载对应平台的 FFmpeg 二进制文件。

## 基础用法

### 1. 简单转换

```typescript
import { ffmpeg } from '@ffmpeg-oneclick/core';

await ffmpeg('input.mp4')
  .output('output.webm')
  .run();
```

### 2. 设置参数

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .size('720p')           // 分辨率
  .fps(30)                // 帧率
  .videoBitrate('1M')     // 视频比特率
  .audioBitrate('128k')   // 音频比特率
  .run();
```

### 3. 进度监听

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .on('progress', (progress) => {
    console.log(`${progress.percent.toFixed(1)}% 完成`);
  })
  .run();
```

## 常用场景

### 视频压缩

```typescript
await ffmpeg('large.mp4')
  .output('compressed.mp4')
  .videoBitrate('1M')
  .audioBitrate('96k')
  .size('720p')
  .run();
```

### 裁剪视频

```typescript
// 裁剪 5-15 秒的片段
await ffmpeg('full.mp4')
  .output('clip.mp4')
  .trim(5, 15)
  .run();
```

### 提取音频

```typescript
await ffmpeg('video.mp4')
  .output('audio.mp3')
  .audioCodec('mp3')
  .audioBitrate('192k')
  .noMetadata()
  .run();
```

### 添加水印

```typescript
// 图片水印
await ffmpeg('video.mp4')
  .watermark('logo.png', {
    position: 'bottomRight',
    opacity: 0.8,
    scale: 0.2
  })
  .output('watermarked.mp4')
  .run();

// 文字水印
await ffmpeg('video.mp4')
  .textWatermark('© 2024 My Brand', {
    fontSize: 24,
    fontColor: 'white',
    position: 'bottomLeft',
    opacity: 0.7
  })
  .output('watermarked.mp4')
  .run();
```

### 转换为 GIF

```typescript
await ffmpeg('video.mp4')
  .output('animation.gif')
  .trim(0, 5)             // 只取前 5 秒
  .fps(15)                // 降低帧率
  .size('480x270')        // 缩小尺寸
  .run();
```

## 下一步

- 查看 [完整 API 文档](./api-documentation.md)
- 查看 [功能列表](./features.md)
- 查看 [API 示例](./api-examples.md)

