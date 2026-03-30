import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { SidebarItem } from "./SidebarItem";
import {
  ChevronDown,
  ClipboardPaste,
  FilePlus,
  FolderPlus,
  Search,
  Settings,
  Trash2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { SidebarProps, DragContext, ResolvedDrop } from "./types";
import { NewItemDialog, DragList, TreeNode, PinnedItemRow } from "./components";
import { importDroppedIntoFs } from "./utils";
import SidebarAreaMenu from "./components/SidebarAreaMenu";
import { useFileSystemContext } from "@/contexts/FileSystemContext";

type SidebarSectionId = "pinned" | "explorer" | "recycle";

const DEFAULT_SECTION_ORDER: SidebarSectionId[] = ["pinned", "explorer", "recycle"];
const DEFAULT_COLLAPSED: Record<SidebarSectionId, boolean> = {
  pinned: false,
  explorer: false,
  recycle: false,
};

export default function Sidebar({ setIsSettingsModalOpen, setIsSearchModalOpen }: SidebarProps) {
  const fs = useFileSystemContext();
  const [newItem, setNewItem] = useState<"file" | "folder" | null>(null);
  const [draggingId, setDraggingIdState] = useState<string | null>(null);
  const [dropTarget, setDropTargetState] = useState<ResolvedDrop | null>(null);
  const [isDragOver, setIsDragOver] = useState(false);
  const [areaMenu, setAreaMenu] = useState<{ x: number; y: number } | null>(null);
  const [sectionOrder, setSectionOrder] = useState<SidebarSectionId[]>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_SECTION_ORDER;
    }

    try {
      const raw = window.localStorage.getItem("notemark:sidebar-section-order");
      const parsed = raw ? JSON.parse(raw) : null;
      if (Array.isArray(parsed)) {
        const filtered = parsed.filter((id): id is SidebarSectionId =>
          DEFAULT_SECTION_ORDER.includes(id as SidebarSectionId),
        );
        const missing = DEFAULT_SECTION_ORDER.filter((id) => !filtered.includes(id));
        return [...filtered, ...missing];
      }
    } catch {
      // ignore invalid local storage
    }

    return DEFAULT_SECTION_ORDER;
  });
  const [collapsedSections, setCollapsedSections] = useState<Record<SidebarSectionId, boolean>>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_COLLAPSED;
    }

    try {
      const raw = window.localStorage.getItem("notemark:sidebar-section-collapsed");
      const parsed = raw ? JSON.parse(raw) : null;
      if (parsed && typeof parsed === "object") {
        return {
          pinned: Boolean(parsed.pinned),
          explorer: Boolean(parsed.explorer),
          recycle: Boolean(parsed.recycle),
        };
      }
    } catch {
      // ignore invalid local storage
    }

    return DEFAULT_COLLAPSED;
  });
  const [draggingSection, setDraggingSection] = useState<SidebarSectionId | null>(null);
  const [sectionDropTarget, setSectionDropTarget] = useState<{
    id: SidebarSectionId | "bottom";
    position: "before" | "after";
  } | null>(null);

  const draggingIdRef = useRef<string | null>(null);
  const dropTargetRef = useRef<ResolvedDrop | null>(null);
  const rootRef = useRef<HTMLDivElement | null>(null);
  const footerRef = useRef<HTMLDivElement | null>(null);
  const lastSectionDragPointRef = useRef<{ x: number; y: number } | null>(null);
  const sectionDropCommittedRef = useRef(false);

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
  const trashNodes = fs.getTrashNodes();
  const selectionCount = fs.selectedNodeIds.size;

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "notemark:sidebar-section-order",
      JSON.stringify(sectionOrder),
    );
  }, [sectionOrder]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(
      "notemark:sidebar-section-collapsed",
      JSON.stringify(collapsedSections),
    );
  }, [collapsedSections]);

  const visibleNodeIds = useMemo(() => {
    const orderedIds: string[] = [];
    const visited = new Set<string>();

    const walk = (node: typeof rootNodes[number]) => {
      if (!visited.has(node.id)) {
        orderedIds.push(node.id);
        visited.add(node.id);
      }
      if (node.type === "folder" && fs.expandedFolders.has(node.id)) {
        fs.getChildren(node.id).forEach(walk);
      }
    };

    pinnedNodes.forEach(walk);
    rootNodes.forEach(walk);
    trashNodes.forEach(walk);
    return orderedIds;
  }, [fs, pinnedNodes, rootNodes, trashNodes]);

  const focusSidebar = useCallback(() => {
    rootRef.current?.focus();
  }, []);

  const toggleSection = useCallback((sectionId: SidebarSectionId) => {
    setCollapsedSections((prev) => ({
      ...prev,
      [sectionId]: !prev[sectionId],
    }));
  }, []);

  const moveSection = useCallback((
    source: SidebarSectionId,
    target: SidebarSectionId,
    position: "before" | "after",
  ) => {
    if (source === target) {
      return;
    }

    setSectionOrder((prev) => {
      const current = prev.filter((id) => id !== source);
      const targetIndex = current.indexOf(target);
      if (targetIndex === -1) {
        return [...current, source];
      }

      const insertIndex = position === "before" ? targetIndex : targetIndex + 1;
      current.splice(insertIndex, 0, source);
      return current;
    });
  }, []);

  const createSectionDragPreview = useCallback((title: string) => {
    if (typeof document === "undefined") {
      return null;
    }

    const preview = document.createElement("div");
    preview.style.position = "fixed";
    preview.style.top = "-9999px";
    preview.style.left = "-9999px";
    preview.style.padding = "8px 12px";
    preview.style.borderRadius = "12px";
    preview.style.border = "1px solid rgba(99,102,241,0.22)";
    preview.style.background = "linear-gradient(180deg, rgba(255,255,255,0.96), rgba(248,250,252,0.94))";
    preview.style.boxShadow = "0 16px 32px -20px rgba(99,102,241,0.45), 0 8px 18px -16px rgba(15,23,42,0.45)";
    preview.style.backdropFilter = "blur(14px)";
    preview.style.setProperty("-webkit-backdrop-filter", "blur(14px)");
    preview.style.color = "#334155";
    preview.style.fontSize = "12px";
    preview.style.fontWeight = "700";
    preview.style.textTransform = "uppercase";
    preview.style.letterSpacing = "0.14em";
    preview.style.pointerEvents = "none";
    preview.style.userSelect = "none";
    preview.textContent = title;
    document.body.appendChild(preview);
    return preview;
  }, []);

  const selectRange = useCallback((targetId: string) => {
    const anchorId = fs.selectionAnchorId ?? fs.activeFileId ?? targetId;
    const startIndex = visibleNodeIds.indexOf(anchorId);
    const endIndex = visibleNodeIds.indexOf(targetId);

    if (startIndex === -1 || endIndex === -1) {
      fs.replaceNodeSelection([targetId], targetId);
      return;
    }

    const [from, to] = startIndex < endIndex ? [startIndex, endIndex] : [endIndex, startIndex];
    fs.replaceNodeSelection(visibleNodeIds.slice(from, to + 1), anchorId);
  }, [fs, visibleNodeIds]);

  const handleNodeClick = useCallback((node: typeof rootNodes[number], event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    focusSidebar();

    const isAdditive = event.metaKey || event.ctrlKey;
    if (event.shiftKey) {
      selectRange(node.id);
      return;
    }

    if (isAdditive) {
      fs.toggleNodeSelection(node.id);
      return;
    }

    fs.replaceNodeSelection([node.id], node.id);
    if (node.type === "folder") {
      fs.toggleFolder(node.id);
    } else {
      fs.openFile(node.id);
    }
  }, [focusSidebar, fs, selectRange]);

  const handleNodeContextMenu = useCallback((node: typeof rootNodes[number], event: React.MouseEvent<HTMLDivElement>) => {
    event.preventDefault();
    event.stopPropagation();
    focusSidebar();

    if (!fs.isNodeSelected(node.id)) {
      fs.replaceNodeSelection([node.id], node.id);
    }

    if (node.type === "file") {
      fs.openFile(node.id);
    }
  }, [focusSidebar, fs]);

  const handleSidebarKeyDown = useCallback((event: React.KeyboardEvent<HTMLDivElement>) => {
    const isModifier = event.ctrlKey || event.metaKey;
    const lowerKey = event.key.toLowerCase();

    if (isModifier && lowerKey === "a") {
      event.preventDefault();
      if (visibleNodeIds.length === 0) {
        fs.clearNodeSelection();
        return;
      }

      fs.replaceNodeSelection(visibleNodeIds, fs.selectionAnchorId ?? visibleNodeIds[0]);
      return;
    }

    if (isModifier && lowerKey === "c") {
      event.preventDefault();
      fs.copySelectedNodes();
      return;
    }

    if (isModifier && lowerKey === "x") {
      event.preventDefault();
      fs.cutSelectedNodes();
      return;
    }

    if (isModifier && lowerKey === "v") {
      event.preventDefault();
      void fs.pasteNodes();
      return;
    }

    if (event.key === "Delete" || event.key === "Backspace") {
      event.preventDefault();
      void fs.deleteSelectedNodes();
    }
  }, [fs, visibleNodeIds]);
  const isExternalFileDrag = useCallback((dataTransfer: DataTransfer | null) => {
    if (!dataTransfer) {
      return false;
    }

    return Array.from(dataTransfer.types ?? []).includes("Files");
  }, []);

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
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";
    setIsDragOver(true);
  }, [isExternalFileDrag]);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    if (e.clientX <= rect.left || e.clientX >= rect.right ||
        e.clientY <= rect.top || e.clientY >= rect.bottom) {
      setIsDragOver(false);
    }
  }, [isExternalFileDrag]);

  const handleDrop = useCallback(async (e: React.DragEvent) => {
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    setIsDragOver(false);
    await importDroppedIntoFs(e.dataTransfer, fs, null);
  }, [fs, isExternalFileDrag]);

  const moveSectionToBottom = useCallback((sectionId: SidebarSectionId) => {
    setSectionOrder((prev) => {
      const next = prev.filter((id) => id !== sectionId);
      return [...next, sectionId];
    });
  }, []);

  const isBottomSectionHotzone = useCallback((clientX: number, clientY: number) => {
    const footerRect = footerRef.current?.getBoundingClientRect();
    if (!footerRect) {
      return false;
    }

    return (
      clientY >= footerRect.top - 24 &&
      clientY <= footerRect.top + 18 &&
      clientX >= footerRect.left &&
      clientX <= footerRect.right
    );
  }, []);

  const activateBottomSectionDrop = useCallback((event: React.DragEvent<HTMLElement>) => {
    if (!draggingSection) {
      return false;
    }

    lastSectionDragPointRef.current = { x: event.clientX, y: event.clientY };

    if (!isBottomSectionHotzone(event.clientX, event.clientY)) {
      return false;
    }

    event.preventDefault();
    event.stopPropagation();
    if (sectionDropTarget?.id !== "bottom") {
      setSectionDropTarget({ id: "bottom", position: "after" });
    }
    return true;
  }, [draggingSection, isBottomSectionHotzone, sectionDropTarget?.id]);

  const renderSectionInsertIndicator = useCallback((active: boolean, edge: "top" | "bottom") => (
    <div
      className={cn(
        "absolute left-3 right-3 flex items-center gap-2 pointer-events-none z-20 transition-opacity duration-150",
        edge === "top" ? "-top-3" : "-bottom-3",
        active ? "opacity-100" : "opacity-0",
      )}
    >
      <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_3px_rgba(99,102,241,0.14)]" />
      <div className="h-0.5 flex-1 rounded-full bg-primary shadow-[0_0_0_1px_rgba(99,102,241,0.14)]" />
    </div>
  ), []);

  const renderSectionHeader = useCallback((
    sectionId: SidebarSectionId,
    title: string,
    actions?: React.ReactNode,
  ) => {
    const collapsed = collapsedSections[sectionId];

    return (
      <div
        draggable
        onDragStart={(event) => {
          sectionDropCommittedRef.current = false;
          lastSectionDragPointRef.current = { x: event.clientX, y: event.clientY };
          setDraggingSection(sectionId);
          event.dataTransfer.effectAllowed = "move";
          event.dataTransfer.setData("text/plain", sectionId);

          const preview = createSectionDragPreview(title);
          if (preview) {
            event.dataTransfer.setDragImage(preview, 28, 18);
            window.setTimeout(() => preview.remove(), 0);
          }
        }}
        onDragEnd={() => {
          const lastPoint = lastSectionDragPointRef.current;
          const shouldMoveToBottom =
            !sectionDropCommittedRef.current &&
            Boolean(lastPoint && isBottomSectionHotzone(lastPoint.x, lastPoint.y));

          if (shouldMoveToBottom) {
            moveSectionToBottom(sectionId);
          }

          sectionDropCommittedRef.current = false;
          lastSectionDragPointRef.current = null;
          setDraggingSection(null);
          setSectionDropTarget(null);
        }}
        className={cn(
          "mb-2 flex items-center justify-between rounded-xl px-3 transition-colors cursor-grab active:cursor-grabbing",
          draggingSection === sectionId && "opacity-60",
        )}
      >
        <button
          type="button"
          onClick={() => toggleSection(sectionId)}
          className="flex min-w-0 flex-1 items-center gap-1.5 rounded-lg py-1 text-left"
        >
          <ChevronDown
            className={cn(
              "h-4 w-4 shrink-0 text-primary/70 transition-transform",
              collapsed && "-rotate-90",
            )}
          />
          <h2 className="text-xs font-extrabold uppercase tracking-[0.15em] text-primary/80">
            {title}
          </h2>
        </button>

        <div className="ml-2 flex items-center gap-1">
          {actions}
        </div>
      </div>
    );
  }, [collapsedSections, createSectionDragPreview, draggingSection, toggleSection]);

  const renderSectionBody = useCallback((sectionId: SidebarSectionId) => {
    if (collapsedSections[sectionId]) {
      return null;
    }

    if (sectionId === "pinned") {
      if (pinnedNodes.length === 0) {
        return <p className="px-3 py-2 text-sm font-medium text-slate-500">No pinned files yet</p>;
      }

      return (
        <DragList
          nodes={pinnedNodes}
          parentId={null}
          renderNode={(node) => (
            <PinnedItemRow
              node={node}
              fs={fs}
              isSelected={fs.isNodeSelected(node.id)}
              selectionCount={selectionCount}
              onNodeClick={handleNodeClick}
              onNodeContextMenu={handleNodeContextMenu}
            />
          )}
        />
      );
    }

    if (sectionId === "explorer") {
      return (
        <>
          {newItem && (
            <NewItemDialog
              type={newItem}
              onConfirm={(name) => {
                if (newItem === "file") fs.createFile(name);
                else fs.createFolder(name);
                setNewItem(null);
                setAreaMenu(null);
              }}
              onCancel={() => {
                setNewItem(null);
                setAreaMenu(null);
              }}
            />
          )}

          {rootNodes.length === 0 ? (
            <p className="px-3 py-2 text-sm font-medium text-slate-500">No files yet</p>
          ) : (
            <DragList
              nodes={rootNodes}
              parentId={null}
              renderNode={(node) => (
                <TreeNode
                  node={node}
                  depth={0}
                  fs={fs}
                  isSelected={fs.isNodeSelected(node.id)}
                  selectionCount={selectionCount}
                  onNodeClick={handleNodeClick}
                  onNodeContextMenu={handleNodeContextMenu}
                />
              )}
            />
          )}
        </>
      );
    }

    if (trashNodes.length === 0) {
      return <p className="px-3 py-2 text-sm font-medium text-slate-500">Recycle bin is empty</p>;
    }

    return (
      <DragList
        nodes={trashNodes}
        parentId={fs.trashFolderId}
        renderNode={(node) => (
          <TreeNode
            node={node}
            depth={0}
            fs={fs}
            isSelected={fs.isNodeSelected(node.id)}
            selectionCount={selectionCount}
            onNodeClick={handleNodeClick}
            onNodeContextMenu={handleNodeContextMenu}
          />
        )}
      />
    );
  }, [
    collapsedSections,
    fs,
    handleNodeClick,
    handleNodeContextMenu,
    newItem,
    pinnedNodes,
    rootNodes,
    selectionCount,
    trashNodes,
  ]);

  return (
    <DragContext.Provider value={{ draggingId, draggingIdRef, setDraggingId, dropTarget, setDropTarget }}>
      <div
        ref={rootRef}
        tabIndex={0}
        className={cn("app-m3-sidebar-content flex flex-col h-full transition-colors duration-200 relative", isDragOver && "bg-primary/[0.04]")}
        onMouseDown={focusSidebar}
        onKeyDown={handleSidebarKeyDown}
        onDragOver={(event) => {
          if (draggingSection) {
            lastSectionDragPointRef.current = { x: event.clientX, y: event.clientY };
          }
          if (activateBottomSectionDrop(event)) {
            return;
          }
          handleDragOver(event);
        }}
        onDragLeave={handleDragLeave}
        onDrop={(event) => {
          if (draggingSection && isBottomSectionHotzone(event.clientX, event.clientY)) {
            event.preventDefault();
            moveSectionToBottom(draggingSection);
            setDraggingSection(null);
            setSectionDropTarget(null);
            return;
          }

          handleDrop(event);
        }}
        onClick={() => {
          focusSidebar();
          fs.clearNodeSelection();
        }}
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
          {sectionOrder.map((sectionId) => {
            const dropBefore = sectionDropTarget?.id === sectionId && sectionDropTarget.position === "before";
            const dropAfter = sectionDropTarget?.id === sectionId && sectionDropTarget.position === "after";

            const handleSectionDragOver = (event: React.DragEvent<HTMLElement>) => {
              if (!draggingSection || draggingSection === sectionId) {
                return;
              }

              lastSectionDragPointRef.current = { x: event.clientX, y: event.clientY };

              if (activateBottomSectionDrop(event)) {
                return;
              }

              event.preventDefault();
              const rect = event.currentTarget.getBoundingClientRect();
              const midpoint = rect.top + rect.height / 2;
              const position = event.clientY < midpoint ? "before" : "after";
              setSectionDropTarget({ id: sectionId, position });
            };

            const handleSectionDrop = (event: React.DragEvent<HTMLElement>) => {
              event.preventDefault();
              if (draggingSection && isBottomSectionHotzone(event.clientX, event.clientY)) {
                sectionDropCommittedRef.current = true;
                moveSectionToBottom(draggingSection);
                setDraggingSection(null);
                setSectionDropTarget(null);
                return;
              }
              if (draggingSection && sectionDropTarget?.id === sectionId) {
                sectionDropCommittedRef.current = true;
                moveSection(draggingSection, sectionId, sectionDropTarget.position);
              }
              setDraggingSection(null);
              setSectionDropTarget(null);
            };

            if (sectionId === "pinned") {
              return (
                <section
                  key={sectionId}
                  onDragOver={handleSectionDragOver}
                  onDragLeave={() => {
                    if (sectionDropTarget?.id === sectionId) {
                      setSectionDropTarget(null);
                    }
                  }}
                  onDrop={handleSectionDrop}
                  className={cn(
                    "relative rounded-2xl transition-colors",
                    sectionDropTarget?.id === sectionId && "bg-primary/[0.04]",
                  )}
                >
                  {renderSectionInsertIndicator(dropBefore, "top")}
                  {renderSectionHeader("pinned", "Pinned")}
                  {renderSectionBody("pinned")}
                  {renderSectionInsertIndicator(dropAfter, "bottom")}
                </section>
              );
            }

            if (sectionId === "explorer") {
              return (
                <section
                  key={sectionId}
                  onDragOver={handleSectionDragOver}
                  onDragLeave={() => {
                    if (sectionDropTarget?.id === sectionId) {
                      setSectionDropTarget(null);
                    }
                  }}
                  onDrop={handleSectionDrop}
                  className={cn(
                    "relative rounded-2xl transition-colors",
                    sectionDropTarget?.id === sectionId && "bg-primary/[0.04]",
                  )}
                >
                  {renderSectionInsertIndicator(dropBefore, "top")}
                  {renderSectionHeader(
                    "explorer",
                    "Explorer",
                    <div className="flex items-center gap-1">
                      <button
                        title="New file"
                        onClick={() => setNewItem("file")}
                        className="p-1 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <FilePlus className="w-3.5 h-3.5 text-primary/50 hover:text-primary" />
                      </button>
                      <button
                        title="New folder"
                        onClick={() => setNewItem("folder")}
                        className="p-1 rounded-lg hover:bg-primary/10 transition-colors"
                      >
                        <FolderPlus className="w-3.5 h-3.5 text-primary/50 hover:text-primary" />
                      </button>
                    </div>,
                  )}
                  {renderSectionBody("explorer")}
                  {renderSectionInsertIndicator(dropAfter, "bottom")}
                </section>
              );
            }

            return (
              <section
                key={sectionId}
                onDragOver={handleSectionDragOver}
                onDragLeave={() => {
                  if (sectionDropTarget?.id === sectionId) {
                    setSectionDropTarget(null);
                  }
                }}
                onDrop={handleSectionDrop}
                className={cn(
                  "relative rounded-2xl transition-colors",
                  sectionDropTarget?.id === sectionId && "bg-primary/[0.04]",
                )}
              >
                {renderSectionInsertIndicator(dropBefore, "top")}
                {renderSectionHeader(
                  "recycle",
                  "Recycle Bin",
                  <div className="flex items-center gap-1">
                    <button
                      title="Paste into recycle bin"
                      onClick={() => void fs.pasteNodes(fs.trashFolderId)}
                      disabled={!fs.trashFolderId || !fs.canPasteNodes()}
                      className="p-1 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-40"
                    >
                      <ClipboardPaste className="w-3.5 h-3.5 text-primary/50 hover:text-primary" />
                    </button>
                    <button
                      title="Delete selected"
                      onClick={() => void fs.deleteSelectedNodes()}
                      disabled={selectionCount === 0}
                      className="p-1 rounded-lg hover:bg-primary/10 transition-colors disabled:opacity-40"
                    >
                      <Trash2 className="w-3.5 h-3.5 text-primary/50 hover:text-primary" />
                    </button>
                  </div>,
                )}
                {renderSectionBody("recycle")}
                {renderSectionInsertIndicator(dropAfter, "bottom")}
              </section>
            );
          })}

        </div>

        <div
          ref={footerRef}
          className="border-t border-primary/10 shrink-0 relative"
          onDragOver={(event) => {
            if (activateBottomSectionDrop(event)) {
              return;
            }
          }}
          onDrop={(event) => {
            if (draggingSection && isBottomSectionHotzone(event.clientX, event.clientY)) {
              event.preventDefault();
              event.stopPropagation();
              sectionDropCommittedRef.current = true;
              moveSectionToBottom(draggingSection);
              setDraggingSection(null);
              setSectionDropTarget(null);
            }
          }}
        >
          {draggingSection && (
            <div
              aria-hidden="true"
              className="absolute inset-x-0 -top-6 h-10 z-30"
              onDragOver={(event) => {
                activateBottomSectionDrop(event);
              }}
              onDragEnter={(event) => {
                activateBottomSectionDrop(event);
              }}
              onDragLeave={(event) => {
                const relatedTarget = event.relatedTarget;
                if (relatedTarget instanceof Node && footerRef.current?.contains(relatedTarget)) {
                  return;
                }

                const rect = event.currentTarget.getBoundingClientRect();
                const stillInside =
                  event.clientX >= rect.left &&
                  event.clientX <= rect.right &&
                  event.clientY >= rect.top &&
                  event.clientY <= rect.bottom;

                if (!stillInside && sectionDropTarget?.id === "bottom") {
                  setSectionDropTarget(null);
                }
              }}
              onDrop={(event) => {
                event.preventDefault();
                event.stopPropagation();
                moveSectionToBottom(draggingSection);
                setDraggingSection(null);
                setSectionDropTarget(null);
              }}
            />
          )}
          <div className="absolute inset-x-3 -top-3 pointer-events-none z-40">
            <div
              className={cn(
                "flex items-center gap-2 transition-opacity duration-150",
                sectionDropTarget?.id === "bottom" ? "opacity-100" : "opacity-0",
              )}
            >
              <div className="h-2 w-2 rounded-full bg-primary shadow-[0_0_0_3px_rgba(99,102,241,0.14)]" />
              <div className="h-0.5 flex-1 rounded-full bg-primary shadow-[0_0_0_1px_rgba(99,102,241,0.14)]" />
            </div>
          </div>
          <div className="p-4 space-y-1">
            <SidebarItem icon={<Search className="w-5 h-5 text-primary/50" />} label="Search"
              onClick={() => setIsSearchModalOpen(true)} />
            <SidebarItem icon={<Settings className="w-5 h-5 text-primary/50" />} label="Settings"
              onClick={() => setIsSettingsModalOpen(true)} />
          </div>
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
