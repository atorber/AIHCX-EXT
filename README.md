# AIHC助手浏览器扩展

## 项目概述

AIHC助手是一个专为百舸AIHC控制台设计的浏览器扩展程序，主要功能包括自动检测AIHC控制台页面、生成CLI命令、导出任务参数（JSON/YAML格式）、提供API文档链接等。

## 技术栈

### 前端框架
- **React 18**: 现代化UI框架，支持Hooks和函数式组件
- **TypeScript 5.7**: 类型安全的JavaScript超集，提供更好的开发体验
- **Vite 6.2**: 新一代构建工具，快速开发和热更新

### 扩展开发
- **Chrome Extension Manifest V3**: 最新版本的Chrome扩展API
- **Chrome APIs**: storage, tabs, runtime, sidePanel, notifications
- **Content Scripts**: 页面内容注入和交互
- **Background Service Worker**: 后台任务处理

### 数据处理
- **百度云SDK**: 官方JavaScript SDK集成
- **Axios**: HTTP客户端库，用于API请求
- **js-yaml**: YAML格式解析和生成
- **Request/Request-Promise**: 兼容性HTTP请求库

### 开发工具
- **Sharp**: 高性能图像处理库
- **ESLint & Prettier**: 代码质量和格式化
- **Node.js 18+**: 运行时环境
- **npm**: 包管理器

### 构建和部署
- **Vite Plugin React**: React插件支持
- **TypeScript Compiler**: 类型检查和编译
- **GitHub Actions**: 自动化CI/CD流程
- **ZIP打包**: 扩展程序打包和发布

## 项目结构

```
AIHCX-EXT/
├── src/                          # 源代码目录
│   ├── components/               # React组件库
│   │   ├── tabs/                # 标签页组件
│   │   │   ├── APIDocsTab.tsx   # API文档标签页
│   │   │   ├── ChatTab.tsx      # AI聊天标签页
│   │   │   ├── CLICommandTab.tsx # CLI命令标签页
│   │   │   ├── CommandScriptTab.tsx # 命令脚本标签页
│   │   │   ├── JSONParamsTab.tsx # JSON参数标签页
│   │   │   └── YAMLParamsTab.tsx # YAML参数标签页
│   │   ├── ContentArea.tsx      # 内容区域组件
│   │   ├── DataDownloadInput.tsx # 数据下载输入组件
│   │   ├── Header.tsx           # 头部组件
│   │   ├── LoadingIndicator.tsx # 加载指示器
│   │   ├── MessageDisplay.tsx   # 消息显示组件
│   │   ├── OptionsContainer.tsx # 选项容器组件
│   │   ├── PopupContainer.tsx   # 弹窗容器组件
│   │   ├── TabNavigation.tsx    # 标签导航组件
│   │   ├── UnsupportedPage.tsx  # 不支持页面组件
│   │   └── UserGuide.tsx        # 用户指南组件
│   ├── handlers/                # 页面处理器
│   │   ├── pages/              # 具体页面处理器
│   │   │   ├── CustomDeploymentHandler.ts
│   │   │   ├── DataDownloadHandler.ts
│   │   │   ├── DatasetDetailHandler.ts
│   │   │   ├── DatasetsHandler.ts
│   │   │   ├── DatasetVersionsHandler.ts
│   │   │   ├── DevelopmentMachinesHandler.ts
│   │   │   ├── ModelDetailHandler.ts
│   │   │   ├── ModelManageListHandler.ts
│   │   │   ├── ModelVersionsHandler.ts
│   │   │   ├── OnlineServiceDeploymentDetailHandler.ts
│   │   │   ├── QueueListHandler.ts
│   │   │   ├── ResourcePoolDetailHandler.ts
│   │   │   ├── ResourcePoolListHandler.ts
│   │   │   ├── TaskDetailHandler.ts
│   │   │   └── TaskListHandler.ts
│   │   ├── BaseHandler.ts       # 基础处理器类
│   │   ├── PageHandlerManager.ts # 页面处理器管理器
│   │   ├── index.ts             # 导出文件
│   │   └── types.ts             # 类型定义
│   ├── utils/                   # 工具函数库
│   │   ├── chromeApi.ts         # Chrome API包装
│   │   ├── common.ts            # 通用工具函数
│   │   ├── errorFilter.ts       # 错误过滤器
│   │   ├── helpers.ts           # 辅助函数
│   │   ├── pageDetection.ts     # 页面检测工具
│   │   └── resourcePools.ts     # 资源池工具
│   ├── types/                   # TypeScript类型定义
│   │   ├── baiducloud.d.ts      # 百度云SDK类型
│   │   └── index.ts             # 主要类型定义
│   ├── styles/                  # 样式文件
│   │   ├── options.css          # 选项页面样式
│   │   └── popup.css            # 弹窗样式
│   ├── assets/                  # 静态资源
│   │   └── icons/               # 图标文件
│   ├── background/              # 后台脚本
│   │   ├── index.ts             # 主后台脚本
│   │   └── index-simple.ts      # 简化版后台脚本
│   ├── content/                 # 内容脚本
│   │   ├── index.ts             # 主内容脚本
│   │   └── style.css            # 内容脚本样式
│   ├── popup/                   # 弹窗页面
│   │   ├── index.html           # 弹窗HTML
│   │   ├── main.tsx             # 弹窗入口
│   │   └── sidebar.css          # 侧边栏样式
│   ├── options/                 # 选项页面
│   │   ├── index.html           # 选项HTML
│   │   └── main.tsx             # 选项入口
│   ├── manifest.json            # 扩展清单文件
│   └── vite-env.d.ts            # Vite环境类型
├── .github/                     # GitHub配置
│   └── workflows/               # GitHub Actions工作流
│       └── release.yml          # 发布工作流
├── scripts/                     # 构建和工具脚本
│   ├── generate-icons.js        # 图标生成脚本
│   ├── package-extension.js     # 扩展打包脚本
│   ├── simple-debug.js          # 简单调试脚本
│   └── test-release.js          # 发布测试脚本
├── dist/                        # 构建输出目录
├── package.json                 # 项目配置和依赖
├── tsconfig.json                # TypeScript配置
├── vite.config.ts               # Vite构建配置
├── CHANGELOG.md                 # 更新日志
├── RELEASE.md                   # 发布说明
└── README.md                    # 项目说明文档
```

