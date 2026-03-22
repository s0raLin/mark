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
    // Inject animation keyframes
    const styleId = "__dl_cursor_style__";
    if (!document.getElementById(styleId)) {
      const s = document.createElement("style");
      s.id = styleId;
      s.textContent = `
        @keyframes __dl_bob__ {
          0%,100% { transform: translateY(-50%) translateX(0px); }
          50%      { transform: translateY(-50%) translateX(4px); }
        }
      `;
      document.head.appendChild(s);
    }

    el = document.createElement("div");
    el.id = id;
    // SVG cursor-style arrow pointing right
    el.innerHTML = `<svg width="14" height="18" viewBox="0 0 14 18" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path d="M2 2 L12 9 L2 16 L2 2Z" fill="#f43f5e" stroke="white" stroke-width="1.5" stroke-linejoin="round"/>
    </svg>`;
    el.style.cssText = `
      position: fixed;
      display: none;
      pointer-events: none;
      z-index: 9999;
      transform: translateY(-50%);
      animation: __dl_bob__ 700ms ease-in-out infinite;
      filter: drop-shadow(0 2px 4px rgba(244,63,94,0.45));
    `;
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
    // Cancel any pending arrow position update
    if (arrowRafRef.current !== null) {
      cancelAnimationFrame(arrowRafRef.current);
      arrowRafRef.current = null;
    }
    const arrow = getGlobalArrow();
    // Wait for margin transition (100ms) to finish before reading rect
    const start = performance.now();
    const update = (now: number) => {
      const wrapper = wrapperRefs.current[idx];
      if (!wrapper) return;
      const rect = wrapper.getBoundingClientRect();
      const y = side === "top" ? rect.top : rect.bottom;
      arrow.style.left = `${rect.left - 14}px`;
      arrow.style.top  = `${y}px`;
      arrow.style.display = "block";
      // Keep updating until transition is done (~110ms)
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
    if (arrow) arrow.style.display = "none";
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
    applyMargin(null, null);
    applyInto(null);
    localDropRef.current = null;
  }, [applyMargin, applyInto]);

  const resolveHit = useCallback((clientY: number, clientX: number) => {
    const dragId = draggingIdRef.current;
    if (!dragId) return;

    const ns = nodesRef.current;
    const pid = parentIdRef.current;

    // Use container rect as the primary bounds check — more reliable than individual row rects
    const container = containerRef.current;
    if (!container) return;
    const cRect = container.getBoundingClientRect();

    // Extend bounds: 28px above, 48px below (to catch "append to end" zone), 32px sides
    const inBounds = clientY >= cRect.top - 28 && clientY <= cRect.bottom + 48 &&
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
      applyMargin(null, null);
      applyInto(null);
      localDropRef.current = { kind: "reorder", parentId: pid, insertBeforeId: null };
      return;
    }

    // Hover over folder row → drop into
    for (const info of rects) {
      if (info.node.type === "folder" && clientY >= info.top && clientY <= info.bottom) {
        applyMargin(null, null);
        applyInto(info.idx);
        localDropRef.current = { kind: "into", folderId: info.node.id };
        return;
      }
    }

    applyInto(null);

    if (clientY < rects[0].mid) {
      applyMargin(rects[0].idx, "top");
      localDropRef.current = { kind: "reorder", parentId: pid, insertBeforeId: rects[0].node.id };
      return;
    }
    if (clientY >= rects[rects.length - 1].mid) {
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
