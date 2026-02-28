# @ffmpeg-oneclick/core

> 一键式 FFmpeg Node.js 库 - 简单、快速、完整

## 特性

- ✅ **链式 API** - 流畅的链式调用，一行代码完成复杂操作
- ✅ **TypeScript 原生** - 完整的类型支持和智能提示
- ✅ **Promise + EventEmitter** - 灵活的异步处理方式
- ✅ **自动下载 FFmpeg** - 零配置，开箱即用
- ✅ **进度追踪** - 实时进度、ETA、详细统计
- ✅ **硬件加速** - 自动检测和使用硬件加速
- ✅ **流式处理** - 支持 Buffer 和 Stream 输入输出
- ✅ **完整功能** - 覆盖 FFmpeg 所有原生功能

## 安装

```bash
npm install @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
```

## 快速开始

### 基础用法

```typescript
import { ffmpeg } from '@ffmpeg-oneclick/core';

// 简单转换
await ffmpeg('input.mp4')
  .output('output.webm')
  .run();
```

### 设置视频参数

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .size('720p')              // 分辨率
  .fps(30)                   // 帧率
  .videoBitrate('1M')        // 视频比特率
  .audioBitrate('128k')      // 音频比特率
  .videoCodec('libx264')     // 视频编码器
  .audioCodec('aac')         // 音频编码器
  .run();
```

### 进度监听

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .on('progress', (progress) => {
    console.log(`进度: ${progress.percent.toFixed(1)}%`);
    console.log(`预计剩余时间: ${progress.eta}秒`);
    console.log(`当前帧数: ${progress.frames}`);
    console.log(`编码速度: ${progress.fps} fps`);
  })
  .on('end', (result) => {
    console.log(`完成！输出文件: ${result.output}`);
    console.log(`文件大小: ${result.size} 字节`);
    console.log(`处理时长: ${result.duration} 毫秒`);
  })
  .on('error', (error) => {
    console.error(`错误: ${error.message}`);
    console.error(`建议: ${error.suggestion}`);
  })
  .run();
```

### 视频裁剪

```typescript
// 裁剪 5-15 秒的片段
await ffmpeg('input.mp4')
  .output('clip.mp4')
  .trim(5, 15)
  .run();
```

### 视频滤镜

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .videoFilters({
    scale: { width: 1920, height: 1080 },
    crop: { x: 0, y: 0, width: 1920, height: 800 },
    brightness: 0.1,
    contrast: 0.2,
  })
  .run();
```

### 硬件加速

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .hardwareAccelerate('auto')  // 自动检测最佳硬件加速
  .run();
```

### 获取视频元数据

```typescript
import { getMetadata } from '@ffmpeg-oneclick/core';

const metadata = await getMetadata('video.mp4');

console.log(`时长: ${metadata.duration}秒`);
console.log(`分辨率: ${metadata.width}x${metadata.height}`);
console.log(`帧率: ${metadata.fps} fps`);
console.log(`视频编码: ${metadata.videoCodec}`);
console.log(`音频编码: ${metadata.audioCodec}`);
```

### 流式处理

```typescript
import { createReadStream, createWriteStream } from 'fs';

// 从流读取
await ffmpeg(createReadStream('input.mp4'))
  .output('output.mp4')
  .run();

// 输出到流
await ffmpeg('input.mp4')
  .output(createWriteStream('output.mp4'))
  .run();
```

## API 文档

### `ffmpeg(input?, options?)`

创建 FFmpeg 实例。

- `input`: 输入文件路径、Buffer 或 Stream（可选）
- `options`: 配置选项
  - `ffmpegPath`: FFmpeg 可执行文件路径
  - `ffprobePath`: FFprobe 可执行文件路径
  - `hardwareAcceleration`: 硬件加速模式
  - `threads`: 线程数
  - `timeout`: 超时时间（毫秒）

### 链式方法

#### 输入输出
- `.input(input)` - 设置输入
- `.output(output)` - 设置输出

#### 视频参数
- `.videoCodec(codec)` - 视频编码器
- `.videoBitrate(bitrate)` - 视频比特率
- `.fps(fps)` - 帧率
- `.size(size)` - 分辨率（'720p', '1080p', '4k' 或 `{width, height}`）

#### 音频参数
- `.audioCodec(codec)` - 音频编码器
- `.audioBitrate(bitrate)` - 音频比特率

#### 时间控制
- `.startTime(seconds)` - 起始时间
- `.duration(seconds)` - 持续时间
- `.trim(start, end)` - 裁剪片段

#### 滤镜
- `.videoFilters(options)` - 视频滤镜
- `.audioFilters(options)` - 音频滤镜

#### 元数据
- `.metadata(key, value)` - 添加元数据
- `.noMetadata()` - 移除所有元数据

#### 性能
- `.hardwareAccelerate(type)` - 硬件加速
- `.threads(count)` - 线程数

#### 事件
- `.on('start', callback)` - 开始执行
- `.on('progress', callback)` - 进度更新
- `.on('end', callback)` - 执行完成
- `.on('error', callback)` - 执行错误

#### 执行
- `.run()` - 执行命令
- `.kill()` - 终止执行
- `.getCommand()` - 获取命令字符串（调试用）

## 开发

```bash
# 安装依赖
pnpm install

# 运行测试
pnpm test

# 构建
pnpm build
```

## 许可证

GPL-3.0
