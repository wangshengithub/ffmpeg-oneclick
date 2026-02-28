# ffmpeg-oneclick

> 🚀 One-Click Node.js FFmpeg Library - Simple, Fast, Complete

[![npm version](https://badge.fury.io/js/@ffmpeg-oneclick%2Fcore.svg)](https://badge.fury.io/js/@ffmpeg-oneclick%2Fcore)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js Version](https://img.shields.io/node/v/@ffmpeg-oneclick/core.svg)](https://nodejs.org)

[中文文档](./README_CN.md)

---

## ✨ Features

- ✅ **Chainable API** - Complete complex operations in one line
- ✅ **Native TypeScript** - Full type support and IntelliSense
- ✅ **Auto-download FFmpeg** - Zero configuration, ready to use
- ✅ **Hardware Acceleration** - Auto-detect and use GPU acceleration
- ✅ **Complete Functionality** - Covers all FFmpeg native features
- ✅ **Streaming Support** - HLS/DASH formats
- ✅ **Watermark System** - Image/text watermarks
- ✅ **Plugin System** - Extensible architecture

## 📦 Installation

```bash
npm install @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
# or
yarn add @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
# or
pnpm add @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
```

## 🚀 Quick Start

### Basic Conversion

```typescript
import { ffmpeg } from '@ffmpeg-oneclick/core';

// Simple conversion
await ffmpeg('input.mp4')
  .output('output.webm')
  .run();

// Set parameters
await ffmpeg('input.mp4')
  .output('output.mp4')
  .size('720p')
  .fps(30)
  .videoBitrate('1M')
  .run();
```

### Add Watermark

```typescript
// Image watermark
await ffmpeg('input.mp4')
  .output('output.mp4')
  .watermark('logo.png', {
    position: 'bottomRight',
    opacity: 0.8
  })
  .run();

// Text watermark
await ffmpeg('input.mp4')
  .output('output.mp4')
  .textWatermark('© 2024 My Brand', {
    fontSize: 24,
    fontColor: 'white',
    position: 'bottomLeft'
  })
  .run();
```

### Generate HLS Streaming

```typescript
// HLS streaming
await ffmpeg('input.mp4')
  .toHLS('playlist.m3u8', {
    segmentDuration: 10
  });

// DASH streaming
await ffmpeg('input.mp4')
  .toDASH('manifest.mpd', {
    segmentDuration: 10
  });
```

### Audio Mixing

```typescript
await ffmpeg('video.mp4')
  .output('output.mp4')
  .mix([
    { input: 'video.mp4', volume: 1.0 },
    { input: 'music.mp3', volume: 0.3 }
  ])
  .run();
```

### Screenshots

```typescript
// Single screenshot
await ffmpeg('video.mp4')
  .screenshot(5, 'frame.jpg')
  .run();

// Multiple screenshots
await ffmpeg('video.mp4')
  .screenshots({
    timestamps: [1, 5, 10, 15],
    filenameTemplate: 'shot_%d.jpg'
  })
  .run();
```

### Use Presets

```typescript
import { presets } from '@ffmpeg-oneclick/core';

// Compress video
await presets.compressVideo('input.mp4', 'output.mp4', 'high');

// Generate GIF
await presets.toGif('input.mp4', 'output.gif', {
  startTime: 5,
  duration: 3
});

// Extract audio
await presets.extractAudio('input.mp4', 'output.mp3');
```

### Progress Monitoring

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .on('progress', (progress) => {
    console.log(`${progress.percent.toFixed(1)}% - ETA: ${progress.eta}s`);
  })
  .on('end', (result) => {
    console.log(`Done! Size: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
  })
  .run();
```

## 📚 Documentation

- [Quick Start](./docs/quick-start_en.md)
- [API Examples](./docs/api-examples_en.md)
- [Complete API Documentation](./docs/api-documentation_en.md)
- [Features](./docs/features_en.md)

## 📚 Documentation

- [Quick Start](./docs/quick-start_EN.md)
- [API Examples](./docs/api-examples_EN.md)
- [Complete API Documentation](./docs/api-documentation_EN.md)
- [Features](./docs/features_EN.md)

## 🛠️ CLI Tool

```bash
# Convert video
ffmpeg-oneclick convert input.mp4 output.webm --size 720p

# Compress video
ffmpeg-oneclick compress input.mp4 output.mp4 --quality high

# Create GIF
ffmpeg-oneclick gif input.mp4 output.gif --start 5 --duration 3

# Extract audio
ffmpeg-oneclick extract-audio input.mp4 output.mp3

# View video info
ffmpeg-oneclick info video.mp4

# Interactive mode
ffmpeg-oneclick interactive
```

## 📊 Comparison

| Feature | ffmpeg-oneclick | fluent-ffmpeg | @ffmpeg/ffmpeg |
|---------|----------------|---------------|----------------|
| Chainable API | ✅ | ✅ | ❌ |
| TypeScript | ✅ | ❌ | ✅ |
| Auto-download FFmpeg | ✅ | ❌ | ✅ |
| Hardware acceleration detection | ✅ | ❌ | ❌ |
| Watermark system | ✅ | ❌ | ❌ |
| HLS/DASH | ✅ | ❌ | ❌ |
| Audio mixing | ✅ | ❌ | ❌ |
| Screenshot feature | ✅ | ❌ | ❌ |
| Plugin system | ✅ | ❌ | ❌ |
| CLI tool | ✅ | ❌ | ❌ |

## 🎯 Feature Completeness

### Core Features

- ✅ Video conversion, compression, cropping, concatenation
- ✅ Audio extraction, mixing, processing
- ✅ Watermarks (image/text)
- ✅ Screenshots, thumbnails
- ✅ HLS/DASH streaming
- ✅ Metadata processing

### Performance Optimization

- ✅ Hardware acceleration (NVENC/QSV/VCE/VideoToolbox)
- ✅ Concurrency control
- ✅ Smart caching
- ✅ aria2 accelerated downloads

### Developer Experience

- ✅ 100% TypeScript
- ✅ 90%+ test coverage
- ✅ Complete documentation
- ✅ Rich examples

## 🤝 Contributing

Contributions welcome! Please submit Issues or Pull Requests on GitHub.

## 📄 License

[GPL-3.0](LICENSE)

## 🙏 Acknowledgments

- [FFmpeg](https://ffmpeg.org/)
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
- [execa](https://github.com/sindresorhus/execa)

---

<div align="center">

</div>
