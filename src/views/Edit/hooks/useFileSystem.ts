import { useState, useEffect, useMemo } from "react";
import { FileNode } from "@/src/types/filesystem";
import {
  getDefaultNodes,
  arraysEqual,
  DEFAULT_FILE_ID,
} from "../utils/editorHelpers";

/**
 * useFileSystem Hook 返回值接口
 * 包含文件系统的所有状态和setter函数
 */
export interface UseFileSystemReturn {
  /** 所有文件/文件夹节点 */
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
  /** 已置顶的节点列表 */
  pinnedNodes: FileNode[];
  /** 设置节点列表 */
  setNodes: React.Dispatch<React.SetStateAction<FileNode[]>>;
  /** 设置文件内容 */
  setFileContents: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  /** 设置置顶ID列表 */
  setPinnedIds: React.Dispatch<React.SetStateAction<string[]>>;
  /** 设置根目录顺序 */
  setExplorerOrder: React.Dispatch<React.SetStateAction<string[]>>;
  /** 设置文件夹顺序 */
  setFolderOrder: React.Dispatch<
    React.SetStateAction<Record<string, string[]>>
  >;
  /** 设置当前活动文件ID */
  setActiveFileId: React.Dispatch<React.SetStateAction<string>>;
  /** 设置展开的文件夹集合 */
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
}

/**
 * 文件系统状态管理Hook
 * 负责管理编辑器中的文件/文件夹数据结构
 *
 * @returns 包含文件系统状态和更新函数的对象
 */
export function useFileSystem(): UseFileSystemReturn {
  // ===== 文件系统状态 =====

  /** 所有文件/文件夹节点列表 */
  const [nodes, setNodes] = useState<FileNode[]>(getDefaultNodes);

  /** 文件ID到内容的映射表（内存存储） */
  const [fileContents, setFileContents] = useState<Record<string, string>>({});

  /** 已置顶的文件/文件夹ID列表 */
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  /** 根目录节点的显示顺序 */
  const [explorerOrder, setExplorerOrder] = useState<string[]>([
    DEFAULT_FILE_ID,
  ]);

  /** 每个文件夹内的节点显示顺序 */
  const [folderOrder, setFolderOrder] = useState<Record<string, string[]>>({});

  /** 当前打开/活动的文件ID */
  const [activeFileId, setActiveFileId] = useState<string>(DEFAULT_FILE_ID);

  /** 当前展开的文件夹ID集合 */
  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set(),
  );

  // ===== 计算属性 =====

  /**
   * 计算节点结构变化的key
   * 当节点结构变化时触发排序同步
   */
  const nodesStructureKey = useMemo(
    () =>
      nodes
        .map((n) => `${n.id}:${n.type}:${n.parentId ?? "root"}`)
        .sort()
        .join("|"),
    [nodes],
  );

  // ===== 副作用：排序同步 =====

  /**
   * 同步根目录节点的显示顺序
   * 当节点列表或置顶ID变化时，确保explorerOrder与实际节点一致
   */
  useEffect(() => {
    setExplorerOrder((prev) => {
      // 获取所有根节点（无父节点且未置顶）
      const rootIds = nodes
        .filter((n) => n.parentId === null && !pinnedIds.includes(n.id))
        .map((n) => n.id);
      // 过滤掉已不存在的ID，添加新出现的ID
      const next = prev.filter((id) => rootIds.includes(id));
      for (const id of rootIds) if (!next.includes(id)) next.push(id);
      return arraysEqual(prev, next) ? prev : next;
    });
  }, [nodesStructureKey, pinnedIds]);

  /**
   * 同步文件夹内节点的显示顺序
   * 当节点列表变化时，更新各文件夹内的顺序
   */
  useEffect(() => {
    setFolderOrder((prev) => {
      const next = { ...prev };
      // 获取所有文件夹ID
      const folderIds = nodes
        .filter((n) => n.type === "folder")
        .map((n) => n.id);
      // 删除已不存在的文件夹记录
      for (const key of Object.keys(next))
        if (!folderIds.includes(key)) delete next[key];
      // 更新每个文件夹的子节点顺序
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

  // ===== 派生状态 =====

  /**
   * 计算已置顶的节点列表
   * 根据pinnedIds从nodes中筛选出置顶的节点
   */
  const pinnedNodes = useMemo(
    () =>
      pinnedIds
        .map((id) => nodes.find((n) => n.id === id))
        .filter(Boolean) as FileNode[],
    [nodes, pinnedIds],
  );

  return {
    nodes,
    fileContents,
    pinnedIds,
    explorerOrder,
    folderOrder,
    activeFileId,
    expandedFolders,
    pinnedNodes,
    setNodes,
    setFileContents,
    setPinnedIds,
    setExplorerOrder,
    setFolderOrder,
    setActiveFileId,
    setExpandedFolders,
  };
}
