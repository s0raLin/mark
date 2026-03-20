import { useState, useCallback, useEffect } from "react";

export interface FileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  createdAt: number;
  updatedAt: number;
}

const STORAGE_KEYS = {
  nodes: "studiomark_fs_nodes",
  contents: "studiomark_fs_contents",
  pinned: "studiomark_fs_pinned",
  activeFile: "studiomark_fs_active",
  explorerOrder: "studiomark_fs_explorer_order",
  // per-folder child order: Record<parentId, string[]>
  folderOrder: "studiomark_fs_folder_order",
};

const DEFAULT_FILE_ID = "default";

function ensureMarkdownExtension(name: string) {
  if (name.endsWith(".md")) return name;
  if (name.endsWith(".markdown")) return `${name.slice(0, -".markdown".length)}.md`;
  return `${name}.md`;
}

function loadJSON<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

function saveJSON(key: string, value: unknown) {
  localStorage.setItem(key, JSON.stringify(value));
}

function generateId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function getDefaultNodes(): FileNode[] {
  return [
    {
      id: DEFAULT_FILE_ID,
      name: "Getting_Started.md",
      type: "file",
      parentId: null,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    },
  ];
}

export function useFileSystem(
  markdown: string,
  setMarkdown: (v: string) => void
) {
  const [nodes, setNodes] = useState<FileNode[]>(() => {
    const saved = loadJSON<FileNode[]>(STORAGE_KEYS.nodes, []);
    if (saved.length === 0) {
      const defaults = getDefaultNodes();
      saveJSON(STORAGE_KEYS.nodes, defaults);
      return defaults;
    }
    return saved;
  });

  // pinnedIds doubles as the ordered pinned list
  const [pinnedIds, setPinnedIds] = useState<string[]>(() =>
    loadJSON(STORAGE_KEYS.pinned, [])
  );

  // explorerOrder: explicit ordering for root-level nodes
  const [explorerOrder, setExplorerOrder] = useState<string[]>(() =>
    loadJSON(STORAGE_KEYS.explorerOrder, [])
  );

  // folderOrder: per-folder child ordering  { [folderId]: string[] }
  const [folderOrder, setFolderOrder] = useState<Record<string, string[]>>(() =>
    loadJSON(STORAGE_KEYS.folderOrder, {})
  );

  const [activeFileId, setActiveFileId] = useState<string>(() => {
    const saved = localStorage.getItem(STORAGE_KEYS.activeFile);
    return saved || DEFAULT_FILE_ID;
  });

  const [expandedFolders, setExpandedFolders] = useState<Set<string>>(
    new Set()
  );

  const nodesStructureKey = (() => {
    // Only include stable structure fields (exclude updatedAt/createdAt),
    // so order-sync effects won't run on every markdown edit.
    return nodes
      .map((n) => `${n.id}:${n.type}:${n.parentId ?? "root"}`)
      .sort()
      .join("|");
  })();

  const arraysEqual = (a: string[], b: string[]) => {
    if (a === b) return true;
    if (a.length !== b.length) return false;
    for (let i = 0; i < a.length; i++) if (a[i] !== b[i]) return false;
    return true;
  };

  useEffect(() => { saveJSON(STORAGE_KEYS.nodes, nodes); }, [nodes]);
  useEffect(() => { saveJSON(STORAGE_KEYS.pinned, pinnedIds); }, [pinnedIds]);
  useEffect(() => { saveJSON(STORAGE_KEYS.explorerOrder, explorerOrder); }, [explorerOrder]);
  useEffect(() => { saveJSON(STORAGE_KEYS.folderOrder, folderOrder); }, [folderOrder]);
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.activeFile, activeFileId);
  }, [activeFileId]);

  // Auto-save current file content when markdown changes
  useEffect(() => {
    if (!activeFileId) return;
    const contents = loadJSON<Record<string, string>>(STORAGE_KEYS.contents, {});
    contents[activeFileId] = markdown;
    saveJSON(STORAGE_KEYS.contents, contents);
    setNodes((prev) =>
      prev.map((n) =>
        n.id === activeFileId ? { ...n, updatedAt: Date.now() } : n
      )
    );
  }, [markdown, activeFileId]);

  // Keep ordering arrays in sync with the current node structure.
  // If localStorage contains stale order data, insertBeforeId lookups can fail,
  // causing "can't go to head/tail" or seemingly random ordering.
  useEffect(() => {
    setExplorerOrder((prev) => {
      const rootIds = nodes
        .filter((n) => n.parentId === null && !pinnedIds.includes(n.id))
        .map((n) => n.id);

      // Remove ids that no longer exist / are pinned; then append missing.
      const next = prev.filter((id) => rootIds.includes(id));
      for (const id of rootIds) if (!next.includes(id)) next.push(id);

      return arraysEqual(prev, next) ? prev : next;
    });
  }, [nodesStructureKey, pinnedIds]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    setFolderOrder((prev) => {
      const next: Record<string, string[]> = { ...prev };
      const folderIds = nodes.filter((n) => n.type === "folder").map((n) => n.id);

      // Remove order entries for deleted folders
      for (const key of Object.keys(next)) {
        if (!folderIds.includes(key)) delete next[key];
      }

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
  }, [nodesStructureKey]); // eslint-disable-line react-hooks/exhaustive-deps

  const openFile = useCallback(
    (id: string) => {
      const contents = loadJSON<Record<string, string>>(STORAGE_KEYS.contents, {});
      setMarkdown(contents[id] ?? "");
      setActiveFileId(id);
    },
    [setMarkdown]
  );

  const createFile = useCallback(
    (
      name: string,
      parentId: string | null = null,
      opts?: { open?: boolean; initialContent?: string }
    ) => {
      const id = generateId();
      const node: FileNode = {
        id,
        name: ensureMarkdownExtension(name),
        type: "file",
        parentId,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      setNodes((prev) => [...prev, node]);
      const contents = loadJSON<Record<string, string>>(STORAGE_KEYS.contents, {});
      contents[id] =
        opts?.initialContent ?? `# ${ensureMarkdownExtension(name).replace(/\.md$/, "")}\n\n`;
      saveJSON(STORAGE_KEYS.contents, contents);
      if (parentId === null) {
        setExplorerOrder((prev) => [...prev, id]);
      } else {
        setFolderOrder((prev) => ({
          ...prev,
          [parentId]: [...(prev[parentId] ?? []), id],
        }));
      }
      if (opts?.open ?? true) openFile(id);
      return id;
    },
    [openFile]
  );

  const createFolder = useCallback((name: string, parentId: string | null = null) => {
    const id = generateId();
    const node: FileNode = {
      id,
      name,
      type: "folder",
      parentId,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    setNodes((prev) => [...prev, node]);
    setExpandedFolders((prev) => new Set([...prev, id]));
    if (parentId === null) {
      setExplorerOrder((prev) => [...prev, id]);
    } else {
      setFolderOrder((prev) => ({
        ...prev,
        [parentId]: [...(prev[parentId] ?? []), id],
      }));
    }
    return id;
  }, []);

  const deleteNode = useCallback(
    (id: string) => {
      const toDelete = new Set<string>();
      const collect = (nodeId: string) => {
        toDelete.add(nodeId);
        nodes.filter((n) => n.parentId === nodeId).forEach((n) => collect(n.id));
      };
      collect(id);

      setNodes((prev) => prev.filter((n) => !toDelete.has(n.id)));
      setPinnedIds((prev) => prev.filter((p) => !toDelete.has(p)));
      setExplorerOrder((prev) => prev.filter((e) => !toDelete.has(e)));
      setFolderOrder((prev) => {
        const next = { ...prev };
        for (const key of Object.keys(next)) {
          next[key] = next[key].filter((e) => !toDelete.has(e));
        }
        for (const id of toDelete) delete next[id];
        return next;
      });

      if (toDelete.has(activeFileId)) {
        const remaining = nodes.filter((n) => n.type === "file" && !toDelete.has(n.id));
        if (remaining.length > 0) openFile(remaining[0].id);
        else { setMarkdown(""); setActiveFileId(""); }
      }
    },
    [nodes, activeFileId, openFile, setMarkdown]
  );

  const renameNode = useCallback((id: string, newName: string) => {
    setNodes((prev) =>
      prev.map((n) =>
        n.id === id
          ? {
              ...n,
              name:
                n.type === "file" ? ensureMarkdownExtension(newName) : newName,
              updatedAt: Date.now(),
            }
          : n
      )
    );
  }, []);

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) =>
      prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]
    );
  }, []);

  const toggleFolder = useCallback((id: string) => {
    setExpandedFolders((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  // Reorder pinned list: insert dragged item before insertBeforeId (or at end if null)
  const reorderPinned = useCallback((fromIndex: number, toIndex: number) => {
    setPinnedIds((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }, []);

  // Reorder explorer root list: insert dragged item at toIndex
  const reorderExplorer = useCallback((fromIndex: number, toIndex: number) => {
    setExplorerOrder((prev) => {
      const next = [...prev];
      const [item] = next.splice(fromIndex, 1);
      next.splice(toIndex, 0, item);
      return next;
    });
  }, []);

  /**
   * Move a node to a new parent and/or position.
   * - newParentId: null = root, string = folder id
   * - insertBeforeId: insert before this sibling id; null = append at end
   */
  const moveNode = useCallback((id: string, newParentId: string | null, insertBeforeId: string | null) => {
    // Update parentId on the node
    setNodes((prev) =>
      prev.map((n) => n.id === id ? { ...n, parentId: newParentId } : n)
    );

    // Remove from old order list
    setExplorerOrder((prev) => prev.filter((e) => e !== id));
    setFolderOrder((prev) => {
      const next: Record<string, string[]> = {};
      for (const [k, v] of Object.entries(prev)) {
        next[k] = v.filter((e) => e !== id);
      }
      return next;
    });

    // Insert into new order list
    if (newParentId === null) {
      setExplorerOrder((prev) => {
        const next = prev.filter((e) => e !== id);
        if (insertBeforeId) {
          const idx = next.indexOf(insertBeforeId);
          if (idx >= 0) { next.splice(idx, 0, id); return next; }
        }
        return [...next, id];
      });
    } else {
      setFolderOrder((prev) => {
        const list = (prev[newParentId] ?? []).filter((e) => e !== id);
        if (insertBeforeId) {
          const idx = list.indexOf(insertBeforeId);
          if (idx >= 0) { list.splice(idx, 0, id); }
          else { list.push(id); }
        } else {
          list.push(id);
        }
        return { ...prev, [newParentId]: list };
      });
      // Auto-expand the target folder
      setExpandedFolders((prev) => new Set([...prev, newParentId]));
    }
  }, []);

  const getNode = useCallback(
    (id: string) => nodes.find((n) => n.id === id),
    [nodes]
  );

  // Returns root-level nodes in explicit order
  const getRootNodes = useCallback((): FileNode[] => {
    const rootNodes = nodes.filter((n) => n.parentId === null && !pinnedIds.includes(n.id));
    const ordered: FileNode[] = [];
    const seen = new Set<string>();
    for (const id of explorerOrder) {
      const node = rootNodes.find((n) => n.id === id);
      if (node) { ordered.push(node); seen.add(id); }
    }
    for (const node of rootNodes) {
      if (!seen.has(node.id)) ordered.push(node);
    }
    return ordered;
  }, [nodes, explorerOrder, pinnedIds]);

  // Returns children of a folder in explicit order
  const getChildren = useCallback(
    (parentId: string): FileNode[] => {
      const children = nodes.filter((n) => n.parentId === parentId);
      const order = folderOrder[parentId] ?? [];
      const ordered: FileNode[] = [];
      const seen = new Set<string>();
      for (const id of order) {
        const node = children.find((n) => n.id === id);
        if (node) { ordered.push(node); seen.add(id); }
      }
      for (const node of children) {
        if (!seen.has(node.id)) ordered.push(node);
      }
      return ordered;
    },
    [nodes, folderOrder]
  );

  const pinnedNodes = pinnedIds
    .map((id) => nodes.find((n) => n.id === id))
    .filter(Boolean) as FileNode[];

  return {
    nodes,
    activeFileId,
    pinnedIds,
    pinnedFiles: pinnedNodes, // kept for compat
    pinnedNodes,
    expandedFolders,
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
  };
}
