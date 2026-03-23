import { useCallback } from "react";
import { FileNode, FileSystemAPI } from "@/types/filesystem";
import {
  ensureFileExtension,
  arraysEqual,
} from "../utils/editorHelpers";
import {
  createFileOnServer,
  createFolderOnServer,
  moveNodeOnServer,
  renameNodeOnServer,
  deleteNodeOnServer,
  saveFileContent,
} from "@/api";

interface UseFileOperationsProps {
  nodes: FileNode[];
  pinnedIds: string[];
  explorerOrder: string[];
  folderOrder: Record<string, string[]>;
  activeFileId: string;
  expandedFolders: Set<string>;
  setNodes: React.Dispatch<React.SetStateAction<FileNode[]>>;
  setPinnedIds: React.Dispatch<React.SetStateAction<string[]>>;
  setExplorerOrder: React.Dispatch<React.SetStateAction<string[]>>;
  setFolderOrder: React.Dispatch<React.SetStateAction<Record<string, string[]>>>;
  setExpandedFolders: React.Dispatch<React.SetStateAction<Set<string>>>;
  setActiveFileId: React.Dispatch<React.SetStateAction<string>>;
}

interface UseFileOperationsReturn {
  openFile: (id: string) => void;
  createFile: (name: string, parentId?: string | null, opts?: { open?: boolean; initialContent?: string }) => string;
  createFolder: (name: string, parentId?: string | null) => string;
  deleteNode: (id: string) => void;
  renameNode: (id: string, newName: string) => void;
  togglePin: (id: string) => void;
  toggleFolder: (id: string) => void;
  reorderPinned: (fromIndex: number, toIndex: number) => void;
  reorderExplorer: (fromIndex: number, toIndex: number) => void;
  moveNode: (id: string, newParentId: string | null, insertBeforeId: string | null) => void;
  getNode: (id: string) => FileNode | undefined;
  getRootNodes: () => FileNode[];
  getChildren: (parentId: string) => FileNode[];
  fs: FileSystemAPI;
}

