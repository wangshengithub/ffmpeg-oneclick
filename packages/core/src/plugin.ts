import { ChainableFFmpeg } from './chainable';
import type { PresetConfig } from './presets';
import semver from 'semver';

/**
 * 插件依赖
 */
export interface PluginDependency {
  /** 依赖的插件名称 */
  name: string;

  /** 依赖的插件版本（支持 semver 范围） */
  version: string;
}

/**
 * 插件接口
 */
export interface Plugin {
  /** 插件名称 */
  name: string;

  /** 插件版本 */
  version: string;

  /** 插件描述 */
  description?: string;

  /** 插件作者 */
  author?: string;

  /** 插件依赖 */
  dependencies?: PluginDependency[];

  /** 插件安装函数 */
  install: (context: PluginContext) => void | Promise<void>;

  /** 插件卸载函数 */
  uninstall?: () => void | Promise<void>;
}

/**
 * 插件上下文
 */
export interface PluginContext {
  /** 注册预设 */
  registerPreset: (name: string, config: PresetConfig) => void;

  /** 注册自定义处理器 */
  registerProcessor: (name: string, handler: ProcessorHandler) => void;

  /** 注册链式方法 */
  registerChainMethod: (name: string, method: (this: ChainableFFmpeg, ...args: any[]) => ChainableFFmpeg) => void;

  /** 注册命令构建器方法 */
  registerBuilderMethod: (name: string, method: (this: any, ...args: any[]) => any) => void;

  /** 获取核心版本 */
  getVersion: () => string;

  /** 扩展类型定义 */
  extendTypes?: (types: any) => any;
}

/**
 * 处理器函数
 */
export type ProcessorHandler = (
  instance: ChainableFFmpeg,
  options?: any
) => ChainableFFmpeg | Promise<ChainableFFmpeg>;

/**
 * 插件资源追踪
 */
interface PluginResources {
  presets: Set<string>;
  processors: Set<string>;
  chainMethods: Set<string>;
  builderMethods: Set<string>;
}

/**
 * 插件管理器
 * 管理和协调所有插件
 */
export class PluginManager {
  private plugins: Map<string, Plugin> = new Map();
  private processors: Map<string, ProcessorHandler> = new Map();
  private presetConfigs: Map<string, PresetConfig> = new Map();
  private pluginResources: Map<string, PluginResources> = new Map();

  /**
   * 安装插件
   */
  async install(plugin: Plugin): Promise<void> {
    if (this.plugins.has(plugin.name)) {
      console.warn(`Plugin ${plugin.name} is already installed`);
      return;
    }

    // 检查插件依赖
    if (plugin.dependencies && plugin.dependencies.length > 0) {
      for (const dep of plugin.dependencies) {
        const installedDep = this.plugins.get(dep.name);

        if (!installedDep) {
          throw new Error(
            `Plugin ${plugin.name} requires dependency "${dep.name}" but it is not installed. ` +
            `Please install ${dep.name} first.`
          );
        }

        // 简单的版本检查（实际应该使用 semver 库）
        if (!this.checkVersionSatisfied(installedDep.version, dep.version)) {
          throw new Error(
            `Plugin ${plugin.name} requires ${dep.name} version ${dep.version}, ` +
            `but version ${installedDep.version} is installed.`
          );
        }
      }
    }

    // 初始化资源追踪
    const resources: PluginResources = {
      presets: new Set(),
      processors: new Set(),
      chainMethods: new Set(),
      builderMethods: new Set(),
    };

    // 创建插件上下文
    const context: PluginContext = {
      registerPreset: (name, config) => {
        this.presetConfigs.set(name, config);
        resources.presets.add(name);
      },

      registerProcessor: (name, handler) => {
        this.processors.set(name, handler);
        resources.processors.add(name);
      },

      registerChainMethod: (name, method) => {
        // 检查是否已存在，防止意外覆盖
        if ((ChainableFFmpeg.prototype as any)[name]) {
          console.warn(
            `Warning: Method "${name}" already exists on ChainableFFmpeg and will be overridden`
          );
        }

        // 动态扩展 ChainableFFmpeg
        (ChainableFFmpeg.prototype as any)[name] = method;
        resources.chainMethods.add(name);
      },

      registerBuilderMethod: async (name, method) => {
        // 动态扩展 CommandBuilder
        let CommandBuilderClass: any;
        try {
          const module = await import('./command-builder');
          CommandBuilderClass = module.CommandBuilder;
        } catch (error) {
          console.error(`Failed to load CommandBuilder: ${error}`);
          throw new Error(`Plugin registration failed: cannot load CommandBuilder`);
        }

        // 检查是否已存在
        if (CommandBuilderClass.prototype[name]) {
          console.warn(
            `Warning: Method "${name}" already exists on CommandBuilder and will be overridden`
          );
        }

        CommandBuilderClass.prototype[name] = method;
        resources.builderMethods.add(name);
      },

      getVersion: () => {
        return '0.1.0';
      },

      extendTypes: (types) => {
        // 扩展类型定义
        return types;
      },
    };

    // 执行插件安装
    await plugin.install(context);

    // 保存插件和资源追踪
    this.plugins.set(plugin.name, plugin);
    this.pluginResources.set(plugin.name, resources);
  }

