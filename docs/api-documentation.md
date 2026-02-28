# API 文档

> ffmpeg-oneclick 完整 API 参考文档

## 📦 安装

```bash
npm install @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
# 或
yarn add @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
# 或
pnpm add @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
```

---

## 🚀 快速开始

```typescript
import { ffmpeg } from '@ffmpeg-oneclick/core';

// 基础转换
await ffmpeg('input.mp4')
  .output('output.webm')
  .run();

// 带参数转换
await ffmpeg('input.mp4')
  .output('output.mp4')
  .videoCodec('libx264')
  .videoBitrate('1M')
  .fps(30)
  .run();
```

---

## 📚 核心 API

### `ffmpeg(input?)`

创建链式 FFmpeg 实例。

**参数:**

- `input?: string` - 输入文件路径（可选）

**返回:**

- `ChainableFFmpeg` - 链式 API 实例

**示例:**

```typescript
const instance = ffmpeg('input.mp4');
const instance = ffmpeg(); // 延迟设置输入
```

---

## 🔗 ChainableFFmpeg API

### 输入/输出方法

#### `input(path: string)`

设置输入文件。

```typescript
ffmpeg().input('input.mp4')
```

#### `output(path: string)`

设置输出文件。

```typescript
ffmpeg('input.mp4').output('output.mp4')
```

---

### 视频编码方法

#### `videoCodec(codec: string)`

设置视频编码器。

```typescript
.videoCodec('libx264')
.videoCodec('libvpx-vp9')
```

#### `videoBitrate(bitrate: string | number)`

设置视频比特率。

```typescript
.videoBitrate('1M')
.videoBitrate(1000000)
```

#### `fps(fps: number)`

设置帧率。

```typescript
.fps(30)
.fps(60)
```

#### `size(resolution: string | { width: number; height: number })`

设置分辨率。

```typescript
.size('1920x1080')
.size('4k')
.size({ width: 1280, height: 720 })
```

---

### 音频编码方法

#### `audioCodec(codec: string)`

设置音频编码器。

```typescript
.audioCodec('aac')
.audioCodec('mp3')
```

#### `audioBitrate(bitrate: string | number)`

设置音频比特率。

```typescript
.audioBitrate('128k')
.audioBitrate(128000)
```

#### `audioFrequency(frequency: number)`

设置音频采样率。

```typescript
.audioFrequency(48000)
```

#### `audioChannels(channels: number)`

设置音频通道数。

```typescript
.audioChannels(2) // 立体声
.audioChannels(1) // 单声道
```

#### `volume(volume: number)`

调整音量。

```typescript
.volume(1.5) // 增加 50%
.volume(0.5) // 降低 50%
```

---

### 时间控制方法

#### `startTime(time: number)`

设置起始时间（秒）。

```typescript
.startTime(10) // 从第 10 秒开始
```

#### `duration(duration: number)`

设置持续时间（秒）。

```typescript
.duration(30) // 持续 30 秒
```

#### `trim(startTime: number, endTime: number)`

裁剪视频片段。

```typescript
.trim(5, 15) // 裁剪 5-15 秒
```

---

### 水印方法

#### `watermark(path: string, options?)`

添加图片水印。

**选项:**

- `position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | { x: number; y: number }`
- `opacity?: number` - 透明度 (0-1)
- `scale?: number` - 缩放比例

```typescript
.watermark('logo.png', {
  position: 'bottomRight',
  opacity: 0.8,
  scale: 0.2
})
```

#### `textWatermark(text: string, options?)`

添加文字水印。

**选项:**

- `fontFile?: string` - 字体文件路径
- `fontSize?: number` - 字体大小
- `fontColor?: string` - 字体颜色
- `position?: 'topLeft' | 'topRight' | 'bottomLeft' | 'bottomRight' | 'center' | { x: number; y: number }`
- `opacity?: number` - 透明度
- `borderColor?: string` - 边框颜色
- `borderWidth?: number` - 边框宽度
- `shadowColor?: string` - 阴影颜色
- `shadowOffset?: number` - 阴影偏移

```typescript
.textWatermark('© 2024 My Brand', {
  fontSize: 24,
  fontColor: 'white',
  position: 'bottomLeft',
  opacity: 0.7
})
```

---

### 截图方法

#### `screenshot(time: number, output: string)`

截取单张截图。

```typescript
.screenshot(5, 'frame.jpg') // 截取第 5 秒
```

