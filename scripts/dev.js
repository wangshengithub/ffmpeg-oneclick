#!/usr/bin/env node

/**
 * 开发辅助脚本
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const command = process.argv[2];

function run(cmd) {
  console.log(`\n> ${cmd}\n`);
  execSync(cmd, { stdio: 'inherit' });
}

function clean() {
  console.log('🧹 清理构建输出...');

  const dirs = ['packages/core/dist', 'packages/bin/dist', 'packages/bin/binaries'];

  dirs.forEach((dir) => {
    const fullPath = path.join(__dirname, '..', dir);
    if (fs.existsSync(fullPath)) {
      fs.rmSync(fullPath, { recursive: true });
      console.log(`   删除: ${dir}`);
    }
  });

  console.log('✅ 清理完成！');
}

function test() {
  console.log('🧪 运行测试...');
  run('pnpm -r test');
  console.log('✅ 测试完成！');
}

function build() {
  console.log('📦 构建所有包...');
  run('pnpm -r build');
  console.log('✅ 构建完成！');
}

function lint() {
  console.log('🔍 代码检查...');
  run('pnpm lint');
  run('pnpm -r typecheck');
  console.log('✅ 检查完成！');
}

function release() {
  console.log('🚀 准备发布...');
  lint();
  test();
  build();
  console.log('✅ 准备完成！运行 pnpm release 来发布。');
}

// 主命令
switch (command) {
  case 'clean':
    clean();
    break;
  case 'test':
    test();
    break;
  case 'build':
    build();
    break;
  case 'lint':
    lint();
    break;
  case 'release':
    release();
    break;
  default:
    console.log('用法: node dev.js <command>');
    console.log('命令:');
    console.log('  clean   - 清理构建输出');
    console.log('  test    - 运行测试');
    console.log('  build   - 构建所有包');
    console.log('  lint    - 代码检查');
    console.log('  release - 准备发布');
    break;
}
