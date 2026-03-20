import React, { useState, useRef, useEffect, useCallback } from "react";
import { SidebarItem } from "./SidebarItem";
import {
  FileText, Folder, FolderOpen, Pin, Search, Settings,
  FilePlus, FolderPlus, Trash2, Pencil, GripVertical,
} from "lucide-react";
import { FileNode, useFileSystem } from "@/src/hooks/useFileSystem";
import { cn } from "@/src/utils/cn";

interface SidebarProps {
  setIsSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSearchModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  fs: ReturnType<typeof useFileSystem>;
}

// ── helpers ───────────────────────────────────────────────────────────────────

function RenameInput({ initial, onConfirm, onCancel }: {
  initial: string; onConfirm: (v: string) => void; onCancel: () => void;
}) {
  const [val, setVal] = useState(initial.replace(/\.md$/, ""));
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.select(); }, []);
  return (
    <input ref={ref} value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => { if (e.key === "Enter") onConfirm(val); if (e.key === "Escape") onCancel(); }}
      onBlur={() => onConfirm(val)}
      onClick={(e) => e.stopPropagation()}
      className="flex-1 text-sm bg-white border border-primary/30 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-primary/20 min-w-0"
    />
  );
}

function ContextMenu({ x, y, node, isPinned, onRename, onDelete, onTogglePin, onClose }: {
  x: number; y: number; node: FileNode; isPinned: boolean;
  onRename: () => void; onDelete: () => void; onTogglePin: () => void; onClose: () => void;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState({ top: y, left: x });

  useEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      top: y + rect.height > window.innerHeight ? Math.max(0, window.innerHeight - rect.height - 8) : y,
      left: x + rect.width > window.innerWidth ? Math.max(0, window.innerWidth - rect.width - 8) : x,
    });
  }, [x, y]);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (!ref.current?.contains(e.target as Node)) onClose(); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, [onClose]);

  return (
    <div ref={ref} style={{ top: pos.top, left: pos.left }}
      className="fixed z-50 bg-white rounded-xl shadow-lg border border-rose-100 py-1 min-w-[140px] text-sm">
      <button onClick={() => { onTogglePin(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 text-slate-600">
        <Pin className="w-3.5 h-3.5 text-primary" />{isPinned ? "Unpin" : "Pin"}
      </button>
      <button onClick={() => { onRename(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-rose-50 text-slate-600">
        <Pencil className="w-3.5 h-3.5 text-slate-400" />Rename
      </button>
      <button onClick={() => { onDelete(); onClose(); }}
        className="w-full flex items-center gap-2 px-3 py-2 hover:bg-red-50 text-red-400">
        <Trash2 className="w-3.5 h-3.5" />Delete
      </button>
    </div>
  );
}

function NewItemDialog({ type, onConfirm, onCancel }: {
  type: "file" | "folder"; onConfirm: (name: string) => void; onCancel: () => void;
}) {
  const [val, setVal] = useState("");
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => { ref.current?.focus(); }, []);
  return (
    <div className="px-3 py-2">
      <input ref={ref} value={val} placeholder={type === "file" ? "filename.md" : "folder name"}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter" && val.trim()) onConfirm(val.trim()); if (e.key === "Escape") onCancel(); }}
        onBlur={() => { if (val.trim()) onConfirm(val.trim()); else onCancel(); }}
        className="w-full text-sm bg-white border border-primary/30 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}

// ── drag context ──────────────────────────────────────────────────────────────
// nodeId: which node is being dragged (null = not dragging)
// We use window-level pointermove/pointerup so events aren't blocked by pointer capture.

interface DragCtx {
  draggingId: string | null;
  draggingIdRef: React.MutableRefObject<string | null>;
  setDraggingId: (id: string | null) => void;
}

const DragContext = React.createContext<DragCtx>({
  draggingId: null,
  draggingIdRef: { current: null },
  setDraggingId: () => {},
});

// ── OS drop import (files/folders) ──────────────────────────────────────────

function isMarkdownLikeName(name: string, mimeType?: string) {
  return (
    mimeType === "text/plain" ||
    name.endsWith(".md") ||
    name.endsWith(".markdown")
  );
}

async function readAllDirectoryEntries(reader: any): Promise<any[]> {
  const results: any[] = [];
  // FileSystemDirectoryReader may need multiple readEntries calls.
  await new Promise<void>((resolve) => {
    const readBatch = () => {
      reader.readEntries(
        (entries: any[]) => {
          if (!entries || entries.length === 0) return resolve();
          results.push(...entries);
          readBatch();
        },
        () => resolve()
      );
    };
    readBatch();
  });
  return results;
}

async function fileEntryToFile(entry: any): Promise<File> {
  return new Promise<File>((resolve) => {
    entry.file((file: File) => resolve(file));
  });
}

async function importEntryIntoFs(
  entry: any,
  fs: ReturnType<typeof useFileSystem>,
  parentId: string | null
): Promise<void> {
  if (entry?.isFile) {
    const file = await fileEntryToFile(entry);
    const name = file.name;
    if (isMarkdownLikeName(name, file.type)) {
      const content = await file.text();
      fs.createFile(name, parentId, { open: false, initialContent: content });
    } else {
      fs.createFile(name, parentId, { open: false });
    }
    return;
  }

  if (entry?.isDirectory) {
    const folderId = fs.createFolder(entry.name, parentId);
    const reader = entry.createReader();
    const childEntries = await readAllDirectoryEntries(reader);
    for (const child of childEntries) {
      await importEntryIntoFs(child, fs, folderId);
    }
  }
}

async function importDroppedIntoFs(
  dataTransfer: DataTransfer,
  fs: ReturnType<typeof useFileSystem>,
  parentId: string | null
): Promise<void> {
  const items = Array.from(dataTransfer.items ?? []);
  const webkitEntries = items
    .map((item) => {
      try {
        return (item as any).webkitGetAsEntry?.() ?? null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (webkitEntries.length > 0) {
    for (const entry of webkitEntries) {
      await importEntryIntoFs(entry, fs, parentId);
    }
    return;
  }

  // Fallback: flat import (no folder structure).
  const files = Array.from(dataTransfer.files ?? []);
  for (const file of files) {
    const name = file.name;
    if (isMarkdownLikeName(name, file.type)) {
      const content = await file.text();
      fs.createFile(name, parentId, { open: false, initialContent: content });
    } else {
      fs.createFile(name, parentId, { open: false });
    }
  }
}

// ── drop target types ─────────────────────────────────────────────────────────

// insertBeforeId: insert dragged item before this node id; null = append at end
type DropTarget =
  | { kind: "reorder"; insertBeforeId: string | null }
  | { kind: "into"; folderId: string };

// ── drag list ─────────────────────────────────────────────────────────────────

interface DragListProps {
  nodes: FileNode[];
  onDrop: (draggedId: string, target: DropTarget) => void;
  renderNode: (node: FileNode) => React.ReactNode;
  className?: string;
}

function DragList({ nodes, onDrop, renderNode, className }: DragListProps) {
  const { draggingId, draggingIdRef } = React.useContext(DragContext);
  const [dropTarget, setDropTarget] = useState<DropTarget | null>(null);
  const itemRefs = useRef<(HTMLDivElement | null)[]>([]);
  const containerRef = useRef<HTMLDivElement>(null);
  // Keep a ref to latest nodes/onDrop so window listeners don't go stale
  const nodesRef = useRef(nodes);
  const onDropRef = useRef(onDrop);
  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { onDropRef.current = onDrop; }, [onDrop]);

  const resolveTarget = useCallback((clientY: number, clientX: number): DropTarget | null => {
    const id = draggingIdRef.current;
    if (!id) return null;

    // Build ordered list of non-dragged items with their rects
    const items: { node: FileNode; rect: DOMRect }[] = [];
    itemRefs.current.forEach((el, i) => {
      if (!el) return;
      const node = nodesRef.current[i];
      if (!node || node.id === id) return;
      items.push({ node, rect: el.getBoundingClientRect() });
    });

    if (items.length === 0) return null;

    // Above the first item → insert before first
    if (clientY <= items[0].rect.top) {
      return { kind: "reorder", insertBeforeId: items[0].node.id };
    }

    // Below the last item → append at end
    const last = items[items.length - 1];
    if (clientY >= last.rect.bottom) {
      return { kind: "reorder", insertBeforeId: null };
    }

    // Within the list
    for (let j = 0; j < items.length; j++) {
      const { node, rect } = items[j];

      // Drop into folder: hover over center 60% vertically
      if (node.type === "folder") {
        // Keep this "into" zone narrow to avoid stealing reorder drops
        // when user intends to insert before/after a sibling.
        const inXCentral = clientX >= rect.left + rect.width * 0.2 && clientX <= rect.right - rect.width * 0.2;
        const inYCentral = clientY >= rect.top + rect.height * 0.4 && clientY <= rect.bottom - rect.height * 0.4;
        if (inXCentral && inYCentral) return { kind: "into", folderId: node.id };
      }

      if (clientY < rect.bottom) {
        const midY = rect.top + rect.height / 2;
        if (clientY < midY) {
          // Before this item
          return { kind: "reorder", insertBeforeId: node.id };
        } else {
          // After this item = before the next item (or append if last)
          const next = items[j + 1];
          return { kind: "reorder", insertBeforeId: next?.node.id ?? null };
        }
      }
    }

    return { kind: "reorder", insertBeforeId: null };
  }, [draggingIdRef]);

  // Use a stable ref for resolveTarget too
  const resolveTargetRef = useRef(resolveTarget);
  useEffect(() => { resolveTargetRef.current = resolveTarget; }, [resolveTarget]);

  useEffect(() => {
    if (!draggingId) { setDropTarget(null); return; }

    const onMove = (e: PointerEvent) => {
      setDropTarget(resolveTargetRef.current(e.clientY, e.clientX));
    };
    const onUp = () => {
      // Read id from ref before anything clears it
      const id = draggingIdRef.current;
      setDropTarget((prev) => {
        if (id && prev) onDropRef.current(id, prev);
        return null;
      });
    };

    window.addEventListener("pointermove", onMove);
    // Use capture phase so we run before the global cancel in Sidebar
    window.addEventListener("pointerup", onUp, { capture: true, once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp, { capture: true });
    };
  }, [draggingId, draggingIdRef]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {nodes.map((node, i) => {
        const isDragging = draggingId === node.id;
        const isInto = dropTarget?.kind === "into" && dropTarget.folderId === node.id;
        // Show insert line before this node if it's the insertBeforeId
        const isInsertBefore = dropTarget?.kind === "reorder" && dropTarget.insertBeforeId === node.id;
        // Show insert line after this node if it's the last and insertBeforeId is null
        const isInsertAfter = dropTarget?.kind === "reorder" && dropTarget.insertBeforeId === null && i === nodes.length - 1;

        return (
          <div key={node.id} ref={(el) => { itemRefs.current[i] = el; }} className="relative">
            {isInsertBefore && <InsertLine />}
            <div className={cn(
              "rounded-xl transition-all duration-200",
              isDragging && "scale-105 shadow-lg ring-2 ring-primary/30 bg-white z-10",
              isInto && "ring-1 ring-primary/40 bg-primary/5",
            )}>
              {renderNode(node)}
            </div>
            {isInsertAfter && <InsertLine />}
          </div>
        );
      })}
    </div>
  );
}

function InsertLine() {
  return (
    <div className="flex items-center px-1 pointer-events-none">
      <div className="w-1.5 h-1.5 rounded-full bg-primary/50 shrink-0" />
      <div className="flex-1 h-px bg-primary/25" />
    </div>
  );
}

// ── grip handle ───────────────────────────────────────────────────────────────

function GripHandle({ nodeId }: { nodeId: string }) {
  const { setDraggingId } = React.useContext(DragContext);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startX = e.clientX;

    const onMove = (ev: PointerEvent) => {
      // Start drag when user moves meaningfully in any direction.
      if (Math.abs(ev.clientY - startY) > 4 || Math.abs(ev.clientX - startX) > 4) {
        cleanup();
        setDraggingId(nodeId);
      }
    };
    const onUp = () => cleanup();
    const cleanup = () => {
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp, { once: true });
  };

  return (
    <GripVertical
      onPointerDown={onPointerDown}
      className="w-3.5 h-3.5 text-slate-300 shrink-0 cursor-grab ml-auto"
    />
  );
}

// ── tree node ─────────────────────────────────────────────────────────────────

function TreeNode({ node, depth, fs }: {
  node: FileNode; depth: number; fs: ReturnType<typeof useFileSystem>;
}) {
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const [isDragOverFolder, setIsDragOverFolder] = useState(false);
  const isActive = fs.activeFileId === node.id;
  const isOpen = fs.expandedFolders.has(node.id);
  const children = node.type === "folder" ? fs.getChildren(node.id) : [];
  const isPinned = fs.pinnedIds.includes(node.id);

  const handleDrop = useCallback((draggedId: string, target: DropTarget) => {
    if (draggedId === node.id) return;
    if (target.kind === "into") {
      fs.moveNode(draggedId, target.folderId, null);
    } else {
      // Reorder within the current folder. For children lists, the "new parent"
      // must be this folder's id (not its own parent).
      fs.moveNode(draggedId, node.id, target.insertBeforeId);
    }
  }, [node, fs]);

  // Handle drop from OS file system into folder
  const handleOSDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFolder(false);
    
    if (node.type !== "folder") return;

    await importDroppedIntoFs(e.dataTransfer, fs, node.id);

    // Only open if currently closed (avoid toggle-close).
    if (!fs.expandedFolders.has(node.id)) fs.toggleFolder(node.id);
  }, [node, fs]);

  const handleOSDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.type === "folder") {
      setIsDragOverFolder(true);
    }
  }, [node.type]);

  const handleOSDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFolder(false);
  }, []);

  return (
    <div style={{ paddingLeft: depth > 0 ? `${depth * 12}px` : 0 }}>
      <div
        onContextMenu={(e) => { e.preventDefault(); e.stopPropagation(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
        onClick={() => { if (node.type === "folder") fs.toggleFolder(node.id); else fs.openFile(node.id); }}
        onDragOver={handleOSDragOver}
        onDragLeave={handleOSDragLeave}
        onDrop={handleOSDrop}
        className={cn(
          "flex items-center gap-2 rounded-xl px-2 py-2 transition-colors select-none cursor-default",
          isActive ? "bg-primary/10 text-slate-800" : "hover:bg-rose-50 text-slate-600",
          isDragOverFolder && "ring-2 ring-primary bg-primary/10",
          isPinned && "bg-amber-50/50"
        )}
      >
        {node.type === "folder"
          ? isOpen
            ? <FolderOpen className="w-4 h-4 text-accent shrink-0" />
            : <Folder className="w-4 h-4 text-secondary shrink-0" />
          : <FileText className="w-4 h-4 text-primary/70 shrink-0" />}
        {renaming ? (
          <RenameInput initial={node.name}
            onConfirm={(v) => { fs.renameNode(node.id, v); setRenaming(false); }}
            onCancel={() => setRenaming(false)} />
        ) : (
          <span className={cn("flex-1 truncate text-sm", isActive && "font-semibold")}>{node.name}</span>
        )}
        <GripHandle nodeId={node.id} />
      </div>

      {node.type === "folder" && isOpen && (
        <div className="border-l border-rose-100 ml-4">
          <DragList
            nodes={children}
            onDrop={handleDrop}
            renderNode={(child) => <TreeNode node={child} depth={depth + 1} fs={fs} />}
          />
          {children.length === 0 && (
            <p className="text-[11px] text-slate-300 px-4 py-1">Empty folder</p>
          )}
        </div>
      )}

      {ctxMenu && (
        <ContextMenu x={ctxMenu.x} y={ctxMenu.y} node={node}
          isPinned={isPinned}
          onRename={() => setRenaming(true)}
          onDelete={() => fs.deleteNode(node.id)}
          onTogglePin={() => fs.togglePin(node.id)}
          onClose={() => setCtxMenu(null)} />
      )}
    </div>
  );
}

// ── pinned item ───────────────────────────────────────────────────────────────

function PinnedItemRow({ node, fs }: { node: FileNode; fs: ReturnType<typeof useFileSystem> }) {
  const [renaming, setRenaming] = useState(false);
  const [ctxMenu, setCtxMenu] = useState<{ x: number; y: number } | null>(null);
  const isActive = fs.activeFileId === node.id;
  const isOpen = node.type === "folder" && fs.expandedFolders.has(node.id);
  const children = isOpen ? fs.getChildren(node.id) : [];

  const handleDrop = useCallback((draggedId: string, target: DropTarget) => {
    if (draggedId === node.id) return;
    if (target.kind === "into") {
      fs.moveNode(draggedId, target.folderId, null);
    } else {
      fs.moveNode(draggedId, node.id, target.insertBeforeId);
    }
  }, [node, fs]);

  // Handle drop from OS file system into folder
  const [isDragOverFolder, setIsDragOverFolder] = useState(false);
  
  const handleOSDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFolder(false);
    
    if (node.type !== "folder") return;

    await importDroppedIntoFs(e.dataTransfer, fs, node.id);
    if (!fs.expandedFolders.has(node.id)) fs.toggleFolder(node.id);
  }, [node, fs]);

  const handleOSDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (node.type === "folder") {
      setIsDragOverFolder(true);
    }
  }, [node.type]);

  const handleOSDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOverFolder(false);
  }, []);

  return (
    <div>
      <div
        onContextMenu={(e) => { e.preventDefault(); setCtxMenu({ x: e.clientX, y: e.clientY }); }}
        onClick={() => { if (node.type === "file") fs.openFile(node.id); else fs.toggleFolder(node.id); }}
        onDragOver={handleOSDragOver}
        onDragLeave={handleOSDragLeave}
        onDrop={handleOSDrop}
        className={cn(
          "flex items-center gap-2 rounded-xl px-2 py-2 transition-colors select-none cursor-default",
          isActive ? "bg-primary/10 text-slate-800" : "hover:bg-rose-50 text-slate-600",
          isDragOverFolder && "ring-2 ring-primary bg-primary/10",
        )}
      >
        {node.type === "folder"
          ? isOpen
            ? <FolderOpen className="w-4 h-4 text-accent shrink-0" />
            : <Folder className="w-4 h-4 text-secondary shrink-0" />
          : <Pin className="w-4 h-4 text-primary shrink-0" />}
        {renaming ? (
          <RenameInput initial={node.name}
            onConfirm={(v) => { fs.renameNode(node.id, v); setRenaming(false); }}
            onCancel={() => setRenaming(false)} />
        ) : (
          <span className={cn("flex-1 truncate text-sm", isActive && "font-semibold")}>{node.name}</span>
        )}
        <GripHandle nodeId={node.id} />
        {ctxMenu && (
          <ContextMenu x={ctxMenu.x} y={ctxMenu.y} node={node} isPinned
            onRename={() => setRenaming(true)}
            onDelete={() => fs.deleteNode(node.id)}
            onTogglePin={() => fs.togglePin(node.id)}
            onClose={() => setCtxMenu(null)} />
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

// ── main sidebar ──────────────────────────────────────────────────────────────

export default function Sidebar({ setIsSettingsModalOpen, setIsSearchModalOpen, fs }: SidebarProps) {
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

  const handleRootDrop = useCallback((draggedId: string, target: DropTarget) => {
    setDraggingId(null);
    if (fs.pinnedIds.includes(draggedId)) {
      fs.togglePin(draggedId);
    }
    if (target.kind === "into") {
      fs.moveNode(draggedId, target.folderId, null);
    } else {
      fs.moveNode(draggedId, null, target.insertBeforeId);
    }
  }, [fs]);

  const handlePinnedDrop = useCallback((draggedId: string, target: DropTarget) => {
    setDraggingId(null);
    if (target.kind === "into") return;

    const pinnedNodes = fs.pinnedNodes;
    const isAlreadyPinned = pinnedNodes.some((n) => n.id === draggedId);

    if (!isAlreadyPinned) {
      fs.togglePin(draggedId);
      return;
    }

    const fromIndex = pinnedNodes.findIndex((n) => n.id === draggedId);
    // insertBeforeId === null means append at end, so use pinnedNodes.length as the target index
    let toIndex = target.insertBeforeId === null
      ? pinnedNodes.length
      : pinnedNodes.findIndex((n) => n.id === target.insertBeforeId);

    // Adjust toIndex for splice-then-insert behavior
    // When moving forward (toIndex > fromIndex), we need to account for the removed item
    if (toIndex > fromIndex) {
      toIndex -= 1;
    }

    if (fromIndex >= 0 && toIndex >= 0 && fromIndex !== toIndex && toIndex < pinnedNodes.length) {
      fs.reorderPinned(fromIndex, toIndex);
    }
  }, [fs]);

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
    // Only set false if leaving the sidebar entirely
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

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);

    await importDroppedIntoFs(e.dataTransfer, fs, null);
  }, [fs]);

  return (
    <DragContext.Provider value={{ draggingId, draggingIdRef, setDraggingId }}>
      <div 
        className={cn(
          "flex flex-col h-full transition-all duration-300 relative",
          isDragOver && "ring-2 ring-dashed ring-primary bg-primary/5 scale-[1.02]"
        )}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragOver && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none z-20">
            <div className="bg-primary/90 text-white px-6 py-4 rounded-2xl shadow-xl">
              <div className="flex items-center gap-3">
                <FolderPlus className="w-6 h-6" />
                <span className="text-lg font-semibold">Drop files here</span>
              </div>
            </div>
          </div>
        )}
        <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6">

          {/* Pinned */}
          {fs.pinnedNodes.length > 0 && (
            <section>
              <div className="px-3 mb-2">
                <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-300">Pinned</h2>
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
              <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-300">Explorer</h2>
              <div className="flex items-center gap-1">
                <button title="New file" onClick={() => setNewItem("file")}
                  className="p-1 rounded-lg hover:bg-rose-50 transition-colors">
                  <FilePlus className="w-3.5 h-3.5 text-rose-300 hover:text-primary" />
                </button>
                <button title="New folder" onClick={() => setNewItem("folder")}
                  className="p-1 rounded-lg hover:bg-rose-50 transition-colors">
                  <FolderPlus className="w-3.5 h-3.5 text-rose-300 hover:text-primary" />
                </button>
              </div>
            </div>

            {newItem && (
              <NewItemDialog type={newItem}
                onConfirm={(name) => {
                  if (newItem === "file") fs.createFile(name);
                  else fs.createFolder(name);
                  setNewItem(null);
                }}
                onCancel={() => setNewItem(null)} />
            )}

            {rootNodes.length === 0
              ? <p className="text-xs text-slate-300 px-3 py-2">No files yet</p>
              : <DragList
                  nodes={rootNodes}
                  onDrop={handleRootDrop}
                  renderNode={(node) => <TreeNode node={node} depth={0} fs={fs} />}
                />
            }
          </section>

        </div>

        <div className="p-4 border-t border-rose-100 space-y-1 shrink-0">
          <SidebarItem icon={<Search className="w-5 h-5 text-slate-400" />} label="Search"
            onClick={() => setIsSearchModalOpen(true)} />
          <SidebarItem icon={<Settings className="w-5 h-5 text-slate-400" />} label="Settings"
            onClick={() => setIsSettingsModalOpen(true)} />
        </div>
      </div>
    </DragContext.Provider>
  );
}
