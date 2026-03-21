import React, { useState, useCallback } from "react";
import { Folder, FolderOpen, Pin } from "lucide-react";
import { FileNode, FileSystemAPI } from "@/types/filesystem";
import { cn } from "@/utils/cn";
import { DropTarget } from "../types";
import RenameInput from "./RenameInput";
import ContextMenu from "./ContextMenu";
import GripHandle from "./GripHandle";
import DragList from "./DragList";
import TreeNode from "./TreeNode";
import { importDroppedIntoFs } from "../utils";

interface PinnedItemRowProps {
  node: FileNode;
  fs: FileSystemAPI;
}

export default function PinnedItemRow({
  node,
  fs,
}: PinnedItemRowProps) {
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const isActive = fs.activeFileId === node.id;
  const isOpen = node.type === "folder" && fs.expandedFolders.has(node.id);
  const children = isOpen ? fs.getChildren(node.id) : [];

  const handleDrop = useCallback(
    (draggedId: string, target: DropTarget) => {
      if (draggedId === node.id) return;
      if (target.kind === "into") {
        fs.moveNode(draggedId, target.folderId, null);
      } else {
        fs.moveNode(draggedId, node.id, target.insertBeforeId);
      }
    },
    [node, fs],
  );

  // Handle drop from OS file system into folder
  const [isDragOverFolder, setIsDragOverFolder] = useState(false);

  const handleOSDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOverFolder(false);

      if (node.type !== "folder") return;

      await importDroppedIntoFs(e.dataTransfer, fs, node.id);
      if (!fs.expandedFolders.has(node.id)) fs.toggleFolder(node.id);
    },
    [node, fs],
  );

  const handleOSDragOver = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      if (node.type === "folder") {
        setIsDragOverFolder(true);
      }
    },
    [node.type],
  );

  const handleOSDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFolder(false);
  }, []);

  return (
    <div>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          setCtxMenu({ x: e.clientX, y: e.clientY });
        }}
        onClick={() => {
          if (node.type === "file") fs.openFile(node.id);
          else fs.toggleFolder(node.id);
        }}
        onDragOver={handleOSDragOver}
        onDragLeave={handleOSDragLeave}
        onDrop={handleOSDrop}
        className={cn(
          "flex items-center gap-2 rounded-xl px-2 py-2 transition-colors select-none cursor-default",
          isActive
            ? "bg-primary/10 text-slate-800"
            : "hover:bg-rose-50 text-slate-600",
          isDragOverFolder && "bg-primary/8 text-slate-800",
        )}
      >
        {node.type === "folder" ? (
          isOpen ? (
            <FolderOpen className="w-4 h-4 text-accent shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-secondary shrink-0" />
          )
        ) : (
          <Pin className="w-4 h-4 text-primary shrink-0" />
        )}
        {renaming ? (
          <RenameInput
            initial={node.name}
            onConfirm={(v) => {
              fs.renameNode(node.id, v);
              setRenaming(false);
            }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <span
            className={cn(
              "flex-1 truncate text-sm",
              isActive && "font-semibold",
            )}
          >
            {node.name}
          </span>
        )}
        <GripHandle nodeId={node.id} />
        {ctxMenu && (
          <ContextMenu
            x={ctxMenu.x}
            y={ctxMenu.y}
            node={node}
            isPinned
            onRename={() => setRenaming(true)}
            onDelete={() => fs.deleteNode(node.id)}
            onTogglePin={() => fs.togglePin(node.id)}
            onClose={() => setCtxMenu(null)}
          />
        )}
      </div>

      {/* Folder children rendered inline under pinned folder */}
      {isOpen && (
        <div className="border-l border-rose-100 ml-4">
          <DragList
            nodes={children}
            onDrop={handleDrop}
            renderNode={(child) => <TreeNode node={child} depth={1} fs={fs} />}
          />
          {children.length === 0 && (
            <p className="text-[11px] text-slate-300 px-4 py-1">Empty folder</p>
          )}
        </div>
      )}
    </div>
  );
}
