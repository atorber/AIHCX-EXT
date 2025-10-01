#!/usr/bin/env node

import { spawn } from 'child_process';
import chokidar from 'chokidar';
import { resolve } from 'path';
import { existsSync } from 'fs';

class ChromeExtensionHotReloader {
  constructor() {
    this.viteProcess = null;
    this.isBuilding = false;
    this.buildQueue = [];
    this.setupSignalHandlers();
  }

  setupSignalHandlers() {
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

  cleanup() {
    if (this.viteProcess) {
      this.viteProcess.kill();
    }
  }

  async buildExtension() {
    if (this.isBuilding) {
      return new Promise((resolve) => {
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
          console.log('🔄 请在Chrome扩展管理页面点击"重新加载"按钮');
          console.log('   chrome://extensions/');
          console.log('');
          
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

  async startViteWatch() {
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

  async handleFileChange(filePath) {
    console.log(`📝 检测到文件变化: ${filePath}`);
    
    try {
      await this.buildExtension();
    } catch (error) {
      console.error('❌ 重新构建失败:', error);
    }
  }

  async start() {
    console.log('🔥 启动Chrome扩展热加载服务...');
    console.log('📋 功能说明:');
    console.log('   - 自动监听文件变化');
    console.log('   - 自动重新构建扩展');
    console.log('   - 提示手动重新加载扩展');
    console.log('   - 按 Ctrl+C 停止服务');
    console.log('');
    console.log('🚀 使用步骤:');
    console.log('   1. 确保Chrome已安装扩展');
    console.log('   2. 打开 chrome://extensions/');
    console.log('   3. 开启"开发者模式"');
    console.log('   4. 点击"重新加载"按钮加载扩展');
    console.log('   5. 现在修改代码后会自动构建，然后手动点击"重新加载"');
    console.log('');

    try {
      // 启动Vite监听模式
      await this.startViteWatch();
      
      // 等待一下让Vite启动
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // 监听src目录变化
      const srcPath = resolve(process.cwd(), 'src');
      const watcher = chokidar.watch(srcPath, {
        ignored: /(^|[\/\\])\../, // 忽略隐藏文件
        persistent: true,
        ignoreInitial: true
      });

      watcher.on('change', (path) => {
        this.handleFileChange(path);
      });

      watcher.on('add', (path) => {
        console.log(`📁 新文件: ${path}`);
        this.handleFileChange(path);
      });

      watcher.on('unlink', (path) => {
        console.log(`🗑️ 文件删除: ${path}`);
        this.handleFileChange(path);
      });

      console.log('✅ 热加载服务已启动！');
      console.log('💡 现在修改代码后会自动重新构建');
      console.log('🔄 构建完成后请在Chrome扩展管理页面点击"重新加载"');

    } catch (error) {
      console.error('❌ 启动热加载服务失败:', error);
      this.cleanup();
      process.exit(1);
    }
  }
}

// 启动热加载服务
const hotReloader = new ChromeExtensionHotReloader();
hotReloader.start().catch(console.error);