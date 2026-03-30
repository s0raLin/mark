import React, { useRef, useEffect, useCallback, useContext } from "react";
import { FileNode } from "@/types/filesystem";
import { cn } from "@/utils/cn";
import { DragContext, ResolvedDrop } from "../types";

interface DragListProps {
  nodes: FileNode[];
  parentId: string | null;
  renderNode: (node: FileNode) => React.ReactNode;
  className?: string;
}

// ── Global singleton arrow (fixed, floats above everything) ──────────────────
function getGlobalArrow(): HTMLDivElement {
  const id = "__dl_cursor_arrow__";
  let el = document.getElementById(id) as HTMLDivElement | null;
  if (!el) {
    const styleId = "__dl_cursor_style__";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `
        @keyframes __dl_pulse__ {
          0%, 100% { filter: drop-shadow(0 6px 14px rgba(99,102,241,0.20)); }
          50% { filter: drop-shadow(0 8px 18px rgba(99,102,241,0.32)); }
        }

        @keyframes __dl_glow__ {
          0%, 100% { opacity: 0.92; }
          50% { opacity: 1; }
        }
      `;
      document.head.appendChild(s);
    }

    el = document.createElement("div");
    el.id = id;
    el.innerHTML = `<svg width="24" height="18" viewBox="0 0 24 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <path d="M2 9H11" stroke="url(#__dl_line__)" stroke-width="2.2" stroke-linecap="round"/>
      <path d="M9 4.5L14.5 9L9 13.5" stroke="#6366F1" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>
      <circle cx="17.5" cy="9" r="3.25" fill="#6366F1"/>
      <circle cx="17.5" cy="9" r="2.1" fill="white" fill-opacity="0.94"/>
      <defs>
        <linearGradient id="__dl_line__" x1="2" y1="9" x2="11" y2="9" gradientUnits="userSpaceOnUse">
          <stop stop-color="#818CF8" stop-opacity="0.3"/>
          <stop offset="1" stop-color="#6366F1"/>
        </linearGradient>
      </defs>
    </svg>`;
    el.style.cssText = `
      position: fixed;
      display: block;
      pointer-events: none;
      z-index: 9999;
      opacity: 0;
      transform: translate3d(-6px, -50%, 0) scale(0.96);
      transform-origin: center;
      transition: opacity 140ms ease, transform 180ms cubic-bezier(0.22, 1, 0.36, 1);
      animation: __dl_pulse__ 1300ms ease-in-out infinite, __dl_glow__ 900ms ease-in-out infinite;
    `;
    el.dataset.visible = "false";
    document.body.appendChild(el);
  }
  return el;
}

// ── Module-level ownership ───────────────────────────────────────────────────
// Stores the instanceId of the deepest DragList that currently owns the drag
const activeDragList = { current: null as symbol | null };
// Stores the area (width*height) of the active DragList's container — smaller = deeper/more specific
const activeDragListArea = { current: Infinity };

