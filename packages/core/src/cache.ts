import { createHash } from 'crypto';
import { existsSync, statSync, unlinkSync, mkdirSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import lockfile from 'proper-lockfile';

/**
 * 缓存配置选项
 */
export interface CacheOptions {
  /** 是否启用缓存 */
  enabled: boolean;

  /** 缓存目录 */
  dir?: string;

  /** 缓存生存时间（秒） */
  ttl?: number;

  /** 最大缓存大小（字节） */
  maxSize?: number;
}

/**
 * 缓存条目
 */
interface CacheEntry {
  /** 缓存键 */
  key: string;

  /** 输入文件路径 */
  inputPath: string;

  /** 输出文件路径 */
  outputPath: string;

  /** 参数哈希 */
  paramsHash: string;

  /** 创建时间戳 */
  createdAt: number;

  /** 过期时间戳 */
  expiresAt: number;

  /** 文件大小 */
  size: number;

  /** 最后访问时间（用于 LRU） */
  lastAccessedAt: number;
}

/**
 * 缓存管理器
 * 实现基于参数哈希的输出文件缓存
 */
export class CacheManager {
  private options: Required<CacheOptions>;
  private cacheDir: string;
  private manifestPath: string;
  private manifest: Map<string, CacheEntry> = new Map();
  private hits = 0;
  private misses = 0;
  private manifestDirty = false;
  private saveTimer: NodeJS.Timeout | null = null;
  private lockOptions = { stale: 5000, retries: 3 };

  constructor(options: CacheOptions = { enabled: true }) {
    this.options = {
      enabled: options.enabled,
      dir: options.dir || join(process.cwd(), '.ffmpeg-cache'),
      ttl: options.ttl || 86400, // 默认 1 天
      maxSize: options.maxSize || 1024 * 1024 * 1024, // 默认 1GB
    };

    this.cacheDir = this.options.dir;
    this.manifestPath = join(this.cacheDir, 'manifest.json');

    // 初始化缓存目录
    this.initCacheDir();

    // 加载缓存清单（异步，不阻塞构造函数）
    this.loadManifest().catch((error) => {
      console.error(`Failed to load cache manifest: ${error.message}`);
    });
  }

  /**
   * 初始化缓存目录
   */
  private initCacheDir(): void {
    try {
      if (!existsSync(this.cacheDir)) {
        mkdirSync(this.cacheDir, { recursive: true });
      }
    } catch (error: any) {
      console.error(`Failed to initialize cache directory: ${error.message}`);
      // 禁用缓存功能
      this.options.enabled = false;
    }
  }

  /**
   * 加载缓存清单
   */
  private async loadManifest(): Promise<void> {
    if (!existsSync(this.manifestPath)) {
      return;
    }

    let release: (() => Promise<void>) | null = null;

    try {
      // 获取文件锁
      release = await lockfile.lock(this.manifestPath, this.lockOptions);

      const data = readFileSync(this.manifestPath, 'utf-8');
      const entries = JSON.parse(data) as CacheEntry[];

      entries.forEach((entry) => {
        // 兼容性处理：为旧条目添加 lastAccessedAt
        if (!entry.lastAccessedAt) {
          entry.lastAccessedAt = entry.createdAt;
        }
        this.manifest.set(entry.key, entry);
      });

      // 释放锁
      await release();
    } catch (error: any) {
      console.error(`Failed to load cache manifest: ${error.message}`);

      // 确保释放锁
      if (release) {
        try {
          await release();
        } catch {}
      }

      // 如果清单损坏，清空缓存
      this.clear();
    }
  }

  /**
   * 标记清单为脏，延迟保存
   * @private
   */
  private markDirty(): void {
    this.manifestDirty = true;

    // 延迟保存，避免频繁 I/O
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }

    this.saveTimer = setTimeout(() => {
      this.saveManifest().catch((error) => {
        console.error(`Failed to save manifest: ${error.message}`);
      });
    }, 1000); // 1秒后保存
  }

  /**
   * 保存缓存清单
   */
  private async saveManifest(): Promise<void> {
    if (!this.manifestDirty) {
      return; // 没有修改，不保存
    }

    let release: (() => Promise<void>) | null = null;

    try {
      // 获取文件锁
      release = await lockfile.lock(this.manifestPath, this.lockOptions);

      const entries = Array.from(this.manifest.values());
      const data = JSON.stringify(entries, null, 2);
      writeFileSync(this.manifestPath, data, 'utf-8');
      this.manifestDirty = false;

      // 释放锁
      await release();
    } catch (error: any) {
      console.error(`Failed to save cache manifest: ${error.message}`);

      // 确保释放锁
      if (release) {
        try {
          await release();
        } catch {}
      }
    }
  }

  /**
   * 生成参数哈希
   */
  generateParamsHash(
    inputPath: string,
    options: Record<string, any>
  ): string {
    try {
      // 包含输入文件路径和所有选项
      const data = JSON.stringify({ inputPath, ...options });
      return createHash('md5').update(data).digest('hex');
    } catch (error: any) {
      console.error(`Failed to generate params hash: ${error.message}`);
      // 回退到简单哈希
      return createHash('md5').update(inputPath).digest('hex');
    }
  }

  /**
   * 获取缓存键
   */
  getCacheKey(inputPath: string, options: Record<string, any>): string {
    return this.generateParamsHash(inputPath, options);
  }

  /**
   * 检查缓存是否存在
   */
  has(key: string): boolean {
    if (!this.options.enabled) {
      return false;
    }

    const entry = this.manifest.get(key);

    if (!entry) {
      return false;
    }

    // 检查是否过期
    if (Date.now() > entry.expiresAt) {
      this.delete(key);
      return false;
    }

    // 检查文件是否存在
    if (!existsSync(entry.outputPath)) {
      this.delete(key);
      return false;
    }

    return true;
  }

  /**
   * 获取缓存
   */
  get(key: string): string | null {
    if (!this.has(key)) {
      this.misses++;
      return null;
    }

    const entry = this.manifest.get(key);

    if (!entry) {
      this.misses++;
      return null;
    }

    // 更新访问时间（用于 LRU）
    entry.lastAccessedAt = Date.now();
    this.hits++;
    this.markDirty();

    return entry.outputPath;
  }

  /**
   * 设置缓存
   */
  set(
    key: string,
    inputPath: string,
    outputPath: string,
    options: Record<string, any>
  ): void {
    if (!this.options.enabled) {
      return;
    }

    // 检查缓存大小，如果超过限制则清理
    this.evictIfNeeded();

    const now = Date.now();
    const paramsHash = this.generateParamsHash(inputPath, options);

    // 获取文件大小
    let size = 0;
    try {
      if (existsSync(outputPath)) {
        const stats = statSync(outputPath);
        size = stats.size;
      }
    } catch (error: any) {
      console.error(`Failed to get file size for caching: ${error.message}`);
      // 使用 0 作为默认值
    }

    const entry: CacheEntry = {
      key,
      inputPath,
      outputPath,
      paramsHash,
      createdAt: now,
      expiresAt: now + this.options.ttl * 1000,
      size,
      lastAccessedAt: now,
    };

    this.manifest.set(key, entry);
    this.markDirty();
  }

  /**
   * 删除缓存
   */
  delete(key: string): void {
    const entry = this.manifest.get(key);

    if (entry) {
      // 删除缓存文件
      if (existsSync(entry.outputPath)) {
        try {
          unlinkSync(entry.outputPath);
        } catch (error: any) {
          console.error(`Failed to delete cache file ${entry.outputPath}: ${error.message}`);
          // 继续删除清单条目，即使文件删除失败
        }
      }

      this.manifest.delete(key);
      this.markDirty();
    }
  }

  /**
   * 清空所有缓存
   */
  clear(): void {
    // 删除所有缓存文件
    this.manifest.forEach((entry) => {
      if (existsSync(entry.outputPath)) {
        try {
          unlinkSync(entry.outputPath);
        } catch (error: any) {
          console.error(`Failed to delete cache file ${entry.outputPath}: ${error.message}`);
          // 继续删除其他文件
        }
      }
    });

    this.manifest.clear();
    this.markDirty();
  }

  /**
   * 获取缓存统计信息
   */
  getStats(): {
    count: number;
    totalSize: number;
    oldestEntry: number;
    newestEntry: number;
    hits: number;
    misses: number;
    hitRate: number;
  } {
    let totalSize = 0;
    let oldestEntry = Date.now();
    let newestEntry = 0;

    this.manifest.forEach((entry) => {
      totalSize += entry.size;
      if (entry.createdAt < oldestEntry) {
        oldestEntry = entry.createdAt;
      }
      if (entry.createdAt > newestEntry) {
        newestEntry = entry.createdAt;
      }
    });

    return {
      count: this.manifest.size,
      totalSize,
      oldestEntry: this.manifest.size > 0 ? oldestEntry : 0,
      newestEntry: this.manifest.size > 0 ? newestEntry : 0,
      hits: this.hits,
      misses: this.misses,
      hitRate: this.getHitRate(),
    };
  }

  /**
   * 清理过期缓存
   */
  cleanupExpired(): void {
    const now = Date.now();
    const expiredKeys: string[] = [];

    this.manifest.forEach((entry, key) => {
      if (now > entry.expiresAt) {
        expiredKeys.push(key);
      }
    });

    expiredKeys.forEach((key) => this.delete(key));
  }

  /**
   * 如果需要，执行 LRU 淘汰
   */
  private evictIfNeeded(): void {
    // 首先清理过期缓存
    this.cleanupExpired();

    const stats = this.getStats();

    // 如果没有超过大小限制，直接返回
    if (stats.totalSize <= this.options.maxSize) {
      return;
    }

    // 按 LRU 策略淘汰（删除最久未访问的条目）
    const entries = Array.from(this.manifest.values()).sort(
      (a, b) => a.lastAccessedAt - b.lastAccessedAt
    );

    let currentSize = stats.totalSize;

    for (const entry of entries) {
      if (currentSize <= this.options.maxSize * 0.8) {
        // 清理到 80% 以下
        break;
      }

      this.delete(entry.key);
      currentSize -= entry.size;
    }
  }

  /**
   * 获取缓存命中率
   */
  getHitRate(): number {
    const total = this.hits + this.misses;
    if (total === 0) return 0;
    return this.hits / total;
  }

  /**
   * 立即保存清单（进程退出前调用）
   */
  async flush(): Promise<void> {
    if (this.saveTimer) {
      clearTimeout(this.saveTimer);
    }
    await this.saveManifest();
  }
}
