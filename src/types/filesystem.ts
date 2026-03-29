// 文件系统的核心数据类型与 API 接口。
// 前端组件只依赖这个接口，不关心数据来自内存还是后端 API。

/** 文件或文件夹节点 */
export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;  // null 表示根目录
  createdAt: number;
  updatedAt: number;
}

/** 文件系统操作接口，由 EditorView 实现并传给子组件 */
export interface FileSystemAPI {
  // ── 状态 ────────────────────────────────────────────────
  nodes: FileNode[];
  activeFileId: string;           // 当前打开的文件 id
  selectedNodeIds: Set<string>;   // 当前在侧边栏选中的节点
  trashFolderId: string | null;   // 回收站目录 id
  pinnedIds: string[];            // 已固定节点的 id 列表
  pinnedFiles: FileNode[];        // 已固定节点（兼容旧引用）
  pinnedNodes: FileNode[];        // 已固定节点
  expandedFolders: Set<string>;   // 已展开的文件夹 id 集合

  // ── 文件操作 ─────────────────────────────────────────────
  /** 打开文件，加载其内容到编辑器 */
  openFile: (id: string) => void;
  /** 用给定节点集合替换当前选择 */
  replaceNodeSelection: (ids: string[], anchorId?: string | null) => void;
  /** 切换节点选中态 */
  toggleNodeSelection: (id: string) => void;
  /** 清空当前节点选择 */
  clearNodeSelection: () => void;
  /** 判断节点当前是否被选中 */
  isNodeSelected: (id: string) => boolean;
  /** 获取回收站中的根节点 */
  getTrashNodes: () => FileNode[];
  /** 将节点移动到回收站，若已在回收站内则彻底删除 */
  deleteSelectedNodes: (ids?: string[]) => Promise<void>;
  /** 复制节点到内部剪贴板 */
  copySelectedNodes: (ids?: string[]) => void;
  /** 剪切节点到内部剪贴板 */
  cutSelectedNodes: (ids?: string[]) => void;
  /** 粘贴到目标目录，默认粘贴到当前上下文目录 */
  pasteNodes: (targetFolderId?: string | null) => Promise<void>;
  /** 当前是否存在可粘贴内容 */
  canPasteNodes: () => boolean;
  /** 新建文件，返回新节点 id */
  createFile: (
    name: string,
    parentId?: string | null,
    opts?: { open?: boolean; initialContent?: string; initialBinaryContentBase64?: string },
  ) => Promise<string>;
  /** 新建文件夹，返回新节点 id */
  createFolder: (name: string, parentId?: string | null) => Promise<string>;
  /** 清空当前工作区 */
  resetWorkspace: () => Promise<void>;
  /** 删除节点（递归删除子节点） */
  deleteNode: (id: string) => Promise<void>;
  /** 重命名节点 */
  renameNode: (id: string, newName: string) => Promise<void>;

  // ── 固定 / 展开 ──────────────────────────────────────────
  /** 切换节点的固定状态 */
  togglePin: (id: string) => void;
  /** 切换文件夹的展开/折叠状态 */
  toggleFolder: (id: string) => void;

  // ── 排序 / 移动 ──────────────────────────────────────────
  /** 调整固定列表中的顺序 */
  reorderPinned: (fromIndex: number, toIndex: number) => void;
  /** 调整根目录列表中的顺序 */
  reorderExplorer: (fromIndex: number, toIndex: number) => void;
  /** 将节点移动到新父节点下，并插入到 insertBeforeId 之前（null 表示追加到末尾） */
  moveNode: (id: string, newParentId: string | null, insertBeforeId: string | null) => Promise<void>;

  // ── 查询 ─────────────────────────────────────────────────
  /** 按 id 查找节点 */
  getNode: (id: string) => FileNode | undefined;
  /** 获取根目录节点列表（按 explorerOrder 排序） */
  getRootNodes: () => FileNode[];
  /** 获取指定文件夹的子节点列表（按 folderOrder 排序） */
  getChildren: (parentId: string) => FileNode[];
}
