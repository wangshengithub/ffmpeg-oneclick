# ffmpeg-oneclick 完整API示例

## 📚 目录

1. [基础功能](#基础功能)
2. [水印功能](#水印功能)
3. [流媒体格式](#流媒体格式)
4. [音频混合](#音频混合)
5. [截图功能](#截图功能)
6. [插件系统](#插件系统)
7. [元数据处理](#元数据处理)
8. [自动旋转](#自动旋转)

---

## 基础功能

### 视频转换

```typescript
import { ffmpeg } from '@ffmpeg-oneclick/core';

// 基础转换
await ffmpeg('input.mp4')
  .output('output.webm')
  .run();

// 设置参数
await ffmpeg('input.mp4')
  .output('output.mp4')
  .size('720p')
  .fps(30)
  .videoBitrate('1M')
  .audioBitrate('128k')
  .run();
```

### 视频拼接

```typescript
// 拼接多个视频
await ffmpeg('video1.mp4')
  .concat(['video1.mp4', 'video2.mp4', 'video3.mp4'])
  .output('merged.mp4')
  .run();

// 无音频拼接
await ffmpeg('video1.mp4')
  .concatWithoutAudio(['video1.mp4', 'video2.mp4'])
  .output('merged_no_audio.mp4')
  .run();
```

### 视频旋转和翻转

```typescript
// 旋转 90 度
await ffmpeg('input.mp4')
  .output('output.mp4')
  .rotate(90)
  .run();

// 水平翻转
await ffmpeg('input.mp4')
  .output('output.mp4')
  .flip()
  .run();

// 垂直翻转
await ffmpeg('input.mp4')
  .output('output.mp4')
  .flop()
  .run();
```

---

## 水印功能

### 图片水印

```typescript
// 基础水印
await ffmpeg('input.mp4')
  .output('output.mp4')
  .watermark('logo.png')
  .run();

// 自定义位置和透明度
await ffmpeg('input.mp4')
  .output('output.mp4')
  .watermark('logo.png', {
    position: 'bottomRight',  // topLeft, topRight, bottomLeft, bottomRight, center
    opacity: 0.8,
    scale: 0.2
  })
  .run();

// 自定义坐标
await ffmpeg('input.mp4')
  .output('output.mp4')
  .watermark('logo.png', {
    position: { x: 100, y: 50 },
    opacity: 0.7,
    scale: 0.15
  })
  .run();
```

### 文字水印

```typescript
// 基础文字水印
await ffmpeg('input.mp4')
  .output('output.mp4')
  .textWatermark('© 2024 My Brand')
  .run();

// 自定义样式
await ffmpeg('input.mp4')
  .output('output.mp4')
  .textWatermark('© 2024 My Brand', {
    fontSize: 24,
    fontColor: 'white',
    position: 'bottomRight',
    opacity: 0.7,
    borderColor: 'black',
    borderWidth: 2,
    shadowColor: 'black',
    shadowOffset: 2
  })
  .run();

// 自定义字体
await ffmpeg('input.mp4')
  .output('output.mp4')
  .textWatermark('Custom Font', {
    fontFile: '/path/to/font.ttf',
    fontSize: 32,
    fontColor: '#FF5733',
    position: 'center'
  })
  .run();
```

---

## 流媒体格式

### HLS (m3u8)

```typescript
// 基础 HLS
await ffmpeg('input.mp4')
  .output('playlist.m3u8')
  .hls()
  .run();

// 自定义 HLS
await ffmpeg('input.mp4')
  .output('playlist.m3u8')
  .hls({
    segmentDuration: 5,          // 5秒一个分片
    playlistName: 'video.m3u8',  // 播放列表文件名
    segmentName: 'seg%d.ts',     // 分片文件名
    listSize: 0,                 // 保留所有分片
    fmp4: false                  // 不使用 fMP4
  })
  .videoBitrate('2M')
  .audioBitrate('128k')
  .run();

// 使用预设
import { presets } from '@ffmpeg-oneclick/core';

await presets.apply('input.mp4', 'playlist.m3u8', 'streaming:hls', {
  segmentDuration: 10
}).run();
```

### DASH (mpd)

```typescript
// 基础 DASH
await ffmpeg('input.mp4')
  .output('manifest.mpd')
  .dash()
  .run();

// 自定义 DASH
await ffmpeg('input.mp4')
  .output('manifest.mpd')
  .dash({
    segmentDuration: 10,
    manifestName: 'video.mpd',
    segmentName: 'chunk-stream$RepresentationID$-$Number%05d$.m4s',
    live: false  // 非直播模式
  })
  .videoBitrate('2M')
  .audioBitrate('128k')
  .run();

// 使用预设
await presets.apply('input.mp4', 'manifest.mpd', 'streaming:dash', {
  segmentDuration: 10
}).run();
```

---

## 音频混合

### 混合多个音轨

```typescript
// 基础音频混合
await ffmpeg('video.mp4')
  .output('output.mp4')
  .mix([
    { input: 'video.mp4' },          // 原始音频
    { input: 'background.mp3', volume: 0.3 }  // 背景音乐，音量 30%
  ])
  .run();

// 高级音频混合
await ffmpeg('video.mp4')
  .output('output.mp4')
  .mix([
    {
      input: 'video.mp4',
      volume: 1.0
    },
    {
      input: 'background.mp3',
      volume: 0.2,
      startTime: 5,      // 5秒后开始
      duration: 30       // 持续30秒
    },
    {
      input: 'sound_effect.mp3',
      volume: 0.8,
      startTime: 10.5
    }
  ], {
    codec: 'aac',
    bitrate: '192k'
  })
  .run();

// 使用外部音频替换
await ffmpeg('video.mp4')
  .output('output.mp4')
  .videoBitrate('1M')
  .mix([
    { input: 'new_audio.mp3', volume: 1.0 }
  ], {
    codec: 'aac',
    bitrate: '128k'
  })
  .run();
```

---

## 截图功能

### 单张截图

```typescript
// 在第5秒截取一张图片
await ffmpeg('video.mp4')
  .screenshot(5, 'screenshot.jpg')
  .run();

// 在多个时间点截取
await ffmpeg('video.mp4')
  .screenshots({
    timestamps: [1, 5, 10, 15, 20],
    filenameTemplate: 'screenshot_%d.jpg',
    outputDir: './screenshots',
    format: 'jpg',
    quality: 2  // 1-31, 越小质量越高
  })
  .run();
```

### 生成缩略图

```typescript
// 生成10张缩略图
await ffmpeg('video.mp4')
  .thumbnails({
    count: 10,
    filenameTemplate: 'thumb_%d.jpg',
    outputDir: './thumbnails',
    format: 'jpg',
    width: 320  // 宽度320px，高度自动
  })
  .run();

// 使用预设
import { presets } from '@ffmpeg-oneclick/core';

await presets.createThumbnail('video.mp4', 'thumbnail.jpg', 5);
```

---

## 插件系统

### 使用内置插件

```typescript
import { usePlugin, ffmpeg, WatermarkEnhancePlugin, AIOptimizePlugin } from '@ffmpeg-oneclick/core';

// 安装水印增强插件
await usePlugin(WatermarkEnhancePlugin);

// 使用插件提供的预设
await ffmpeg('input.mp4')
  .output('output.mp4')
  .applyPreset('watermark:brand', {
    logo: 'brand.png',
    position: 'topRight',
    opacity: 0.9,
    scale: 0.15
  })
  .run();

// 安装 AI 优化插件
await usePlugin(AIOptimizePlugin);

// 使用 AI 优化
await ffmpeg('input.mp4')
  .output('output.mp4')
  .applyPreset('ai:optimize', {
    targetQuality: 'high'
  })
  .run();
```

### 创建自定义插件

```typescript
import type { Plugin, PluginContext } from '@ffmpeg-oneclick/core';

const MyCustomPlugin: Plugin = {
  name: 'my-custom-plugin',
  version: '1.0.0',
  description: 'My custom FFmpeg plugin',

  install(context: PluginContext) {
    // 注册自定义预设
    context.registerPreset('my:vintage', {
      name: 'Vintage Effect',
      description: 'Add vintage film effect',
      processor: (instance) => {
        return instance.videoFilters({
          saturation: 0.8,
          contrast: 0.9,
          brightness: -0.1
        });
      }
    });

    // 注册自定义处理器
    context.registerProcessor('my:customFilter', (instance, options) => {
      const { intensity = 0.5 } = options || {};
      return instance.videoFilters({
        blur: intensity
      });
    });

    // 注册链式方法
    context.registerChainMethod('addVintageEffect', function() {
      return this.videoFilters({
        saturation: 0.8,
        contrast: 0.9
      });
    });
  }
};

// 安装并使用
await usePlugin(MyCustomPlugin);

await ffmpeg('input.mp4')
  .output('output.mp4')
  .addVintageEffect()
  .run();
```

---

## 元数据处理

### 读取元数据

```typescript
import { MetadataProcessor } from '@ffmpeg-oneclick/core';

const processor = new MetadataProcessor();

// 获取完整元数据
const metadata = await processor.getMetadata('video.mp4');

console.log('Duration:', metadata.format.duration);
console.log('Video streams:', metadata.streams.filter(s => s.codec_type === 'video'));
console.log('Audio streams:', metadata.streams.filter(s => s.codec_type === 'audio'));

// 获取视频流信息
const videoStream = await processor.getVideoStream('video.mp4');
console.log('Resolution:', videoStream?.width, 'x', videoStream?.height);
console.log('FPS:', videoStream?.fps);

// 获取音频流信息
const audioStream = await processor.getAudioStream('video.mp4');
console.log('Sample rate:', audioStream?.sample_rate);
console.log('Channels:', audioStream?.channels);

// 获取所有音频流
const allAudioStreams = await processor.getAllAudioStreams('video.mp4');
console.log('Audio tracks:', allAudioStreams.length);
```

### 添加和修改元数据

```typescript
// 添加元数据
await ffmpeg('input.mp4')
  .output('output.mp4')
  .metadata('title', 'My Video')
  .metadata('artist', 'My Name')
  .metadata('comment', 'Created with ffmpeg-oneclick')
  .run();

// 清除所有元数据
await ffmpeg('input.mp4')
  .output('output.mp4')
  .noMetadata()
  .run();
```

---

## 自动旋转

### 自动检测并旋转

```typescript
// 自动检测旋转信息并应用
await ffmpeg('input.mp4')
  .output('output.mp4')
  .autoRotate()
  .run();

// 检查是否需要旋转
import { MetadataProcessor } from '@ffmpeg-oneclick/core';

const processor = new MetadataProcessor();
const needsRotate = await processor.needsAutoRotate('video.mp4');

if (needsRotate) {
  console.log('Video needs auto-rotation');
  await ffmpeg('video.mp4')
    .output('rotated.mp4')
    .autoRotate()
    .run();
}
```

---

## 并发处理

### 使用任务队列

```typescript
import { ConcurrentQueue, ffmpeg } from '@ffmpeg-oneclick/core';

const queue = new ConcurrentQueue({
  maxConcurrent: 3,  // 最多同时处理3个任务
  autoStart: true
});

// 添加任务
const task1 = queue.add(
  () => ffmpeg('video1.mp4').output('output1.mp4').run(),
  'high'  // 高优先级
);

const task2 = queue.add(
  () => ffmpeg('video2.mp4').output('output2.mp4').run(),
  'normal'
);

const task3 = queue.add(
  () => ffmpeg('video3.mp4').output('output3.mp4').run(),
  'low'
);

// 监听事件
queue.on('task:completed', (task) => {
  console.log(`Task ${task.id} completed`);
});

queue.on('task:failed', (task, error) => {
  console.error(`Task ${task.id} failed:`, error);
});

// 等待所有任务完成
await queue.waitAll();
```

---

## 智能缓存

### 启用缓存

```typescript
// 启用缓存
await ffmpeg('input.mp4')
  .output('output.mp4')
  .cache({
    enabled: true,
    ttl: 3600,      // 缓存1小时
    maxSize: 1024 * 1024 * 1024  // 最大1GB
  })
  .run();

// 相同参数的第二次执行会使用缓存
await ffmpeg('input.mp4')
  .output('output.mp4')
  .cache({ enabled: true })
  .run();  // 直接从缓存返回
```

---

## 硬件加速

### 自动检测硬件加速

```typescript
import { detectBestHardwareAccel, ffmpeg } from '@ffmpeg-oneclick/core';

// 检测最佳硬件加速
const bestAccel = await detectBestHardwareAccel();

if (bestAccel.available) {
  console.log('Using hardware acceleration:', bestAccel.type);
  console.log('Encoder:', bestAccel.encoder);
}

// 使用硬件加速
await ffmpeg('input.mp4')
  .output('output.mp4')
  .hardwareAccelerate('auto')  // auto, nvenc, qsv, vce, videotoolbox
  .run();

// 强制使用特定硬件加速
await ffmpeg('input.mp4')
  .output('output.mp4')
  .hardwareAccelerate('nvenc')  // NVIDIA
  .run();
```

---

## CLI 工具

### 基础命令

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

# 检测硬件加速
ffmpeg-oneclick detect-hw

# 列出预设
ffmpeg-oneclick presets

# 交互模式
ffmpeg-oneclick interactive
```

---

## 完整示例

### 视频处理流水线

```typescript
import { ffmpeg, presets, detectBestHardwareAccel, ConcurrentQueue } from '@ffmpeg-oneclick/core';

// 1. 检测硬件加速
const hwAccel = await detectBestHardwareAccel();
console.log('Hardware acceleration:', hwAccel.type);

// 2. 处理视频
await ffmpeg('raw_video.mp4')
  .output('processed.mp4')
  // 自动旋转
  .autoRotate()
  // 调整分辨率
  .size('1080p')
  // 添加水印
  .watermark('brand.png', {
    position: 'bottomRight',
    opacity: 0.8,
    scale: 0.1
  })
  // 添加字幕水印
  .textWatermark('© 2024 My Company', {
    fontSize: 16,
    fontColor: 'white',
    position: 'bottomLeft',
    opacity: 0.7
  })
  // 硬件加速
  .hardwareAccelerate(hwAccel.available ? 'auto' : 'none')
  // 编码设置
  .videoBitrate('2M')
  .audioBitrate('128k')
  // 进度监听
  .on('progress', (progress) => {
    console.log(`${progress.percent.toFixed(1)}% - ETA: ${progress.eta}s`);
  })
  // 执行
  .run();

console.log('Processing complete!');
```

---

**更多信息请查看：**

- [完整 API 文档](./api-documentation.md)
- [功能列表](./features.md)
- [快速开始](./quick-start.md)
