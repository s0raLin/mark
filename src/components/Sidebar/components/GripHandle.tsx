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
    <GripVertical
      onPointerDown={onPointerDown}
      className="w-3.5 h-3.5 text-slate-300 shrink-0 cursor-grab ml-auto"
    />
  );
}