#### `screenshots(options)`

截取多张截图。

**选项:**

- `timestamps: number[]` - 时间点数组
- `filenameTemplate?: string` - 文件名模板

```typescript
.screenshots({
  timestamps: [1, 5, 10, 15],
  filenameTemplate: 'shot_%d.jpg'
})
```

#### `thumbnails(options)`

生成缩略图。

**选项:**

- `count: number` - 缩略图数量
- `filenameTemplate?: string` - 文件名模板

```typescript
.thumbnails({
  count: 10,
  filenameTemplate: 'thumb_%d.jpg'
})
```

---

### 流媒体方法

#### `toHLS(output: string, options?)`

转换为 HLS 流媒体格式。

**选项:**

- `segmentDuration?: number` - 分片时长（秒）
- `playlistName?: string` - 播放列表名称
- `segmentName?: string` - 分片文件名模板
- `listSize?: number` - 分片数量限制
- `fmp4?: boolean` - 使用 fMP4 格式

```typescript
await ffmpeg('input.mp4')
  .toHLS('playlist.m3u8', {
    segmentDuration: 10
  });
```

#### `toDASH(output: string, options?)`

转换为 DASH 流媒体格式。

**选项:**

- `segmentDuration?: number` - 分片时长（秒）
- `manifestName?: string` - 清单文件名

```typescript
await ffmpeg('input.mp4')
  .toDASH('manifest.mpd', {
    segmentDuration: 10
  });
```

---

### 滤镜方法

#### `videoFilters(filters)`

应用视频滤镜。

```typescript
.videoFilters({
  scale: '1920x1080',
  fps: 30,
  crop: { width: 1920, height: 800, x: 0, y: 140 },
  rotate: 90,
  blur: 2,
  sharpen: 1,
  brightness: 0.1,
  contrast: 1.2,
  saturation: 1.1
})
```

#### `audioFilters(filters)`

应用音频滤镜。

```typescript
.audioFilters({
  volume: 1.5,
  denoise: true,
  normalize: true
})
```

---

### 音频混合方法

#### `mix(audioInputs)`

混合多个音频轨道。

```typescript
.mix([
  { input: 'video.mp4', volume: 1.0 },
  { input: 'music.mp3', volume: 0.3, startTime: 0 },
  { input: 'voice.mp3', volume: 0.8, startTime: 5 }
])
```

---

### 元数据方法

#### `metadata(key: string, value: string)`

添加元数据。

```typescript
.metadata('title', 'My Video')
.metadata('author', 'John Doe')
```

#### `noMetadata()`

移除所有元数据。

```typescript
.noMetadata()
```

---

### 高级方法

#### `hardwareAccelerate(type: 'nvenc' | 'qsv' | 'vce' | 'videotoolbox')`

启用硬件加速。

```typescript
.hardwareAccelerate('nvenc')
```

#### `threads(count: number)`

设置线程数。

```typescript
.threads(4)
```

#### `format(format: string)`

设置输出格式。

```typescript
.format('mp4')
.format('webm')
```

#### `outputOption(key: string, value?: string)`

添加输出选项。

```typescript
.outputOption('-preset', 'fast')
.outputOption('-crf', '23')
```

#### `inputOption(key: string, value?: string)`

添加输入选项。

```typescript
.inputOption('-framerate', '30')
```

#### `cache(options?)`

启用缓存。

**选项:**

- `enabled?: boolean` - 是否启用
- `dir?: string` - 缓存目录
- `ttl?: number` - TTL（秒）
- `maxSize?: number` - 最大缓存大小（字节）

```typescript
.cache({
  enabled: true,
  ttl: 3600
})
```

---

### 执行方法

#### `run()`

执行 FFmpeg 命令。

**返回:** `Promise<FFmpegResult>`

```typescript
const result = await ffmpeg('input.mp4')
  .output('output.mp4')
  .run();

console.log(`输出: ${result.output}`);
console.log(`耗时: ${result.duration}ms`);
console.log(`大小: ${result.size} bytes`);
```

#### `getCommand()`

获取 FFmpeg 命令（不执行）。

```typescript
const command = ffmpeg('input.mp4')
  .output('output.mp4')
  .videoBitrate('1M')
  .getCommand();

console.log(command); // ['-i', 'input.mp4', '-b:v', '1M', 'output.mp4']
```

#### `kill()`

终止 FFmpeg 进程。

