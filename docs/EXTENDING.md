# 扩展文档

## 新增一个资源接口

推荐按资源分层添加，而不是继续往一个大文件里堆逻辑。

### 前端步骤

1. 在 `src/api/client/resources/` 下新增资源文件
2. 在 `src/api/client/commands.ts` 中登记对应命令名
3. 在 `src/api/client/index.ts` 中导出
4. 在需要的 context 或组件中调用

### Tauri 后端步骤

1. 在 `src-tauri/src/commands/` 下新增模块
2. 在 `src-tauri/src/commands/mod.rs` 中导出
3. 在 `src-tauri/src/lib.rs` 中注册到 `invoke_handler`
4. 若涉及存储逻辑，在 `src-tauri/src/repository/storage.rs` 中补方法

### Electron 兼容步骤

如果当前资源需要兼容 Electron：

1. 在资源客户端里增加 `hasTauriRuntime()` 分支判断
2. 为 Electron 回退实现补 `httpGet()` / `httpSend()`
3. 若旧 Go 服务没有对应路由，补 `server/internal/handler`

## 新增一个 Context

新增之前先判断是否真的需要 context。

适合用 context 的情况：

- 多层组件都要访问
- 状态生命周期覆盖整个编辑页
- 是“领域状态”而不是局部 UI 瞬时状态

不适合用 context 的情况：

- 只在一个组件树局部使用
- 只是单个组件内部交互
- 只是一次性副作用绑定

### 当前推荐边界

- `StorageContext`
  跨资源加载与持久化
- `FileSystemContext`
  文件树领域状态与动作
- `MarkdownSyncContext`
  当前文档内容
- `EditorStateContext`
  编辑器 UI 状态
- `ErrorContext`
  全局通知

## 新增后端命令时的命名建议

尽量使用资源化命名，而不是模糊动词堆叠：

- 好：`files_get_content`
- 好：`editor_config_update`
- 好：`search_query_files`
- 一般：`do_file_stuff`
- 一般：`save_everything`

## 新增注释时的建议

建议优先写以下信息：

- 该模块负责什么，不负责什么
- 为什么这里要做兼容分支
- 为什么状态要经过归一化
- 为什么某一步需要后端返回完整快照

避免写以下低价值注释：

- “把值赋给变量”
- “这里调用了函数”
- 与代码字面意思完全重复的说明

## 未来迁移到纯 Tauri 时怎么做

如果后续决定完全移除 Electron / Go：

1. 删除 `index.ts` 和 `dist-electron` 相关构建链路
2. 删除 `server/` 目录中的旧 Go 路由
3. 删除资源客户端中的 HTTP 回退逻辑
4. 把上传等剩余 HTTP 功能迁到 Tauri command

建议按资源逐步迁移，不要一次性混改所有功能。
