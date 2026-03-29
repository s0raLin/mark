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
  getFileContent,
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

const TRASH_FOLDER_NAME = "__notemark_recycle_bin__";

interface ClipboardState {
  ids: string[];
  mode: "copy" | "cut";
}

interface FileSystemContextValue extends FileSystemAPI {
  explorerOrder: string[];
  folderOrder: Record<string, string[]>;
  selectionAnchorId: string | null;
  clipboard: ClipboardState | null;
  setNodes: React.Dispatch<React.SetStateAction<FileNode[]>>;
  setPinnedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setExplorerOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setFolderOrder: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setActiveFileId: React.Dispatch<React.SetStateAction<string>>;
  setSelectedNodeIds: React.Dispatch<React.SetStateAction<Set<string>>>;
  setSelectionAnchorId: React.Dispatch<React.SetStateAction<string | null>>;
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
  const [selectedNodeIds, setSelectedNodeIds] = useState<Set<string>>(
    () => new Set(initialState.activeFileId ? [initialState.activeFileId] : []),
  );
  const [selectionAnchorId, setSelectionAnchorId] = useState<string | null>(
    () => initialState.activeFileId || null,
  );
  const [clipboard, setClipboard] = useState<ClipboardState | null>(null);
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(new Set());

  const getTrashNode = useCallback(
    () => nodes.find((node) => node.parentId === null && node.type === "folder" && node.name === TRASH_FOLDER_NAME),
    [nodes],
  );

