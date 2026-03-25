import { FileNode } from "@/types/filesystem";
import {
  getDefaultNodes,
  DEFAULT_FILE_ID,
  arraysEqual,
} from "@/contexts/utils/editorHelpers";
import {
  useState,
  useRef,
  useEffect,
  useMemo,
  ReactNode,
  createContext,
  useContext,
} from "react";
import { useStorageSyncContext } from "./StorageContext";

/**
 * useFileSystem Hook 返回值接口
 */
export interface FileSystemContextProps {
  nodes: FileNode[];
  pinnedIds: string[];
  explorerOrder: string[];
  folderOrder: Record<string, string[]>;
  activeFileId: string;
  expandedFolders: Set<string>;
  pinnedNodes: FileNode[];
  setNodes: React.Dispatch<React.SetStateAction<FileNode[]>>;
  setPinnedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setExplorerOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setFolderOrder: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  setActiveFileId: React.Dispatch<React.SetStateAction<string>>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
}

const FileSystemContext = createContext<FileSystemContextProps | undefined>(
  undefined,
);

/**
 * 文件系统状态管理Hook
 */
export function FileSystemProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const { userData, isInitialized } = useStorageSyncContext();

  const [nodes, setNodes] = useState<FileNode[]>(() => {
    if (userData?.fileSystem?.nodes?.length > 0) {
      return userData.fileSystem.nodes.map((n) => ({
        ...n,
        createdAt:
          typeof n.createdAt === "string"
            ? new Date(n.createdAt).getTime()
            : n.createdAt,
        updatedAt:
          typeof n.updatedAt === "string"
            ? new Date(n.updatedAt).getTime()
            : n.updatedAt,
      })) as FileNode[];
    }
    return getDefaultNodes();
  });

  const [pinnedIds, setPinnedIds] = useState<string[]>(() => {
    return userData?.fileSystem?.pinnedIds ?? [];
  });

  const [explorerOrder, setExplorerOrder] = useState<string[]>(() => {
    if (userData?.fileSystem?.explorerOrder?.length > 0) {
      return userData.fileSystem.explorerOrder;
    }
    return [DEFAULT_FILE_ID];
  });

  const [folderOrder, setFolderOrder] = useState<Record<string, string[]>>(
    () => {
      return userData?.fileSystem?.folderOrder ?? {};
    },
  );

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    if (userData?.fileSystem?.nodes?.length > 0) {
      const firstFile = userData.fileSystem.nodes.find(
        (n) => n.type === "file",
      );
      return firstFile?.id ?? DEFAULT_FILE_ID;
    }
    return DEFAULT_FILE_ID;
  });

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  // 当初始数据异步加载完成后，同步到状态
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current || !isInitialized || !userData) return;
    hasInitialized.current = true;
    if (userData.fileSystem?.nodes?.length > 0) {
      setNodes(
        userData.fileSystem.nodes.map((n) => ({
          ...n,
          createdAt:
            typeof n.createdAt === "string"
              ? new Date(n.createdAt).getTime()
              : n.createdAt,
          updatedAt:
            typeof n.updatedAt === "string"
              ? new Date(n.updatedAt).getTime()
              : n.updatedAt,
        })) as FileNode[],
      );
      const firstFile = userData.fileSystem.nodes.find(
        (n) => n.type === "file",
      );
      if (firstFile) setActiveFileId(firstFile.id);
    }
    if (userData.fileSystem.pinnedIds)
      setPinnedIds(userData.fileSystem.pinnedIds);
    if (userData.fileSystem.explorerOrder?.length > 0)
      setExplorerOrder(userData.fileSystem.explorerOrder);
    if (userData.fileSystem.folderOrder)
      setFolderOrder(userData.fileSystem.folderOrder);
  }, [isInitialized, userData]);

  // 计算节点结构变化的key
  const nodesStructureKey = useMemo(
    () =>
      nodes
        .map((n) => `${n.id}:${n.type}:${n.parentId ?? "root"}`)
        .sort()
        .join("|"),
    [nodes],
  );

  // 同步根目录节点的显示顺序
  useEffect(() => {
    setExplorerOrder((prev) => {
      const rootIds = nodes
        .filter(
          (n) =>
            (n.parentId === null || n.parentId === undefined) &&
            !pinnedIds.includes(n.id),
        )
        .map((n) => n.id);
      const next = prev.filter((id) => rootIds.includes(id));
      for (const id of rootIds) if (!next.includes(id)) next.push(id);
      return arraysEqual(prev, next) ? prev : next;
    });
  }, [nodesStructureKey, pinnedIds]);

  // 同步文件夹内节点的显示顺序
  useEffect(() => {
    setFolderOrder((prev) => {
      const next = { ...prev };
      const folderIds = nodes
        .filter((n) => n.type === "folder")
        .map((n) => n.id);
      for (const key of Object.keys(next))
        if (!folderIds.includes(key)) delete next[key];
      for (const folderId of folderIds) {
        const childIds = nodes
          .filter((n) => n.parentId === folderId)
          .map((n) => n.id);
        const existing = prev[folderId] ?? [];
        const filtered = existing.filter((id) => childIds.includes(id));
        const appended = childIds.filter((id) => !filtered.includes(id));
        const updated = [...filtered, ...appended];
        if (!arraysEqual(existing, updated)) next[folderId] = updated;
      }
      return next;
    });
  }, [nodesStructureKey]);

  // 计算已置顶的节点列表
  const pinnedNodes = useMemo(
    () =>
      pinnedIds
        .map((id) => nodes.find((n) => n.id === id))
        .filter(Boolean) as FileNode[],
    [nodes, pinnedIds],
  );

  return (
    <FileSystemContext.Provider
      value={{
        nodes,
        pinnedIds,
        explorerOrder,
        folderOrder,
        activeFileId,
        expandedFolders,
        pinnedNodes,
        setNodes,
        setPinnedIds,
        setExplorerOrder,
        setFolderOrder,
        setActiveFileId,
        setExpandedFolders,
      }}
    >
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
