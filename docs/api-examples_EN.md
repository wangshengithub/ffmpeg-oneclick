# Complete API Examples

## 📚 Table of Contents

1. [Basic Features](#basic-features)
2. [Video Processing](#video-processing)
3. [Audio Processing](#audio-processing)
4. [Watermarks](#watermarks)
5. [Screenshots](#screenshots)
6. [Streaming](#streaming)
7. [Advanced Features](#advanced-features)
8. [Presets](#presets)
9. [Progress & Events](#progress--events)
10. [Error Handling](#error-handling)

---

## Basic Features

### Simple Conversion

```typescript
import { ffmpeg } from '@ffmpeg-oneclick/core';

// Basic conversion
await ffmpeg('input.mp4')
  .output('output.webm')
  .run();

// With parameters
await ffmpeg('input.mp4')
  .output('output.mp4')
  .videoCodec('libx264')
  .audioCodec('aac')
  .size('1920x1080')
  .fps(30)
  .run();
```

### Video Compression

```typescript
// High compression
await ffmpeg('input.mp4')
  .output('compressed.mp4')
  .videoBitrate('1M')
  .audioBitrate('128k')
  .crf(28)
  .run();

// Quality presets
await presets.compressVideo('input.mp4', 'output.mp4', 'high');
await presets.compressVideo('input.mp4', 'output.mp4', 'medium');
await presets.compressVideo('input.mp4', 'output.mp4', 'low');
```

### Video Trimming

```typescript
// Trim 5-15 seconds
await ffmpeg('input.mp4')
  .output('clip.mp4')
  .trim(5, 15)
  .run();

// Trim from start
await ffmpeg('input.mp4')
  .output('clip.mp4')
  .trim(0, 10)
  .run();

// Trim to end
await ffmpeg('input.mp4')
  .output('clip.mp4')
  .startTime(30)
  .run();
```

---

## Video Processing

### Resolution Scaling

```typescript
// Preset resolutions
await ffmpeg('input.mp4')
  .output('720p.mp4')
  .size('720p')
  .run();

// Custom resolution
await ffmpeg('input.mp4')
  .output('custom.mp4')
  .size('1280x720')
  .run();

// Maintain aspect ratio
await ffmpeg('input.mp4')
  .output('resized.mp4')
  .size('1280:-1')  // Auto height
  .run();
```

### Frame Rate Control

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .fps(30)
  .run();

// High FPS
await ffmpeg('input.mp4')
  .output('output.mp4')
  .fps(60)
  .run();
```

### Video Filters

```typescript
// Blur
await ffmpeg('input.mp4')
  .output('blurred.mp4')
  .videoFilter('boxblur=2:1')
  .run();

// Sharpen
await ffmpeg('input.mp4')
  .output('sharpened.mp4')
  .videoFilter('unsharp=5:5:1.0:5:5:0.0')
  .run();

// Rotation
await ffmpeg('input.mp4')
  .output('rotated.mp4')
  .rotate(90)
  .run();

// Flip
await ffmpeg('input.mp4')
  .output('flipped.mp4')
  .flip('horizontal')
  .run();
```

### Video Concatenation

```typescript
// Concatenate videos
await ffmpeg()
  .concat(['part1.mp4', 'part2.mp4', 'part3.mp4'])
  .output('full.mp4')
  .run();
```

---

## Audio Processing

### Extract Audio

```typescript
await ffmpeg('video.mp4')
  .output('audio.mp3')
  .noVideo()
  .audioCodec('mp3')
  .audioBitrate('192k')
  .run();

// Using preset
await presets.extractAudio('video.mp4', 'audio.mp3');
```

### Audio Mixing

```typescript
// Mix video audio with background music
await ffmpeg('video.mp4')
  .output('mixed.mp4')
  .mix([
    { input: 'video.mp4', volume: 1.0 },
    { input: 'music.mp3', volume: 0.3 }
  ])
  .run();
```

### Volume Adjustment

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .volume(1.5)  // 150% volume
  .run();
```

---

## Watermarks

### Image Watermark

```typescript
await ffmpeg('video.mp4')
  .watermark('logo.png', {
    position: 'bottomRight',
    opacity: 0.8,
    scale: 0.2
  })
  .output('watermarked.mp4')
  .run();
```

### Text Watermark

```typescript
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

---

## Screenshots

### Single Screenshot

```typescript
await ffmpeg('video.mp4')
  .screenshot(5, 'frame.jpg')
  .run();
```

### Multiple Screenshots

```typescript
await ffmpeg('video.mp4')
  .screenshots({
    timestamps: [1, 5, 10, 15],
    filenameTemplate: 'shot_%d.jpg'
  })
  .run();
```

---

## Streaming

### HLS

```typescript
await ffmpeg('input.mp4')
  .toHLS('playlist.m3u8', {
    segmentDuration: 10
  });
```

### DASH

```typescript
await ffmpeg('input.mp4')
  .toDASH('manifest.mpd', {
    segmentDuration: 10
  });
```

---

## Advanced Features

### Hardware Acceleration

```typescript
// Auto-detect
await ffmpeg('input.mp4')
  .output('output.mp4')
  .hardwareAccelerate('auto')
  .run();

// Specific encoder
await ffmpeg('input.mp4')
  .output('output.mp4')
  .hardwareAccelerate('nvenc')
  .run();
```

### Metadata

```typescript
// Add metadata
await ffmpeg('input.mp4')
  .output('output.mp4')
  .metadata('title', 'My Video')
  .metadata('artist', 'My Name')
  .run();

// Remove all metadata
await ffmpeg('input.mp4')
  .output('output.mp4')
  .noMetadata()
  .run();
```

---

## Presets

### Built-in Presets

```typescript
import { presets } from '@ffmpeg-oneclick/core';

// Compress
await presets.compressVideo('input.mp4', 'output.mp4', 'high');

// GIF
await presets.toGif('input.mp4', 'output.gif', {
  startTime: 5,
  duration: 3,
  fps: 15
});

// Extract audio
await presets.extractAudio('input.mp4', 'output.mp3');

// Web optimize
await presets.webOptimize('input.mp4', 'output.mp4');
```

---

## Progress & Events

### Progress Monitoring

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .on('progress', (progress) => {
    console.log(`${progress.percent.toFixed(1)}%`);
    console.log(`ETA: ${progress.eta}s`);
    console.log(`Speed: ${progress.speed}x`);
  })
  .on('end', (result) => {
    console.log('Done!');
    console.log(`Size: ${result.size} bytes`);
  })
  .run();
```

---

## Error Handling

```typescript
try {
  await ffmpeg('input.mp4')
    .output('output.mp4')
    .run();
} catch (error) {
  if (error.code === 'INPUT_NOT_FOUND') {
    console.error('Input file not found');
  } else if (error.code === 'FFMPEG_ERROR') {
    console.error('FFmpeg error:', error.message);
    console.error('Suggestion:', error.suggestion);
  }
}
```

---

## Next Steps

- [Complete API Documentation](./api-documentation_EN.md)
- [Feature List](./features_EN.md)
- [Quick Start](./quick-start_EN.md)