```typescript
const instance = ffmpeg('input.mp4').output('output.mp4');

// 稍后终止
instance.kill();
```

---

### 事件监听

#### `on(event: string, handler: Function)`

注册事件监听器。

**事件类型:**

- `'start'` - 开始执行
- `'progress'` - 进度更新
- `'end'` - 执行完成
- `'error'` - 执行错误
- `'stderr'` - stderr 输出
- `'stdout'` - stdout 输出

```typescript
ffmpeg('input.mp4')
  .output('output.mp4')
  .on('start', (command) => {
    console.log('命令:', command);
  })
  .on('progress', (progress) => {
    console.log(`进度: ${progress.percent.toFixed(1)}%`);
    console.log(`剩余时间: ${progress.eta}秒`);
    console.log(`当前帧: ${progress.frames}`);
    console.log(`比特率: ${progress.bitrate} kbps`);
    console.log(`编码速度: ${progress.fps} fps`);
  })
  .on('end', (result) => {
    console.log('完成！');
    console.log(`文件大小: ${(result.size / 1024 / 1024).toFixed(2)} MB`);
  })
  .on('error', (error) => {
    console.error('错误:', error.message);
  })
  .run();
```

---

## 🎨 预设 API

### `presets` 对象

内置预设管理器。

#### 压缩预设

```typescript
import { presets } from '@ffmpeg-oneclick/core';

// 高压缩率（小文件）
await presets.compressVideo('input.mp4', 'output.mp4', 'high');

// 中等压缩率（平衡）
await presets.compressVideo('input.mp4', 'output.mp4', 'medium');

// 低压缩率（高质量）
await presets.compressVideo('input.mp4', 'output.mp4', 'low');
```

#### GIF 转换

```typescript
await presets.toGif('input.mp4', 'output.gif', {
  startTime: 5,
  duration: 3,
  fps: 15,
  size: '480x270'
});
```

#### 音频提取

```typescript
await presets.extractAudio('input.mp4', 'output.mp3', '192k');
```

#### Web 优化

```typescript
await presets.webOptimized('input.mp4', 'output.mp4');
```

#### 移动设备优化

```typescript
await presets.mobileFriendly('input.mp4', 'output.mp4');
```

#### 缩略图生成

```typescript
await presets.createThumbnail('input.mp4', 'thumbnail.jpg', 5);
```

---

## 🔌 插件 API

### 插件接口

```typescript
interface Plugin {
  name: string;
  version: string;
  description?: string;
  author?: string;
  dependencies?: Array<{
    name: string;
    version: string;  // 支持 semver 范围: ^1.0.0, >=1.0.0, 等
  }>;
  install: (context: PluginContext) => void | Promise<void>;
  uninstall?: () => void | Promise<void>;
}
```

### 使用插件

```typescript
import { usePlugin, getPluginManager } from '@ffmpeg-oneclick/core';

// 安装插件
await usePlugin(MyCustomPlugin);

// 获取插件管理器
const manager = getPluginManager();

// 安装插件
await manager.install(MyPlugin);

// 卸载插件
await manager.uninstall('my-plugin');

// 列出所有插件
const plugins = manager.listPlugins();

// 获取统计信息
const stats = manager.getStats();
```

### 创建插件

```typescript
const MyCustomPlugin: Plugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  description: 'My custom FFmpeg plugin',

  // 可选：声明插件依赖
  dependencies: [
    { name: 'base-plugin', version: '^1.0.0' },
  ],

  install(context) {
    // 注册预设
    context.registerPreset('my:preset', {
      name: 'My Custom Preset',
      processor: (instance, options) => {
        return instance
          .videoCodec('libx264')
          .videoBitrate(options.bitrate || '1M');
      },
    });

    // 注册处理器
    context.registerProcessor('my-processor', (instance, options) => {
      return instance.videoBitrate(options.bitrate);
    });

    // 注册链式方法
    context.registerChainMethod('myCustomMethod', function(this: ChainableFFmpeg, value: string) {
      return this.outputOption('-my-option', value);
    });
  },

  uninstall() {
    console.log('Plugin uninstalled');
  },
};
```

### 插件依赖管理

插件可以声明对其他插件的依赖。依赖在安装时会自动检查，如果依赖未满足，安装将失败。

**支持的版本范围：**

