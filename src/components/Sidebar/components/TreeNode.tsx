import React, { useState, useCallback } from "react";
import { FileText, Folder, FolderOpen } from "lucide-react";
import { FileNode, FileSystemAPI } from "@/src/types/filesystem";
import { cn } from "@/src/utils/cn";
import { DropTarget } from "../types";
import RenameInput from "./RenameInput";
import ContextMenu from "./ContextMenu";
import GripHandle from "./GripHandle";
import DragList from "./DragList";
import { importDroppedIntoFs } from "../utils";

interface TreeNodeProps {
  node: FileNode;
  depth: number;
  fs: FileSystemAPI;
}

export default function TreeNode({
  node,
  depth,
  fs,
}: TreeNodeProps) {
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [isDragOverFolder, setIsDragOverFolder] = useState(false);
  const isActive = fs.activeFileId === node.id;
  const isOpen = fs.expandedFolders.has(node.id);
  const children = node.type === "folder" ? fs.getChildren(node.id) : [];
  const isPinned = fs.pinnedIds.includes(node.id);

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
  const handleOSDrop = useCallback(
    async (e: React.DragEvent) => {
      e.preventDefault();
      e.stopPropagation();
      setIsDragOverFolder(false);

      if (node.type !== "folder") return;

      await importDroppedIntoFs(e.dataTransfer, fs, node.id);

      // Only open if currently closed (avoid toggle-close).
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
    <div style={{ paddingLeft: depth > 0 ? `${depth * 12}px` : 0 }}>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setCtxMenu({ x: e.clientX, y: e.clientY });
        }}
        onClick={() => {
          if (node.type === "folder") fs.toggleFolder(node.id);
          else fs.openFile(node.id);
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
          isPinned && "bg-amber-50/50",
        )}
      >
        {node.type === "folder" ? (
          isOpen ? (
            <FolderOpen className="w-4 h-4 text-accent shrink-0" />
          ) : (
            <Folder className="w-4 h-4 text-secondary shrink-0" />
          )
        ) : (
          <FileText className="w-4 h-4 text-primary/70 shrink-0" />
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
      </div>

      {node.type === "folder" && isOpen && (
        <div className="border-l border-rose-100 ml-4">
          <DragList
            nodes={children}
            onDrop={handleDrop}
            renderNode={(child) => (
              <TreeNode node={child} depth={depth + 1} fs={fs} />
            )}
          />
          {children.length === 0 && (
            <p className="text-[11px] text-slate-300 px-4 py-1">Empty folder</p>
          )}
        </div>
      )}

      {ctxMenu && (
        <ContextMenu
          x={ctxMenu.x}
          y={ctxMenu.y}
          node={node}
          isPinned={isPinned}
          onRename={() => setRenaming(true)}
          onDelete={() => fs.deleteNode(node.id)}
          onTogglePin={() => fs.togglePin(node.id)}
          onClose={() => setCtxMenu(null)}
        />
      )}
    </div>
  );
}
