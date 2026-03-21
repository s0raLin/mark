import { useCallback } from "react";
import { FileNode, FileSystemAPI } from "@/src/types/filesystem";
import {
  ensureMarkdownExtension,
  generateId,
} from "../utils/editorHelpers";

/**
 * useFileOperations Hook 参数接口
 */
interface UseFileOperationsProps {
  /** 所有文件/文件夹节点列表 */
  nodes: FileNode[];
  /** 文件ID到内容的映射 */
  fileContents: Record<string, string>;
  /** 已置顶的文件/文件夹ID列表 */
  pinnedIds: string[];
  /** 根目录中节点的显示顺序 */
  explorerOrder: string[];
  /** 每个文件夹内节点的显示顺序 */
  folderOrder: Record<string, string[]>;
  /** 当前活动的文件ID */
  activeFileId: string;
  /** 已展开的文件夹ID集合 */
  expandedFolders: Set<string>;
  /** 设置节点列表 */
  setNodes: React.Dispatch<React.SetStateAction<FileNode[]>>;
  /** 设置文件内容 */
  setFileContents: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** 设置置顶ID列表 */
  setPinnedIds: React.Dispatch<React.SetStateAction<string[]>>;
  /** 设置根目录顺序 */
  setExplorerOrder: React.Dispatch<React.SetStateAction<string[]>>;
  /** 设置文件夹顺序 */
  setFolderOrder: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  /** 设置展开的文件夹集合 */
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
}

/**
 * useFileOperations Hook 返回值接口
 */
export interface UseFileOperationsReturn {
  /** 打开文件 - 加载文件内容到编辑器 */
  openFile: (id: string) => void;
  /** 创建新文件 */
  createFile: (
    name: string,
    parentId?: string | null,
    opts?: { open?: boolean; initialContent?: string },
  ) => string;
  /** 创建新文件夹 */
  createFolder: (name: string, parentId?: string | null) => string;
  /** 删除节点（递归删除子节点） */
  deleteNode: (id: string) => void;
  /** 重命名节点 */
  renameNode: (id: string, newName: string) => void;
  /** 切换置顶状态 */
  togglePin: (id: string) => void;
  /** 切换文件夹展开/折叠状态 */
  toggleFolder: (id: string) => void;
  /** 调整置顶列表中的顺序 */
  reorderPinned: (fromIndex: number, toIndex: number) => void;
  /** 调整根目录列表中的顺序 */
  reorderExplorer: (fromIndex: number, toIndex: number) => void;
  /** 移动节点到新父节点 */
  moveNode: (
    id: string,
    newParentId: string | null,
    insertBeforeId: string | null,
  ) => void;
  /** 根据ID查找节点 */
  getNode: (id: string) => FileNode | undefined;
  /** 获取根目录节点列表（已排序） */
  getRootNodes: () => FileNode[];
  /** 获取指定文件夹的子节点列表（已排序） */
  getChildren: (parentId: string) => FileNode[];
  /** 完整的文件系统API对象 */
  fs: FileSystemAPI;
}

/**
 * 文件操作Hook
 * 提供所有文件/文件夹的CRUD操作
 * 
 * @param props - 依赖的文件系统状态和setter函数
 * @returns 包含所有文件操作函数的对象
 */
