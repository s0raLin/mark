import { FilePlus, FolderPlus, Pencil, Pin, Trash2 } from "lucide-react";
import { FileNode } from "@/types/filesystem";
import ContextMenuSurface, { ContextMenuAction } from "@/components/ContextMenuSurface";

interface ContextMenuProps {
  x: number;
  y: number;
  node: FileNode;
  isPinned: boolean;
  onRename: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onClose: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
}

export default function ContextMenu({
  x,
  y,
  node,
  isPinned,
  onRename,
  onDelete,
  onTogglePin,
  onClose,
  onNewFile,
  onNewFolder,
}: ContextMenuProps) {
  const isFolder = node.type === "folder";
  const actions: ContextMenuAction[] = [];

  if (isFolder && onNewFile) {
    actions.push({
      id: "new-file",
      label: "New File",
      icon: <FilePlus className="w-3.5 h-3.5 text-primary" />,
      onSelect: onNewFile,
    });
  }
  if (isFolder && onNewFolder) {
    actions.push({
      id: "new-folder",
      label: "New Folder",
      icon: <FolderPlus className="w-3.5 h-3.5 text-secondary" />,
      onSelect: onNewFolder,
    });
  }

  actions.push(
    {
      id: "pin",
      label: isPinned ? "Unpin" : "Pin",
      icon: <Pin className="w-3.5 h-3.5 text-primary" />,
      onSelect: onTogglePin,
      separatorBefore: isFolder && (Boolean(onNewFile) || Boolean(onNewFolder)),
    },
    {
      id: "rename",
      label: "Rename",
      icon: <Pencil className="w-3.5 h-3.5 text-slate-400" />,
      onSelect: onRename,
    },
    {
      id: "delete",
      label: "Delete",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onSelect: onDelete,
      danger: true,
    },
  );

  return <ContextMenuSurface x={x} y={y} actions={actions} onClose={onClose} minWidthClassName="min-w-[148px]" />;
}
