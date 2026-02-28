# Quick Start Guide

This guide will help you get started with ffmpeg-oneclick in 5 minutes.

## Installation

```bash
# Using npm
npm install @ffmpeg-oneclick/core @ffmpeg-oneclick/bin

# Using yarn
yarn add @ffmpeg-oneclick/core @ffmpeg-oneclick/bin

# Using pnpm
pnpm add @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
```

FFmpeg binaries for your platform will be automatically downloaded during installation.

## Basic Usage

### 1. Simple Conversion

```typescript
import { ffmpeg } from '@ffmpeg-oneclick/core';

await ffmpeg('input.mp4')
  .output('output.webm')
  .run();
```

### 2. Set Parameters

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .size('720p')           // Resolution
  .fps(30)                // Frame rate
  .videoBitrate('1M')     // Video bitrate
  .audioBitrate('128k')   // Audio bitrate
  .run();
```

### 3. Progress Monitoring

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .on('progress', (progress) => {
    console.log(`${progress.percent.toFixed(1)}% complete`);
  })
  .run();
```

## Common Use Cases

### Video Compression

```typescript
await ffmpeg('large.mp4')
  .output('compressed.mp4')
  .videoBitrate('1M')
  .audioBitrate('96k')
  .size('720p')
  .run();
```

### Trim Video

```typescript
// Trim segment from 5-15 seconds
await ffmpeg('full.mp4')
  .output('clip.mp4')
  .trim(5, 15)
  .run();
```

### Extract Audio

```typescript
await ffmpeg('video.mp4')
  .output('audio.mp3')
  .audioCodec('mp3')
  .audioBitrate('192k')
  .noMetadata()
  .run();
```

### Add Watermark

```typescript
// Image watermark
await ffmpeg('video.mp4')
  .watermark('logo.png', {
    position: 'bottomRight',
    opacity: 0.8,
    scale: 0.2
  })
  .output('watermarked.mp4')
  .run();

// Text watermark
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

### Convert to GIF

```typescript
await ffmpeg('video.mp4')
  .output('animation.gif')
  .trim(0, 5)             // Take first 5 seconds
  .fps(15)                // Reduce frame rate
  .size('480x270')        // Resize
  .run();
```

## Next Steps

- View [Complete API Documentation](./api-documentation_EN.md)
- View [Feature List](./features_EN.md)
- View [API Examples](./api-examples_EN.md)
