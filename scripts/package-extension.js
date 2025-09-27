import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createReadStream, createWriteStream } from 'fs';
import { pipeline } from 'stream';
import { promisify } from 'util';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const pipelineAsync = promisify(pipeline);

// 简单的ZIP创建函数（不依赖外部库）
async function createZip(sourceDir, zipPath) {
  console.log(`开始打包扩展程序...`);
  console.log(`源目录: ${sourceDir}`);
  console.log(`输出文件: ${zipPath}`);
  
  try {
    // 使用系统zip命令（在GitHub Actions中可用）
    const { exec } = await import('child_process');
    const { promisify } = await import('util');
    const execAsync = promisify(exec);
    
    // 确保输出目录存在
    const outputDir = path.dirname(zipPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }
    
    // 使用zip命令创建压缩包
    const zipCommand = `cd "${sourceDir}" && zip -r "${zipPath}" . -x "*.DS_Store" "*.git*" "node_modules/*" "*.log"`;
    console.log(`执行命令: ${zipCommand}`);
    
    await execAsync(zipCommand);
    
    console.log(`✅ 扩展程序打包完成: ${zipPath}`);
    
    // 显示文件大小
    const stats = fs.statSync(zipPath);
    const fileSizeInMB = (stats.size / (1024 * 1024)).toFixed(2);
    console.log(`📦 文件大小: ${fileSizeInMB} MB`);
    
  } catch (error) {
    console.error('❌ 打包失败:', error.message);
    
    // 如果zip命令不可用，尝试使用Node.js的archiver库
    console.log('尝试使用备用打包方法...');
    await createZipWithArchiver(sourceDir, zipPath);
  }
}

// 备用打包方法（使用archiver库）
async function createZipWithArchiver(sourceDir, zipPath) {
  try {
    // 动态导入archiver（如果可用）
    const archiver = await import('archiver');
    
    const output = createWriteStream(zipPath);
    const archive = archiver.default('zip', { zlib: { level: 9 } });
    
    output.on('close', () => {
      console.log(`✅ 扩展程序打包完成: ${zipPath}`);
      console.log(`📦 文件大小: ${(archive.pointer() / (1024 * 1024)).toFixed(2)} MB`);
    });
    
    archive.on('error', (err) => {
      console.error('❌ 打包失败:', err);
      process.exit(1);
    });
    
    archive.pipe(output);
    archive.directory(sourceDir, false);
    await archive.finalize();
    
  } catch (error) {
    console.error('❌ 备用打包方法也失败:', error.message);
    console.log('请安装 archiver 库: npm install --save-dev archiver');
    process.exit(1);
  }
}

// 主函数
async function main() {
  const rootDir = path.join(__dirname, '..');
  const distDir = path.join(rootDir, 'dist');
  
  // 检查dist目录是否存在
  if (!fs.existsSync(distDir)) {
    console.error('❌ dist目录不存在，请先运行 npm run build');
    process.exit(1);
  }
  
  // 获取版本号
  const packageJson = JSON.parse(fs.readFileSync(path.join(rootDir, 'package.json'), 'utf8'));
  const version = packageJson.version;
  
  // 生成ZIP文件名
  const zipFileName = `aihc-helper-extension-v${version}.zip`;
  const zipPath = path.join(rootDir, zipFileName);
  
  console.log(`🚀 开始打包 AIHC助手浏览器扩展 v${version}`);
  
  await createZip(distDir, zipPath);
  
  console.log(`\n🎉 打包完成！`);
  console.log(`📁 扩展文件: ${zipPath}`);
  console.log(`\n📋 安装说明:`);
  console.log(`1. 下载 ${zipFileName} 文件`);
  console.log(`2. 解压缩文件`);
  console.log(`3. 打开Chrome浏览器，进入 chrome://extensions/`);
  console.log(`4. 开启"开发者模式"`);
  console.log(`5. 点击"加载已解压的扩展程序"`);
  console.log(`6. 选择解压后的文件夹`);
}

// 运行主函数
main().catch((error) => {
  console.error('❌ 打包过程出错:', error);
  process.exit(1);
});
