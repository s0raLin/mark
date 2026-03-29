# NoteMark

一个面向桌面端的 Markdown 编辑器，支持实时预览、文件树、搜索、主题定制和本地持久化。

当前项目处于从 `Electron + Go` 向 `Tauri + Rust` 迁移的阶段，因此仓库同时保留了两条桌面运行链路。前端会自动识别当前运行时，并在 Tauri IPC 与 Electron 本地服务之间切换。

## 当前架构

- 前端：React + TypeScript + Vite
- 新桌面后端：Tauri 2 + Rust
- 旧桌面后端：Electron + Go

## 文档导航

- 架构说明：[docs/ARCHITECTURE.md](/home/cangli/Desktop/ts/notemark/docs/ARCHITECTURE.md)
- 开发文档：[docs/DEVELOPMENT.md](/home/cangli/Desktop/ts/notemark/docs/DEVELOPMENT.md)
- 构建与打包：[docs/BUILD.md](/home/cangli/Desktop/ts/notemark/docs/BUILD.md)
- 使用文档：[docs/USAGE.md](/home/cangli/Desktop/ts/notemark/docs/USAGE.md)
- 扩展文档：[docs/EXTENDING.md](/home/cangli/Desktop/ts/notemark/docs/EXTENDING.md)

## 快速开始

### 安装依赖

```bash
pnpm install
```

### Electron 开发模式

```bash
pnpm dev:electron
```

### Tauri 开发模式

```bash
pnpm dev:tauri
```

### Tauri Linux 打包

```bash
pnpm build:tauri:linux
```

### 常用检查

```bash
pnpm exec tsc --noEmit
cd src-tauri && cargo check
```

## 项目重点目录

```text
src/
  api/client/          前端资源客户端与运行时适配
  contexts/            前端状态层
  components/          UI 组件
  views/               页面装配层

src-tauri/src/
  commands/            Tauri 命令入口
  repository/          Rust 存储仓储层
  models/              Rust 数据模型

server/
  internal/handler/    Electron 旧链路的 Go HTTP 处理器
  internal/repository/ Electron 旧链路的 Go 存储层
```

## 说明

如果你在 Electron 模式下看到与 Tauri IPC 相关的日志，不代表应用一定不可用。前端已经实现运行时回退，优先尝试 Tauri；没有 Tauri 时会自动走 Electron 本地 `/api` 服务。
