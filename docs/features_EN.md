# Features

## 📋 Core Features

### Video Operations

- ✅ Format conversion (all FFmpeg supported formats)
- ✅ Resolution scaling (4k/1080p/720p/480p/custom)
- ✅ Frame rate control
- ✅ Bitrate control
- ✅ Encoder selection
- ✅ Video trimming (time segments)
- ✅ Video concatenation (multiple files)
- ✅ Video rotation/flip
- ✅ Video filters (blur/sharpen/color adjustment, etc.)

### Audio Operations

- ✅ Audio extraction
- ✅ Audio encoding/transcoding
- ✅ Audio bitrate/sample rate/channel control
- ✅ Volume adjustment
- ✅ Audio mixing (multiple tracks)
- ✅ Audio filters (noise reduction/normalization, etc.)

### Watermark System

- ✅ Image watermarks
  - Position control (9 preset positions + custom coordinates)
  - Opacity adjustment
  - Scale ratio
- ✅ Text watermarks
  - Font/size/color
  - Position control
  - Opacity/border/shadow

### Screenshot Features

- ✅ Single screenshot (precise timestamp)
- ✅ Multiple screenshots (multiple timestamps)
- ✅ Thumbnail generation (evenly distributed)

### Streaming Formats

- ✅ HLS (m3u8)
  - Segment duration control
  - Playlist management
  - fMP4 support
- ✅ DASH (mpd)
  - Segment duration control
  - Manifest management
  - Live mode support

### Metadata Processing

- ✅ Read metadata (duration/resolution/codec, etc.)
- ✅ Add/modify metadata
- ✅ Clear metadata
- ✅ Auto-rotation handling

## ⚡ Performance Optimization

### Hardware Acceleration

- ✅ NVIDIA NVENC
- ✅ Intel QSV
- ✅ AMD VCE
- ✅ Apple VideoToolbox
- ✅ Auto-detect best option
- ✅ Transparent fallback to software encoding

### Concurrency Control

- ✅ Task queue management
- ✅ Priority control (high/normal/low)
- ✅ Max concurrency configuration
- ✅ Task pause/resume/cancel

### Smart Caching

- ✅ Parameter hash keys
- ✅ TTL management
- ✅ LRU eviction policy
- ✅ Cache size limits

### Download Optimization

- ✅ aria2 multi-threaded acceleration
- ✅ Resume support
- ✅ Proxy support
- ✅ Progress tracking

## 🔌 Extensibility

### Plugin System

- ✅ Plugin install/uninstall
- ✅ Preset registration
- ✅ Custom processors
- ✅ Chainable method extension
- ✅ Builder method extension

### Preset System

- ✅ Compression presets (high/medium/low)
- ✅ Web optimization presets
- ✅ Mobile device presets
- ✅ Platform presets (YouTube/TikTok)
- ✅ Streaming presets (HLS/DASH)
- ✅ Custom presets

## 🛠️ Developer Tools

### CLI Tool

- ✅ convert - Convert video
- ✅ compress - Compress video
- ✅ gif - Create GIF
- ✅ extract-audio - Extract audio
- ✅ info - View information
- ✅ detect-hw - Detect hardware acceleration
- ✅ interactive - Interactive mode
- ✅ presets - List presets

### Progress Reporting

- ✅ Percentage progress
- ✅ Estimated time remaining (ETA)
- ✅ Current frame
- ✅ Bitrate
- ✅ Encoding speed (FPS)
- ✅ File size

### Error Handling

- ✅ Error code system
- ✅ Friendly messages
- ✅ Solution suggestions
- ✅ Retry mechanism

## 📊 Technical Specifications

### Platform Support

- ✅ Windows (x64)
- ✅ macOS (x64/ARM64)
- ✅ Linux (x64/ARM64)

### System Requirements

- ✅ Node.js >= 18.0.0
- ✅ TypeScript >= 5.0 (optional)

### Package Size

- ✅ Core: < 500KB (excluding binaries)
- ✅ Full installation: ~200MB (including FFmpeg binaries)

### Test Coverage

- ✅ Unit tests: 90%+
- ✅ Integration tests: Main features
- ✅ E2E tests: Critical workflows

## 🎯 Feature Comparison

| Feature | ffmpeg-oneclick | fluent-ffmpeg | @ffmpeg/ffmpeg |
|---------|----------------|---------------|----------------|
| **Core Features** | | | |
| Chainable API | ✅ | ✅ | ❌ |
| TypeScript | ✅ Native | ❌ | ✅ |
| Auto-download | ✅ | ❌ | ✅ |
| **Advanced Features** | | | |
| Watermark system | ✅ | ❌ | ❌ |
| HLS/DASH | ✅ | ❌ | ❌ |
| Audio mixing | ✅ | ❌ | ❌ |
| Screenshot feature | ✅ Complete | ⚠️ Basic | ❌ |
| **Performance** | | | |
| Hardware acceleration | ✅ Auto-detect | ❌ | ❌ |
| Concurrency control | ✅ Built-in | ❌ | ❌ |
| Smart caching | ✅ Built-in | ❌ | ❌ |
| **Extensibility** | | | |
| Plugin system | ✅ | ❌ | ❌ |
| Preset system | ✅ Rich | ⚠️ Basic | ❌ |
| CLI tool | ✅ Complete | ❌ | ❌ |