## 功能特性

### 🎯 智能页面识别
扩展支持识别AIHC控制台的**16种**不同页面类型，包括：

#### 任务管理
- **任务详情页面**：完整的任务操作命令集，支持启动、停止、删除等操作
- **任务列表页面**：任务列表查询命令生成，支持筛选和搜索

#### 资源池管理
- **自运维资源池列表**：显示自运维资源池CLI命令和API文档
- **全托管资源池列表**：显示全托管资源池相关命令
- **自运维资源池详情**：根据clusterUuid生成特定资源池操作命令
- **全托管资源池详情**：全托管资源池的详细操作命令

#### 队列管理
- **队列列表页面**：显示队列相关CLI命令和配置
- **全托管队列列表**：全托管队列的管理命令

#### 数据集管理
- **数据集管理页面**：数据集列表和基本操作命令
- **数据集详情页面**：数据集详细信息查看和管理命令
- **数据集版本列表**：数据集版本管理和操作命令

#### 模型管理
- **模型管理列表**：模型列表查看和管理命令
- **模型详情页面**：模型详细信息查看和操作命令
- **模型版本列表**：模型版本管理和操作命令

#### 开发环境
- **开发机列表**：开发机管理相关命令
- **在线服务部署详情**：在线服务的部署和管理命令

#### 其他功能
- **自定义部署页面**：自定义部署配置和命令生成
- **数据下载页面**：支持数据集和模型下载链接解析

### 🔧 核心功能模块

#### 1. CLI命令生成
- **智能命令构建**：基于页面参数自动生成aihc CLI命令
- **命令脚本生成**：生成可直接执行的启动命令脚本
- **参数验证**：自动验证命令参数的有效性
- **命令历史**：支持查看和重用历史命令

#### 2. 多格式参数导出
- **JSON格式**：结构化的JSON参数导出，支持嵌套对象
- **YAML格式**：人类可读的YAML配置文件导出
- **TXT格式**：纯文本格式，便于快速查看
- **批量导出**：支持同时导出多种格式