  const trashFolderId = getTrashNode()?.id ?? null;
  const isNodeInsideTrash = useCallback((id: string) => {
    if (!trashFolderId) {
      return false;
    }

    let current = nodes.find((node) => node.id === id);
    while (current) {
      if (current.id === trashFolderId) {
        return true;
      }
      current = current.parentId
        ? nodes.find((node) => node.id === current?.parentId)
        : undefined;
    }
    return false;
  }, [nodes, trashFolderId]);

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
    setSelectedNodeIds((prev) => {
      const filtered = new Set(
        [...prev].filter((id) => nextNodes.some((node) => node.id === id)),
      );
      if (filtered.size > 0) {
        return filtered;
      }
      return new Set(nextState.activeFileId ? [nextState.activeFileId] : []);
    });
    setSelectionAnchorId((prev) => {
      if (prev && nextNodes.some((node) => node.id === prev)) {
        return prev;
      }
      return nextState.activeFileId || null;
    });
  }, []);

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current || !isInitialized || !userData) return;
    hasInitialized.current = true;
    applyStorageFileSystem(userData.fileSystem);
  }, [applyStorageFileSystem, isInitialized, userData]);

  useEffect(() => {
    if (!isInitialized) {
      return;
    }

    if (trashFolderId) {
      return;
    }

    void createFolderResource("", TRASH_FOLDER_NAME).then((response) => {
      applyStorageFileSystem(response.fileSystem);
    }).catch(() => {
      // 回收站创建失败时保持静默，避免阻断主界面。
    });
  }, [applyStorageFileSystem, isInitialized, trashFolderId]);

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

  useEffect(() => {
    setPinnedIds((prev) => prev.filter((id) => !isNodeInsideTrash(id)));
  }, [isNodeInsideTrash, nodesStructureKey]);

  const pinnedNodes = useMemo(
    () =>
      pinnedIds
        .filter((id) => id !== trashFolderId)
        .map((id) => nodes.find((node) => node.id === id))
        .filter(Boolean) as FileNode[],
    [nodes, pinnedIds, trashFolderId],
  );

  const filterTopLevelIds = useCallback((ids: string[]) => {
    const uniqueIds = ids.filter((id, index) => ids.indexOf(id) === index);
    return uniqueIds.filter((id) => {
      let current = nodes.find((node) => node.id === id);
      while (current?.parentId) {
        if (uniqueIds.includes(current.parentId)) {
          return false;
        }
        current = nodes.find((node) => node.id === current?.parentId);
      }
      return true;
    });
  }, [nodes]);

  const getSelectionIds = useCallback((ids?: string[]) => {
    const source = ids && ids.length > 0 ? ids : [...selectedNodeIds];
    return filterTopLevelIds(source.filter((id) => id !== trashFolderId));
  }, [filterTopLevelIds, selectedNodeIds, trashFolderId]);

  const openFile = useCallback(
    (id: string) => {
      setActiveFileId(id);
      setSelectedNodeIds(new Set([id]));
      setSelectionAnchorId(id);
    },
    [],
  );

  const replaceNodeSelection = useCallback(
    (ids: string[], anchorId?: string | null) => {
      const availableIds = new Set(nodes.map((node) => node.id));
      const nextIds = ids.filter((id, index, list) => availableIds.has(id) && list.indexOf(id) === index);
      setSelectedNodeIds(new Set(nextIds));
      setSelectionAnchorId(anchorId ?? nextIds.at(-1) ?? null);
    },
    [nodes],
  );

  const toggleNodeSelection = useCallback(
    (id: string) => {
      if (!nodes.some((node) => node.id === id)) {
        return;
      }

      setSelectedNodeIds((prev) => {
        const next = new Set(prev);
        if (next.has(id)) {
          next.delete(id);
        } else {
          next.add(id);
        }
        return next;
      });
      setSelectionAnchorId(id);
    },
    [nodes],
  );

  const clearNodeSelection = useCallback(() => {
    setSelectedNodeIds(new Set());
    setSelectionAnchorId(null);
  }, []);

  const isNodeSelected = useCallback(
    (id: string) => selectedNodeIds.has(id),
    [selectedNodeIds],
  );

  const buildUniqueName = useCallback((targetParentId: string | null, originalName: string) => {
    const siblingNames = new Set(
      nodes
        .filter((node) => (node.parentId ?? null) === targetParentId)
        .map((node) => node.name),
    );

    if (!siblingNames.has(originalName)) {
      return originalName;
    }

    const extensionIndex = originalName.lastIndexOf(".");
    const hasExtension = extensionIndex > 0;
    const baseName = hasExtension ? originalName.slice(0, extensionIndex) : originalName;
    const extension = hasExtension ? originalName.slice(extensionIndex) : "";

    let copyIndex = 1;
    while (true) {
      const nextName = `${baseName} copy${copyIndex > 1 ? ` ${copyIndex}` : ""}${extension}`;
      if (!siblingNames.has(nextName)) {
        return nextName;
      }
      copyIndex += 1;
    }
  }, [nodes]);

  const deleteSelectedNodes = useCallback(async (ids?: string[]) => {
    const targetIds = getSelectionIds(ids);
    if (targetIds.length === 0) {
      return;
    }

    const trashId = getTrashNode()?.id ?? null;
    if (!trashId) {
      return;
    }

    const nextSelected = new Set(selectedNodeIds);
    let nextActiveFileId = activeFileId;

    for (const id of targetIds) {
      const node = nodes.find((item) => item.id === id);
      if (!node) {
        continue;
      }

      const isInTrash = node.parentId === trashId || id === trashId;
      if (isInTrash) {
        const fileSystem = await deleteFileNode(id);
        applyStorageFileSystem(fileSystem);
      } else {
        const nextName = buildUniqueName(trashId, node.name);
        if (nextName !== node.name) {
          const renamed = await renameFileNode(id, nextName);
          applyStorageFileSystem(renamed.fileSystem);
        }
        const moved = await moveFileNode(id, trashId);
        applyStorageFileSystem(moved.fileSystem);
      }

      nextSelected.delete(id);
      if (nextActiveFileId === id) {
        nextActiveFileId = "";
      }
    }

    setSelectedNodeIds(nextSelected);
    setSelectionAnchorId(nextSelected.size > 0 ? [...nextSelected][0] : null);
    if (!nextActiveFileId) {
      setActiveFileId("");
    }
  }, [
    activeFileId,
    applyStorageFileSystem,
    buildUniqueName,
    getSelectionIds,
    getTrashNode,
    nodes,
    selectedNodeIds,
  ]);

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
        setSelectedNodeIds(new Set([response.id]));
        setSelectionAnchorId(response.id);
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
    setSelectedNodeIds(new Set());
    setSelectionAnchorId(null);
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
    if (isNodeInsideTrash(id)) {
      return;
    }

    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  }, [isNodeInsideTrash]);

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
      (node) => node.parentId === null && !pinnedIds.includes(node.id) && node.id !== trashFolderId,
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
  }, [explorerOrder, nodes, pinnedIds, trashFolderId]);

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

  const duplicateNodeRecursive = useCallback(async (
    sourceId: string,
    targetParentId: string | null,
  ): Promise<string | null> => {
    const sourceNode = nodes.find((node) => node.id === sourceId);
    if (!sourceNode) {
      return null;
    }

    const nextName = buildUniqueName(targetParentId, sourceNode.name);

    if (sourceNode.type === "folder") {
      const createdFolderId = await createFolder(nextName, targetParentId);
      const childNodes = getChildren(sourceNode.id);
      for (const child of childNodes) {
        await duplicateNodeRecursive(child.id, createdFolderId);
      }
      return createdFolderId;
    }

    const content = await getFileContent(sourceId);
    return createFile(nextName, targetParentId, {
      open: false,
      initialContent: content.kind === "text" ? content.content : "",
      initialBinaryContentBase64: content.kind === "text" ? undefined : content.contentBase64,
    });
  }, [buildUniqueName, createFile, createFolder, getChildren, nodes]);

  const resolvePasteTarget = useCallback((targetFolderId?: string | null) => {
    if (targetFolderId !== undefined) {
      return targetFolderId;
    }

    const anchorId = selectionAnchorId ?? [...selectedNodeIds][0] ?? null;
    if (!anchorId) {
      return null;
    }

    const anchorNode = nodes.find((node) => node.id === anchorId);
    if (!anchorNode) {
      return null;
    }

    return anchorNode.type === "folder" ? anchorNode.id : (anchorNode.parentId ?? null);
  }, [nodes, selectedNodeIds, selectionAnchorId]);

  const copySelectedNodes = useCallback((ids?: string[]) => {
    const nextIds = getSelectionIds(ids);
    if (nextIds.length === 0) {
      return;
    }
    setClipboard({ ids: nextIds, mode: "copy" });
  }, [getSelectionIds]);

  const cutSelectedNodes = useCallback((ids?: string[]) => {
    const nextIds = getSelectionIds(ids);
    if (nextIds.length === 0) {
      return;
    }
    setClipboard({ ids: nextIds, mode: "cut" });
  }, [getSelectionIds]);

  const pasteNodes = useCallback(async (targetFolderId?: string | null) => {
    if (!clipboard || clipboard.ids.length === 0) {
      return;
    }

    const destinationId = resolvePasteTarget(targetFolderId);
    const destinationNode = destinationId ? nodes.find((node) => node.id === destinationId) : null;
    if (destinationNode && destinationNode.type !== "folder") {
      return;
    }

    if (clipboard.mode === "cut") {
      for (const id of clipboard.ids) {
        if (id === destinationId) {
          continue;
        }
        await moveNode(id, destinationId ?? null, null);
      }
      setClipboard(null);
      return;
    }

    for (const id of clipboard.ids) {
      await duplicateNodeRecursive(id, destinationId ?? null);
    }
  }, [clipboard, duplicateNodeRecursive, moveNode, nodes, resolvePasteTarget]);

  const canPasteNodes = useCallback(() => {
    return Boolean(clipboard && clipboard.ids.length > 0);
  }, [clipboard]);

  const getTrashNodes = useCallback((): FileNode[] => {
    if (!trashFolderId) {
      return [];
    }
    return getChildren(trashFolderId);
  }, [getChildren, trashFolderId]);

  const contextValue = useMemo<FileSystemContextValue>(
    () => ({
      nodes,
      activeFileId,
      selectedNodeIds,
      trashFolderId,
      pinnedIds,
      explorerOrder,
      folderOrder,
      selectionAnchorId,
      clipboard,
      pinnedFiles: pinnedNodes,
      pinnedNodes,
      expandedFolders,
      openFile,
      replaceNodeSelection,
      toggleNodeSelection,
      clearNodeSelection,
      isNodeSelected,
      getTrashNodes,
      deleteSelectedNodes,
      copySelectedNodes,
      cutSelectedNodes,
      pasteNodes,
      canPasteNodes,
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
      setSelectedNodeIds,
      setSelectionAnchorId,
      setExpandedFolders,
      applyStorageFileSystem,
    }),
    [
      activeFileId,
      applyStorageFileSystem,
      canPasteNodes,
      clearNodeSelection,
      clipboard,
      copySelectedNodes,
      clearNodeSelection,
      createFile,
      createFolder,
      cutSelectedNodes,
      deleteSelectedNodes,
      resetWorkspace,
      deleteNode,
      expandedFolders,
      isNodeSelected,
      getTrashNodes,
      getChildren,
      getNode,
      getRootNodes,
      moveNode,
      nodes,
      openFile,
      pasteNodes,
      explorerOrder,
      folderOrder,
      pinnedIds,
      pinnedNodes,
      replaceNodeSelection,
      renameNode,
      reorderExplorer,
      reorderPinned,
      selectedNodeIds,
      selectionAnchorId,
      trashFolderId,
      toggleNodeSelection,
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
