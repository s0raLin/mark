import React, { useState, useCallback } from "react";
import { ChevronRight, Folder, FolderOpen, Pin } from "lucide-react";
import { FileNode, FileSystemAPI } from "@/types/filesystem";
import { cn } from "@/utils/cn";
import RenameInput from "./RenameInput";
import ContextMenu from "./ContextMenu";
import GripHandle from "./GripHandle";
import DragList from "./DragList";
import TreeNode from "./TreeNode";
import NewItemDialog from "./NewItemDialog";
import { importDroppedIntoFs } from "../utils";

interface PinnedItemRowProps {
  node: FileNode;
  fs: FileSystemAPI;
  isSelected: boolean;
  selectionCount: number;
  onNodeClick: (node: FileNode, event: React.MouseEvent<HTMLDivElement>) => void;
  onNodeContextMenu: (node: FileNode, event: React.MouseEvent<HTMLDivElement>) => void;
}

export default function PinnedItemRow({
  node,
  fs,
  isSelected,
  selectionCount,
  onNodeClick,
  onNodeContextMenu,
}: PinnedItemRowProps) {
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [isDragOverFolder, setIsDragOverFolder] = useState(false);
  const [newItem, setNewItem] = useState<"file" | "folder" | null>(null);
  const isExternalFileDrag = useCallback((dataTransfer: DataTransfer | null) => {
    if (!dataTransfer) {
      return false;
    }

    return Array.from(dataTransfer.types ?? []).includes("Files");
  }, []);

  const isActive = fs.activeFileId === node.id;
  const isOpen = node.type === "folder" && fs.expandedFolders.has(node.id);
  const children = isOpen ? fs.getChildren(node.id) : [];

  const handleOSDragOver = useCallback((e: React.DragEvent) => {
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    if (node.type === "folder") setIsDragOverFolder(true);
  }, [isExternalFileDrag, node.type]);

  const handleOSDragLeave = useCallback((e: React.DragEvent) => {
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFolder(false);
  }, [isExternalFileDrag]);

  const handleOSDrop = useCallback(async (e: React.DragEvent) => {
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFolder(false);
    if (node.type !== "folder") return;
    await importDroppedIntoFs(e.dataTransfer, fs, node.id);
    if (!fs.expandedFolders.has(node.id)) fs.toggleFolder(node.id);
  }, [fs, isExternalFileDrag, node]);

  return (
    <div>
      <div
        onContextMenu={(e) => {
          if (renaming) return;
          onNodeContextMenu(node, e);
          setCtxMenu({ x: e.clientX, y: e.clientY });
        }}
        onClick={(e) => {
          if (renaming) return;
          onNodeClick(node, e);
        }}
        onDragOver={handleOSDragOver}
        onDragLeave={handleOSDragLeave}
        onDrop={handleOSDrop}
        data-folder={node.type === "folder" ? "true" : undefined}
        data-node-id={node.id}
        className={cn(
          "group/sidebar-row flex items-center gap-2 rounded-xl px-2 py-2 transition-colors select-none cursor-pointer",
          isActive
            ? "bg-primary/[0.12] text-primary font-semibold"
            : isSelected
              ? "bg-primary/[0.08] text-primary/90 ring-1 ring-primary/15"
              : "hover:bg-primary/[0.08] text-slate-600",
          (isDragOverFolder) && "bg-primary/[0.08] ring-1 ring-primary/30",
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
          <Pin className="w-4 h-4 text-primary shrink-0" />
        )}
        {renaming ? (
          <RenameInput
            initial={node.name}
            onConfirm={(v) => { fs.renameNode(node.id, v); setRenaming(false); }}
            onCancel={() => setRenaming(false)}
          />
        ) : (
          <span className={cn("flex-1 truncate text-sm", (isActive || isSelected) && "font-bold")}>
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
            selectionCount={selectionCount}
            canPaste={fs.canPasteNodes()}
            onRename={() => setRenaming(true)}
            onDelete={() => fs.deleteSelectedNodes([node.id])}
            onTogglePin={() => fs.togglePin(node.id)}
            onCopy={() => fs.copySelectedNodes([node.id])}
            onCut={() => fs.cutSelectedNodes([node.id])}
            onPaste={node.type === "folder" ? () => void fs.pasteNodes(node.id) : undefined}
            onClose={() => setCtxMenu(null)}
            onNewFile={node.type === "folder" ? () => setNewItem("file") : undefined}
            onNewFolder={node.type === "folder" ? () => setNewItem("folder") : undefined}
          />
        )}
      </div>

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

      {isOpen && (
        <div className="border-l border-primary/20 ml-4">
          <DragList
            nodes={children}
            parentId={node.id}
            renderNode={(child) => (
              <TreeNode
                node={child}
                depth={1}
                fs={fs}
                isSelected={fs.isNodeSelected(child.id)}
                selectionCount={selectionCount}
                onNodeClick={onNodeClick}
                onNodeContextMenu={onNodeContextMenu}
              />
            )}
          />
          {children.length === 0 && (
            <p className="text-[11px] text-slate-300 px-4 py-1">Empty folder</p>
          )}
        </div>
      )}
    </div>
  );
}
