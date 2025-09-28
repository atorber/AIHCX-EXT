# GitHub Pages 部署说明

这个 GitHub Action 会自动将 `.qoder/repowiki/zh` 目录中的文档发布为 GitHub Pages。

## 配置步骤

### 1. 启用 GitHub Pages

1. 进入你的 GitHub 仓库
2. 点击 "Settings" 标签
3. 在左侧菜单中找到 "Pages"
4. 在 "Source" 部分选择 "GitHub Actions"

### 2. 触发条件

这个 Action 会在以下情况下自动运行：
- 推送到 `main` 分支且修改了 `.qoder/repowiki/zh/` 目录下的文件
- 手动触发（在 Actions 页面点击 "Run workflow"）

### 3. 文档结构

确保你的文档目录结构如下：
```
.qoder/repowiki/zh/
├── content/
│   ├── 快速入门.md
│   ├── 安装指南.md
│   ├── 功能说明.md
│   ├── 开发指南.md
│   ├── 故障排除.md
│   └── 更新日志.md
└── README.md (可选)
```

### 4. 访问文档

部署完成后，你可以通过以下地址访问文档：
```
https://[你的用户名].github.io/[仓库名]/
```

例如：
```
https://luyuchao.github.io/AIHCX-EXT/
```

### 5. 自定义

如果需要修改文档的样式或布局，可以编辑 `.github/workflows/deploy-docs-simple.yml` 文件中的 HTML 模板部分。

## 功能特性

- 📱 响应式设计，支持移动端访问
- 🎨 简洁美观的界面
- 🔗 便捷的导航菜单
- 📄 通过 iframe 加载 Markdown 文件
- 🚀 自动构建和部署

## 故障排除

### 权限问题
如果遇到权限错误，确保：
1. 仓库的 Settings > Actions > General 中启用了 "Read and write permissions"
2. 在 Settings > Pages 中选择了 "GitHub Actions" 作为源

### 文件不存在
如果部署后看不到内容：
1. 检查 `.qoder/repowiki/zh/content/` 目录是否存在
2. 确保 Markdown 文件名称正确
3. 查看 Actions 运行日志确认构建过程

### 编码问题
如果中文显示异常：
1. 确保所有 Markdown 文件使用 UTF-8 编码
2. 检查文件名是否包含特殊字符