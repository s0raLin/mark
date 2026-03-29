# 构建与打包文档

## 目标

本项目当前同时保留两套桌面构建链路：

- `Electron + Go`
  这是当前更完整的旧发布链路，已经配置了 `electron-builder`。
- `Tauri + Rust`
  这是新的桌面链路，当前已经可以直接构建 Linux `deb` 和 `AppImage`，并可继续通过 Tauri 配置文件扩展到更多 bundle 类型或平台。

这份文档主要说明：

- 如何做日常构建
- 如何打包 Electron 发布包
- 如何构建 Tauri 产物
- 两条链路的区别与注意事项

## 构建前准备

### 通用要求

- Node.js 18+
- pnpm 8+

### Electron 构建要求

- Go 1.21+
- 对应平台可执行的 Go 编译环境

### Tauri 构建要求

- Rust 1.77+
- Tauri 2 所需系统依赖

不同系统的 Tauri 依赖建议参考官方安装说明，例如：

- Linux 上常见需要 `webkit2gtk`、`libsoup` 等运行/开发包
- macOS 需要 Xcode Command Line Tools
- Windows 需要 MSVC Build Tools

## 构建概览

当前推荐只记住这几个命令：

```bash
pnpm build
pnpm build:electron
pnpm dist
pnpm dev:tauri
pnpm build:tauri
pnpm build:tauri:linux
```

### 前端静态资源

```bash
pnpm build
```

作用：

- 生成 `dist/`
- 供 Tauri 与 Electron 两条链路复用

### Electron 桌面构建

```bash
pnpm build:electron
```

作用：

- 构建 Electron 前端静态资源
- 生成 Electron 旧链路需要的 Go 服务二进制
- 将根目录的 `index.ts` 打包为 `dist-electron/index.cjs`

### Tauri Rust 检查

```bash
cd src-tauri
cargo check
```

### Tauri 构建

```bash
cd src-tauri
cargo tauri build
```

作用：

- 生成 Tauri 原生桌面构建产物
- 使用 `src-tauri/tauri.conf.json` 中的配置

## Electron 打包流程

### 完整构建

```bash
pnpm dist
```

该命令会依次执行：

1. `pnpm run build:electron`
2. `electron-builder`

### 按平台打包

Windows：

```bash
pnpm dist:win
```

macOS：

```bash
pnpm dist:mac
```

Linux：

```bash
pnpm dist:linux
```

### Electron 打包产物说明

主要配置在根目录 `package.json` 的 `build` 字段。

关键点：

- `dist/`
  前端静态资源
- `dist-electron/`
  Electron 主进程产物
- `server/cmd/server`
  Go 服务二进制会被复制为额外资源
- `release/`
  默认打包输出目录

### Electron 打包时的注意事项

- `pnpm dist` 依赖 Go 二进制可以成功构建
- 如果你改动了 Go 服务但没有重新构建，最终包里可能仍是旧二进制
- 当前 Electron 链路仍是正式打包脚本的主要依赖

## Tauri 构建流程

### 本地调试

```bash
pnpm dev:tauri
```

### 生产构建

```bash
pnpm build:tauri
```

### Linux 打包

默认的 Linux Tauri 配置会产出 `deb` 和 `AppImage`：

```bash
pnpm build:tauri:linux
```

### Tauri 配置位置

配置文件：

- `src-tauri/tauri.conf.json`
- `src-tauri/tauri.linux.conf.json`

关键项：

- `build.frontendDist`
  指向前端构建目录 `../dist`
- `build.devUrl`
  开发模式下前端地址
- `build.beforeDevCommand`
  Tauri 开发前自动执行的前端命令
- `build.beforeBuildCommand`
  Tauri 构建前自动执行的前端命令
- `identifier`
  应用包唯一标识，不能使用默认的 `com.tauri.dev`
- `bundle.targets`
  控制当前平台要输出哪些 bundle 类型

### Linux bundle 的当前约定

Linux 平台的 bundle 类型单独放在：

- `src-tauri/tauri.linux.conf.json`

当前内容等价于：

```json
{
  "bundle": {
    "targets": ["deb", "appimage"]
  }
}
```

这样做的好处是：

- 主配置文件保留通用设置
- Linux 打包规则独立维护
- 后续新增 Windows / macOS 配置时，可以继续添加 `tauri.windows.conf.json`、`tauri.macos.conf.json`
- 如果要做特定发布变体，也可以继续用 `cargo tauri build --config <file>` 追加配置

### 如何扩展到别的 bundle 或平台

有两种推荐方式：

1. 改平台配置文件

例如把 Linux 增加 `rpm`：

```json
{
  "bundle": {
    "targets": ["deb", "appimage", "rpm"]
  }
}
```

2. 构建时临时覆盖

```bash
cd src-tauri
cargo tauri build --bundles deb,appimage,rpm
```

或者追加一个专门的配置文件：

```bash
cd src-tauri
cargo tauri build --config ./tauri.release.conf.json
```

### Tauri 当前状态说明

虽然 Tauri 已经具备核心运行能力，并且现在已经整理出 Linux 的 `deb + AppImage` 打包流程，但仓库整体仍处于双运行时过渡阶段：

- 前端优先支持 Tauri IPC
- Electron 仍保留本地服务回退
- 上传等部分能力仍沿用 Electron / Go 风格的发布链路

因此：

- 想做发布包时，当前更推荐使用 Electron 打包链路
- 想做新架构验证或 Rust 联调时，推荐使用 Tauri 构建链路

## 推荐的构建检查顺序

在打包前建议至少执行：

```bash
pnpm exec tsc --noEmit
cd src-tauri && cargo check
go build -C server ./cmd/server
```

如果你要出 Electron 包，建议再执行：

```bash
pnpm build:electron
```

## 常见问题

### 1. `Tauri IPC is unavailable in the current runtime`

说明当前不是 Tauri 运行时。

如果你在 Electron 里启动：

- 这是预期内可兼容的
- 前端会自动回退到本地 `/api` 服务

如果 Electron 模式下仍不可用，重点检查：

- Go 服务是否成功启动
- Electron 主进程是否正确代理 `/api`

### 2. Electron 打包成功，但运行时报后端不可用

优先检查：

- Go 二进制是否已被复制到 `extraResources`
- 当前平台对应的可执行文件名是否正确
- `index.ts` 中主进程启动路径是否匹配

### 3. Tauri 构建失败

优先检查：

- 是否安装了系统依赖
- Rust 版本是否满足要求
- `pnpm build` 是否能先成功
- Linux 上是否安装了 `webkit2gtk`、`libsoup3` 等 Tauri 依赖

### 4. `tsc --noEmit` 扫到了 `src-tauri/target`

仓库已经在 `tsconfig.json` 中排除了：

- `src-tauri/target`
- `dist`
- `dist-electron`

如果你重新调整了 TypeScript 配置，请确保这些构建产物目录不要被纳入检查。

## 后续建议

如果后续决定彻底迁移到 Tauri，建议按以下顺序推进：

1. 先保证所有核心功能都能走 Tauri command
2. 再移除 Electron 运行时回退
3. 最后删除 Go 打包链路和 `electron-builder` 配置

在彻底迁移完成前，请把 Electron 与 Tauri 的构建文档都视为有效。
