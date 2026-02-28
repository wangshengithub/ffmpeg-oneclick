# API Documentation

> Complete API reference for ffmpeg-oneclick

## 📦 Installation

```bash
npm install @ffmpeg-oneclick/core @ffmpeg-oneclick/bin
```

## 🚀 Quick Start

```typescript
import { ffmpeg } from '@ffmpeg-oneclick/core';

await ffmpeg('input.mp4')
  .output('output.mp4')
  .run();
```

---

## 📖 Core API

### ffmpeg(input)

Main entry point for creating FFmpeg operations.

```typescript
function ffmpeg(input?: InputType): ChainableFFmpeg
```

**Parameters:**
- `input` (optional): Input file path or stream. Can be string, Buffer, or Stream.

**Returns:** `ChainableFFmpeg` instance

**Example:**
```typescript
// From file
const command = ffmpeg('input.mp4');

// From stream
const command = ffmpeg(readStream);

// Multiple inputs
const command = ffmpeg()
  .input('video.mp4')
  .input('audio.mp3');
```

---

## Chainable API Methods

### Input/Output

#### input(input)

Add an input file or stream.

```typescript
.input(input: InputType): this
```

**Parameters:**
- `input`: Input file path, Buffer, or Stream

**Returns:** `this` (chainable)

**Example:**
```typescript
await ffmpeg()
  .input('video.mp4')
  .output('output.mp4')
  .run();
```

#### output(output)

Set the output file path or stream.

```typescript
.output(output: OutputType): this
```

**Parameters:**
- `output`: Output file path or writable stream

**Returns:** `this` (chainable)

---

### Video Settings

#### videoCodec(codec)

Set video codec.

```typescript
.videoCodec(codec: string): this
```

**Parameters:**
- `codec`: Video codec name (e.g., 'libx264', 'libx265', 'vp9')

**Common Codecs:**
- `libx264` - H.264/AVC
- `libx265` - H.265/HEVC
- `vp9` - VP9
- `av1` - AV1

**Example:**
```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .videoCodec('libx265')
  .run();
```

#### size(resolution)

Set video resolution.

```typescript
.size(resolution: string): this
```

**Parameters:**
- `resolution`: Resolution string or preset

**Presets:**
- `'4k'` or `'2160p'` - 3840x2160
- `'1080p'` - 1920x1080
- `'720p'` - 1280x720
- `'480p'` - 854x480
- Custom: `'1280x720'`

**Example:**
```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .size('1080p')
  .run();
```

#### fps(frameRate)

Set frame rate.

```typescript
.fps(frameRate: number): this
```

**Parameters:**
- `frameRate`: Frames per second

**Example:**
```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .fps(30)
  .run();
```

#### videoBitrate(bitrate)

Set video bitrate.

```typescript
.videoBitrate(bitrate: string | number): this
```

**Parameters:**
- `bitrate`: Bitrate value (e.g., '1M', '1500k', 1500000)

**Example:**
```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .videoBitrate('2M')
  .run();
```

---

### Audio Settings

#### audioCodec(codec)

Set audio codec.

```typescript
.audioCodec(codec: string): this
```

**Parameters:**
- `codec`: Audio codec name (e.g., 'aac', 'mp3', 'opus')

**Common Codecs:**
- `aac` - AAC
- `mp3` - MP3
- `opus` - Opus
- `flac` - FLAC

#### audioBitrate(bitrate)

Set audio bitrate.

```typescript
.audioBitrate(bitrate: string | number): this
```

**Parameters:**
- `bitrate`: Bitrate value (e.g., '128k', '192k', 192000)

**Example:**
```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .audioBitrate('192k')
  .run();
```

#### volume(volume)

Adjust audio volume.

```typescript
.volume(volume: number): this
```

**Parameters:**
- `volume`: Volume multiplier (1.0 = 100%, 0.5 = 50%, 2.0 = 200%)

**Example:**
```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .volume(1.5)  // 150% volume
  .run();
```

---

### Video Operations

#### trim(startTime, endTime?)

Trim video to specified time range.

```typescript
.trim(startTime: number, endTime?: number): this
```

**Parameters:**
- `startTime`: Start time in seconds
- `endTime` (optional): End time in seconds. If omitted, trims to end of video

**Example:**
```typescript
// Trim 10-20 seconds
await ffmpeg('input.mp4')
  .output('output.mp4')
  .trim(10, 20)
  .run();

// Trim from 5 seconds to end
await ffmpeg('input.mp4')
  .output('output.mp4')
  .trim(5)
  .run();
```

#### rotate(angle)

Rotate video.

```typescript
.rotate(angle: number): this
```

**Parameters:**
- `angle`: Rotation angle in degrees (90, 180, 270)

**Example:**
```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .rotate(90)
  .run();
```

#### flip(direction)

Flip video.

```typescript
.flip(direction: 'horizontal' | 'vertical'): this
```

**Parameters:**
- `direction`: 'horizontal' or 'vertical'

---

### Watermarks

#### watermark(image, options)

Add image watermark.

