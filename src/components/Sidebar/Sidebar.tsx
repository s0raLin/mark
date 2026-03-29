import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { SidebarItem } from "./SidebarItem";
import {
  ClipboardPaste,
  FilePlus,
  FolderPlus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { SidebarProps, DragContext, ResolvedDrop } from "./types";
import { NewItemDialog, DragList, TreeNode, PinnedItemRow } from "./components";
import { importDroppedIntoFs } from "./utils";
import SidebarAreaMenu from "./components/SidebarAreaMenu";
import { useFileSystemContext } from "@/contexts/FileSystemContext";

export default function Sidebar({ setIsSettingsModalOpen, setIsSearchModalOpen }: SidebarProps) {
  const fs = useFileSystemContext();
  const [newItem, setNewItem] = useState<"file" | "folder" | null>(null);
  const [draggingId, setDraggingIdState] = useState<string | null>(null);
  const [dropTarget, setDropTargetState] = useState<ResolvedDrop | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [areaMenu, setAreaMenu] = useState<{ x: number; y: number } | null>(null);

  const draggingIdRef = useRef<string | null>(null);
  const dropTargetRef = useRef<ResolvedDrop | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);

  const setDraggingId = useCallback((id: string | null) => {
    draggingIdRef.current = id;
    setDraggingIdState(id);
    if (id === null) {
      dropTargetRef.current = null;
      setDropTargetState(null);
    }
  }, []);

  const setDropTarget = useCallback((t: ResolvedDrop | null) => {
    dropTargetRef.current = t;
    setDropTargetState(t);
  }, []);

  const rootNodes = fs.getRootNodes();
  const pinnedNodes = fs.pinnedNodes;
  const trashNodes = fs.getTrashNodes();
  const selectionCount = fs.selectedNodeIds.size;

  const visibleNodeIds = useMemo(() => {
    const orderedIds: string[] = [];
    const visited = new Set<string>();

    const walk = (node: typeof rootNodes[number]) => {
      if (!visited.has(node.id)) {
        orderedIds.push(node.id);
        visited.add(node.id);
      }
      if (node.type === "folder" && fs.expandedFolders.has(node.id)) {
        fs.getChildren(node.id).forEach(walk);
      }
    };

    pinnedNodes.forEach(walk);
    rootNodes.forEach(walk);
    trashNodes.forEach(walk);
    return orderedIds;
  }, [fs, pinnedNodes, rootNodes, trashNodes]);

  const focusSidebar = useCallback(() => {
    rootRef.current?.focus();
  }, []);

  const selectRange = useCallback((targetId: string) => {
    const anchorId = fs.selectionAnchorId ?? fs.activeFileId ?? targetId;
    const startIndex = visibleNodeIds.indexOf(anchorId);
    const endIndex = visibleNodeIds.indexOf(targetId);

    if (startIndex === -1 || endIndex === -1) {
      fs.replaceNodeSelection([targetId], targetId);
      return;
    }

    const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
    fs.replaceNodeSelection(visibleNodeIds.slice(from, to + 1), anchorId);
  }, [fs, visibleNodeIds]);

  const handleNodeClick = useCallback((node: typeof rootNodes[number], event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    focusSidebar();

    const isAdditive = event.metaKey || event.ctrlKey;
    if (event.shiftKey) {
      selectRange(node.id);
      return;
    }

    if (isAdditive) {
      fs.toggleNodeSelection(node.id);
      return;
    }

    fs.replaceNodeSelection([node.id], node.id);
    if (node.type === "folder") {
      fs.toggleFolder(node.id);
    } else {
      fs.openFile(node.id);
    }
  }, [focusSidebar, fs, selectRange]);

  const handleNodeContextMenu = useCallback((node: typeof rootNodes[number], event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    focusSidebar();

    if (!fs.isNodeSelected(node.id)) {
      fs.replaceNodeSelection([node.id], node.id);
    }

    if (node.type === "file") {
      fs.openFile(node.id);
    }
  }, [focusSidebar, fs]);

  const handleSidebarKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const isModifier = event.ctrlKey || event.metaKey;
    const lowerKey = event.key.toLowerCase();

    if (isModifier && lowerKey === "a") {
      event.preventDefault();
      if (visibleNodeIds.length === 0) {
        fs.clearNodeSelection();
        return;
      }

      fs.replaceNodeSelection(visibleNodeIds, fs.selectionAnchorId ?? visibleNodeIds[0]);
      return;
    }

    if (isModifier && lowerKey === "c") {
      event.preventDefault();
      fs.copySelectedNodes();
      return;
    }

    if (isModifier && lowerKey === "x") {
      event.preventDefault();
      fs.cutSelectedNodes();
      return;
    }

    if (isModifier && lowerKey === "v") {
      event.preventDefault();
      void fs.pasteNodes();
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      void fs.deleteSelectedNodes();
    }
  }, [fs, visibleNodeIds]);
  const isExternalFileDrag = useCallback((dataTransfer: DataTransfer | null) => {
    if (!dataTransfer) {
      return false;
    }

    return Array.from(dataTransfer.types ?? []).includes("Files");
  }, []);

  // Global pointerup — single source of truth for executing the drop
  useEffect(() => {
    if (!draggingId) return;

    const handleUp = () => {
      const dragId = draggingIdRef.current;
      const target = dropTargetRef.current;

      setDraggingId(null);

      if (!dragId || !target) return;

      if (target.kind === "into") {
        // Don't drop into self or any descendant
        if (target.folderId === dragId) return;
        // Walk up from target to root — if we hit dragId, it means target is inside dragId
        let cur = fs.getNode(target.folderId);
        while (cur) {
          if (cur.id === dragId) return;
          cur = cur.parentId ? fs.getNode(cur.parentId) : undefined;
        }
        fs.moveNode(dragId, target.folderId, null);
        // Auto-expand target folder
        if (!fs.expandedFolders.has(target.folderId)) {
          fs.toggleFolder(target.folderId);
        }
      } else {
        // Reorder — check it's not a no-op and not dropping into self
        const node = fs.getNode(dragId);
        if (!node) return;
        // Don't reorder into own children (target parent or insertBefore is inside dragId's subtree)
        const isIntoOwnChild = 
          (target.parentId && target.parentId.startsWith(dragId + "/")) ||
          (target.insertBeforeId && target.insertBeforeId.startsWith(dragId + "/"));
        if (isIntoOwnChild) return;
        const sameParent = (node.parentId ?? null) === target.parentId;
        if (sameParent && target.insertBeforeId === null) {
          // Moving to end of same list — still valid
        }
        fs.moveNode(dragId, target.parentId, target.insertBeforeId);
      }
    };

    window.addEventListener("pointerup", handleUp);
    return () => window.removeEventListener("pointerup", handleUp);
  }, [draggingId, fs]);

  // OS file drop
  const handleDragOver = useCallback((e: React.DragEvent) => {
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, [isExternalFileDrag]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX <= rect.left || e.clientX >= rect.right ||
        e.clientY <= rect.top || e.clientY >= rect.bottom) {
      setIsDragOver(false);
    }
  }, [isExternalFileDrag]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    await importDroppedIntoFs(e.dataTransfer, fs, null);
  }, [fs, isExternalFileDrag]);

  return (
    <DragContext.Provider value={{ draggingId, draggingIdRef, setDraggingId, dropTarget, setDropTarget }}>
      <div
        ref={rootRef}
        tabIndex={0}
        className={cn("app-m3-sidebar-content flex flex-col h-full transition-colors duration-200 relative", isDragOver && "bg-primary/[0.04]")}
        onMouseDown={focusSidebar}
        onKeyDown={handleSidebarKeyDown}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => {
          focusSidebar();
          fs.clearNodeSelection();
        }}
        onContextMenu={(e) => {
          if ((e.target as HTMLElement).closest("[data-node-id]")) return;
          e.preventDefault();
          setAreaMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        {isDragOver && (
          <div className="absolute inset-0 border-2 border-primary/30 rounded-none pointer-events-none z-20" />
        )}

        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
          {/* Pinned */}
          {pinnedNodes.length > 0 && (
            <section>
              <div className="px-3 mb-2">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary/60">Pinned</h2>
              </div>
              <DragList
                nodes={pinnedNodes}
                parentId={null}
                renderNode={(node) => (
                  <PinnedItemRow
                    node={node}
                    fs={fs}
                    isSelected={fs.isNodeSelected(node.id)}
                    selectionCount={selectionCount}
                    onNodeClick={handleNodeClick}
                    onNodeContextMenu={handleNodeContextMenu}
                  />
                )}
              />
            </section>
          )}

          {/* Explorer */}
          <section>
            <div className="px-3 mb-2 flex items-center justify-between">
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary/60">Explorer</h2>
              <div className="flex items-center gap-1">
                <button title="New file" onClick={() => setNewItem("file")}
                  className="p-1 rounded-lg hover:bg-primary/10 transition-colors">
                  <FilePlus className="w-3.5 h-3.5 text-primary/50 hover:text-primary" />
                </button>
                <button title="New folder" onClick={() => setNewItem("folder")}
                  className="p-1 rounded-lg hover:bg-primary/10 transition-colors">
                  <FolderPlus className="w-3.5 h-3.5 text-primary/50 hover:text-primary" />
                </button>
              </div>
            </div>

            {newItem && (
              <NewItemDialog
                type={newItem}
                onConfirm={(name) => {
                  if (newItem === "file") fs.createFile(name);
                  else fs.createFolder(name);
                  setNewItem(null);
                  setAreaMenu(null);
                }}
                onCancel={() => { setNewItem(null); setAreaMenu(null); }}
              />
            )}

            {rootNodes.length === 0 ? (
              <p className="text-xs text-slate-300 px-3 py-2">No files yet</p>
            ) : (
              <DragList
                nodes={rootNodes}
                parentId={null}
                renderNode={(node) => (
                  <TreeNode
                    node={node}
                    depth={0}
                    fs={fs}
                    isSelected={fs.isNodeSelected(node.id)}
                    selectionCount={selectionCount}
                    onNodeClick={handleNodeClick}
                    onNodeContextMenu={handleNodeContextMenu}
                  />
                )}
              />
            )}
          </section>

          <section>
            <div className="px-3 mb-2 flex items-center justify-between">
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary/60">Recycle Bin</h2>
              <div className="flex items-center gap-1">
                <button
                  title="Paste into recycle bin"
                  onClick={() => void fs.pasteNodes(fs.trashFolderId)}
                  disabled={!fs.trashFolderId || !fs.canPasteNodes()}
                  className="p-1 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-40"
                >
                  <ClipboardPaste className="w-3.5 h-3.5 text-primary/50 hover:text-primary" />
                </button>
                <button
                  title="Delete selected"
                  onClick={() => void fs.deleteSelectedNodes()}
                  disabled={selectionCount === 0}
                  className="p-1 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-40"
                >
                  <Trash2 className="w-3.5 h-3.5 text-primary/50 hover:text-primary" />
                </button>
              </div>
            </div>

            {trashNodes.length === 0 ? (
              <p className="text-xs text-slate-300 px-3 py-2">Recycle bin is empty</p>
            ) : (
              <DragList
                nodes={trashNodes}
                parentId={fs.trashFolderId}
                renderNode={(node) => (
                  <TreeNode
                    node={node}
                    depth={0}
                    fs={fs}
                    isSelected={fs.isNodeSelected(node.id)}
                    selectionCount={selectionCount}
                    onNodeClick={handleNodeClick}
                    onNodeContextMenu={handleNodeContextMenu}
                  />
                )}
              />
            )}
          </section>
        </div>

        <div className="p-4 border-t border-primary/10 space-y-1 shrink-0">
          <SidebarItem icon={<Search className="w-5 h-5 text-primary/50" />} label="Search"
            onClick={() => setIsSearchModalOpen(true)} />
          <SidebarItem icon={<Settings className="w-5 h-5 text-primary/50" />} label="Settings"
            onClick={() => setIsSettingsModalOpen(true)} />
        </div>

        {areaMenu && (
          <SidebarAreaMenu
            x={areaMenu.x}
            y={areaMenu.y}
            onClose={() => setAreaMenu(null)}
            onNewFile={() => setNewItem("file")}
            onNewFolder={() => setNewItem("folder")}
            onSearch={() => setIsSearchModalOpen(true)}
            onSettings={() => setIsSettingsModalOpen(true)}
          />
        )}
      </div>
    </DragContext.Provider>
  );
}
