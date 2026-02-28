import { execa } from 'execa';

/**
 * 硬件加速类型
 */
export type HardwareAccelType = 'nvenc' | 'qsv' | 'vce' | 'videotoolbox' | 'none';

/**
 * 硬件加速信息
 */
export interface HardwareAccelInfo {
  /** 硬件加速类型 */
  type: HardwareAccelType;

  /** 是否可用 */
  available: boolean;

  /** 编码器名称 */
  encoder?: string;

  /** 解码器名称 */
  decoder?: string;

  /** 额外信息 */
  info?: string;
}

/**
 * 硬件加速检测器
 * 自动检测系统可用的硬件加速能力
 */
export class HardwareAccelDetector {
  private ffmpegPath: string;
  private cache: Map<HardwareAccelType, HardwareAccelInfo> = new Map();

  constructor(ffmpegPath: string = 'ffmpeg') {
    this.ffmpegPath = ffmpegPath;
  }

  /**
   * 检测所有硬件加速能力
   */
  async detectAll(): Promise<HardwareAccelInfo[]> {
    const types: HardwareAccelType[] = ['nvenc', 'qsv', 'vce', 'videotoolbox'];
    const results: HardwareAccelInfo[] = [];

    for (const type of types) {
      const info = await this.detect(type);
      results.push(info);
    }

    return results;
  }

  /**
   * 检测特定硬件加速
   */
  async detect(type: HardwareAccelType): Promise<HardwareAccelInfo> {
    // 检查缓存
    if (this.cache.has(type)) {
      return this.cache.get(type)!;
    }

    let info: HardwareAccelInfo;

    switch (type) {
      case 'nvenc':
        info = await this.detectNVENC();
        break;
      case 'qsv':
        info = await this.detectQSV();
        break;
      case 'vce':
        info = await this.detectVCE();
        break;
      case 'videotoolbox':
        info = await this.detectVideoToolbox();
        break;
      default:
        info = { type: 'none', available: false };
    }

    // 缓存结果
    this.cache.set(type, info);

    return info;
  }

  /**
   * 通用硬件加速检测
   */
  private async detectHardwareAccel(
    type: HardwareAccelType,
    encoderName: string,
    decoderName: string,
    description: string,
    platformCheck?: () => boolean
  ): Promise<HardwareAccelInfo> {
    const info: HardwareAccelInfo = {
      type,
      available: false,
    };

    // 平台检查（如 VideoToolbox 仅在 macOS 上）
    if (platformCheck && !platformCheck()) {
      return info;
    }

    try {
      // 检查编码器
      const encoderResult = await execa(this.ffmpegPath, ['-encoders']);
      const encoderOutput = encoderResult.stdout;

      if (encoderOutput.includes(encoderName)) {
        info.available = true;
        info.encoder = encoderName;
        info.info = description;

        // 检查解码器
        const decoderResult = await execa(this.ffmpegPath, ['-decoders']);
        if (decoderResult.stdout.includes(decoderName)) {
          info.decoder = decoderName;
        }
      }
    } catch (error) {
      // FFmpeg 不可用或硬件加速不支持
    }

    return info;
  }

  /**
   * 检测 NVIDIA NVENC
   */
  private async detectNVENC(): Promise<HardwareAccelInfo> {
    return this.detectHardwareAccel(
      'nvenc',
      'h264_nvenc',
      'h264_cuvid',
      'NVIDIA NVENC hardware acceleration'
    );
  }

  /**
   * 检测 Intel QSV
   */
  private async detectQSV(): Promise<HardwareAccelInfo> {
    return this.detectHardwareAccel(
      'qsv',
      'h264_qsv',
      'h264_qsv',
      'Intel Quick Sync Video hardware acceleration'
    );
  }

  /**
   * 检测 AMD VCE
   */
  private async detectVCE(): Promise<HardwareAccelInfo> {
    return this.detectHardwareAccel(
      'vce',
      'h264_amf',
      'h264_d3d11va',
      'AMD VCE/AMF hardware acceleration'
    );
  }

  /**
   * 检测 Apple VideoToolbox
   */
  private async detectVideoToolbox(): Promise<HardwareAccelInfo> {
    return this.detectHardwareAccel(
      'videotoolbox',
      'h264_videotoolbox',
      'h264',
      'Apple VideoToolbox hardware acceleration',
      () => process.platform === 'darwin'
    );
  }

  /**
   * 获取最佳硬件加速
   */
  async getBest(): Promise<HardwareAccelInfo> {
    const all = await this.detectAll();

    // 按优先级排序：NVENC > QSV > VCE > VideoToolbox
    const priority: HardwareAccelType[] = ['nvenc', 'qsv', 'vce', 'videotoolbox'];

    for (const type of priority) {
      const info = all.find((i) => i.type === type);
      if (info && info.available) {
        return info;
      }
    }

    return { type: 'none', available: false };
  }

  /**
   * 清除缓存
   */
  clearCache(): void {
    this.cache.clear();
  }
}

/**
 * 全局硬件加速检测器实例
 */
let globalDetector: HardwareAccelDetector | null = null;

/**
 * 获取硬件加速检测器实例
 */
export function getHardwareAccelDetector(ffmpegPath?: string): HardwareAccelDetector {
  if (!globalDetector) {
    globalDetector = new HardwareAccelDetector(ffmpegPath);
  }
  return globalDetector;
}

/**
 * 快速检测最佳硬件加速
 */
export async function detectBestHardwareAccel(
  ffmpegPath?: string
): Promise<HardwareAccelInfo> {
  const detector = getHardwareAccelDetector(ffmpegPath);
  return detector.getBest();
}