- 精确版本: `1.0.0`
- 兼容版本: `^1.0.0` (主版本必须相同)
- 大于等于: `>=1.0.0`
- 大于: `>1.0.0`
- 小于等于: `<=1.0.0`
- 小于: `<1.0.0`

```typescript
const AdvancedPlugin: Plugin = {
  name: 'advanced-plugin',
  version: '1.0.0',
  dependencies: [
    { name: 'base-plugin', version: '^1.0.0' },  // 要求 1.x.x
    { name: 'utils-plugin', version: '>=2.0.0' }, // 要求 2.0.0 或更高
  ],
  install(context) {
    // 插件逻辑
  },
};

// 安装时依赖检查
await manager.install(basePlugin);     // 先安装依赖
await manager.install(utilsPlugin);    // 先安装依赖
await manager.install(AdvancedPlugin); // 然后安装主插件
```

### 卸载插件注意事项

当卸载插件时，插件管理器会：

1. **检查依赖关系**：如果有其他插件依赖此插件，卸载将失败
2. **发出警告**：如果插件注册了链式方法，会发出警告（可能影响现有实例）
3. **清理资源**：自动清理插件注册的所有资源（预设、处理器、方法）

```typescript
// 卸载有依赖的插件会抛出错误
await manager.uninstall('base-plugin'); // Error: Cannot uninstall...

// 必须先卸载依赖它的插件
await manager.uninstall('advanced-plugin');
await manager.uninstall('base-plugin'); // 现在可以卸载
```

---

## 📊 缓存 API

### `CacheManager`

```typescript
import { CacheManager } from '@ffmpeg-oneclick/core';

const cache = new CacheManager({
  enabled: true,
  dir: '.ffmpeg-cache',
  ttl: 86400, // 1天
  maxSize: 1024 * 1024 * 1024 // 1GB
});

// 生成参数哈希
const key = cache.generateParamsHash('input.mp4', { bitrate: '1M' });

// 设置缓存
cache.set(key, 'input.mp4', 'output.mp4', { bitrate: '1M' });

// 获取缓存
const cached = cache.get(key);

// 检查缓存
const exists = cache.has(key);

// 删除缓存
cache.delete(key);

// 清空缓存
cache.clear();

// 获取统计信息
const stats = cache.getStats();
```

---

## ⚡ 并发控制 API

### `ConcurrentQueue`

```typescript
import { ConcurrentQueue } from '@ffmpeg-oneclick/core';

const queue = new ConcurrentQueue({
  maxConcurrent: 3, // 最大并发数
  autoStart: true, // 自动开始
  timeout: 300000 // 超时时间（5分钟）
});

// 添加任务
const taskId = queue.add(async () => {
  return await ffmpeg('input1.mp4').output('output1.mp4').run();
}, 'normal'); // 优先级: 'high' | 'normal' | 'low'

// 事件监听
queue.on('task:started', (task) => {
  console.log(`任务开始: ${task.id}`);
});

queue.on('task:completed', (task) => {
  console.log(`任务完成: ${task.id}`);
});

queue.on('task:failed', (task, error) => {
  console.error(`任务失败: ${task.id}`, error);
});

queue.on('queue:empty', () => {
  console.log('队列为空');
});

// 控制方法
queue.pause(); // 暂停
queue.resume(); // 恢复
queue.cancel(taskId); // 取消任务
queue.clear(); // 清空队列

// 查询方法
const task = queue.getTask(taskId);
const stats = queue.getStats();
const isEmpty = queue.isEmpty();
const isPaused = queue.isPaused();

// 等待所有任务完成
await queue.waitAll();
```

---

## 🎯 硬件加速 API

### `HardwareAccelDetector`

```typescript
import {
  HardwareAccelDetector,
  detectBestHardwareAccel,
  getHardwareAccelDetector
} from '@ffmpeg-oneclick/core';

// 检测最佳硬件加速
const best = await detectBestHardwareAccel();

if (best.available) {
  console.log(`最佳硬件加速: ${best.type}`);
  console.log(`编码器: ${best.encoder}`);
  console.log(`解码器: ${best.decoder}`);
}

// 获取检测器实例
const detector = getHardwareAccelDetector();

// 检测所有类型
const all = await detector.detectAll();

// 检测特定类型
const nvenc = await detector.detect('nvenc');
const qsv = await detector.detect('qsv');
const vce = await detector.detect('vce');
const videotoolbox = await detector.detect('videotoolbox');

// 清除缓存
detector.clearCache();
```

