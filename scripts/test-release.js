import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { execSync } from 'child_process';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// 模拟GitHub Actions环境的本地测试脚本
async function testRelease() {
  console.log('🧪 开始测试发布流程...\n');
  
  const rootDir = path.join(__dirname, '..');
  
  try {
    // 1. 检查环境
    console.log('1️⃣ 检查环境...');
    
    // 检查Node.js版本
    const nodeVersion = process.version;
    console.log(`   Node.js版本: ${nodeVersion}`);
    
    // 检查npm版本
    const npmVersion = execSync('npm --version', { encoding: 'utf8' }).trim();
    console.log(`   npm版本: ${npmVersion}`);
    
    // 检查Git
    try {
      const gitVersion = execSync('git --version', { encoding: 'utf8' }).trim();
      console.log(`   Git版本: ${gitVersion}`);
    } catch (error) {
      console.log('   ⚠️  Git未安装或不可用');
    }
    
    console.log('   ✅ 环境检查完成\n');
    
    // 2. 安装依赖
    console.log('2️⃣ 安装依赖...');
    execSync('npm ci', { stdio: 'inherit', cwd: rootDir });
    console.log('   ✅ 依赖安装完成\n');
    
    // 3. 类型检查
    console.log('3️⃣ 类型检查...');
    execSync('npm run type-check', { stdio: 'inherit', cwd: rootDir });
    console.log('   ✅ 类型检查通过\n');
    
    // 4. 构建扩展
    console.log('4️⃣ 构建扩展...');
    execSync('npm run build', { stdio: 'inherit', cwd: rootDir });
    console.log('   ✅ 扩展构建完成\n');
    
    // 5. 打包扩展
    console.log('5️⃣ 打包扩展...');
    execSync('npm run package', { stdio: 'inherit', cwd: rootDir });
    console.log('   ✅ 扩展打包完成\n');
    
    // 6. 验证构建产物
    console.log('6️⃣ 验证构建产物...');
    
    const distDir = path.join(rootDir, 'dist');
    const manifestPath = path.join(distDir, 'manifest.json');
    const zipFiles = fs.readdirSync(rootDir).filter(file => file.endsWith('.zip'));
    
    // 检查dist目录
    if (!fs.existsSync(distDir)) {
      throw new Error('dist目录不存在');
    }
    console.log('   ✅ dist目录存在');
    
    // 检查manifest.json
    if (!fs.existsSync(manifestPath)) {
      throw new Error('manifest.json不存在');
    }
    console.log('   ✅ manifest.json存在');
    
    // 检查图标文件
    const iconsDir = path.join(distDir, 'assets', 'icons');
    if (!fs.existsSync(iconsDir)) {
      throw new Error('图标目录不存在');
    }
    const icons = fs.readdirSync(iconsDir);
    const requiredIcons = ['icon16.png', 'icon32.png', 'icon48.png', 'icon128.png'];
    for (const icon of requiredIcons) {
      if (!icons.includes(icon)) {
        throw new Error(`缺少图标文件: ${icon}`);
      }
    }
    console.log('   ✅ 所有图标文件存在');
    
    // 检查ZIP文件
    if (zipFiles.length === 0) {
      throw new Error('没有生成ZIP文件');
    }
    console.log(`   ✅ 生成ZIP文件: ${zipFiles.join(', ')}`);
    
    console.log('   ✅ 构建产物验证完成\n');
    
    // 7. 显示构建结果
    console.log('🎉 发布流程测试完成！\n');
    console.log('📊 构建结果:');
    console.log(`   📁 构建目录: ${distDir}`);
    console.log(`   📦 打包文件: ${zipFiles.map(f => path.join(rootDir, f)).join(', ')}`);
    
    // 显示文件大小
    for (const zipFile of zipFiles) {
      const zipPath = path.join(rootDir, zipFile);
      const stats = fs.statSync(zipPath);
      const sizeKB = (stats.size / 1024).toFixed(2);
      console.log(`   📏 ${zipFile}: ${sizeKB} KB`);
    }
    
    console.log('\n📋 下一步操作:');
    console.log('1. 提交代码到Git仓库');
    console.log('2. 创建Git标签: git tag v0.5.0');
    console.log('3. 推送标签: git push origin v0.5.0');
    console.log('4. GitHub Actions将自动触发发布流程');
    
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

// 运行测试
testRelease();
