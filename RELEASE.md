# 发布流程文档

本文档描述了AIHC助手浏览器扩展的自动化发布流程。

## 🚀 自动化发布流程

本项目使用GitHub Actions实现完全自动化的发布流程。当您推送Git标签时，系统会自动构建、打包并发布浏览器扩展。

## 📋 发布步骤

### 1. 准备发布

在发布新版本之前，请确保：

- [ ] 所有功能已完成并测试
- [ ] 代码已通过类型检查
- [ ] 更新了 `package.json` 中的版本号
- [ ] 更新了 `CHANGELOG.md` 文件
- [ ] 提交了所有更改

### 2. 本地测试

在发布之前，建议先进行本地测试：

```bash
# 运行完整的发布流程测试
npm run test-release
```

这个命令会：
- 检查环境依赖
- 安装项目依赖
- 运行类型检查
- 构建扩展程序
- 打包为ZIP文件
- 验证构建产物

### 3. 创建Git标签

```bash
# 创建新版本标签（使用语义化版本）
git tag v0.5.0

# 推送标签到远程仓库
git push origin v0.5.0
```

### 4. 自动发布

当您推送标签后，GitHub Actions会自动：

1. **检出代码** - 获取最新的代码和完整Git历史
2. **环境设置** - 设置Node.js 18环境和npm缓存
3. **依赖安装** - 使用 `npm ci` 安装项目依赖
4. **类型检查** - 运行TypeScript类型检查
5. **构建扩展** - 编译TypeScript并构建生产版本
6. **打包扩展** - 将构建产物打包为ZIP文件
7. **生成变更日志** - 自动生成版本间的变更日志
8. **创建发布** - 在GitHub上创建新的Release
9. **上传资源** - 上传ZIP文件作为发布资源
10. **清理** - 清理临时文件

## 🏷️ 版本命名规范

本项目遵循[语义化版本](https://semver.org/lang/zh-CN/)规范：

- **主版本号 (MAJOR)**: 不兼容的API修改
- **次版本号 (MINOR)**: 向下兼容的功能性新增  
- **修订号 (PATCH)**: 向下兼容的问题修正

### 标签格式

- 正式版本：`v1.0.0`、`v1.1.0`、`v1.1.1`
- 预发布版本：`v1.0.0-alpha.1`、`v1.0.0-beta.1`、`v1.0.0-rc.1`

## 📦 发布产物

每次发布会生成以下产物：

### 1. GitHub Release
- 包含详细的发布说明
- 自动生成的变更日志
- 安装和使用说明
- 功能特性介绍

### 2. 扩展包文件
- `aihc-helper-extension-v{version}.zip` - 浏览器扩展安装包
- 可直接下载并安装到Chrome浏览器

### 3. 构建产物
- `dist/` 目录 - 完整的扩展程序文件
- 保留30天供下载和调试使用

## 🔧 手动触发发布

除了推送标签外，您还可以手动触发发布流程：

1. 进入GitHub仓库的Actions页面
2. 选择"Build and Release Extension"工作流
3. 点击"Run workflow"按钮
4. 选择要发布的标签或分支

## 📝 变更日志

项目使用自动化的变更日志生成：

- **首次发布**：显示所有功能特性
- **后续版本**：显示与上一个标签之间的所有提交

### 自定义变更日志

如果您需要自定义变更日志，可以：

1. 在 `CHANGELOG.md` 中添加详细的变更记录
2. 使用规范的提交信息格式
3. 在GitHub Release中手动编辑发布说明

## 🛠️ 本地开发

### 开发模式

```bash
# 启动开发模式（监听文件变化）
npm run dev
```

### 构建测试

```bash
# 构建生产版本
npm run build

# 打包扩展
npm run package
```

### 类型检查

```bash
# 运行TypeScript类型检查
npm run type-check
```

## 🐛 故障排除

### 常见问题

1. **构建失败**
   - 检查TypeScript类型错误
   - 确保所有依赖已正确安装
   - 查看GitHub Actions日志获取详细错误信息

2. **图标文件缺失**
   - 确保 `src/assets/icons/` 目录包含所有必需的图标
   - 运行 `npm run generate-icons` 重新生成图标

3. **ZIP文件过大**
   - 检查是否包含了不必要的文件
   - 优化构建配置减少包大小

4. **发布失败**
   - 检查GitHub Token权限
   - 确保标签格式正确
   - 查看Actions日志获取错误详情

### 获取帮助

如果遇到问题，请：

1. 查看GitHub Actions的运行日志
2. 检查项目的Issues页面
3. 联系项目维护者

## 📚 相关文档

- [GitHub Actions文档](https://docs.github.com/cn/actions)
- [语义化版本规范](https://semver.org/lang/zh-CN/)
- [Chrome扩展开发指南](https://developer.chrome.com/docs/extensions/)
- [Keep a Changelog](https://keepachangelog.com/zh-CN/1.0.0/)

## 🔄 持续集成

本项目配置了以下CI/CD流程：

- ✅ 自动构建和测试
- ✅ 类型检查和代码质量检查  
- ✅ 自动化发布流程
- ✅ 构建产物管理
- ✅ 发布文档生成

这确保了每次发布都是高质量、可重复和可追溯的。