---

## 📝 元数据 API

### `MetadataProcessor`

```typescript
import { MetadataProcessor } from '@ffmpeg-oneclick/core';

const processor = new MetadataProcessor('ffprobe');

// 获取元数据
const metadata = await processor.getMetadata('video.mp4');
console.log(`时长: ${metadata.duration}秒`);
console.log(`分辨率: ${metadata.width}x${metadata.height}`);
console.log(`帧率: ${metadata.fps} fps`);
console.log(`视频编码: ${metadata.videoCodec}`);
console.log(`音频编码: ${metadata.audioCodec}`);

// 获取时长
const duration = await processor.getDuration('video.mp4');

// 获取分辨率
const resolution = await processor.getResolution('video.mp4');

// 获取帧率
const fps = await processor.getFrameRate('video.mp4');

// 检测旋转
const rotation = await processor.detectRotation('video.mp4');
const needsRotate = await processor.needsAutoRotate('video.mp4');
const filter = await processor.getAutoRotateFilter('video.mp4');

// 音频信息
const sampleRate = await processor.getAudioSampleRate('video.mp4');
const channels = await processor.getAudioChannels('video.mp4');
const hasAudio = await processor.hasAudio('video.mp4');
const hasVideo = await processor.hasVideo('video.mp4');
const audioStreams = await processor.getAllAudioStreams('video.mp4');
const subtitleStreams = await processor.getAllSubtitleStreams('video.mp4');
```

---

## 🛠️ 错误处理

### 错误码

```typescript
import { ErrorCode, createFFmpegError } from '@ffmpeg-oneclick/core';

// 错误码枚举
enum ErrorCode {
  INPUT_NOT_FOUND = 'INPUT_NOT_FOUND',
  OUTPUT_PATH_INVALID = 'OUTPUT_PATH_INVALID',
  FFMPEG_NOT_FOUND = 'FFMPEG_NOT_FOUND',
  FFMPEG_EXECUTION_FAILED = 'FFMPEG_EXECUTION_FAILED',
  FFMPEG_TIMEOUT = 'FFMPEG_TIMEOUT',
  INPUT_INVALID_FORMAT = 'INPUT_INVALID_FORMAT',
  HARDWARE_ACCEL_NOT_AVAILABLE = 'HARDWARE_ACCEL_NOT_AVAILABLE',
  CACHE_ERROR = 'CACHE_ERROR',
  CONCURRENT_LIMIT_REACHED = 'CONCURRENT_LIMIT_REACHED',
  PLUGIN_ERROR = 'PLUGIN_ERROR',
}
```

### 错误处理示例

```typescript
try {
  await ffmpeg('input.mp4').output('output.mp4').run();
} catch (error) {
  if (error.code === ErrorCode.INPUT_NOT_FOUND) {
    console.error('输入文件不存在');
    console.log('建议:', error.suggestion);
  } else if (error.code === ErrorCode.FFMPEG_EXECUTION_FAILED) {
    console.error('FFmpeg 执行失败');
    console.log('命令:', error.details.command);
    console.log('日志:', error.details.stderr);
  }
}
```

---

## 📦 类型定义

### 主要类型

```typescript
// FFmpeg 结果
interface FFmpegResult {
  output: string;
  duration: number;
  size: number;
  command: string;
  logs: string;
}

// 进度信息
interface ProgressInfo {
  percent: number;
  eta: number;
  frames: number;
  time: number;
  bitrate: number;
  fps: number;
  size: number;
}

// 视频元数据
interface VideoMetadata {
  duration: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  videoBitrate: number;
  audioBitrate: number;
  audioSampleRate: number;
  audioChannels: number;
}

// 硬件加速信息
interface HardwareAccelInfo {
  type: HardwareAccelType;
  available: boolean;
  encoder?: string;
  decoder?: string;
  info?: string;
}

// 缓存选项
interface CacheOptions {
  enabled?: boolean;
  dir?: string;
  ttl?: number;
  maxSize?: number;
}

// 队列选项
interface QueueOptions {
  maxConcurrent?: number;
  autoStart?: boolean;
  timeout?: number;
}
```

---

## 📚 更多资源

- [快速开始](./quick-start.md)
- [API 示例](./api-examples.md)
- [功能列表](./features.md)

---

## 🤝 贡献

欢迎贡献！请查看 GitHub 仓库了解详情。

## 📄 许可证

GPL-3.0
