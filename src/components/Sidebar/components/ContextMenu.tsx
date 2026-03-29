import {
  ClipboardPaste,
  Copy,
  FilePlus,
  FolderPlus,
  Pencil,
  Pin,
  Scissors,
  Trash2,
} from "lucide-react";
import { FileNode } from "@/types/filesystem";
import ContextMenuSurface, { ContextMenuAction } from "@/components/ContextMenuSurface";

interface ContextMenuProps {
  x: number;
  y: number;
  node: FileNode;
  isPinned: boolean;
  canPin?: boolean;
  selectionCount?: number;
  canPaste?: boolean;
  onRename: () => void;
  onDelete: () => void;
  onTogglePin: () => void;
  onCopy: () => void;
  onCut: () => void;
  onPaste?: () => void;
  onClose: () => void;
  onNewFile?: () => void;
  onNewFolder?: () => void;
}

export default function ContextMenu({
  x,
  y,
  node,
  isPinned,
  canPin = true,
  selectionCount = 1,
  canPaste = false,
  onRename,
  onDelete,
  onTogglePin,
  onCopy,
  onCut,
  onPaste,
  onClose,
  onNewFile,
  onNewFolder,
}: ContextMenuProps) {
  const isFolder = node.type === "folder";
  const isMultiSelection = selectionCount > 1;
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
      id: "copy",
      label: isMultiSelection ? `Copy ${selectionCount} Items` : "Copy",
      icon: <Copy className="w-3.5 h-3.5 text-slate-400" />,
      onSelect: onCopy,
      separatorBefore: isFolder && (Boolean(onNewFile) || Boolean(onNewFolder)),
    },
    {
      id: "cut",
      label: isMultiSelection ? `Cut ${selectionCount} Items` : "Cut",
      icon: <Scissors className="w-3.5 h-3.5 text-slate-400" />,
      onSelect: onCut,
    },
    ...(isFolder && onPaste
      ? [{
        id: "paste",
        label: "Paste",
        icon: <ClipboardPaste className="w-3.5 h-3.5 text-primary" />,
        onSelect: onPaste,
        disabled: !canPaste,
      } satisfies ContextMenuAction]
      : []),
    ...(canPin
      ? [{
        id: "pin",
        label: isPinned ? "Unpin" : "Pin",
        icon: <Pin className="w-3.5 h-3.5 text-primary" />,
        onSelect: onTogglePin,
        separatorBefore: true,
      } satisfies ContextMenuAction]
      : []),
    {
      id: "rename",
      label: isMultiSelection ? "Rename First Item" : "Rename",
      icon: <Pencil className="w-3.5 h-3.5 text-slate-400" />,
      onSelect: onRename,
    },
    {
      id: "delete",
      label: isMultiSelection ? `Delete ${selectionCount} Items` : "Delete",
      icon: <Trash2 className="w-3.5 h-3.5" />,
      onSelect: onDelete,
      danger: true,
      separatorBefore: !canPin,
    },
  );

  return <ContextMenuSurface x={x} y={y} actions={actions} onClose={onClose} minWidthClassName="min-w-[148px]" />;
}
