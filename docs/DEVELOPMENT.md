# 开发文档

## 环境要求

- Node.js 18+
- pnpm 8+
- Go 1.21+
- Rust 1.77+ 与 Tauri 2 开发环境

如果你关注发布流程、安装包输出和平台构建差异，请同时查看：

- [docs/BUILD.md](/home/cangli/Desktop/ts/notemark/docs/BUILD.md)

## 安装依赖

```bash
pnpm install
```

## 开发模式

### 1. 前端单独启动

```bash
pnpm dev
```

适合纯页面开发，但如果页面依赖桌面能力，单独跑 Vite 可能无法完整工作。

### 2. Electron 开发模式

```bash
pnpm dev:electron
```

该模式会：

- 启动 Go 服务
- 启动前端页面
- 通过 Electron 打开桌面窗口

适合当前最稳定的完整联调方式。

### 3. Tauri 开发模式

如果本地已经配置好 Tauri 环境：

```bash
cd src-tauri
cargo tauri dev
```

前端会自动走 Tauri IPC，不会经过 `/api`。

## 常用检查

### TypeScript

```bash
pnpm exec tsc --noEmit
```

### Rust

```bash
cd src-tauri
cargo check
```

### Go

```bash
go build -C server ./cmd/server
```

## 目录关注点

### 新功能一般从哪里加

- 新资源接口：`src/api/client/resources`
- 新前端状态：`src/contexts`
- 新 Tauri 命令：`src-tauri/src/commands`
- 新 Rust 存储逻辑：`src-tauri/src/repository`
- 旧 Electron/Go 路由：`server/internal/handler`

### 注释原则

- 优先解释“为什么这样设计”，不是解释语法。
- 复杂的数据流、双运行时兼容、文件树归一化这类逻辑建议保留注释。
- 简单赋值和显然逻辑不需要注释。

## 调试建议

### 看到 `Tauri IPC is unavailable`

说明当前运行的不是 Tauri runtime，而是浏览器或 Electron。

现在前端已经支持自动回退到 Electron 本地 `/api`，如果仍报错，优先检查：

- Electron 主进程是否正常启动
- Go 服务是否已监听 `8080`
- `/api/user/data` 是否可访问

### 文件树状态异常

重点检查：

- `FileSystemContext`
- `src/contexts/utils/storageFileSystem.ts`
- Rust `StorageRepo::build_file_system`

### 保存失败

重点检查：

- `StorageContext`
- `MarkdownSyncContext`
- `src/api/client/resources/*`
- 对应 Rust command 或 Go handler

## 提交前建议

至少跑这两个检查：

```bash
pnpm exec tsc --noEmit
cd src-tauri && cargo check
```

如果改到了 Electron 旧链路，也建议补跑：

```bash
go build -C server ./cmd/server
```
