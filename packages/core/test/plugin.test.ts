import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { PluginManager, getPluginManager, usePlugin, Plugin } from '../src/plugin';
import { ChainableFFmpeg } from '../src/chainable';

describe('PluginSystem', () => {
  let pluginManager: PluginManager;

  beforeEach(() => {
    pluginManager = new PluginManager();
  });

  afterEach(async () => {
    // 按照依赖顺序的反序清理插件，避免依赖冲突
    try {
      const plugins = pluginManager.listPlugins();
      // 先卸载依赖其他插件的插件
      for (const plugin of plugins) {
        if (plugin.dependencies && plugin.dependencies.length > 0) {
          try {
            await pluginManager.uninstall(plugin.name);
          } catch (error) {
            // 忽略卸载错误
          }
        }
      }
      // 再卸载剩余的插件
      await pluginManager.clear();
    } catch (error) {
      // 确保清理不会失败
      pluginManager = new PluginManager();
    }
  });

  describe('install', () => {
    it('should install plugin successfully', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: async (context) => {
          context.registerPreset('test:preset', {
            name: 'Test Preset',
            description: 'Test preset',
          });
        },
      };

      await pluginManager.install(plugin);

      expect(pluginManager.has('test-plugin')).toBe(true);
    });

    it('should warn when installing same plugin twice', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
      };

      await pluginManager.install(plugin);

      const consoleSpy = vi.spyOn(console, 'warn');
      await pluginManager.install(plugin);

      expect(consoleSpy).toHaveBeenCalledWith('Plugin test-plugin is already installed');
    });

    it('should register presets', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: (context) => {
          context.registerPreset('custom:preset', {
            name: 'Custom Preset',
            description: 'Test preset',
            videoCodec: 'libx264',
          });
        },
      };

      await pluginManager.install(plugin);

      const preset = pluginManager.getPresetConfig('custom:preset');
      expect(preset).toBeDefined();
      expect(preset?.name).toBe('Custom Preset');
    });

    it('should register processors', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: (context) => {
          context.registerProcessor('custom-processor', (instance) => {
            return instance.videoBitrate('2M');
          });
        },
      };

      await pluginManager.install(plugin);

      const processor = pluginManager.getProcessor('custom-processor');
      expect(processor).toBeDefined();
    });

    it('should register chain methods', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: (context) => {
          context.registerChainMethod('customMethod', function (this: ChainableFFmpeg) {
            return this.videoBitrate('1M');
          });
        },
      };

      await pluginManager.install(plugin);

      expect((ChainableFFmpeg.prototype as any).customMethod).toBeDefined();
    });
  });

  describe('uninstall', () => {
    it('should uninstall plugin', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
      };

      await pluginManager.install(plugin);
      await pluginManager.uninstall('test-plugin');

      expect(pluginManager.has('test-plugin')).toBe(false);
    });

    it('should warn when uninstalling non-existent plugin', async () => {
      const consoleSpy = vi.spyOn(console, 'warn');
      await pluginManager.uninstall('non-existent');

      expect(consoleSpy).toHaveBeenCalledWith('Plugin non-existent is not installed');
    });

    it('should call plugin uninstall hook', async () => {
      const uninstallHook = vi.fn();

      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
        uninstall: uninstallHook,
      };

      await pluginManager.install(plugin);
      await pluginManager.uninstall('test-plugin');

      expect(uninstallHook).toHaveBeenCalled();
    });

    it('should cleanup registered presets', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: (context) => {
          context.registerPreset('test:preset', {
            name: 'Test Preset',
          });
        },
      };

      await pluginManager.install(plugin);
      await pluginManager.uninstall('test-plugin');

      const preset = pluginManager.getPresetConfig('test:preset');
      expect(preset).toBeUndefined();
    });

    it('should cleanup registered processors', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: (context) => {
          context.registerProcessor('test-processor', (instance) => instance);
        },
      };

      await pluginManager.install(plugin);
      await pluginManager.uninstall('test-plugin');

      const processor = pluginManager.getProcessor('test-processor');
      expect(processor).toBeUndefined();
    });

    it('should cleanup registered chain methods', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: (context) => {
          context.registerChainMethod('testMethod', function (this: ChainableFFmpeg) {
            return this;
          });
        },
      };

      await pluginManager.install(plugin);
      expect((ChainableFFmpeg.prototype as any).testMethod).toBeDefined();

      await pluginManager.uninstall('test-plugin');
      expect((ChainableFFmpeg.prototype as any).testMethod).toBeUndefined();
    });
  });

  describe('getPlugin', () => {
    it('should return installed plugin', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
      };

      await pluginManager.install(plugin);

      const retrieved = pluginManager.getPlugin('test-plugin');
      expect(retrieved).toBe(plugin);
    });

    it('should return undefined for non-existent plugin', () => {
      const retrieved = pluginManager.getPlugin('non-existent');
      expect(retrieved).toBeUndefined();
    });
  });

  describe('listPlugins', () => {
    it('should list all installed plugins', async () => {
      const plugin1: Plugin = {
        name: 'plugin1',
        version: '1.0.0',
        install: () => {},
      };

      const plugin2: Plugin = {
        name: 'plugin2',
        version: '1.0.0',
        install: () => {},
      };

      await pluginManager.install(plugin1);
      await pluginManager.install(plugin2);

      const plugins = pluginManager.listPlugins();
      expect(plugins).toHaveLength(2);
      expect(plugins.map(p => p.name)).toContain('plugin1');
      expect(plugins.map(p => p.name)).toContain('plugin2');
    });
  });

  describe('applyProcessor', () => {
    it('should apply processor to instance', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: (context) => {
          context.registerProcessor('test-processor', (instance, options) => {
            return instance.videoBitrate(options.bitrate);
          });
        },
      };

      await pluginManager.install(plugin);

      const mockInstance = {
        videoBitrate: vi.fn().mockReturnThis(),
      } as any;

      await pluginManager.applyProcessor('test-processor', mockInstance, {
        bitrate: '2M',
      });

      expect(mockInstance.videoBitrate).toHaveBeenCalledWith('2M');
    });

    it('should throw error for non-existent processor', async () => {
      const mockInstance = {} as any;

      await expect(
        pluginManager.applyProcessor('non-existent', mockInstance)
      ).rejects.toThrow('Processor not found: non-existent');
    });
  });

  describe('getStats', () => {
    it('should return correct statistics', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: (context) => {
          context.registerPreset('preset1', { name: 'Preset 1' });
          context.registerPreset('preset2', { name: 'Preset 2' });
          context.registerProcessor('processor1', (instance) => instance);
        },
      };

      await pluginManager.install(plugin);

      const stats = pluginManager.getStats();
      expect(stats.pluginCount).toBe(1);
      expect(stats.processorCount).toBe(1);
      expect(stats.presetCount).toBe(2);
    });
  });

  describe('clear', () => {
    it('should clear all plugins and resources', async () => {
      const plugin1: Plugin = {
        name: 'plugin1',
        version: '1.0.0',
        install: (context) => {
          context.registerPreset('preset1', { name: 'Preset 1' });
        },
      };

      const plugin2: Plugin = {
        name: 'plugin2',
        version: '1.0.0',
        install: (context) => {
          context.registerProcessor('processor1', (instance) => instance);
        },
      };

      await pluginManager.install(plugin1);
      await pluginManager.install(plugin2);

      await pluginManager.clear();

      const stats = pluginManager.getStats();
      expect(stats.pluginCount).toBe(0);
      expect(stats.processorCount).toBe(0);
      expect(stats.presetCount).toBe(0);
    });
  });

  describe('getPluginManager', () => {
    it('should return global plugin manager instance', () => {
      const manager = getPluginManager();
      expect(manager).toBeInstanceOf(PluginManager);
    });

    it('should return same instance on multiple calls', () => {
      const manager1 = getPluginManager();
      const manager2 = getPluginManager();
      expect(manager1).toBe(manager2);
    });
  });

  describe('usePlugin', () => {
    it('should install plugin using convenience function', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: () => {},
      };

      await usePlugin(plugin);

      const manager = getPluginManager();
      expect(manager.has('test-plugin')).toBe(true);
    });
  });

  describe('Plugin Dependencies', () => {
    it('should install plugin with satisfied dependencies', async () => {
      const dependencyPlugin: Plugin = {
        name: 'dependency-plugin',
        version: '1.5.0',
        install: () => {},
      };

      const mainPlugin: Plugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: [
          { name: 'dependency-plugin', version: '^1.0.0' },
        ],
        install: () => {},
      };

      await pluginManager.install(dependencyPlugin);
      await pluginManager.install(mainPlugin);

      expect(pluginManager.has('main-plugin')).toBe(true);
    });

    it('should throw error when dependency is not installed', async () => {
      const plugin: Plugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: [
          { name: 'missing-dependency', version: '1.0.0' },
        ],
        install: () => {},
      };

      await expect(pluginManager.install(plugin)).rejects.toThrow(
        'Plugin main-plugin requires dependency "missing-dependency" but it is not installed'
      );
    });

    it('should throw error when dependency version is not satisfied', async () => {
      const dependencyPlugin: Plugin = {
        name: 'dependency-plugin',
        version: '1.0.0',
        install: () => {},
      };

      const mainPlugin: Plugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: [
          { name: 'dependency-plugin', version: '^2.0.0' },
        ],
        install: () => {},
      };

      await pluginManager.install(dependencyPlugin);

      await expect(pluginManager.install(mainPlugin)).rejects.toThrow(
        'requires dependency-plugin version ^2.0.0'
      );
    });

    it('should prevent uninstalling plugin that other plugins depend on', async () => {
      const dependencyPlugin: Plugin = {
        name: 'dependency-plugin',
        version: '1.0.0',
        install: () => {},
      };

      const mainPlugin: Plugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: [
          { name: 'dependency-plugin', version: '1.0.0' },
        ],
        install: () => {},
      };

      await pluginManager.install(dependencyPlugin);
      await pluginManager.install(mainPlugin);

      await expect(pluginManager.uninstall('dependency-plugin')).rejects.toThrow(
        'Cannot uninstall plugin dependency-plugin because plugin main-plugin depends on it'
      );
    });

    it('should allow uninstalling plugin after dependent plugin is removed', async () => {
      const dependencyPlugin: Plugin = {
        name: 'dependency-plugin',
        version: '1.0.0',
        install: () => {},
      };

      const mainPlugin: Plugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: [
          { name: 'dependency-plugin', version: '1.0.0' },
        ],
        install: () => {},
      };

      await pluginManager.install(dependencyPlugin);
      await pluginManager.install(mainPlugin);
      await pluginManager.uninstall('main-plugin');
      await pluginManager.uninstall('dependency-plugin');

      expect(pluginManager.has('dependency-plugin')).toBe(false);
    });
  });

  describe('Version Checking', () => {
    it('should satisfy exact version match', async () => {
      const dependencyPlugin: Plugin = {
        name: 'dependency-plugin',
        version: '1.0.0',
        install: () => {},
      };

      const mainPlugin: Plugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: [
          { name: 'dependency-plugin', version: '1.0.0' },
        ],
        install: () => {},
      };

      await pluginManager.install(dependencyPlugin);
      await pluginManager.install(mainPlugin);

      expect(pluginManager.has('main-plugin')).toBe(true);
    });

    it('should satisfy compatible version (^)', async () => {
      const dependencyPlugin: Plugin = {
        name: 'dependency-plugin',
        version: '1.5.3',
        install: () => {},
      };

      const mainPlugin: Plugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: [
          { name: 'dependency-plugin', version: '^1.0.0' },
        ],
        install: () => {},
      };

      await pluginManager.install(dependencyPlugin);
      await pluginManager.install(mainPlugin);

      expect(pluginManager.has('main-plugin')).toBe(true);
    });

    it('should not satisfy incompatible version (^)', async () => {
      const dependencyPlugin: Plugin = {
        name: 'dependency-plugin',
        version: '2.0.0',
        install: () => {},
      };

      const mainPlugin: Plugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: [
          { name: 'dependency-plugin', version: '^1.0.0' },
        ],
        install: () => {},
      };

      await pluginManager.install(dependencyPlugin);

      await expect(pluginManager.install(mainPlugin)).rejects.toThrow();
    });

    it('should satisfy greater than or equal (>=)', async () => {
      const dependencyPlugin: Plugin = {
        name: 'dependency-plugin',
        version: '1.5.0',
        install: () => {},
      };

      const mainPlugin: Plugin = {
        name: 'main-plugin',
        version: '1.0.0',
        dependencies: [
          { name: 'dependency-plugin', version: '>=1.0.0' },
        ],
        install: () => {},
      };

      await pluginManager.install(dependencyPlugin);
      await pluginManager.install(mainPlugin);

      expect(pluginManager.has('main-plugin')).toBe(true);
    });
  });

  describe('Uninstall Warnings', () => {
    it('should warn when uninstalling plugin with chain methods', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: (context) => {
          context.registerChainMethod('customMethod', function (this: ChainableFFmpeg) {
            return this;
          });
        },
      };

      await pluginManager.install(plugin);

      const consoleSpy = vi.spyOn(console, 'warn');
      await pluginManager.uninstall('test-plugin');

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Warning: Uninstalling plugin test-plugin')
      );
      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('Methods will be removed: customMethod')
      );
    });

    it('should not warn when uninstalling plugin without chain methods', async () => {
      const plugin: Plugin = {
        name: 'test-plugin',
        version: '1.0.0',
        install: (context) => {
          context.registerPreset('test:preset', { name: 'Test' });
        },
      };

      await pluginManager.install(plugin);

      const consoleSpy = vi.spyOn(console, 'warn');
      await pluginManager.uninstall('test-plugin');

      // 应该只有 "Plugin test-plugin is not installed" 的警告（如果在卸载后再次调用）
      // 但不应该有 "Warning: Uninstalling plugin" 的警告
      const warnings = consoleSpy.mock.calls.filter(
        (call) => call[0].includes('Warning: Uninstalling plugin')
      );
      expect(warnings).toHaveLength(0);
    });
  });
});
