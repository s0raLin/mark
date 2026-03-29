# 架构说明

## 目标

NoteMark 当前处于桌面端双运行时过渡阶段：

- `Tauri`：新架构，使用 Rust 后端和 `invoke` IPC。
- `Electron + Go`：旧架构，前端通过本地 `/api` 代理访问 Go 服务。

前端资源客户端会优先检测 Tauri 运行时；如果当前不是 Tauri，则自动回退到 Electron 的本地 HTTP 服务。这样可以在迁移过程中保持应用可运行。

## 总体分层

### 前端

- `src/api/client`
  资源化客户端层。
  负责把“用户设置 / 编辑器配置 / 文件树 / 文件内容 / 搜索”映射成统一调用接口。
- `src/contexts`
  前端状态层。
  负责页面内状态同步、自动保存、通知展示、文件树交互。
- `src/components`
  纯 UI 和交互组件。
- `src/views`
  页面装配层。

### 后端

- `src-tauri/src/commands`
  Tauri 命令入口层。
  这里的函数命名采用接近 REST 资源的风格，例如 `users_get_settings`、`files_update_content`。
- `src-tauri/src/repository`
  Rust 存储仓储层。
  负责文件系统扫描、配置保存、文件读写、搜索等。
- `server/internal/handler`
  Electron 旧链路的 Go HTTP 处理层。

## 资源边界

为了让接口组织更清晰，前后端都按资源分组：

- `users`
  完整用户设置的读取和整体更新。
- `editorConfig`
  编辑器配置。
- `fileSystem`
  文件树结构与顺序。
- `files`
  文件内容、文件创建、文件夹创建、节点移动、节点重命名、节点删除。
- `search`
  文件搜索。

## 前端运行时适配

核心适配逻辑位于 `src/api/client/utils/index.ts`：

1. 如果检测到 `window.__TAURI__.core.invoke`，走 Tauri IPC。
2. 如果没有检测到 Tauri，则使用 Electron 本地服务 `/api`。

这层适配的意义是：

- 业务代码不直接关心运行时。
- 资源客户端保持统一。
- 迁移到纯 Tauri 时，可以只删除 Electron 回退实现，而不用大规模改页面逻辑。

## 状态层职责

### `StorageContext`

- 负责初始加载用户设置。
- 负责文件树和编辑器配置的防抖保存。
- 不直接管理文件树交互细节。

### `FileSystemContext`

- 负责文件树状态与文件相关动作。
- 同时暴露 `FileSystemAPI`，供侧边栏、搜索、编辑器等直接消费。
- 负责把后端返回的 `StorageFileSystem` 归一化为前端 `FileNode[]`。

### `MarkdownSyncContext`

- 负责当前活动文件的内容读取和保存。
- 带有简单缓存，避免频繁切文件时重复加载。

### `EditorStateContext`

- 负责纯 UI 态，如视图模式、保存状态、上次保存时间。

### `ErrorContext`

- 负责用户可见通知。
- 原始异常通过 `errorBus` 上报，再转换为友好的通知内容。

## 数据流示例

### 打开应用

1. `StorageContext` 调用 `getUserSettings()`
2. 资源客户端判断当前是 Tauri 还是 Electron
3. 获取完整用户设置
4. `FileSystemContext` 根据 `fileSystem` 初始化文件树
5. `EditorThemeProvider` 根据 `editorConfig` 初始化主题配置

### 编辑文件

1. `MarkdownSyncContext` 监听活动文件变化
2. 读取文件内容并写入本地状态
3. 用户编辑时触发 `updateFileContent()`
4. 后端写盘
5. `StorageContext` 继续负责文件树元数据和配置的节流保存

### 文件树操作

1. `FileSystemContext` 调用资源客户端方法，例如 `createFileResource()`
2. 后端完成操作后返回最新文件树快照
3. `FileSystemContext` 用 `applyStorageFileSystem()` 统一落地

## 迁移方向

长期目标是纯 Tauri 架构：

- 删除 Electron 主进程和 Go HTTP 服务
- 删除前端 HTTP 回退
- 上传等剩余 HTTP 功能迁移到 Tauri command

在此之前，双运行时兼容层是稳定过渡方案。
