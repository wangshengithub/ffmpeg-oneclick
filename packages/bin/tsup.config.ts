import { defineConfig } from 'tsup';

export default defineConfig([
  {
    entry: ['src/index.ts', 'src/install.ts'],
    format: ['cjs', 'esm'],
    dts: true,
    splitting: false,
    sourcemap: true,
    clean: true,
    minify: false,
    // 添加 ESM 兼容性支持（使用下划线前缀避免变量名冲突）
    esbuildOptions(options) {
      options.banner = {
        js: `
import { createRequire } from 'module';
import { fileURLToPath as _urlToFile } from 'url';
import { dirname as _getDirname } from 'path';
const require = createRequire(import.meta.url);
const __filename = _urlToFile(import.meta.url);
const __dirname = _getDirname(_urlToFile(import.meta.url));
        `.trim(),
      };
    },
  },
]);
