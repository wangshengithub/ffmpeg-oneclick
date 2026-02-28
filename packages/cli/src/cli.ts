#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import inquirer from 'inquirer';
import { ffmpeg, getMetadata, presets, detectBestHardwareAccel } from '@ffmpeg-oneclick/core';

const program = new Command();

program
  .name('ffmpeg-oneclick')
  .description('One-click FFmpeg - Simple, Fast, Complete')
  .version('0.1.0');

// 转换命令
program
  .command('convert <input> <output>')
  .description('Convert video/audio file')
  .option('-s, --size <size>', 'Output size (e.g., 720p, 1080p, 1920x1080)')
  .option('-f, --fps <fps>', 'Frame rate', parseInt)
  .option('-vb, --video-bitrate <bitrate>', 'Video bitrate')
  .option('-ab, --audio-bitrate <bitrate>', 'Audio bitrate')
  .option('-vc, --video-codec <codec>', 'Video codec')
  .option('-ac, --audio-codec <codec>', 'Audio codec')
  .option('-hw, --hardware-accel', 'Enable hardware acceleration')
  .action(async (input, output, options) => {
    const spinner = ora('Processing...').start();

    try {
      const instance = ffmpeg(input).output(output);

      if (options.size) instance.size(options.size);
      if (options.fps) instance.fps(options.fps);
      if (options.videoBitrate) instance.videoBitrate(options.videoBitrate);
      if (options.audioBitrate) instance.audioBitrate(options.audioBitrate);
      if (options.videoCodec) instance.videoCodec(options.videoCodec);
      if (options.audioCodec) instance.audioCodec(options.audioCodec);
      if (options.hardwareAccel) instance.hardwareAccelerate('auto');

      instance.on('progress', (progress) => {
        spinner.text = `Processing: ${progress.percent.toFixed(1)}% | ETA: ${Math.ceil(progress.eta)}s`;
      });

      const result = await instance.run();

      spinner.succeed(`Conversion completed! Output: ${result.output}`);
      console.log(chalk.gray(`  File size: ${(result.size / 1024 / 1024).toFixed(2)} MB`));
      console.log(chalk.gray(`  Duration: ${(result.duration / 1000).toFixed(2)}s`));
    } catch (error: any) {
      spinner.fail('Conversion failed');
      console.error(chalk.red(error.message));
      if (error.suggestion) {
        console.error(chalk.yellow('Suggestion:'), error.suggestion);
      }
      process.exit(1);
    }
  });

