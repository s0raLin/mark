import React, { useState, useCallback } from "react";
import { ChevronRight, FileText, Folder, FolderOpen } from "lucide-react";
import { FileNode, FileSystemAPI } from "@/types/filesystem";
import { cn } from "@/utils/cn";
import RenameInput from "./RenameInput";
import ContextMenu from "./ContextMenu";
import GripHandle from "./GripHandle";
import DragList from "./DragList";
import NewItemDialog from "./NewItemDialog";
import { importDroppedIntoFs } from "../utils";
interface TreeNodeProps {
  node: FileNode;
  depth: number;
  fs: FileSystemAPI;
}

export default function TreeNode({ node, depth, fs }: TreeNodeProps) {
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [newItem, setNewItem] = useState<"file" | "folder" | null>(null);
  const [isDragOverFolder, setIsDragOverFolder] = useState(false);

  const isActive = fs.activeFileId === node.id;
  const isOpen = node.type === "folder" && fs.expandedFolders.has(node.id);
  const children = node.type === "folder" ? fs.getChildren(node.id) : [];
  const isPinned = fs.pinnedIds.includes(node.id);

  // OS file drag-over
  const handleOSDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.type === "folder") setIsDragOverFolder(true);
  }, [node.type]);

  const handleOSDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFolder(false);
  }, []);

  const handleOSDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFolder(false);
    if (node.type !== "folder") return;
    await importDroppedIntoFs(e.dataTransfer, fs, node.id);
    if (!fs.expandedFolders.has(node.id)) fs.toggleFolder(node.id);
  }, [node, fs]);

  return (
    <div style={{ paddingLeft: depth > 0 ? `${depth * 12}px` : 0 }}>
      <div
        onContextMenu={(e) => {
          e.preventDefault();
          e.stopPropagation();
          if (node.type === "file") fs.openFile(node.id);
          setCtxMenu({ x: e.clientX, y: e.clientY });
        }}
        onClick={() => {
          if (renaming) return;
          if (node.type === "folder") fs.toggleFolder(node.id);
          else fs.openFile(node.id);
        }}
        onDragOver={handleOSDragOver}
        onDragLeave={handleOSDragLeave}
        onDrop={handleOSDrop}
        data-folder={node.type === "folder" ? "true" : undefined}
        data-node-id={node.id}
        className={cn(
          "group/sidebar-row flex items-center gap-2 rounded-xl px-2 py-2 transition-colors select-none cursor-pointer",
          isActive ? "bg-primary/[0.12] text-primary font-semibold" : "hover:bg-primary/[0.08] text-slate-600",
          (isDragOverFolder) && "bg-primary/[0.08] ring-1 ring-primary/30",
          isPinned && !isActive && "bg-amber-50/50",
        )}
      >
        {node.type === "folder" && (
          <ChevronRight className={cn("w-3.5 h-3.5 shrink-0 text-slate-300 transition-transform", isOpen && "rotate-90")} />
        )}
        {node.type === "folder" ? (
          isOpen
            ? <FolderOpen className="w-4 h-4 text-accent shrink-0" />
            : <Folder className="w-4 h-4 text-secondary shrink-0" />
        ) : (
          <FileText className="w-4 h-4 text-primary/70 shrink-0" />
        )}

        {renaming ? (
          <RenameInput
            initial={node.name}
            onConfirm={(v) => { fs.renameNode(node.id, v); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <span className={cn("flex-1 truncate text-sm", isActive && "font-bold")}>
            {node.name}
          </span>
        )}
        <GripHandle nodeId={node.id} />
      </div>

      {node.type === "folder" && isOpen && (
        <div className="border-l border-primary/20 ml-4">
          <DragList
            nodes={children}
            parentId={node.id}
            renderNode={(child) => <TreeNode node={child} depth={depth + 1} fs={fs} />}
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
          onNewFile={node.type === "folder" ? () => setNewItem("file") : undefined}
          onNewFolder={node.type === "folder" ? () => setNewItem("folder") : undefined}
        />
      )}

      {newItem && (
        <NewItemDialog
          type={newItem}
          onConfirm={(name) => {
            if (newItem === "file") fs.createFile(name, node.id);
            else fs.createFolder(name, node.id);
            if (!fs.expandedFolders.has(node.id)) fs.toggleFolder(node.id);
            setNewItem(null);
            setCtxMenu(null);
          }}
          onCancel={() => { setNewItem(null); setCtxMenu(null); }}
        />
      )}
    </div>
  );
}