```typescript
.watermark(image: string, options?: WatermarkOptions): this
```

**Parameters:**
- `image`: Path to watermark image
- `options`: Watermark configuration

**WatermarkOptions:**
```typescript
interface WatermarkOptions {
  position?: Position | { x: number; y: number };
  opacity?: number;  // 0-1
  scale?: number;    // 0-1
}
```

**Position Presets:**
- `'topLeft'`, `'topCenter'`, `'topRight'`
- `'centerLeft'`, `'center'`, `'centerRight'`
- `'bottomLeft'`, `'bottomCenter'`, `'bottomRight'`

**Example:**
```typescript
await ffmpeg('video.mp4')
  .watermark('logo.png', {
    position: 'bottomRight',
    opacity: 0.8,
    scale: 0.2
  })
  .output('output.mp4')
  .run();
```

#### textWatermark(text, options)

Add text watermark.

```typescript
.textWatermark(text: string, options?: TextWatermarkOptions): this
```

**Parameters:**
- `text`: Watermark text
- `options`: Text watermark configuration

**TextWatermarkOptions:**
```typescript
interface TextWatermarkOptions {
  fontSize?: number;
  fontColor?: string;
  fontFamily?: string;
  position?: Position | { x: number; y: number };
  opacity?: number;
  box?: number;
  boxColor?: string;
}
```

**Example:**
```typescript
await ffmpeg('video.mp4')
  .textWatermark('© 2024 My Brand', {
    fontSize: 24,
    fontColor: 'white',
    position: 'bottomLeft',
    opacity: 0.7
  })
  .output('output.mp4')
  .run();
```

---

### Screenshots

#### screenshot(timestamp, output)

Take a single screenshot.

```typescript
.screenshot(timestamp: number, output: string): this
```

**Parameters:**
- `timestamp`: Time in seconds
- `output`: Output file path

**Example:**
```typescript
await ffmpeg('video.mp4')
  .screenshot(5, 'frame.jpg')
  .run();
```

#### screenshots(options)

Take multiple screenshots.

```typescript
.screenshots(options: ScreenshotOptions): this
```

**ScreenshotOptions:**
```typescript
interface ScreenshotOptions {
  timestamps: number[];
  filenameTemplate?: string;
  size?: string;
}
```

**Example:**
```typescript
await ffmpeg('video.mp4')
  .screenshots({
    timestamps: [1, 5, 10, 15],
    filenameTemplate: 'shot_%d.jpg',
    size: '1280x720'
  })
  .run();
```

---

### Streaming

#### toHLS(output, options?)

Convert to HLS format.

```typescript
.toHLS(output: string, options?: HLSOptions): Promise<FFmpegResult>
```

**HLSOptions:**
```typescript
interface HLSOptions {
  segmentDuration?: number;  // Default: 10
  playlistName?: string;
  segmentName?: string;
  fmp4?: boolean;
}
```

**Example:**
```typescript
await ffmpeg('input.mp4')
  .toHLS('playlist.m3u8', {
    segmentDuration: 10
  });
```

#### toDASH(output, options?)

Convert to DASH format.

```typescript
.toDASH(output: string, options?: DASHOptions): Promise<FFmpegResult>
```

**Example:**
```typescript
await ffmpeg('input.mp4')
  .toDASH('manifest.mpd', {
    segmentDuration: 10
  });
```

---

### Audio Mixing

#### mix(tracks)

Mix multiple audio tracks.

```typescript
.mix(tracks: AudioTrack[]): this
```

**AudioTrack:**
```typescript
interface AudioTrack {
  input: string;
  volume?: number;
  delay?: number;  // milliseconds
}
```

**Example:**
```typescript
await ffmpeg('video.mp4')
  .output('output.mp4')
  .mix([
    { input: 'video.mp4', volume: 1.0 },
    { input: 'music.mp3', volume: 0.3 }
  ])
  .run();
```

---

### Metadata

#### metadata(key, value)

Add or modify metadata.

```typescript
.metadata(key: string, value: string): this
```

**Example:**
```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .metadata('title', 'My Video')
  .metadata('artist', 'My Name')
  .run();
```

#### noMetadata()

Remove all metadata.

```typescript
.noMetadata(): this
```

---

### Hardware Acceleration

#### hardwareAccelerate(type)

Enable hardware acceleration.

```typescript
.hardwareAccelerate(type: 'auto' | 'nvenc' | 'qsv' | 'vce' | 'videotoolbox'): this
```

**Parameters:**
- `type`: Acceleration type or 'auto' for auto-detection

**Example:**
```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .hardwareAccelerate('auto')
  .run();
```

---

### Event Handling

#### on(event, handler)

Register event handler.

```typescript
.on(event: string, handler: Function): this
```

**Events:**
- `'progress'` - Progress updates
- `'end'` - Conversion complete
- `'error'` - Error occurred
- `'start'` - FFmpeg started

**Progress Object:**
```typescript
interface Progress {
  percent: number;
  eta: number;        // seconds
  currentFrame: number;
  totalFrames: number;
  fps: number;
  speed: number;
  bitrate: string;
}
```

