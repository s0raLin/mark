import React from "react";
import { GripVertical } from "lucide-react";
import { DragContext } from "../types";

interface GripHandleProps {
  nodeId: string;
}

export default function GripHandle({ nodeId }: GripHandleProps) {
  const { setDraggingId } = React.useContext(DragContext);

  const onPointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.stopPropagation();
    const startY = e.clientY;
    const startX = e.clientX;

    const onMove = (ev: PointerEvent) => {
      // Start drag when user moves meaningfully in any direction.
      if (
        Math.abs(ev.clientY - startY) > 4 ||
        Math.abs(ev.clientX - startX) > 4
      ) {
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
    <div
      onPointerDown={onPointerDown}
      title="Drag to reorder"
      className="ml-auto shrink-0 flex h-6 w-6 items-center justify-center text-slate-400 opacity-0 pointer-events-none transition-all duration-150 group-hover/sidebar-row:opacity-100 group-hover/sidebar-row:pointer-events-auto group-hover/sidebar-row:text-slate-400 hover:text-primary hover:cursor-grab active:cursor-grabbing"
    >
      <GripVertical className="w-3.5 h-3.5" />
    </div>
  );
}