#### 3. AI聊天集成
- **智能对话**：集成AI聊天功能，支持技术问题咨询
- **上下文理解**：基于当前页面上下文提供相关建议
- **服务配置**：支持自定义AI服务URL和访问令牌
- **消息历史**：完整的对话历史记录和搜索

#### 4. 数据下载工具
- **URL解析**：智能解析数据集和模型下载链接
- **元数据提取**：自动提取数据集/模型的元数据信息
- **下载命令生成**：生成对应的下载CLI命令
- **批量处理**：支持批量解析和处理多个下载链接

#### 5. API文档集成
- **快速访问**：一键跳转到相关API文档页面
- **上下文相关**：根据当前页面显示相关的API文档
- **文档搜索**：内置文档搜索功能
- **示例代码**：提供API调用示例代码

### 🎨 用户体验优化

#### 界面设计
- **现代化UI**：基于React的现代化用户界面设计
- **响应式布局**：适配不同屏幕尺寸和设备
- **深色模式支持**：自动适配系统主题
- **流畅动画**：平滑的过渡动画和交互反馈

#### 交互体验
- **一键复制功能**：带视觉反馈的剪贴板操作
- **智能提示**：上下文相关的操作提示和帮助信息
- **快捷键支持**：常用操作的键盘快捷键
- **拖拽操作**：支持拖拽文件进行批量处理

#### 用户引导
- **新手引导系统**：交互式的新手使用指南
- **功能演示**：关键功能的动画演示
- **帮助文档**：完整的内置帮助文档
- **错误处理**：友好的错误提示和解决方案

### 🔌 技术集成

#### 浏览器集成
- **Chrome扩展API**：完整的Chrome扩展功能支持
- **侧边栏集成**：通过content script注入的悬浮按钮和侧边栏
- **页面注入**：智能检测页面类型并注入相关功能
- **跨页面通信**：不同页面间的消息传递和状态同步

#### 数据管理
- **本地存储**：用户配置和数据的本地持久化
- **数据同步**：多设备间的数据同步（可选）
- **缓存机制**：智能缓存减少重复请求
- **数据导出**：支持配置和数据的导出备份

#### 安全特性
- **权限控制**：最小化权限原则，只请求必要的权限
- **数据加密**：敏感数据的本地加密存储
- **安全通信**：HTTPS加密的API通信
- **隐私保护**：不收集用户隐私数据

## 开发指南

