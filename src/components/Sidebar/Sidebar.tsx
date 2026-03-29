import React, { useState, useRef, useEffect, useCallback } from "react";
import { SidebarItem } from "./SidebarItem";
import { FilePlus, FolderPlus, Search, Settings } from "lucide-react";
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
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX <= rect.left || e.clientX >= rect.right ||
        e.clientY <= rect.top || e.clientY >= rect.bottom) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    await importDroppedIntoFs(e.dataTransfer, fs, null);
  }, [fs]);

  return (
    <DragContext.Provider value={{ draggingId, draggingIdRef, setDraggingId, dropTarget, setDropTarget }}>
      <div
        className={cn("app-m3-sidebar-content flex flex-col h-full transition-colors duration-200 relative", isDragOver && "bg-primary/[0.04]")}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
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
                renderNode={(node) => <PinnedItemRow node={node} fs={fs} />}
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
                renderNode={(node) => <TreeNode node={node} depth={0} fs={fs} />}
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