export default function DragList({ nodes, parentId, renderNode, className }: DragListProps) {
  const { draggingId, draggingIdRef, setDropTarget } = useContext(DragContext);

  const instanceId = useRef(Symbol());
  const containerRef = useRef<HTMLDivElement>(null);
  const wrapperRefs = useRef<(HTMLDivElement | null)[]>([]);
  const rowRefs = useRef<(HTMLDivElement | null)[]>([]);
  const nodesRef = useRef(nodes);
  const parentIdRef = useRef(parentId);
  const localDropRef = useRef<ResolvedDrop | null>(null);
  const activeMarginRef = useRef<{ idx: number; side: "top" | "bottom" } | null>(null);
  const activeIntoIdx = useRef<number | null>(null);

  useEffect(() => { nodesRef.current = nodes; }, [nodes]);
  useEffect(() => { parentIdRef.current = parentId; }, [parentId]);

  useEffect(() => {
    wrapperRefs.current = wrapperRefs.current.slice(0, nodes.length);
    rowRefs.current = rowRefs.current.slice(0, nodes.length);
  }, [nodes.length]);

  // Position the global fixed arrow at the left edge of a wrapper's gap
  const arrowRafRef = useRef<number | null>(null);

  const showArrow = useCallback((idx: number, side: "top" | "bottom") => {
    if (arrowRafRef.current !== null) {
      cancelAnimationFrame(arrowRafRef.current);
      arrowRafRef.current = null;
    }
    const arrow = getGlobalArrow();
    const start = performance.now();
    const update = (now: number) => {
      const wrapper = wrapperRefs.current[idx];
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const y = side === "top" ? rect.top : rect.bottom;
      arrow.style.left = `${rect.left - 22}px`;
      arrow.style.top = `${y}px`;
      if (arrow.dataset.visible !== "true") {
        arrow.dataset.visible = "true";
        arrow.style.opacity = "1";
        arrow.style.transform = "translate3d(0, -50%, 0) scale(1)";
      }
      if (now - start < 110) {
        arrowRafRef.current = requestAnimationFrame(update);
      } else {
        arrowRafRef.current = null;
      }
    };
    arrowRafRef.current = requestAnimationFrame(update);
  }, []);

  const hideArrow = useCallback(() => {
    if (arrowRafRef.current !== null) {
      cancelAnimationFrame(arrowRafRef.current);
      arrowRafRef.current = null;
    }
    const arrow = document.getElementById("__dl_cursor_arrow__") as HTMLDivElement | null;
    if (arrow) {
      arrow.dataset.visible = "false";
      arrow.style.opacity = "0";
      arrow.style.transform = "translate3d(-6px, -50%, 0) scale(0.96)";
    }
  }, []);

  const applyMargin = useCallback((idx: number | null, side: "top" | "bottom" | null) => {
    const prev = activeMarginRef.current;
    // Idempotent: skip if nothing changed
    const sameState = prev?.idx === idx && prev?.side === side;
    if (sameState && idx !== null) return;

    // Clear previous only if it's different
    if (prev !== null && (prev.idx !== idx || prev.side !== side)) {
      const el = wrapperRefs.current[prev.idx];
      if (el) { el.style.marginTop = ""; el.style.marginBottom = ""; }
    }

    if (idx === null || side === null) {
      activeMarginRef.current = null;
      hideArrow();
      return;
    }
    const el = wrapperRefs.current[idx];
    if (el) {
      if (side === "top") el.style.marginTop = "1.75rem";
      else el.style.marginBottom = "1.75rem";
    }
    activeMarginRef.current = { idx, side };
    showArrow(idx, side);
  }, [showArrow, hideArrow]);

  const applyInto = useCallback((idx: number | null) => {
    if (activeIntoIdx.current === idx) return; // idempotent
    if (activeIntoIdx.current !== null) {
      const el = rowRefs.current[activeIntoIdx.current];
      if (el) el.classList.remove("ring-1", "ring-primary/40", "bg-primary/5");
    }
    if (idx === null) { activeIntoIdx.current = null; return; }
    const el = rowRefs.current[idx];
    if (el) el.classList.add("ring-1", "ring-primary/40", "bg-primary/5");
    activeIntoIdx.current = idx;
  }, []);

  const clearVisuals = useCallback(() => {
    applyInto(null);
    applyMargin(null, null);
    localDropRef.current = null;
  }, [applyInto, applyMargin]);

  const resolveHit = useCallback((clientY: number, clientX: number) => {
    const dragId = draggingIdRef.current;
    if (!dragId) return;

    const ns = nodesRef.current;
    const pid = parentIdRef.current;

    // Use container rect as the primary bounds check — more reliable than individual row rects
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();

    // Strict bounds check (no extension) — ensures parent DragList can reclaim ownership
    // when cursor moves outside a nested container
    const inBounds = clientY >= cRect.top - 18 && clientY <= cRect.bottom + 18 &&
                     clientX >= cRect.left - 32 && clientX <= cRect.right + 64;

    if (!inBounds) {
      if (activeDragList.current === instanceId.current) {
        activeDragList.current = null;
        activeDragListArea.current = Infinity;
        clearVisuals();
      }
      return;
    }

    // Compete by container area — smaller container (deeper/nested) wins
    const myArea = cRect.width * cRect.height;
    if (activeDragList.current !== null && activeDragList.current !== instanceId.current) {
      if (myArea >= activeDragListArea.current) {
        // A more specific (smaller) DragList already owns this — yield
        clearVisuals();
        return;
      }
      // We are more specific — take over
    }

    activeDragList.current = instanceId.current;
    activeDragListArea.current = myArea;

    type RowInfo = { idx: number; top: number; bottom: number; mid: number; node: FileNode };
    const rects: RowInfo[] = [];

    for (let i = 0; i < ns.length; i++) {
      const el = wrapperRefs.current[i];
      if (!el || ns[i]?.id === dragId) continue;
      const r = el.getBoundingClientRect();
      rects.push({ idx: i, top: r.top, bottom: r.bottom, mid: (r.top + r.bottom) / 2, node: ns[i] });
    }

    if (rects.length === 0) {
      applyInto(null);
      localDropRef.current = { kind: "reorder", parentId: pid, insertBeforeId: null };
      return;
    }

    // Hover over folder row → drop into (only middle 50% of row triggers "into", edges trigger reorder)
    // Block: don't allow dropping into self or own children
    for (const info of rects) {
      if (info.node.type === "folder" && clientY >= info.top && clientY <= info.bottom) {
        // Block: don't allow dropping into self or own children
        const isOwnChild = dragId && info.node.id.startsWith(dragId + "/");
        if (info.node.id === dragId || isOwnChild) {
          // Block - clear drop target, no animation
          applyInto(null);
          localDropRef.current = null;
          return;
        }
        const rowHeight = info.bottom - info.top;
        const edgeZone = Math.min(rowHeight * 0.28, 10); // top/bottom 28% or 10px triggers reorder
        if (clientY < info.top + edgeZone) {
          // top edge → insert before this folder
          applyInto(null);
          applyMargin(info.idx, "top");
          localDropRef.current = { kind: "reorder", parentId: pid, insertBeforeId: info.node.id };
          return;
        }
        if (clientY > info.bottom - edgeZone) {
          // bottom edge → insert after this folder
          applyInto(null);
          applyMargin(info.idx, "bottom");
          // find the next sibling in rects (skip the dragged node)
          const rectsIdx = rects.findIndex(r => r.idx === info.idx);
          const nextRect = rects[rectsIdx + 1];
          localDropRef.current = { kind: "reorder", parentId: pid, insertBeforeId: nextRect?.node.id ?? null };
          return;
        }
        // middle → drop into folder - show push/squeeze animation
        applyInto(info.idx);
        localDropRef.current = { kind: "into", folderId: info.node.id };
        return;
      }
    }

    // Reorder in empty space - block if target is inside own subtree - no animation
    if (pid && dragId && pid.startsWith(dragId + "/")) {
      applyInto(null);
      localDropRef.current = null;
      return;
    }

    applyInto(null);

    const topBand = Math.min(Math.max((rects[0].bottom - rects[0].top) * 0.45, 14), 28);
    const bottomBand = Math.min(
      Math.max((rects[rects.length - 1].bottom - rects[rects.length - 1].top) * 0.45, 14),
      28,
    );

    if (clientY <= rects[0].top + topBand) {
      applyMargin(rects[0].idx, "top");
      localDropRef.current = { kind: "reorder", parentId: pid, insertBeforeId: rects[0].node.id };
      return;
    }
    if (clientY >= rects[rects.length - 1].bottom - bottomBand) {
      applyMargin(rects[rects.length - 1].idx, "bottom");
      localDropRef.current = { kind: "reorder", parentId: pid, insertBeforeId: null };
      return;
    }
    for (let j = 0; j < rects.length - 1; j++) {
      if (clientY >= rects[j].mid && clientY < rects[j + 1].mid) {
        applyMargin(rects[j + 1].idx, "top");
        localDropRef.current = { kind: "reorder", parentId: pid, insertBeforeId: rects[j + 1].node.id };
        return;
      }
    }
    applyMargin(rects[rects.length - 1].idx, "bottom");
    localDropRef.current = { kind: "reorder", parentId: pid, insertBeforeId: null };
  }, [draggingIdRef, applyMargin, applyInto, clearVisuals]);

  const resolveHitRef = useRef(resolveHit);
  useEffect(() => { resolveHitRef.current = resolveHit; }, [resolveHit]);

  useEffect(() => {
    if (!draggingId) { clearVisuals(); return; }

    const handleMove = (e: PointerEvent) => resolveHitRef.current(e.clientY, e.clientX);

    const handleUp = () => {
      if (activeDragList.current === instanceId.current && localDropRef.current) {
        setDropTarget(localDropRef.current);
      }
      clearVisuals();
      if (activeDragList.current === instanceId.current) {
        activeDragList.current = null;
        activeDragListArea.current = Infinity;
      }
    };

    window.addEventListener("pointermove", handleMove, { passive: true });
    window.addEventListener("pointerup", handleUp, { capture: true, once: true });
    return () => {
      window.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp, { capture: true });
    };
  }, [draggingId, clearVisuals, setDropTarget]);

  return (
    <div ref={containerRef} className={cn("relative", className)}>
      {nodes.map((node, i) => {
        const isDragging = draggingId === node.id;
        return (
          <div
            key={node.id}
            ref={(el) => { wrapperRefs.current[i] = el; }}
            style={{ transition: "margin 100ms" }}
            data-folder={node.type === "folder" ? "true" : undefined}
            data-node-id={node.id}
          >
            <div
              ref={(el) => { rowRefs.current[i] = el; }}
              className={cn(
                "rounded-xl transition-all duration-150",
                isDragging && "scale-105 shadow-lg ring-1 ring-primary/20",
              )}
            >
              {renderNode(node)}
            </div>
          </div>
        );
      })}
    </div>
  );
}
