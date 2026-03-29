import {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import type { StorageFileSystem } from "@/api/client";
import {
  createFileResource,
  createFolderResource,
  deleteFileNode,
  moveFileNode,
  renameFileNode,
} from "@/api/client";
import type { FileNode, FileSystemAPI } from "@/types/filesystem";
import { useStorageSyncContext } from "./StorageContext";
import { ensureFileExtension, getDefaultNodes, DEFAULT_FILE_ID } from "./utils/fileSystemUtils";
import {
  buildFileSystemState,
  reconcileExplorerOrder,
  reconcileFolderOrder,
} from "./utils/storageFileSystem";

interface FileSystemContextValue extends FileSystemAPI {
  explorerOrder: string[];
  folderOrder: Record<string, string[]>;
  setNodes: React.Dispatch<React.SetStateAction<FileNode[]>>;
  setPinnedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setExplorerOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setFolderOrder: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setActiveFileId: React.Dispatch<React.SetStateAction<string>>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  applyStorageFileSystem: (fileSystem: StorageFileSystem) => void;
}

const FileSystemContext = createContext<FileSystemContextValue | undefined>(
  undefined,
);

// 文件系统上下文同时承担两类职责：
// 1. 保存前端文件树状态
// 2. 暴露文件相关动作，屏蔽 Tauri / Electron 的运行时差异
//
// 这样页面和组件只需要依赖一个统一的 `FileSystemAPI`。
export function FileSystemProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const { userData, isInitialized } = useStorageSyncContext();
  const initialState = buildFileSystemState(userData?.fileSystem);
  const hasPersistedFileSystem = userData?.fileSystem !== undefined;

  const [nodes, setNodes] = useState<FileNode[]>(() =>
    initialState.nodes.length > 0 || hasPersistedFileSystem
      ? initialState.nodes
      : getDefaultNodes(),
  );
  const [pinnedIds, setPinnedIds] = useState<string[]>(() => initialState.pinnedIds);
  const [explorerOrder, setExplorerOrder] = useState<string[]>(() =>
    initialState.explorerOrder.length > 0
      ? initialState.explorerOrder
      : [DEFAULT_FILE_ID],
  );
  const [folderOrder, setFolderOrder] = useState<Record<string, string[]>>(
    () => initialState.folderOrder,
  );
  const [activeFileId, setActiveFileId] = useState<string>(() =>
    initialState.activeFileId || DEFAULT_FILE_ID,
  );
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const applyStorageFileSystem = useCallback((fileSystem: StorageFileSystem) => {
    // 所有文件树变更最终都应收敛到后端快照，而不是由前端自行推导最终结果。
    const nextState = buildFileSystemState(fileSystem);
    const nextNodes = nextState.nodes;

    setNodes(nextNodes);
    setPinnedIds(nextState.pinnedIds);
    setExplorerOrder(
      nextState.explorerOrder.length > 0
        ? nextState.explorerOrder
        : [],
    );
    setFolderOrder(nextState.folderOrder);
    setActiveFileId((prev) => {
      if (prev && nextNodes.some((node) => node.id === prev)) {
        return prev;
      }
      return nextState.activeFileId || "";
    });
  }, []);

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current || !isInitialized || !userData) return;
    hasInitialized.current = true;
    applyStorageFileSystem(userData.fileSystem);
  }, [applyStorageFileSystem, isInitialized, userData]);

  const nodesStructureKey = useMemo(
    () =>
      nodes
        .map((node) => `${node.id}:${node.type}:${node.parentId ?? "root"}`)
        .sort()
        .join("|"),
    [nodes],
  );

  useEffect(() => {
    setExplorerOrder((prev) => reconcileExplorerOrder(nodes, pinnedIds, prev));
  }, [nodesStructureKey, nodes, pinnedIds]);

  useEffect(() => {
    setFolderOrder((prev) => reconcileFolderOrder(nodes, prev));
  }, [nodesStructureKey, nodes]);

  const pinnedNodes = useMemo(
    () =>
      pinnedIds
        .map((id) => nodes.find((node) => node.id === id))
        .filter(Boolean) as FileNode[],
    [nodes, pinnedIds],
  );

  const openFile = useCallback(
    (id: string) => {
      setActiveFileId(id);
    },
    [],
  );

  const createFile = useCallback(
    async (
      name: string,
      parentId: string | null = null,
      opts?: { open?: boolean; initialContent?: string; initialBinaryContentBase64?: string },
    ): Promise<string> => {
      const fileName = ensureFileExtension(name);
      if (!fileName.trim()) return "";

      // 新建 Markdown 文件时自动补一个一级标题，减少空白文档出现频率。
      const baseName = fileName.replace(/\.[^.]+$/, "");
      const content =
        opts?.initialContent ??
        (fileName.endsWith(".md") ? `# ${baseName}\n\n` : "");

      const response = await createFileResource(
        parentId ?? "",
        fileName,
        opts?.initialBinaryContentBase64 ? "" : content,
        opts?.initialBinaryContentBase64,
      );
      applyStorageFileSystem(response.fileSystem);
      if (opts?.open !== false) {
        setActiveFileId(response.id);
      }
      if (parentId) {
        setExpandedFolders((prev) => new Set([...prev, parentId]));
      }
      return response.id;
    },
    [applyStorageFileSystem],
  );

  const createFolder = useCallback(
    async (name: string, parentId: string | null = null): Promise<string> => {
      if (!name.trim()) return "";
      const response = await createFolderResource(parentId ?? "", name);
      applyStorageFileSystem(response.fileSystem);
      setExpandedFolders(
        (prev) => new Set([...prev, response.id, ...(parentId ? [parentId] : [])]),
      );
      return response.id;
    },
    [applyStorageFileSystem],
  );

  const resetWorkspace = useCallback(async (): Promise<void> => {
    const rootNodeIds = nodes
      .filter((node) => node.parentId === null)
      .map((node) => node.id);

    for (const id of rootNodeIds) {
      const fileSystem = await deleteFileNode(id);
      applyStorageFileSystem(fileSystem);
    }

    setExpandedFolders(new Set());
    setActiveFileId("");
  }, [applyStorageFileSystem, nodes]);

  const deleteNode = useCallback(
    async (id: string): Promise<void> => {
      const fileSystem = await deleteFileNode(id);
      applyStorageFileSystem(fileSystem);
    },
    [applyStorageFileSystem],
  );

  const renameNode = useCallback(
    async (id: string, newName: string): Promise<void> => {
      const node = nodes.find((item) => item.id === id);
      if (!node) return;

      const finalName =
        node.type === "file" ? ensureFileExtension(newName) : newName;
      if (!finalName.trim() || finalName === node.name) return;

      const response = await renameFileNode(id, finalName);
      applyStorageFileSystem(response.fileSystem);
      if (activeFileId === id) {
        setActiveFileId(response.id);
      }
    },
    [activeFileId, applyStorageFileSystem, nodes],
  );

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, []);

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const reorderPinned = useCallback((fromIndex: number, toIndex: number) => {
    setPinnedIds((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }, []);

  const reorderExplorer = useCallback((fromIndex: number, toIndex: number) => {
    setExplorerOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }, []);

  const moveNode = useCallback(
    async (
      id: string,
      newParentId: string | null,
      insertBeforeId: string | null,
    ): Promise<void> => {
      const response = await moveFileNode(id, newParentId ?? "");
      applyStorageFileSystem(response.fileSystem);

      // 后端会返回真实快照，这里只补“目标列表中的显示顺序”。
      if (newParentId === null) {
        setExplorerOrder((prev) => {
          const next = prev.filter((item) => item !== response.id);
          if (insertBeforeId) {
            const index = next.indexOf(insertBeforeId);
            if (index >= 0) {
              next.splice(index, 0, response.id);
              return next;
            }
          }
          return [...next, response.id];
        });
      } else {
        setFolderOrder((prev) => {
          const next = { ...prev };
          const list = (next[newParentId] ?? []).filter(
            (item) => item !== response.id,
          );
          if (insertBeforeId) {
            const index = list.indexOf(insertBeforeId);
            if (index >= 0) {
              list.splice(index, 0, response.id);
            } else {
              list.push(response.id);
            }
          } else {
            list.push(response.id);
          }
          next[newParentId] = list;
          return next;
        });
        setExpandedFolders((prev) => new Set([...prev, newParentId]));
      }

      if (activeFileId === id) {
        setActiveFileId(response.id);
      }
    },
    [activeFileId, applyStorageFileSystem],
  );

  const getNode = useCallback(
    (id: string) => nodes.find((node) => node.id === id),
    [nodes],
  );

  const getRootNodes = useCallback((): FileNode[] => {
    const rootNodes = nodes.filter(
      (node) => node.parentId === null && !pinnedIds.includes(node.id),
    );
    const ordered: FileNode[] = [];
    const seen = new Set<string>();
    for (const id of explorerOrder) {
      const node = rootNodes.find((item) => item.id === id);
      if (node) {
        ordered.push(node);
        seen.add(id);
      }
    }
    for (const node of rootNodes) {
      if (!seen.has(node.id)) {
        ordered.push(node);
      }
    }
    return ordered;
  }, [explorerOrder, nodes, pinnedIds]);

  const getChildren = useCallback(
    (parentId: string): FileNode[] => {
      const children = nodes.filter((node) => node.parentId === parentId);
      const order = folderOrder[parentId] ?? [];
      const ordered: FileNode[] = [];
      const seen = new Set<string>();
      for (const id of order) {
        const node = children.find((item) => item.id === id);
        if (node) {
          ordered.push(node);
          seen.add(id);
        }
      }
      for (const node of children) {
        if (!seen.has(node.id)) {
          ordered.push(node);
        }
      }
      return ordered;
    },
    [folderOrder, nodes],
  );

  const contextValue = useMemo<FileSystemContextValue>(
    () => ({
      nodes,
      activeFileId,
      pinnedIds,
      explorerOrder,
      folderOrder,
      pinnedFiles: pinnedNodes,
      pinnedNodes,
      expandedFolders,
      openFile,
      createFile,
      createFolder,
      resetWorkspace,
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
      setNodes,
      setPinnedIds,
      setExplorerOrder,
      setFolderOrder,
      setActiveFileId,
      setExpandedFolders,
      applyStorageFileSystem,
    }),
    [
      activeFileId,
      applyStorageFileSystem,
      createFile,
      createFolder,
      resetWorkspace,
      deleteNode,
      expandedFolders,
      getChildren,
      getNode,
      getRootNodes,
      moveNode,
      nodes,
      openFile,
      explorerOrder,
      folderOrder,
      pinnedIds,
      pinnedNodes,
      renameNode,
      reorderExplorer,
      reorderPinned,
      toggleFolder,
      togglePin,
    ],
  );

  return (
    <FileSystemContext.Provider value={contextValue}>
      {children}
    </FileSystemContext.Provider>
  );
}

export function useFileSystemContext() {
  const context = useContext(FileSystemContext);
  if (!context) {
    throw new Error(
      "useFileSystemContext must be used within FileSystemProvider",
    );
  }

  return context;
}
