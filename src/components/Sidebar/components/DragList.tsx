import React, { useState, useRef, useEffect, useCallback } from "react";
import { FileNode } from "@/types/filesystem";
import { cn } from "@/utils/cn";
import { DropTarget, DragContext } from "../types";

interface DragListProps {
  nodes: FileNode[];
  onDrop: (draggedId: string, target: DropTarget) => void;
  renderNode: (node: FileNode) => React.ReactNode;
  className?: string;
}

export default function DragList({
  nodes,
  onDrop,
  renderNode,
  className,
}: DragListProps) {
  const { draggingId, draggingIdRef } = React.useContext(DragContext);

  // Use refs for drop state to avoid layout shifts from re-renders during drag.
  const dropIndexRef = useRef<number | null>(null);
  const intoIdRef = useRef<string | null>(null);
  const [renderTick, setRenderTick] = useState(0);

  const rowRefs = useRef<(HTMLElement | null)[]>([]);
  const nodesRef = useRef(nodes);
  const onDropRef = useRef(onDrop);

  useEffect(() => {
    nodesRef.current = nodes;
  }, [nodes]);

  useEffect(() => {
    onDropRef.current = onDrop;
  }, [onDrop]);

  const setDropState = useCallback((idx: number | null, into: string | null) => {
    if (dropIndexRef.current !== idx || intoIdRef.current !== into) {
      dropIndexRef.current = idx;
      intoIdRef.current = into;
      setRenderTick((t) => t + 1);
    }
  }, []);

  const resolveHit = useCallback((clientY: number) => {
    const id = draggingIdRef.current;
    if (!id) return;

    const ns = nodesRef.current;
    if (!ns.some((n) => n.id === id)) {
      setDropState(null, null);
      return;
    }

    const dragIdx = ns.findIndex((n) => n.id === id);

    type RowRect = { idx: number; mid: number; node: FileNode };
    const rects: RowRect[] = [];
    rowRefs.current.forEach((el, i) => {
      if (!el || i === dragIdx) return;
      const r = el.getBoundingClientRect();
      rects.push({ idx: i, mid: (r.top + r.bottom) / 2, node: ns[i] });
    });

    if (rects.length === 0) {
      setDropState(dragIdx === 0 ? ns.length : 0, null);
      return;
    }

    if (clientY <= rects[0].mid) {
      setDropState(rects[0].idx, null);
      return;
    }

    if (clientY > rects[rects.length - 1].mid) {
      setDropState(ns.length, null);
      return;
    }

    for (let j = 0; j < rects.length - 1; j++) {
      const cur = rects[j];
      const next = rects[j + 1];
      if (clientY > cur.mid && clientY <= next.mid) {
        setDropState(next.idx, null);
        return;
      }
    }

    setDropState(ns.length, null);
  }, [draggingIdRef, setDropState]);

  const resolveHitRef = useRef(resolveHit);
  useEffect(() => {
    resolveHitRef.current = resolveHit;
  }, [resolveHit]);

  useEffect(() => {
    if (!draggingId) {
      setDropState(null, null);
      return;
    }

    const onMove = (e: PointerEvent) => resolveHitRef.current(e.clientY);

    const onUp = () => {
      const id = draggingIdRef.current;
      const ns = nodesRef.current;
      const idx = dropIndexRef.current;
      const into = intoIdRef.current;

      // Clear visual state first
      setDropState(null, null);

      if (!id || !ns.some((n) => n.id === id)) return;

      if (into) {
        onDropRef.current(id, { kind: "into", folderId: into });
      } else if (idx !== null) {
        // Convert absolute index → insertBeforeId
        const insertBeforeId = idx < ns.length ? ns[idx].id : null;
        onDropRef.current(id, { kind: "reorder", insertBeforeId });
      }
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp, { capture: true, once: true });
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp, { capture: true });
    };
  }, [draggingId, draggingIdRef, setDropState]);

  const dropIndex = dropIndexRef.current;
  const intoId = intoIdRef.current;
  // suppress unused warning — renderTick drives re-renders
  void renderTick;

  return (
    <div className={cn("relative", className)}>
      {nodes.map((node, i) => {
        const isDragging = draggingId === node.id;
        const isInto = intoId === node.id;
        const isInsertBefore = dropIndex === i && !isDragging;
        const isInsertAfter = dropIndex === nodes.length && i === nodes.length - 1 && !isDragging;

        return (
          <div
            key={node.id}
            className="relative transition-[margin] duration-100"
            style={{
              marginTop: isInsertBefore ? "1.75rem" : undefined,
              marginBottom: isInsertAfter ? "1.75rem" : undefined,
            }}
          >
            <div
              ref={(el) => {
                rowRefs.current[i] = el;
              }}
              className={cn(
                "rounded-xl transition-all duration-150",
                isDragging && "scale-105 shadow-lg ring-1 ring-primary/20",
                isInto && "ring-1 ring-primary/40 bg-primary/5",
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
