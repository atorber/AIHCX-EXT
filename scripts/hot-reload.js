#!/usr/bin/env node

import { spawn, ChildProcess } from 'child_process';
import { watch } from 'chokidar';
import { resolve } from 'path';
import { existsSync } from 'fs';

class ExtensionHotReloader {
  private viteProcess: ChildProcess | null = null;
  private webExtProcess: ChildProcess | null = null;
  private isBuilding = false;
  private buildQueue: (() => void)[] = [];

  constructor() {
    this.setupSignalHandlers();
  }

  private setupSignalHandlers() {
    process.on('SIGINT', () => {
      console.log('\n🛑 正在停止热加载服务...');
      this.cleanup();
      process.exit(0);
    });

    process.on('SIGTERM', () => {
      this.cleanup();
      process.exit(0);
    });
  }

  private cleanup() {
    if (this.viteProcess) {
      this.viteProcess.kill();
    }
    if (this.webExtProcess) {
      this.webExtProcess.kill();
    }
  }

  private async buildExtension() {
    if (this.isBuilding) {
      return new Promise<void>((resolve) => {
        this.buildQueue.push(resolve);
      });
    }

    this.isBuilding = true;
    console.log('🔨 开始构建扩展...');

    return new Promise((resolve, reject) => {
      const buildProcess = spawn('npm', ['run', 'build'], {
        stdio: 'pipe',
        shell: true
      });

      let output = '';
      buildProcess.stdout?.on('data', (data) => {
        output += data.toString();
      });

      buildProcess.stderr?.on('data', (data) => {
        output += data.toString();
      });

      buildProcess.on('close', (code) => {
        this.isBuilding = false;
        
        if (code === 0) {
          console.log('✅ 扩展构建完成');
          // 处理队列中的等待
          while (this.buildQueue.length > 0) {
            const resolve = this.buildQueue.shift();
            if (resolve) resolve();
          }
          resolve();
        } else {
          console.error('❌ 扩展构建失败');
          console.error(output);
          reject(new Error(`构建失败，退出码: ${code}`));
        }
      });
    });
  }

  private async startWebExt() {
    const distPath = resolve(process.cwd(), 'dist');
    
    if (!existsSync(distPath)) {
      console.log('📁 dist目录不存在，先构建扩展...');
      await this.buildExtension();
    }

    console.log('🚀 启动web-ext开发模式...');
    
    this.webExtProcess = spawn('npx', ['web-ext', 'run', '--source-dir', distPath, '--firefox-profile', 'extension-dev'], {
      stdio: 'inherit',
      shell: true
    });

    this.webExtProcess.on('error', (error) => {
      console.error('❌ web-ext启动失败:', error);
    });

    this.webExtProcess.on('close', (code) => {
      console.log(`web-ext进程退出，退出码: ${code}`);
    });
  }

  private async startViteWatch() {
    console.log('👀 启动Vite监听模式...');
    
    this.viteProcess = spawn('npm', ['run', 'dev'], {
      stdio: 'inherit',
      shell: true
    });

    this.viteProcess.on('error', (error) => {
      console.error('❌ Vite启动失败:', error);
    });

    this.viteProcess.on('close', (code) => {
      console.log(`Vite进程退出，退出码: ${code}`);
    });
  }

  private async handleFileChange(filePath: string) {
    console.log(`📝 检测到文件变化: ${filePath}`);
    
    try {
      await this.buildExtension();
      console.log('🔄 扩展已重新加载');
    } catch (error) {
      console.error('❌ 重新加载失败:', error);
    }
  }

  public async start() {
    console.log('🔥 启动Chrome扩展热加载服务...');
    console.log('📋 功能说明:');
    console.log('   - 自动监听文件变化');
    console.log('   - 自动重新构建扩展');
    console.log('   - 自动重新加载扩展');
    console.log('   - 按 Ctrl+C 停止服务');
    console.log('');

    try {
      // 启动Vite监听模式
      await this.startViteWatch();
      
      // 等待一下让Vite启动
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 启动web-ext
      await this.startWebExt();

      // 监听dist目录变化
      const distPath = resolve(process.cwd(), 'dist');
      const watcher = watch(distPath, {
        ignored: /(^|[\/\\])\../, // 忽略隐藏文件
        persistent: true,
        ignoreInitial: true
      });

      watcher.on('change', (path) => {
        console.log(`📝 dist文件变化: ${path}`);
        // web-ext会自动检测到dist目录的变化并重新加载扩展
      });

      watcher.on('add', (path) => {
        console.log(`📁 新文件: ${path}`);
      });

      watcher.on('unlink', (path) => {
        console.log(`🗑️ 文件删除: ${path}`);
      });

      console.log('✅ 热加载服务已启动！');
      console.log('💡 现在修改代码后会自动重新构建和加载扩展');

    } catch (error) {
      console.error('❌ 启动热加载服务失败:', error);
      this.cleanup();
      process.exit(1);
    }
  }
}

// 启动热加载服务
const hotReloader = new ExtensionHotReloader();
hotReloader.start().catch(console.error);
