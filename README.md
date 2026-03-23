# NoteMark ✨

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=flat&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Go-1.21-00ADD8?style=flat&logo=go" alt="Go">
  <img src="https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/Electron-41.0.3-47848F?style=flat&logo=electron" alt="Electron">
  <img src="https://img.shields.io/badge/TailwindCSS-4.1.14-06B6D4?style=flat&logo=tailwind-css" alt="Tailwind CSS">
</p>

<p align="center">
  <strong>NoteMark</strong> — 一个现代化、可爱风格的 Markdown 编辑器，支持实时预览、自动同步和自定义主题。
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/notemark/notemark/main/public/favicon.svg" width="128" height="128" alt="notemark Logo">
</p>

---

## 📺 演示

![NoteMark Editor](https://via.placeholder.com/800x450/f8fafc/e2e8f0?text=notemark+Editor+Demo)

---

## ✨ 特性

### 🎯 核心功能
- 📝 **实时预览** - 双栏实时渲染，所见即所得
- 🎨 **语法高亮** - 支持 Markdown 源码语法高亮
- 🖥️ **多视图模式** - 支持分屏、仅编辑器和仅预览三种模式
- ⌨️ **键盘快捷键** - 高效编辑，支持自定义快捷键

### 🎨 主题定制
- 🎭 **编辑器主题** - 支持 One Dark、Dracula、GitHub、Nord、Sublime、VS Code 等多种主题
- 🖼️ **预览主题** - 多种预览样式可选
- 🎪 **自定义强调色** - 自由选择您喜欢的强调色
- ✨ **粒子特效** - 开启可爱的闪光粒子效果
- 🔤 **自定义字体** - 支持上传自定义字体

### 📁 文件管理
- 🌲 **文件树** - 侧边栏显示文件结构
- 📄 **文件操作** - 支持新建、重命名、移动、删除文件
- 🔍 **全文搜索** - 快速搜索文件内容
- 📌 **固定文件** - 支持将常用文件固定到顶部

### 📤 导出功能
- 📄 **导出为 PDF** - 生成精美的 PDF 文档
- 🌐 **导出为 HTML** - 生成独立的 HTML 页面
- 🖼️ **导出为 PNG** - 将 Markdown 渲染为图片
- 📦 **导出为 ZIP** - 打包所有资源

### 🖥️ 桌面应用
- 🚀 **Electron 桌面端** - 跨平台桌面应用
- 🎯 **自定义标题栏** - 自研窗口控制组件（最小化、最大化、关闭），无原生菜单栏
- 💾 **本地数据存储** - 数据保存在本地，支持用户数据管理

---

## 🛠️ 技术栈

### 前端
| 技术 | 版本 | 用途 |
|------|------|------|
| React | 19.0.0 | UI 框架 |
| TypeScript | 5.8.2 | 类型安全 |
| Vite | 6.2.0 | 快速构建工具 |
| Tailwind CSS | 4.1.14 | 原子化 CSS 框架 |
| CodeMirror | 6.x | 代码编辑器 |
| React Markdown | 10.1.0 | Markdown 渲染 |
| Motion | 12.x | 动画库 |
| Lucide React | 0.546.0 | 图标库 |

### 后端
| 技术 | 版本 | 用途 |
|------|------|------|
| Go | 1.21 | 后端语言 |
| Gin | - | Web 框架 |
| REST API | - | 前后端分离架构 |

### 桌面端
| 技术 | 版本 | 用途 |
|------|------|------|
| Electron | 41.0.3 | 跨平台桌面应用框架 |
| electron-builder | 26.8.1 | 应用打包工具 |

---

## 🚀 快速开始

### 前置要求

- Node.js 18+
- pnpm 8+ (推荐) 或 npm/yarn
- Go 1.21+

### 安装依赖

```bash
# 安装前端依赖
pnpm install

# 或者使用 npm
npm install
```

### 启动开发服务器

```bash
# 启动前端开发服务器
pnpm dev
```

前端默认运行在 http://localhost:5173

### 启动 Electron 桌面应用

```bash
# 使用 Electron 启动应用（同时启动前后端服务）
node index.ts
```

Electron 应用会：
1. 启动 Go 后端服务器（默认端口 8080）
2. 启动前端开发服务器（默认端口 5173）
3. 打开桌面窗口，使用自定义标题栏（无原生菜单栏）

### 启动后端服务器

```bash
# 进入 server 目录
cd server

# 启动 Go 服务器 (默认端口 8080)
go run cmd/server/main.go
```

或者直接运行编译好的二进制文件：

```bash
./server/cmd/server/server
```

### 构建生产版本

```bash
# 构建前端
pnpm build

# 构建 Electron 应用
pnpm build:electron

# 完整打包（包含后端）
pnpm dist

# 打包特定平台
pnpm dist:win    # Windows
pnpm dist:mac    # macOS
pnpm dist:linux  # Linux
```

---

## 📁 项目结构

```
notemark/
├── .env.example          # 环境变量示例
├── .gitignore            # Git 忽略配置
├── index.html            # HTML 入口
├── index.ts              # Electron 主进程入口
├── package.json          # 前端依赖配置
├── pnpm-lock.yaml        # pnpm 锁文件
├── vite.config.ts        # Vite 配置
├── tsconfig.json         # TypeScript 配置
├── tsconfig.electron.json # Electron TypeScript 配置
│
├── public/               # 静态资源
│   └── favicon.svg       # 应用图标
│
├── server/               # Go 后端
│   ├── cmd/
│   │   └── server/
│   │       ├── main.go   # 后端入口
│   │       └── server    # 编译后的二进制文件
│   │
│   ├── internal/         # 内部包
│   │   ├── handler/      # HTTP 处理器
│   │   │   ├── user.go   # 用户数据处理
│   │   │   ├── file.go   # 文件操作处理
│   │   │   └── upload.go # 上传处理
│   │   │
│   │   ├── model/        # 数据模型
│   │   │   └── types.go  # 类型定义
│   │   │
│   │   ├── service/      # 业务逻辑
│   │   │   └── storage.go
│   │   │
│   │   └── repository/   # 数据仓库
│   │       └── storage.go # 存储实现
│   │
│   ├── data/             # 运行数据目录
│   │   ├── userdata.json # 用户数据
│   │   └── files/        # 用户文件
│   │
│   ├── go.mod            # Go 依赖
│   └── go.sum            # Go 锁文件
│
├── src/                  # React 前端
│   ├── main.tsx          # 前端入口
│   ├── App.tsx           # 根组件
│   ├── index.css         # 全局样式
│   │
│   ├── api/              # API 客户端
│   │   ├── client.ts     # Axios 实例
│   │   ├── index.ts      # API 导出
│   │   └── types.ts      # API 类型
│   │
│   ├── components/       # React 组件
│   │   ├── ErrorToast/   # 错误提示
│   │   ├── Footer/       # 底部组件
│   │   ├── Header/       # 头部组件
│   │   ├── WindowControls/ # 窗口控制
│   │   │
│   │   ├── MainContent/  # 主内容区
│   │   │   ├── MainContent.tsx
│   │   │   ├── Outline/  # 大纲组件
│   │   │   ├── Pane/     # 编辑/预览面板
│   │   │   └── Toolbar/  # 工具栏
│   │   │
│   │   ├── Modals/       # 模态框
│   │   │   ├── ExportModal/    # 导出模态框
│   │   │   ├── LauncherModal/  # 启动器模态框
│   │   │   ├── SaveAsModal/    # 另存为模态框
│   │   │   ├── SearchModal/    # 搜索模态框
│   │   │   ├── SettingsModal/  # 设置模态框
│   │   │   │   ├── SettingAccount/   # 账户设置
│   │   │   │   ├── SettingEditor/    # 编辑器设置
│   │   │   │   ├── SettingExport/    # 导出设置
│   │   │   │   └── SettingGeneral/   # 通用设置
│   │   │   └── SparkleDust/    # 粒子特效
│   │   │
│   │   └── Sidebar/      # 侧边栏
│   │       ├── Sidebar.tsx
│   │       ├── SidebarItem.tsx
│   │       ├── components/     # 侧边栏子组件
│   │       │   ├── ContextMenu.tsx
│   │       │   ├── DragList.tsx
│   │       │   ├── GripHandle.tsx
│   │       │   ├── NewItemDialog.tsx
│   │       │   ├── PinnedItemRow.tsx
│   │       │   ├── RenameInput.tsx
│   │       │   └── TreeNode.tsx
│   │       └── utils/    # 侧边栏工具
│   │
│   ├── constants/        # 常量定义
│   │   ├── index.ts
│   │   └── theme.ts      # 主题常量
│   │
│   ├── contexts/         # React Context
│   │   ├── ErrorContext.tsx
│   │   └── errorBus.ts
│   │
│   ├── hooks/            # 自定义 Hooks
│   │   ├── useKeyboardShortcuts.ts
│   │   └── useModalRoute.ts
│   │
│   ├── router/           # 路由配置
│   │   └── IndexRouter.tsx
│   │
│   ├── types/            # TypeScript 类型
│   │   ├── editor.ts
│   │   ├── electron.d.ts
│   │   └── filesystem.ts
│   │
│   ├── utils/            # 工具函数
│   │   └── cn.ts         # className 合并
│   │
│   └── views/            # 页面视图
│       └── Edit/
│           ├── EditorView.tsx
│           ├── hooks/    # 编辑器相关 Hooks
│           │   ├── useEditorState.ts
│           │   ├── useEditorTheme.ts
│           │   ├── useFileOperations.ts
│           │   ├── useFileSystem.ts
│           │   ├── useMarkdownSync.ts
│           │   └── useStorageSync.ts
│           └── utils/    # 编辑器工具
│               └── editorHelpers.ts
│
└── dist-electron/        # Electron 构建输出
    └── index.js
```

---

## ⚙️ 配置

### 环境变量

可以在 `.env.example` 中查看可用的环境变量：

```bash
# 复制环境变量文件
cp .env.example .env
```

### 后端配置

| 变量 | 默认值 | 描述 |
|------|--------|------|
| `PORT` | `8080` | 服务器端口 |

---

## 📡 API 端点

### 用户数据
- `GET /api/user/data` - 获取用户数据
- `POST /api/user/data` - 保存用户数据

### 文件操作
- `GET /api/files/search` - 搜索文件
- `POST /api/files/create` - 创建文件
- `POST /api/files/mkdir` - 创建文件夹
- `POST /api/files/move` - 移动文件/文件夹
- `POST /api/files/rename` - 重命名文件/文件夹
- `GET /api/file/*fileId` - 获取文件内容
- `PUT /api/file/*fileId` - 保存文件内容
- `DELETE /api/file/*fileId` - 删除文件/文件夹

### 上传
- `POST /api/upload` - 上传图片
- `POST /api/upload-font` - 上传字体

---

## ⌨️ 键盘快捷键

| 快捷键 | 功能 |
|--------|------|
| `Ctrl+N` | 新建文件 |
| `Ctrl+S` | 保存文件 |
| `Ctrl+Shift+S` | 另存为 |
| `Ctrl+F` | 搜索 |
| `Ctrl+,` | 打开设置 |
| `Ctrl+P` | 快速打开文件 |
| `Ctrl+Shift+P` | 打开命令面板 |

---

## 🎨 主题预览

### 编辑器主题

| 主题 | 描述 |
|------|------|
| One Dark | Atom 经典的暗色主题 |
| Dracula | 流行的暗色主题 |
| GitHub | GitHub 风格主题 |
| Nord | 北欧风格主题 |
| Sublime | Sublime Text 风格 |
| VS Code | VS Code 暗色主题 |

---

## 📄 许可证

MIT License - 查看 [LICENSE](LICENSE) 了解详情。

---

## 🙏 致谢

- [CodeMirror](https://codemirror.net/) - 出色的代码编辑器
- [React Markdown](https://github.com/remarkjs/react-markdown) - Markdown 渲染
- [Tailwind CSS](https://tailwindcss.com/) - 美丽的 CSS 框架
- [Lucide](https://lucide.dev/) - 精致的图标
- [Motion](https://motion.dev/) - 强大的动画库
- [Gin](https://gin-gonic.com/) - Go Web 框架
- [Electron](https://www.electronjs.org/) - 跨平台桌面应用框架

---