// 压缩命令
program
  .command('compress <input> <output>')
  .description('Compress video file')
  .option('-q, --quality <quality>', 'Quality: high, medium, low', 'medium')
  .action(async (input, output, options) => {
    const spinner = ora('Compressing...').start();

    try {
      const quality = options.quality as 'high' | 'medium' | 'low';

      await presets.compressVideo(input, output, quality);

      spinner.succeed('Compression completed!');
    } catch (error: any) {
      spinner.fail('Compression failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// GIF 转换命令
program
  .command('gif <input> <output>')
  .description('Convert video to GIF')
  .option('--start <seconds>', 'Start time', parseInt)
  .option('--duration <seconds>', 'Duration', parseInt)
  .option('--fps <fps>', 'Frame rate', parseInt)
  .option('--size <size>', 'Size (e.g., 480x270)')
  .action(async (input, output, options) => {
    const spinner = ora('Creating GIF...').start();

    try {
      await presets.toGif(input, output, {
        startTime: options.start,
        duration: options.duration,
        fps: options.fps,
        size: options.size,
      });

      spinner.succeed('GIF created successfully!');
    } catch (error: any) {
      spinner.fail('GIF creation failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// 提取音频命令
program
  .command('extract-audio <input> <output>')
  .description('Extract audio from video')
  .option('-ab, --bitrate <bitrate>', 'Audio bitrate')
  .action(async (input, output, options) => {
    const spinner = ora('Extracting audio...').start();

    try {
      await presets.extractAudio(input, output, options.bitrate);

      spinner.succeed('Audio extracted successfully!');
    } catch (error: any) {
      spinner.fail('Audio extraction failed');
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// 视频信息命令
program
  .command('info <input>')
  .description('Show video file information')
  .action(async (input) => {
    try {
      const metadata = await getMetadata(input);

      console.log(chalk.bold('\nVideo Information:\n'));
      console.log(`  ${chalk.cyan('Duration:')} ${metadata.duration.toFixed(2)}s`);
      console.log(`  ${chalk.cyan('Resolution:')} ${metadata.width}x${metadata.height}`);
      console.log(`  ${chalk.cyan('Frame Rate:')} ${metadata.fps} fps`);
      console.log(`  ${chalk.cyan('Video Codec:')} ${metadata.videoCodec}`);
      console.log(`  ${chalk.cyan('Audio Codec:')} ${metadata.audioCodec}`);
      console.log(`  ${chalk.cyan('Video Bitrate:')} ${metadata.videoBitrate} kbps`);
      console.log(`  ${chalk.cyan('Audio Bitrate:')} ${metadata.audioBitrate} kbps`);
      console.log(`  ${chalk.cyan('Audio Sample Rate:')} ${metadata.audioSampleRate} Hz`);
      console.log(`  ${chalk.cyan('Audio Channels:')} ${metadata.audioChannels}`);
      console.log();
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// 硬件加速检测命令
program
  .command('detect-hw')
  .description('Detect available hardware acceleration')
  .action(async () => {
    console.log(chalk.bold('\nDetecting hardware acceleration...\n'));

    try {
      const best = await detectBestHardwareAccel();

      if (best.available) {
        console.log(chalk.green(`✓ ${best.info}`));
        console.log(chalk.gray(`  Encoder: ${best.encoder}`));
        if (best.decoder) {
          console.log(chalk.gray(`  Decoder: ${best.decoder}`));
        }
      } else {
        console.log(chalk.yellow('No hardware acceleration available'));
        console.log(chalk.gray('Using software encoding'));
      }

      console.log();
    } catch (error: any) {
      console.error(chalk.red(error.message));
      process.exit(1);
    }
  });

// 交互式命令
program
  .command('interactive')
  .description('Interactive mode with guided prompts')
  .action(async () => {
    console.log(chalk.bold.cyan('\n🎬 FFmpeg OneClick - Interactive Mode\n'));

    try {
      const answers = await inquirer.prompt([
        {
          type: 'input',
          name: 'input',
          message: 'Input file path:',
          validate: (input) => input.length > 0 || 'Please enter a file path',
        },
        {
          type: 'input',
          name: 'output',
          message: 'Output file path:',
          validate: (input) => input.length > 0 || 'Please enter a file path',
        },
        {
          type: 'list',
          name: 'operation',
          message: 'Select operation:',
          choices: [
            'Convert video',
            'Compress video',
            'Create GIF',
            'Extract audio',
            'Custom conversion',
          ],
        },
        {
          type: 'list',
          name: 'quality',
          message: 'Select quality:',
          choices: ['high', 'medium', 'low'],
          when: (answers) => answers.operation === 'Compress video',
        },
        {
          type: 'list',
          name: 'size',
          message: 'Select resolution:',
          choices: ['4k', '1080p', '720p', '480p', 'Custom'],
          when: (answers) =>
            ['Convert video', 'Custom conversion'].includes(answers.operation),
        },
      ]);

      const spinner = ora('Processing...').start();

      // 根据选择执行操作
      switch (answers.operation) {
        case 'Convert video':
          await ffmpeg(answers.input)
            .output(answers.output)
            .size(answers.size)
            .on('progress', (progress) => {
              spinner.text = `${progress.percent.toFixed(1)}%`;
            })
            .run();
          break;

        case 'Compress video':
          await presets.compressVideo(answers.input, answers.output, answers.quality);
          break;

        case 'Create GIF':
          await presets.toGif(answers.input, answers.output);
          break;

        case 'Extract audio':
          await presets.extractAudio(answers.input, answers.output);
          break;
      }

      spinner.succeed('Operation completed successfully!');
    } catch (error: any) {
      console.error(chalk.red('\nError:'), error.message);
      process.exit(1);
    }
  });

// 列出预设命令
program
  .command('presets')
  .description('List all available presets')
  .action(() => {
    console.log(chalk.bold('\nAvailable Presets:\n'));

    const presetList = presets.list();

    presetList.forEach(({ name, config }) => {
      console.log(`  ${chalk.cyan(name)}`);
      if (config.description) {
        console.log(chalk.gray(`    ${config.description}`));
      }
    });

    console.log();
  });

program.parse();