export function useFileOperations({
  nodes,
  pinnedIds,
  explorerOrder,
  folderOrder,
  activeFileId,
  expandedFolders,
  setNodes,
  setPinnedIds,
  setExplorerOrder,
  setFolderOrder,
  setExpandedFolders,
  setActiveFileId,
}: UseFileOperationsProps): UseFileOperationsReturn {

  const openFile = useCallback((_id: string) => {}, []);

  // 创建文件：先乐观更新 UI，再调用后端 API 获取真实 ID（路径）
  const createFile = useCallback(
    (name: string, parentId: string | null = null, opts?: { open?: boolean; initialContent?: string }): string => {
      const fileName = ensureFileExtension(name);
      // 乐观 ID：parentId/fileName 或 fileName
      const optimisticId = parentId ? `${parentId}/${fileName}` : fileName;
      const baseName = fileName.replace(/\.[^.]+$/, "");
      const content = opts?.initialContent ?? (fileName.endsWith(".md") ? `# ${baseName}\n\n` : "");

      const node: FileNode = {
        id: optimisticId,
        name: fileName,
        type: "file",
        parentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };

      setNodes(prev => [...prev, node]);

      if (parentId === null) {
        setExplorerOrder(prev => [...prev, optimisticId]);
      } else {
        setFolderOrder(prev => ({
          ...prev,
          [parentId]: [...(prev[parentId] ?? []), optimisticId],
        }));
      }

      // 调用后端创建文件
      createFileOnServer(parentId ?? "", fileName, content).then(res => {
        if (res.id !== optimisticId) {
          // 后端返回的 ID 与乐观 ID 不同，更新
          setNodes(prev => prev.map(n => n.id === optimisticId ? { ...n, id: res.id } : n));
          if (parentId === null) {
            setExplorerOrder(prev => prev.map(id => id === optimisticId ? res.id : id));
          } else {
            setFolderOrder(prev => ({
              ...prev,
              [parentId]: (prev[parentId] ?? []).map(id => id === optimisticId ? res.id : id),
            }));
          }
        }
      }).catch(err => {
        console.error("创建文件失败:", err);
        // 回滚
        setNodes(prev => prev.filter(n => n.id !== optimisticId));
        if (parentId === null) {
          setExplorerOrder(prev => prev.filter(id => id !== optimisticId));
        } else {
          setFolderOrder(prev => ({
            ...prev,
            [parentId]: (prev[parentId] ?? []).filter(id => id !== optimisticId),
          }));
        }
      });

      // 保存初始内容
      saveFileContent(optimisticId, content).catch(() => {});

      return optimisticId;
    },
    [setNodes, setExplorerOrder, setFolderOrder],
  );

  // 创建文件夹
  const createFolder = useCallback(
    (name: string, parentId: string | null = null): string => {
      const optimisticId = parentId ? `${parentId}/${name}` : name;

      setNodes(prev => [...prev, {
        id: optimisticId,
        name,
        type: "folder",
        parentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }]);
      setExpandedFolders(prev => new Set([...prev, optimisticId]));

      if (parentId === null) {
        setExplorerOrder(prev => [...prev, optimisticId]);
      } else {
        setFolderOrder(prev => ({
          ...prev,
          [parentId]: [...(prev[parentId] ?? []), optimisticId],
        }));
      }

      createFolderOnServer(parentId ?? "", name).then(res => {
        if (res.id !== optimisticId) {
          setNodes(prev => prev.map(n => n.id === optimisticId ? { ...n, id: res.id } : n));
          setExpandedFolders(prev => {
            const next = new Set(prev);
            next.delete(optimisticId);
            next.add(res.id);
            return next;
          });
          if (parentId === null) {
            setExplorerOrder(prev => prev.map(id => id === optimisticId ? res.id : id));
          } else {
            setFolderOrder(prev => ({
              ...prev,
              [parentId]: (prev[parentId] ?? []).map(id => id === optimisticId ? res.id : id),
            }));
          }
        }
      }).catch(err => {
        console.error("创建文件夹失败:", err);
        setNodes(prev => prev.filter(n => n.id !== optimisticId));
        setExpandedFolders(prev => { const next = new Set(prev); next.delete(optimisticId); return next; });
        if (parentId === null) {
          setExplorerOrder(prev => prev.filter(id => id !== optimisticId));
        } else {
          setFolderOrder(prev => ({
            ...prev,
            [parentId]: (prev[parentId] ?? []).filter(id => id !== optimisticId),
          }));
        }
      });

      return optimisticId;
    },
    [setNodes, setExpandedFolders, setExplorerOrder, setFolderOrder],
  );

  // 删除节点（递归删除子节点）
  const deleteNode = useCallback(
    (id: string) => {
      const toDelete = new Set<string>();
      const collect = (nodeId: string) => {
        toDelete.add(nodeId);
        nodes.filter(n => n.parentId === nodeId).forEach(n => collect(n.id));
      };
      collect(id);

      setNodes(prev => prev.filter(n => !toDelete.has(n.id)));
      setPinnedIds(prev => prev.filter(p => !toDelete.has(p)));
      setExplorerOrder(prev => prev.filter(e => !toDelete.has(e)));
      setFolderOrder(prev => {
        const next = { ...prev };
        for (const key of Object.keys(next)) next[key] = next[key].filter(e => !toDelete.has(e));
        for (const d of toDelete) delete next[d];
        return next;
      });

      deleteNodeOnServer(id).catch(err => console.error("删除失败:", err));
    },
    [nodes, setNodes, setPinnedIds, setExplorerOrder, setFolderOrder],
  );

  // 重命名节点：调用后端，更新 ID（因为 ID 是路径）
  const renameNode = useCallback(
    (id: string, newName: string) => {
      const node = nodes.find(n => n.id === id);
      if (!node) return;
      const finalName = node.type === "file" ? ensureFileExtension(newName) : newName;
      const parentId = node.parentId;
      const newId = parentId ? `${parentId}/${finalName}` : finalName;

      // 乐观更新：更新该节点及所有子节点的 ID
      const updateIds = (oldPrefix: string, newPrefix: string) => {
        setNodes(prev => prev.map(n => {
          if (n.id === oldPrefix) return { ...n, id: newPrefix, name: finalName, updatedAt: Date.now() };
          if (n.id.startsWith(oldPrefix + "/")) return { ...n, id: newPrefix + n.id.slice(oldPrefix.length) };
          if (n.parentId === oldPrefix) return { ...n, parentId: newPrefix };
          if (n.parentId?.startsWith(oldPrefix + "/")) return { ...n, parentId: newPrefix + n.parentId.slice(oldPrefix.length) };
          return n;
        }));
        setPinnedIds(prev => prev.map(p => p === oldPrefix ? newPrefix : p.startsWith(oldPrefix + "/") ? newPrefix + p.slice(oldPrefix.length) : p));
        setExplorerOrder(prev => prev.map(e => e === oldPrefix ? newPrefix : e.startsWith(oldPrefix + "/") ? newPrefix + e.slice(oldPrefix.length) : e));
        setFolderOrder(prev => {
          const next: Record<string, string[]> = {};
          for (const [k, v] of Object.entries(prev)) {
            const newKey = k === oldPrefix ? newPrefix : k.startsWith(oldPrefix + "/") ? newPrefix + k.slice(oldPrefix.length) : k;
            next[newKey] = v.map(e => e === oldPrefix ? newPrefix : e.startsWith(oldPrefix + "/") ? newPrefix + e.slice(oldPrefix.length) : e);
          }
          return next;
        });
        setExpandedFolders(prev => {
          const next = new Set<string>();
          for (const f of prev) {
            next.add(f === oldPrefix ? newPrefix : f.startsWith(oldPrefix + "/") ? newPrefix + f.slice(oldPrefix.length) : f);
          }
          return next;
        });
        if (activeFileId === oldPrefix || activeFileId.startsWith(oldPrefix + "/")) {
          setActiveFileId(activeFileId === oldPrefix ? newPrefix : newPrefix + activeFileId.slice(oldPrefix.length));
        }
      };

      updateIds(id, newId);

      renameNodeOnServer(id, finalName).catch(err => {
        console.error("重命名失败:", err);
        // 回滚
        updateIds(newId, id);
      });
    },
    [nodes, activeFileId, setNodes, setPinnedIds, setExplorerOrder, setFolderOrder, setExpandedFolders, setActiveFileId],
  );

  const togglePin = useCallback(
    (id: string) => {
      setPinnedIds(prev => prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]);
    },
    [setPinnedIds],
  );

  const toggleFolder = useCallback(
    (id: string) => {
      setExpandedFolders(prev => {
        const next = new Set(prev);
        next.has(id) ? next.delete(id) : next.add(id);
        return next;
      });
    },
    [setExpandedFolders],
  );

  const reorderPinned = useCallback(
    (fromIndex: number, toIndex: number) => {
      setPinnedIds(prev => {
        const next = [...prev];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return next;
      });
    },
    [setPinnedIds],
  );

  const reorderExplorer = useCallback(
    (fromIndex: number, toIndex: number) => {
      setExplorerOrder(prev => {
        const next = [...prev];
        const [item] = next.splice(fromIndex, 1);
        next.splice(toIndex, 0, item);
        return next;
      });
    },
    [setExplorerOrder],
  );

  // 移动节点：调用后端，更新 ID（路径变了）
  const moveNode = useCallback(
    (id: string, newParentId: string | null, insertBeforeId: string | null) => {
      const node = nodes.find(n => n.id === id);
      if (!node) return;
      const name = node.name;
      const newId = newParentId ? `${newParentId}/${name}` : name;

      // helper: remap a single id string
      const remapId = (s: string, oldPrefix: string, newPrefix: string) => {
        if (s === oldPrefix) return newPrefix;
        if (s.startsWith(oldPrefix + "/")) return newPrefix + s.slice(oldPrefix.length);
        return s;
      };

      // 一次性完成所有状态更新，避免多次 setState 之间的竞态
      setNodes(prev => prev.map(n => {
        if (n.id === id) return { ...n, id: newId, parentId: newParentId, updatedAt: Date.now() };
        if (n.id.startsWith(id + "/")) return { ...n, id: newId + n.id.slice(id.length), parentId: n.parentId === id ? newId : remapId(n.parentId!, id, newId) };
        return n;
      }));

      setPinnedIds(prev => prev.map(p => remapId(p, id, newId)));

      setExpandedFolders(prev => {
        const next = new Set<string>();
        for (const f of prev) next.add(remapId(f, id, newId));
        if (newParentId) next.add(newParentId);
        return next;
      });

      if (activeFileId === id || activeFileId.startsWith(id + "/")) {
        setActiveFileId(remapId(activeFileId, id, newId));
      }

      // 更新排序表：同时处理 key 重命名和条目移除/插入
      setExplorerOrder(prev => {
        // 先把旧 id 从根列表移除
        let next = prev.filter(e => e !== id);
        // 如果目标是根级别，插入到正确位置
        if (newParentId === null) {
          next = next.filter(e => e !== newId);
          if (insertBeforeId) {
            const idx = next.indexOf(insertBeforeId);
            if (idx >= 0) { next.splice(idx, 0, newId); return next; }
          }
          return [...next, newId];
        }
        return next;
      });

      setFolderOrder(prev => {
        const next: Record<string, string[]> = {};
        for (const [k, v] of Object.entries(prev)) {
          // 重命名 key（被移动的文件夹自身及其子文件夹的 key）
          const newKey = remapId(k, id, newId);
          // 从原父级列表中移除旧 id
          const filtered = v.filter(e => e !== id);
          next[newKey] = filtered;
        }
        // 插入到目标文件夹
        if (newParentId !== null) {
          const list = (next[newParentId] ?? []).filter(e => e !== newId);
          if (insertBeforeId) {
            const idx = list.indexOf(insertBeforeId);
            if (idx >= 0) list.splice(idx, 0, newId);
            else list.push(newId);
          } else {
            list.push(newId);
          }
          next[newParentId] = list;
        }
        return next;
      });

      // 调用后端
      moveNodeOnServer(id, newParentId ?? "").catch(err => {
        console.error("移动失败:", err);
      });
    },
    [nodes, activeFileId, setNodes, setPinnedIds, setExplorerOrder, setFolderOrder, setExpandedFolders, setActiveFileId],
  );

  const getNode = useCallback((id: string) => nodes.find(n => n.id === id), [nodes]);

  const getRootNodes = useCallback((): FileNode[] => {
    const rootNodes = nodes.filter(n => n.parentId === null && !pinnedIds.includes(n.id));
    const ordered: FileNode[] = [];
    const seen = new Set<string>();
    for (const id of explorerOrder) {
      const node = rootNodes.find(n => n.id === id);
      if (node) { ordered.push(node); seen.add(id); }
    }
    for (const node of rootNodes) if (!seen.has(node.id)) ordered.push(node);
    return ordered;
  }, [nodes, explorerOrder, pinnedIds]);

  const getChildren = useCallback(
    (parentId: string): FileNode[] => {
      const children = nodes.filter(n => n.parentId === parentId);
      const order = folderOrder[parentId] ?? [];
      const ordered: FileNode[] = [];
      const seen = new Set<string>();
      for (const id of order) {
        const node = children.find(n => n.id === id);
        if (node) { ordered.push(node); seen.add(id); }
      }
      for (const node of children) if (!seen.has(node.id)) ordered.push(node);
      return ordered;
    },
    [nodes, folderOrder],
  );

  const pinnedNodes: FileNode[] = nodes.filter(n => pinnedIds.includes(n.id));

  const fs: FileSystemAPI = {
    nodes,
    activeFileId,
    pinnedIds,
    pinnedFiles: pinnedNodes,
    pinnedNodes,
    expandedFolders,
    openFile,
    createFile: (name, parentId?, opts?) => createFile(name, parentId ?? null, opts),
    createFolder: (name, parentId?) => createFolder(name, parentId ?? null),
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
    openFile, createFile, createFolder, deleteNode, renameNode,
    togglePin, toggleFolder, reorderPinned, reorderExplorer, moveNode,
    getNode, getRootNodes, getChildren, fs,
  };
}