  /**
   * 卸载插件
   */
  async uninstall(pluginName: string): Promise<void> {
    const plugin = this.plugins.get(pluginName);

    if (!plugin) {
      console.warn(`Plugin ${pluginName} is not installed`);
      return;
    }

    // 检查是否有其他插件依赖此插件
    for (const [name, installedPlugin] of this.plugins) {
      if (installedPlugin.dependencies) {
        const dependsOnThis = installedPlugin.dependencies.some(
          (dep) => dep.name === pluginName
        );
        if (dependsOnThis) {
          throw new Error(
            `Cannot uninstall plugin ${pluginName} because plugin ${name} depends on it. ` +
            `Please uninstall ${name} first.`
          );
        }
      }
    }

    // 获取资源并警告正在使用的方法
    const resources = this.pluginResources.get(pluginName);
    if (resources && resources.chainMethods.size > 0) {
      console.warn(
        `Warning: Uninstalling plugin ${pluginName} while instances may be using it.\n` +
        `Methods will be removed: ${Array.from(resources.chainMethods).join(', ')}\n` +
        `Existing instances may encounter errors if they reference these methods.`
      );
    }

    // 执行卸载
    if (plugin.uninstall) {
      await plugin.uninstall();
    }

    // 清理插件注册的资源
    if (resources) {
      // 清理预设
      resources.presets.forEach((name) => {
        this.presetConfigs.delete(name);
      });

      // 清理处理器
      resources.processors.forEach((name) => {
        this.processors.delete(name);
      });

      // 清理链式方法
      resources.chainMethods.forEach((name) => {
        delete (ChainableFFmpeg.prototype as any)[name];
      });

      // 清理构建器方法
      for (const name of Array.from(resources.builderMethods)) {
        try {
          const module = await import('./command-builder');
          const CommandBuilder = module.CommandBuilder;
          delete (CommandBuilder.prototype as unknown as Record<string, unknown>)[name];
        } catch (error) {
          console.error(`Failed to clean up builder method ${name}: ${error}`);
        }
      }

      // 删除资源追踪
      this.pluginResources.delete(pluginName);
    }

    // 移除插件
    this.plugins.delete(pluginName);
  }

  /**
   * 获取插件
   */
  getPlugin(name: string): Plugin | undefined {
    return this.plugins.get(name);
  }

  /**
   * 列出所有插件
   */
  listPlugins(): Plugin[] {
    return Array.from(this.plugins.values());
  }

  /**
   * 获取处理器
   */
  getProcessor(name: string): ProcessorHandler | undefined {
    return this.processors.get(name);
  }

  /**
   * 获取预设配置
   */
  getPresetConfig(name: string): PresetConfig | undefined {
    return this.presetConfigs.get(name);
  }

  /**
   * 列出所有预设配置
   */
  listPresetConfigs(): Array<{ name: string; config: PresetConfig }> {
    return Array.from(this.presetConfigs.entries()).map(([name, config]) => ({
      name,
      config,
    }));
  }

  /**
   * 应用处理器
   */
  async applyProcessor(
    name: string,
    instance: ChainableFFmpeg,
    options?: any
  ): Promise<ChainableFFmpeg> {
    const processor = this.processors.get(name);

    if (!processor) {
      throw new Error(`Processor not found: ${name}`);
    }

    return processor(instance, options);
  }

  /**
   * 检查插件是否已安装
   */
  has(name: string): boolean {
    return this.plugins.has(name);
  }

  /**
   * 清空所有插件
   */
  async clear(): Promise<void> {
    // 卸载所有插件
    for (const [name] of this.plugins) {
      await this.uninstall(name);
    }

    this.plugins.clear();
    this.processors.clear();
    this.presetConfigs.clear();
    this.pluginResources.clear();
  }

  /**
   * 获取插件统计信息
   */
  getStats(): {
    pluginCount: number;
    processorCount: number;
    presetCount: number;
  } {
    return {
      pluginCount: this.plugins.size,
      processorCount: this.processors.size,
      presetCount: this.presetConfigs.size,
    };
  }

  /**
   * 检查版本是否满足要求
   * @private
   */
  private checkVersionSatisfied(installedVersion: string, requiredVersion: string): boolean {
    try {
      // 使用 semver 库进行完整的版本范围检查
      return semver.satisfies(installedVersion, requiredVersion);
    } catch (error) {
      console.error(`Invalid version range "${requiredVersion}": ${error}`);
      return false;
    }
  }
}

/**
 * 全局插件管理器实例
 */
let globalPluginManager: PluginManager | null = null;

/**
 * 获取插件管理器实例
 */
export function getPluginManager(): PluginManager {
  if (!globalPluginManager) {
    globalPluginManager = new PluginManager();
  }
  return globalPluginManager;
}

/**
 * 使用插件的便捷函数
 */
export async function usePlugin(plugin: Plugin): Promise<void> {
  const manager = getPluginManager();
  await manager.install(plugin);
}
