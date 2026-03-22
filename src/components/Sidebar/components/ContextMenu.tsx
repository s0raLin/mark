import { useState, useRef, useEffect, useLayoutEffect } from "react";
import { Pin, Pencil, Trash2, FilePlus, FolderPlus } from "lucide-react";
import { FileNode } from "@/types/filesystem";

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
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      top:
        y + rect.height > window.innerHeight
          ? Math.max(0, window.innerHeight - rect.height - 8)
          : y,
      left:
        x + rect.width > window.innerWidth
          ? Math.max(0, window.innerWidth - rect.width - 8)
          : x,
    });
  }, [x, y]);

  // 初始位置设为 null，直到计算出正确位置
  const displayPos = pos ?? { top: y, left: x };

  useEffect(() => {
    const h = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  const isFolder = node.type === "folder";

  return (
    <div
      ref={ref}
      style={{ top: displayPos.top, left: displayPos.left }}
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-rose-100 py-1 min-w-[140px] text-sm"
    >
      {/* New File - only shown for folders */}
      {isFolder && onNewFile && (
        <button
          onClick={() => {
            onNewFile();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 text-slate-600"
        >
          <FilePlus className="w-3.5 h-3.5 text-primary" />
          New File
        </button>
      )}
      {/* New Folder - only shown for folders */}
      {isFolder && onNewFolder && (
        <button
          onClick={() => {
            onNewFolder();
            onClose();
          }}
          className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 text-slate-600"
        >
          <FolderPlus className="w-3.5 h-3.5 text-secondary" />
          New Folder
        </button>
      )}
      {(isFolder && (onNewFile || onNewFolder)) && <div className="border-t border-rose-100 my-1" />}
      <button
        onClick={() => {
          onTogglePin();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 text-slate-600"
      >
        <Pin className="w-3.5 h-3.5 text-primary" />
        {isPinned ? "Unpin" : "Pin"}
      </button>
      <button
        onClick={() => {
          onRename();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 text-slate-600"
      >
        <Pencil className="w-3.5 h-3.5 text-slate-400" />
        Rename
      </button>
      <button
        onClick={() => {
          onDelete();
          onClose();
        }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-400"
      >
        <Trash2 className="w-3.5 h-3.5" />
        Delete
      </button>
    </div>
  );
}
