import React, { useState, useRef, useEffect, useCallback } from "react";
import { SidebarItem } from "./SidebarItem";
import {
  FilePlus,
  FolderPlus,
  Search,
  Settings,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { SidebarProps, DragContext } from "./types";
import {
  NewItemDialog,
  DragList,
  TreeNode,
  PinnedItemRow,
} from "./components";
import { importDroppedIntoFs } from "./utils";

export default function Sidebar({
  setIsSettingsModalOpen,
  setIsSearchModalOpen,
  fs,
}: SidebarProps) {
  const [newItem, setNewItem] = useState<"file" | "folder" | null>(null);
  const [draggingId, setDraggingIdState] = useState<string | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const draggingIdRef = useRef<string | null>(null);
  const setDraggingId = useCallback((id: string | null) => {
    draggingIdRef.current = id;
    setDraggingIdState(id);
  }, []);
  const rootNodes = fs.getRootNodes();

  // Global cancel on pointerup
  useEffect(() => {
    const up = () => setDraggingId(null);
    window.addEventListener("pointerup", up);
    return () => window.removeEventListener("pointerup", up);
  }, []);

  const handleRootDrop = useCallback(
    (draggedId: string, target: import("./types").DropTarget) => {
      setDraggingId(null);
      if (target.kind === "into") {
        fs.moveNode(draggedId, target.folderId, null);
      } else {
        fs.moveNode(draggedId, null, target.insertBeforeId);
      }
    },
    [fs],
  );

  const handlePinnedDrop = useCallback(
    (draggedId: string, target: import("./types").DropTarget) => {
      setDraggingId(null);
      if (target.kind === "into") return;

      const pinnedNodes = fs.pinnedNodes;
      if (!pinnedNodes.some((n) => n.id === draggedId)) return;

      const fromIndex = pinnedNodes.findIndex((n) => n.id === draggedId);

      // insertBeforeId === null → append at end
      let toIndex: number;
      if (target.insertBeforeId === null) {
        toIndex = pinnedNodes.length - 1;
      } else {
        const beforeIdx = pinnedNodes.findIndex((n) => n.id === target.insertBeforeId);
        if (beforeIdx < 0) return;
        toIndex = fromIndex < beforeIdx ? beforeIdx - 1 : beforeIdx;
      }

      if (fromIndex !== toIndex) {
        fs.reorderPinned(fromIndex, toIndex);
      }
    },
    [fs],
  );

  // Handle dragging files from OS file system
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.dataTransfer.types.includes("Files")) {
      setIsDragOver(true);
    }
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX <= rect.left ||
      e.clientX >= rect.right ||
      e.clientY <= rect.top ||
      e.clientY >= rect.bottom
    ) {
      setIsDragOver(false);
    }
  }, []);

  const handleDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOver(false);
      await importDroppedIntoFs(e.dataTransfer, fs, null);
    },
    [fs],
  );

  // Reset on drag cancel / drag out of window
  const handleDragEnd = useCallback(() => {
    setIsDragOver(false);
  }, []);

  return (
    <DragContext.Provider value={{ draggingId, draggingIdRef, setDraggingId }}>
      <div
        className={cn(
          "flex flex-col h-full transition-colors duration-200 relative",
          isDragOver && "bg-primary/[0.04]",
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onDragEnd={handleDragEnd}
      >
        {/* Subtle border overlay when dragging */}
        {isDragOver && (
          <div className="absolute inset-0 border-2 border-primary/30 rounded-none pointer-events-none z-20 transition-opacity duration-200" />
        )}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
          {/* Pinned */}
          {fs.pinnedNodes.length > 0 && (
            <section>
              <div className="px-3 mb-2">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-300">
                  Pinned
                </h2>
              </div>
              <DragList
                nodes={fs.pinnedNodes}
                onDrop={handlePinnedDrop}
                renderNode={(node) => <PinnedItemRow node={node} fs={fs} />}
              />
            </section>
          )}

          {/* Explorer */}
          <section>
            <div className="px-3 mb-2 flex items-center justify-between">
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-300">
                Explorer
              </h2>
              <div className="flex items-center gap-1">
                <button
                  title="New file"
                  onClick={() => setNewItem("file")}
                  className="p-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <FilePlus className="w-3.5 h-3.5 text-rose-300 hover:text-primary" />
                </button>
                <button
                  title="New folder"
                  onClick={() => setNewItem("folder")}
                  className="p-1 rounded-lg hover:bg-rose-50 transition-colors"
                >
                  <FolderPlus className="w-3.5 h-3.5 text-rose-300 hover:text-primary" />
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
                }}
                onCancel={() => setNewItem(null)}
              />
            )}

            {rootNodes.length === 0 ? (
              <p className="text-xs text-slate-300 px-3 py-2">No files yet</p>
            ) : (
              <DragList
                nodes={rootNodes}
                onDrop={handleRootDrop}
                renderNode={(node) => (
                  <TreeNode node={node} depth={0} fs={fs} />
                )}
              />
            )}
          </section>
        </div>

        <div className="p-4 border-t border-rose-100 space-y-1 shrink-0">
          <SidebarItem
            icon={<Search className="w-5 h-5 text-slate-400" />}
            label="Search"
            onClick={() => setIsSearchModalOpen(true)}
          />
          <SidebarItem
            icon={<Settings className="w-5 h-5 text-slate-400" />}
            label="Settings"
            onClick={() => setIsSettingsModalOpen(true)}
          />
        </div>
      </div>
    </DragContext.Provider>
  );
}