export function useFileOperations({
  nodes,
  fileContents,
  pinnedIds,
  explorerOrder,
  folderOrder,
  activeFileId,
  expandedFolders,
  setNodes,
  setFileContents,
  setPinnedIds,
  setExplorerOrder,
  setFolderOrder,
  setExpandedFolders,
}: UseFileOperationsProps): UseFileOperationsReturn {

  /**
   * 打开文件
   * 将指定ID的文件内容加载到编辑器中
   * 实际markdown更新由父组件处理
   * 
   * @param id - 要打开的文件ID
   */
  const openFile = useCallback(
    (id: string) => {
      setFileContents((prev) => {
        return prev;
      });
    },
    [setFileContents],
  );

  /**
   * 创建新文件
   * 在指定父目录下创建新文件，可选择立即打开
   * 
   * @param name - 文件名
   * @param parentId - 父文件夹ID（null表示根目录）
   * @param opts.open - 是否立即打开文件
   * @param opts.initialContent - 文件初始内容
   * @returns 新创建文件的ID
   */
  const createFile = useCallback(
    (
      name: string,
      parentId: string | null = null,
      opts?: { open?: boolean; initialContent?: string },
    ): string => {
      // 生成唯一ID
      const id = generateId();
      // 确保文件名以.md结尾
      const fileName = ensureMarkdownExtension(name);

      // 创建文件节点
      const node: FileNode = {
        id,
        name: fileName,
        type: "file",
        parentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      // 生成文件内容
      const content =
        opts?.initialContent ??
        `# ${fileName.replace(/\.md$/, "")}\n\n`;

      // 更新节点列表
      setNodes((prev) => [...prev, node]);
      // 更新文件内容映射
      setFileContents((prev) => ({ ...prev, [id]: content }));

      // 更新显示顺序
      if (parentId === null) {
        // 根目录文件
        setExplorerOrder((prev) => [...prev, id]);
      } else {
        // 文件夹内文件
        setFolderOrder((prev) => ({
          ...prev,
          [parentId]: [...(prev[parentId] ?? []), id],
        }));
      }

      return id;
    },
    [setNodes, setFileContents, setExplorerOrder, setFolderOrder],
  );

  /**
   * 创建新文件夹
   * 在指定父目录下创建新文件夹，新创建的文件夹自动展开
   * 
   * @param name - 文件夹名
   * @param parentId - 父文件夹ID（null表示根目录）
   * @returns 新创建文件夹的ID
   */
  const createFolder = useCallback(
    (name: string, parentId: string | null = null): string => {
      const id = generateId();

      // 创建文件夹节点
      setNodes((prev) => [
        ...prev,
        {
          id,
          name,
          type: "folder",
          parentId,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        },
      ]);

      // 新文件夹自动展开
      setExpandedFolders((prev) => new Set([...prev, id]));

      // 更新显示顺序
      if (parentId === null) {
        setExplorerOrder((prev) => [...prev, id]);
      } else {
        setFolderOrder((prev) => ({
          ...prev,
          [parentId]: [...(prev[parentId] ?? []), id],
        }));
      }

      return id;
    },
    [setNodes, setExpandedFolders, setExplorerOrder, setFolderOrder],
  );

  /**
   * 删除节点
   * 递归删除指定节点及其所有子节点
   * 同时清理相关的文件内容、置顶ID、排序记录
   * 
   * @param id - 要删除的节点ID
   */
  const deleteNode = useCallback(
    (id: string) => {
      // 收集要删除的所有节点ID（包括子节点）
      const toDelete = new Set<string>();
      const collect = (nodeId: string) => {
        toDelete.add(nodeId);
        nodes
          .filter((n) => n.parentId === nodeId)
          .forEach((n) => collect(n.id));
      };
      collect(id);

      // 删除节点
      setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));

      // 删除相关文件内容
      setFileContents((prev) => {
        const next = { ...prev };
        for (const d of toDelete) delete next[d];
        return next;
      });

      // 清理置顶ID
      setPinnedIds((prev) => prev.filter((p) => !toDelete.has(p)));

      // 清理根目录顺序
      setExplorerOrder((prev) => prev.filter((e) => !toDelete.has(e)));

      // 清理文件夹顺序
      setFolderOrder((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next))
          next[key] = next[key].filter((e) => !toDelete.has(e));
        for (const d of toDelete) delete next[d];
        return next;
      });
    },
    [nodes, setNodes, setFileContents, setPinnedIds, setExplorerOrder, setFolderOrder],
  );

  /**
   * 重命名节点
   * 文件会自动添加.md扩展名，文件夹保持原名
   * 
   * @param id - 要重命名的节点ID
   * @param newName - 新名称
   */
  const renameNode = useCallback(
    (id: string, newName: string) => {
      setNodes((prev) =>
        prev.map((n) =>
          n.id === id
            ? {
              ...n,
              name:
                n.type === "file" ? ensureMarkdownExtension(newName) : newName,
              updatedAt: Date.now(),
            }
            : n,
        ),
      );
    },
    [setNodes],
  );

  /**
   * 切换置顶状态
   * 如果已置顶则取消置顶，否则添加到置顶列表
   * 
   * @param id - 要切换置顶状态的节点ID
   */
  const togglePin = useCallback(
    (id: string) => {
      setPinnedIds((prev) =>
        prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id],
      );
    },
    [setPinnedIds],
  );

  /**
   * 切换文件夹展开/折叠状态
   * 
   * @param id - 要切换的文件夹ID
   */
  const toggleFolder = useCallback(
    (id: string) => {
      setExpandedFolders((prev) => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    },
    [setExpandedFolders],
  );

  /**
   * 调整置顶列表中的顺序
   * 
   * @param fromIndex - 起始索引
   * @param toIndex - 目标索引
   */
  const reorderPinned = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPinnedIds((prev) => {
        const next = [...prev];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return next;
      });
    },
    [setPinnedIds],
  );

  /**
   * 调整根目录列表中的顺序
   * 
   * @param fromIndex - 起始索引
   * @param toIndex - 目标索引
   */
  const reorderExplorer = useCallback(
    (fromIndex: number, toIndex: number) => {
      setExplorerOrder((prev) => {
        const next = [...prev];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return next;
      });
    },
    [setExplorerOrder],
  );

  /**
   * 移动节点到新父节点
   * 可以将节点移动到根目录或某个文件夹内
   * 
   * @param id - 要移动的节点ID
   * @param newParentId - 新父节点ID（null表示根目录）
   * @param insertBeforeId - 插入到指定ID之前（null表示追加到末尾）
   */
  const moveNode = useCallback(
    (id: string, newParentId: string | null, insertBeforeId: string | null) => {
      // 更新节点的父ID
      setNodes((prev) =>
        prev.map((n) => (n.id === id ? { ...n, parentId: newParentId } : n)),
      );

      // 从原位置移除
      setExplorerOrder((prev) => prev.filter((e) => e !== id));
      setFolderOrder((prev) => {
        const next: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(prev))
          next[k] = v.filter((e) => e !== id);
        return next;
      });

      if (newParentId === null) {
        // 移动到根目录
        setExplorerOrder((prev) => {
          const next = prev.filter((e) => e !== id);
          if (insertBeforeId) {
            const idx = next.indexOf(insertBeforeId);
            if (idx >= 0) {
              next.splice(idx, 0, id);
              return next;
            }
          }
          return [...next, id];
        });
      } else {
        // 移动到文件夹内
        setFolderOrder((prev) => {
          const list = (prev[newParentId] ?? []).filter((e) => e !== id);
          if (insertBeforeId) {
            const idx = list.indexOf(insertBeforeId);
            if (idx >= 0) list.splice(idx, 0, id);
            else list.push(id);
          } else list.push(id);
          return { ...prev, [newParentId]: list };
        });
        // 确保目标文件夹展开
        setExpandedFolders((prev) => new Set([...prev, newParentId]));
      }
    },
    [setNodes, setExplorerOrder, setFolderOrder, setExpandedFolders],
  );

  /**
   * 根据ID查找节点
   * 
   * @param id - 节点ID
   * @returns 找到的节点或undefined
   */
  const getNode = useCallback(
    (id: string) => nodes.find((n) => n.id === id),
    [nodes],
  );

  /**
   * 获取根目录节点列表
   * 按照explorerOrder排序，排除置顶节点
   * 
   * @returns 排序后的根节点列表
   */
  const getRootNodes = useCallback((): FileNode[] => {
    const rootNodes = nodes.filter(
      (n) => n.parentId === null && !pinnedIds.includes(n.id),
    );
    const ordered: FileNode[] = [];
    const seen = new Set<string>();
    // 按照explorerOrder顺序添加
    for (const id of explorerOrder) {
      const node = rootNodes.find((n) => n.id === id);
      if (node) {
        ordered.push(node);
        seen.add(id);
      }
    }
    // 添加剩余未排序的节点
    for (const node of rootNodes) if (!seen.has(node.id)) ordered.push(node);
    return ordered;
  }, [nodes, explorerOrder, pinnedIds]);

  /**
   * 获取指定文件夹的子节点列表
   * 按照folderOrder排序
   * 
   * @param parentId - 父文件夹ID
   * @returns 排序后的子节点列表
   */
  const getChildren = useCallback(
    (parentId: string): FileNode[] => {
      const children = nodes.filter((n) => n.parentId === parentId);
      const order = folderOrder[parentId] ?? [];
      const ordered: FileNode[] = [];
      const seen = new Set<string>();
      // 按照folderOrder顺序添加
      for (const id of order) {
        const node = children.find((n) => n.id === id);
        if (node) {
          ordered.push(node);
          seen.add(id);
        }
      }
      // 添加剩余未排序的节点
      for (const node of children) if (!seen.has(node.id)) ordered.push(node);
      return ordered;
    },
    [nodes, folderOrder],
  );

  // ===== 构建FileSystemAPI对象 =====

  /** 计算置顶节点列表 */
  const pinnedNodes: FileNode[] = nodes.filter((n) => pinnedIds.includes(n.id));

  /** 完整的文件系统API，供Sidebar等组件使用 */
  const fs: FileSystemAPI = {
    nodes,
    activeFileId,
    pinnedIds,
    pinnedFiles: pinnedNodes,
    pinnedNodes,
    expandedFolders,
    openFile,
    createFile: (name: string, parentId?: string | null, opts?: { open?: boolean; initialContent?: string }) =>
      createFile(name, parentId ?? null, opts),
    createFolder: (name: string, parentId?: string | null) =>
      createFolder(name, parentId ?? null),
    deleteNode,
    renameNode,
    togglePin,
    toggleFolder,
    reorderPinned,
    reorderExplorer,
    moveNode,
    getNode,
    getRootNodes,
    getChildren,
  };

  return {
    openFile,
    createFile,
    createFolder,
    deleteNode,
    renameNode,
    togglePin,
    toggleFolder,
    reorderPinned,
    reorderExplorer,
    moveNode,
    getNode,
    getRootNodes,
    getChildren,
    fs,
  };
}
