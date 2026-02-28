# ffmpeg-oneclick

> 🚀 一键式 Node.js FFmpeg 库 - 简单、快速、完整

[![npm version](https://badge.fury.io/js/@ffmpeg-oneclick%2Fcore.svg)](https://badge.fury.io/js/@ffmpeg-oneclick%2Fcore)
[![License: GPL v3](https://img.shields.io/badge/License-GPLv3-blue.svg)](https://www.gnu.org/licenses/gpl-3.0)
[![Node.js Version](https://img.shields.io/node/v/@ffmpeg-oneclick/core.svg)](https://nodejs.org)

---

## ✨ 特性

- ✅ **链式 API** - 一行代码完成复杂操作
- ✅ **TypeScript 原生** - 完整类型支持和智能提示
- ✅ **自动下载 FFmpeg** - 零配置，开箱即用
- ✅ **硬件加速** - 自动检测和使用 GPU 加速
- ✅ **完整功能** - 覆盖所有 FFmpeg 原生功能
- ✅ **流媒体支持** - HLS/DASH 格式
- ✅ **水印系统** - 图片/文字水印
- ✅ **插件系统** - 可扩展架构

## 📦 安装

```bash
npm install @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
# 或
yarn add @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
# 或
pnpm add @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
```

## 🚀 快速开始

### 基础转换

```typescript
import { ffmpeg } from '@ffmpeg-oneclick/core';

// 简单转换
await ffmpeg('input.mp4')
  .output('output.webm')
  .run();

// 设置参数
await ffmpeg('input.mp4')
  .output('output.mp4')
  .size('720p')
  .fps(30)
  .videoBitrate('1M')
  .run();
```

### 添加水印

```typescript
// 图片水印
await ffmpeg('input.mp4')
  .output('output.mp4')
  .watermark('logo.png', {
    position: 'bottomRight',
    opacity: 0.8
  })
  .run();

// 文字水印
await ffmpeg('input.mp4')
  .output('output.mp4')
  .textWatermark('© 2024 My Brand', {
    fontSize: 24,
    fontColor: 'white',
    position: 'bottomLeft'
  })
  .run();
```

### 生成 HLS 流媒体

```typescript
// HLS 流媒体
await ffmpeg('input.mp4')
  .toHLS('playlist.m3u8', {
    segmentDuration: 10
  });

// DASH 流媒体
await ffmpeg('input.mp4')
  .toDASH('manifest.mpd', {
    segmentDuration: 10
  });
```

### 音频混合

```typescript
await ffmpeg('video.mp4')
  .output('output.mp4')
  .mix([
    { input: 'video.mp4', volume: 1.0 },
    { input: 'music.mp3', volume: 0.3 }
  ])
  .run();
```

### 截图

```typescript
// 单张截图
await ffmpeg('video.mp4')
  .screenshot(5, 'frame.jpg')
  .run();

// 多张截图
await ffmpeg('video.mp4')
  .screenshots({
    timestamps: [1, 5, 10, 15],
    filenameTemplate: 'shot_%d.jpg'
  })
  .run();
```

### 使用预设

```typescript
import { presets } from '@ffmpeg-oneclick/core';

// 压缩视频
await presets.compressVideo('input.mp4', 'output.mp4', 'high');

// 生成 GIF
await presets.toGif('input.mp4', 'output.gif', {
  startTime: 5,
  duration: 3
});

// 提取音频
await presets.extractAudio('input.mp4', 'output.mp3');
```

### 进度监听

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .on('progress', (progress) => {
    console.log(`${progress.percent.toFixed(1)}% - ETA: ${progress.eta}s`);
  })
  .on('end', (result) => {
    console.log(`完成！大小: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
  })
  .run();
```

## 📚 文档

- [快速开始](./docs/quick-start.md)
- [API 示例](./docs/api-examples.md)
- [完整 API 文档](./docs/api-documentation.md)
- [功能列表](./docs/features.md)

## 🛠️ CLI 工具

```bash
# 转换视频
ffmpeg-oneclick convert input.mp4 output.webm --size 720p

# 压缩视频
ffmpeg-oneclick compress input.mp4 output.mp4 --quality high

# 创建 GIF
ffmpeg-oneclick gif input.mp4 output.gif --start 5 --duration 3

# 提取音频
ffmpeg-oneclick extract-audio input.mp4 output.mp3

# 查看视频信息
ffmpeg-oneclick info video.mp4

# 交互模式
ffmpeg-oneclick interactive
```

## 📊 对比

| 特性          | ffmpeg-oneclick | fluent-ffmpeg | @ffmpeg/ffmpeg |
| ----------- | --------------- | ------------- | -------------- |
| 链式 API      | ✅               | ✅             | ❌              |
| TypeScript  | ✅               | ❌             | ✅              |
| 自动下载 FFmpeg | ✅               | ❌             | ✅              |
| 硬件加速检测      | ✅               | ❌             | ❌              |
| 水印系统        | ✅               | ❌             | ❌              |
| HLS/DASH    | ✅               | ❌             | ❌              |
| 音频混合        | ✅               | ❌             | ❌              |
| 截图功能        | ✅               | ❌             | ❌              |
| 插件系统        | ✅               | ❌             | ❌              |
| CLI 工具      | ✅               | ❌             | ❌              |

## 🎯 功能完整性

### 核心功能

- ✅ 视频转换、压缩、裁剪、拼接
- ✅ 音频提取、混合、处理
- ✅ 水印（图片/文字）
- ✅ 截图、缩略图
- ✅ HLS/DASH 流媒体
- ✅ 元数据处理

### 性能优化

- ✅ 硬件加速（NVENC/QSV/VCE/VideoToolbox）
- ✅ 并发控制
- ✅ 智能缓存
- ✅ aria2 加速下载

### 开发体验

- ✅ 100% TypeScript
- ✅ 90%+ 测试覆盖率
- ✅ 完整文档
- ✅ 丰富示例

## 🤝 贡献

欢迎贡献！请在 GitHub 上提交 Issue 或 Pull Request。

## 📄 许可证

[GPL-3.0](LICENSE)

## 🙏 致谢

- [FFmpeg](https://ffmpeg.org/)
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
- [execa](https://github.com/sindresorhus/execa)

---

<div align="center">

</div>