### 环境要求
- Node.js >= 16
- npm >= 8

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run dev          # 开发模式，监听文件变化并自动构建
```

### 构建和打包
```bash
npm run build        # 构建生产版本
npm run package      # 打包扩展为ZIP文件
npm run preview      # 预览构建结果
```

### 质量检查
```bash
npm run type-check   # TypeScript类型检查
```

### 发布流程
```bash
npm run test-release # 完整发布流程测试
npm run release      # 发布流程（包含测试）
```

### 工具脚本
```bash
npm run generate-icons # 生成/复制图标文件
```

## 安装和使用

### 开发环境安装
1. 运行 `npm run build` 构建项目
2. 在Chrome浏览器中打开扩展管理页面（chrome://extensions/）
3. 开启"开发者模式"
4. 点击"加载已解压的扩展程序"
5. 选择项目根目录下的 `dist` 文件夹

### 配置
1. 安装扩展后，右键点击扩展图标，选择"选项"
2. 在设置页面中填写您的百度云API凭证（Access Key和Secret Key）
3. 保存设置

### 使用方法
1. 访问百舸AIHC控制台（https://console.bce.baidu.com/aihc）
2. 扩展将自动检测支持的页面类型
3. 点击浏览器工具栏中的扩展图标或页面右侧的悬浮按钮
4. 根据页面类型查看相应的CLI命令、API文档等信息
5. 使用复制按钮将命令复制到剪贴板，或保存参数为文件

## 组件架构

### 主要组件
- **PopupContainer**: 主容器组件，管理状态和数据流
- **OptionsContainer**: 选项容器组件，管理用户配置和设置
- **Header**: 头部组件，显示插件标题和页面信息
- **TabNavigation**: 标签导航组件，支持动态标签显示
- **ContentArea**: 内容区域组件，根据标签类型渲染内容
- **MessageDisplay**: 消息显示组件，支持多种消息类型
- **LoadingIndicator**: 加载指示器组件，显示加载状态
- **DataDownloadInput**: 数据下载输入组件，解析下载链接
- **UnsupportedPage**: 不支持页面组件，显示友好提示
- **UserGuide**: 用户引导组件，新手使用指南

### 标签页组件
- **CLICommandTab**: CLI命令标签页 - 生成和显示aihc CLI命令
- **CommandScriptTab**: 启动命令标签页 - 生成可执行的启动脚本
- **JSONParamsTab**: JSON参数标签页 - 导出JSON格式的参数配置
- **YAMLParamsTab**: YAML参数标签页 - 导出YAML格式的参数配置
- **APIDocsTab**: API文档标签页 - 显示相关API文档链接
- **ChatTab**: AI聊天标签页 - 集成AI对话功能，支持技术咨询

## API接口

### Chrome Extension API
- `chrome.storage`: 数据存储
- `chrome.tabs`: 标签页操作
- `chrome.runtime`: 消息通信
- `chrome.sidePanel`: 侧边栏管理

### 消息通信
扩展使用消息传递机制在不同脚本间通信：
- Background Script ↔ Popup
- Background Script ↔ Content Script
- Content Script ↔ Popup

## 样式系统

### 设计原则
- 响应式设计，适配不同屏幕尺寸
- 一致的色彩系统和间距规范
- 平滑的过渡动画和交互反馈
- 支持深色模式（可选）

### 色彩系统
- 主色调：#4285f4（Google蓝）
- 成功色：#10b981（绿色）
- 警告色：#f59e0b（橙色）
- 错误色：#ef4444（红色）

## 调试和问题排查

### 开发者工具
1. 打开Chrome开发者工具
2. 切换到"扩展程序"标签页
3. 查看Background页面和Popup页面的控制台日志

### 常见问题
1. **扩展无法加载**: 检查manifest.json文件和构建产物
2. **页面检测失败**: 确认URL模式匹配逻辑
3. **API调用失败**: 检查网络连接和API凭证配置
4. **样式显示异常**: 检查CSS文件路径和样式优先级

## 性能优化

### 已实现的优化
- 组件懒加载和代码分割
- 防抖和节流处理用户输入
- 缓存机制减少重复API调用
- CSS优化和动画性能

### 建议的优化
- 使用React.memo优化组件渲染
- 实现虚拟滚动处理大量数据
- 添加Service Worker缓存策略

## 贡献指南

### 开发流程
1. Fork项目仓库
2. 创建特性分支
3. 提交代码更改
4. 创建Pull Request

### 代码规范
- 使用TypeScript严格模式
- 遵循ESLint和Prettier配置
- 编写单元测试覆盖核心功能
- 添加适当的代码注释

## 许可证

MIT License

## 更新日志

### v0.5.0 (当前版本)

#### 🎉 主要功能
- **完全重写为React架构** - 基于React 18和TypeScript 5.7
- **16种页面类型支持** - 覆盖AIHC控制台的主要功能页面
- **AI聊天集成** - 内置AI对话功能，支持技术咨询
- **数据下载工具** - 智能解析数据集和模型下载链接
- **多格式导出** - 支持JSON、YAML、TXT格式的参数导出

#### 🔧 技术改进
- **现代化构建工具** - 使用Vite 6.2进行快速构建
- **Chrome Extension Manifest V3** - 支持最新的扩展API
- **完整的TypeScript支持** - 类型安全和更好的开发体验
- **组件化架构** - 可维护的React组件设计
- **GitHub Actions集成** - 自动化构建和发布流程

#### 🎨 用户体验
- **响应式设计** - 适配不同屏幕尺寸
- **流畅动画** - 平滑的过渡效果和交互反馈
- **智能页面检测** - 自动识别页面类型并显示相关功能
- **一键复制功能** - 带视觉反馈的剪贴板操作
- **用户引导系统** - 新手友好的使用指南

#### 📦 开发工具
- **完整的npm脚本** - 开发、构建、测试、发布一体化
- **调试工具** - 内置调试脚本和错误处理
- **图标生成** - 自动化图标处理和复制
- **发布自动化** - GitHub Actions自动发布流程
