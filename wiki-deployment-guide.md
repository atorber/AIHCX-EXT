# GitHub Wiki 部署指南

这个 GitHub Action 将自动把 `.qoder/repowiki/zh` 目录中的文档发布到项目的 GitHub Wiki。

## 工作流特性

- **自动触发**: 当 `.qoder/repowiki/zh/**` 目录下的文件有变化时自动运行
- **手动触发**: 可以通过 GitHub Actions 页面手动运行
- **智能首页**: 自动生成包含欢迎信息的 Wiki 首页
- **导航生成**: 自动为所有文档生成导航链接
- **增量更新**: 只在有变化时才更新 Wiki

## 文件说明

- **工作流文件**: `.github/workflows/deploy-to-wiki.yml`
- **源文档目录**: `.qoder/repowiki/zh/`
- **目标位置**: GitHub Wiki

## 工作流程

1. **检出代码**: 获取最新的仓库代码
2. **检出 Wiki**: 获取当前的 Wiki 内容
3. **设置首页**: 如果 Wiki 为空，创建欢迎页面
4. **复制文档**: 将所有 `.md` 文件复制到 Wiki
5. **更新导航**: 自动生成文档导航链接
6. **提交推送**: 将更新推送到 Wiki

## Wiki 首页内容

Wiki 首页 (Home.md) 包含：

```markdown
# Welcome to the AIHCX-EXT wiki!

Wikis provide a place in your repository to lay out the roadmap of your project, show the current status, and document software better, together.

## 文档导航

- [文档1](文档1)
- [文档2](文档2)
...

---

*此文档由 GitHub Actions 自动生成和更新*
```

## 使用方式

### 自动部署
当您推送变更到 `main` 或 `master` 分支，且修改了 `.qoder/repowiki/zh/` 目录下的文件时，工作流会自动运行。

### 手动部署
1. 进入 GitHub 仓库
2. 点击 "Actions" 标签页
3. 选择 "Deploy Documentation to GitHub Wiki" 工作流
4. 点击 "Run workflow" 按钮

## 权限要求

工作流使用 `GITHUB_TOKEN` 来访问 Wiki，这个 token 默认可用，无需额外配置。

## 访问 Wiki

部署完成后，您可以通过以下方式访问 Wiki：
- 直接访问: `https://github.com/你的用户名/AIHCX-EXT/wiki`
- 在仓库页面点击 "Wiki" 标签页

## 注意事项

- Wiki 页面标题会根据 Markdown 文件的第一个 `# 标题` 生成
- 如果文件没有标题，则使用文件名作为标题
- 中文字符在 Wiki 中完全支持
- 所有 Markdown 语法都受支持

## 故障排除

如果部署失败，请检查：

1. **权限问题**: 确保仓库启用了 Wiki 功能
2. **文件格式**: 确保源文件是有效的 Markdown 格式
3. **分支名称**: 确保推送到了 `main` 或 `master` 分支
4. **路径问题**: 确保文件在 `.qoder/repowiki/zh/` 目录下

## 自定义配置

如需修改工作流，可以编辑 `.github/workflows/deploy-to-wiki.yml`：

- 修改触发分支: 更改 `branches` 列表
- 修改监控路径: 更改 `paths` 配置
- 自定义首页内容: 修改 `Setup wiki if empty` 步骤

---

*此指南由 GitHub Actions 自动部署系统生成*