# StudioMark ✨

<p align="center">
  <img src="https://img.shields.io/badge/React-19.0.0-61DAFB?style=flat&logo=react" alt="React">
  <img src="https://img.shields.io/badge/TypeScript-5.8.2-3178C6?style=flat&logo=typescript" alt="TypeScript">
  <img src="https://img.shields.io/badge/Go-1.21-00ADD8?style=flat&logo=go" alt="Go">
  <img src="https://img.shields.io/badge/Vite-6.2.0-646CFF?style=flat&logo=vite" alt="Vite">
  <img src="https://img.shields.io/badge/TailwindCSS-4.1.14-06B6D4?style=flat&logo=tailwind-css" alt="Tailwind CSS">
</p>

<p align="center">
  <strong>StudioMark</strong> — 一个现代化、可爱风格的 Markdown 编辑器，支持实时预览、自动同步和自定义主题。
</p>

<p align="center">
  <img src="https://raw.githubusercontent.com/StudioMark/studiomark/main/public/favicon.svg" width="128" height="128" alt="StudioMark Logo">
</p>

---

## 📺 演示

![StudioMark Editor](https://via.placeholder.com/800x450/f8fafc/e2e8f0?text=StudioMark+Editor+Demo)

---

## ✨ 特性

### 编辑功能
- 📝 **实时预览** - 双栏实时渲染，所见即所得
- 🎨 **语法高亮** - 支持 Markdown 源码语法高亮
- 🖥️ **多视图模式** - 支持分屏、仅编辑器和仅预览三种模式
- ⌨️ **键盘快捷键** - 高效编辑，支持自定义快捷键

### 主题定制
- 🎭 **编辑器主题** - 支持 One Dark、Dracula、GitHub、Nord、Sublime、VS Code 等多种主题
- 🖼️ **预览主题** - 多种预览样式可选
- 🎪 **自定义强调色** - 自由选择您喜欢的强调色
- ✨ **粒子特效** - 开启可爱的闪光粒子效果
- 🔤 **自定义字体** - 支持上传自定义字体

### 文件管理
- 📁 **文件树** - 侧边栏显示文件结构
- 📄 **文件操作** - 支持新建、重命名、移动、删除文件
- 🔍 **全文搜索** - 快速搜索文件内容

### 导出功能
- 📄 **导出为 PDF** - 生成精美的 PDF 文档
- 🌐 **导出为 HTML** - 生成独立的 HTML 页面
- 🖼️ **导出为 PNG** - 将 Markdown 渲染为图片
- 📦 **导出为 ZIP** - 打包所有资源

---

## 🛠️ 技术栈

### 前端
- **React 19** - UI 框架
- **TypeScript 5.8** - 类型安全
- **Vite 6** - 快速构建工具
- **Tailwind CSS 4** - 原子化 CSS 框架
- **CodeMirror 6** - 代码编辑器
- **React Markdown** - Markdown 渲染
- **Motion** - 动画库
- **Lucide React** - 图标库

### 后端
- **Go 1.21** - 后端语言
- **Gin** - Web 框架
- **REST API** - 前后端分离架构

### 桌面端
- **Electron 41** - 跨平台桌面应用框架
- **自定义标题栏** - 自研窗口控制组件（最小化、最大化、关闭），无原生菜单栏

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
```

---

## 📁 项目结构

```
studiomark/
├── public/                 # 静态资源
│   └── uploads/           # 上传的图片
├── server/                # Go 后端
│   ├── cmd/server/        # 入口文件
│   ├── internal/          # 内部包
│   │   ├── handler/      # HTTP 处理器
│   │   ├── model/         # 数据模型
│   │   └── repository/   # 数据仓库
│   └── public/           # 静态文件服务
├── src/                   # React 前端
│   ├── api/              # API 客户端
│   ├── components/       # React 组件
│   │   ├── Modals/       # 模态框组件
│   │   ├── Sidebar/      # 侧边栏组件
│   │   └── MainContent/  # 主内容区组件
│   ├── constants/        # 常量定义
│   ├── hooks/            # 自定义 Hooks
│   ├── router/           # 路由配置
│   ├── types/            # TypeScript 类型
│   ├── utils/            # 工具函数
│   └── views/            # 页面视图
├── index.html            # HTML 入口
├── package.json          # 前端依赖
├── vite.config.ts        # Vite 配置
└── tsconfig.json         # TypeScript 配置
```

---

## 🔧 配置

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

## 📋 API 端点

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

---