**Example:**
```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .on('progress', (progress) => {
    console.log(`${progress.percent.toFixed(1)}%`);
  })
  .on('end', (result) => {
    console.log('Complete!');
  })
  .run();
```

---

### Execution

#### run()

Execute the FFmpeg command.

```typescript
.run(): Promise<FFmpegResult>
```

**Returns:** Promise that resolves with result

**FFmpegResult:**
```typescript
interface FFmpegResult {
  output: string;
  duration: number;  // milliseconds
  size: number;       // bytes
  command: string;
  logs: string;
}
```

**Example:**
```typescript
const result = await ffmpeg('input.mp4')
  .output('output.mp4')
  .run();

console.log(`Output: ${result.output}`);
console.log(`Duration: ${result.duration}ms`);
console.log(`Size: ${result.size} bytes`);
```

#### getCommand()

Get the FFmpeg command without executing.

```typescript
.getCommand(): string
```

**Returns:** FFmpeg command string

**Example:**
```typescript
const cmd = ffmpeg('input.mp4')
  .output('output.mp4')
  .size('720p')
  .getCommand();

console.log(cmd);  // "ffmpeg -i input.mp4 -s 1280x720 output.mp4"
```

---

## 🎨 Presets API

### compressVideo(input, output, quality)

Compress video with quality preset.

```typescript
presets.compressVideo(
  input: string,
  output: string,
  quality: 'high' | 'medium' | 'low'
): Promise<FFmpegResult>
```

**Example:**
```typescript
await presets.compressVideo('input.mp4', 'output.mp4', 'high');
```

### toGif(input, output, options)

Convert video to GIF.

```typescript
presets.toGif(
  input: string,
  output: string,
  options?: {
    startTime?: number;
    duration?: number;
    fps?: number;
    size?: string;
  }
): Promise<FFmpegResult>
```

**Example:**
```typescript
await presets.toGif('input.mp4', 'output.gif', {
  startTime: 5,
  duration: 3,
  fps: 15,
  size: '480x270'
});
```

### extractAudio(input, output)

Extract audio from video.

```typescript
presets.extractAudio(input: string, output: string): Promise<FFmpegResult>
```

**Example:**
```typescript
await presets.extractAudio('video.mp4', 'audio.mp3');
```

---

## 📊 Metadata API

### getMetadata(input)

Get video metadata.

```typescript
getMetadata(input: string): Promise<MetadataInfo>
```

**Returns:**
```typescript
interface MetadataInfo {
  duration: number;
  width: number;
  height: number;
  fps: number;
  videoCodec: string;
  audioCodec: string;
  bitrate: number;
  size: number;
}
```

**Example:**
```typescript
const meta = await getMetadata('video.mp4');
console.log(`Duration: ${meta.duration}s`);
console.log(`Resolution: ${meta.width}x${meta.height}`);
```

---

## 🔌 Plugin API

### usePlugin(plugin)

Install a plugin.

```typescript
usePlugin(plugin: Plugin): Promise<void>
```

**Plugin Interface:**
```typescript
interface Plugin {
  name: string;
  version: string;
  install: (context: PluginContext) => void | Promise<void>;
  uninstall?: () => void | Promise<void>;
}
```

**Example:**
```typescript
const myPlugin = {
  name: 'my-plugin',
  version: '1.0.0',
  install: (context) => {
    context.registerPreset('my:preset', {
      name: 'My Preset',
      videoCodec: 'libx264'
    });
  }
};

await usePlugin(myPlugin);
```

---

## 📝 Type Definitions

### InputType

```typescript
type InputType = string | Buffer | ReadableStream;
```

### OutputType

```typescript
type OutputType = string | WritableStream;
```

### Position

```typescript
type Position =
  | 'topLeft' | 'topCenter' | 'topRight'
  | 'centerLeft' | 'center' | 'centerRight'
  | 'bottomLeft' | 'bottomCenter' | 'bottomRight';
```

---

## 🎯 Best Practices

### Error Handling

Always wrap in try-catch:

```typescript
try {
  const result = await ffmpeg('input.mp4')
    .output('output.mp4')
    .run();
  console.log('Success:', result);
} catch (error) {
  console.error('Error:', error.message);
  console.error('Code:', error.code);
  console.error('Suggestion:', error.suggestion);
}
```

### Resource Cleanup

Use `finally` for cleanup:

```typescript
try {
  await ffmpeg('input.mp4')
    .output('output.mp4')
    .run();
} catch (error) {
  console.error(error);
} finally {
  // Cleanup temporary files
}
```

### Progress Monitoring

Monitor long operations:

```typescript
await ffmpeg('input.mp4')
  .output('output.mp4')
  .on('progress', (progress) => {
    console.log(`${progress.percent}% - ETA: ${progress.eta}s`);
  })
  .run();
```

---

## 📚 Related

- [Quick Start](./quick-start_EN.md)
- [API Examples](./api-examples_EN.md)
- [Features](./features_EN.md)
