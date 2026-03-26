import React from "react";
import { FileSystemAPI } from "@/types/filesystem";

export interface SidebarProps {
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsSearchModalOpen: (open: boolean) => void;
}

// drop target types
export type DropTarget =
  | { kind: "reorder"; insertBeforeId: string | null }
  | { kind: "into"; folderId: string };

// Unified drop target with parent context for cross-level moves
export type ResolvedDrop =
  | { kind: "into"; folderId: string }
  | { kind: "reorder"; parentId: string | null; insertBeforeId: string | null };

// Drag context
export interface DragCtx {
  draggingId: string | null;
  draggingIdRef: React.RefObject<string | null>;
  setDraggingId: (id: string | null) => void;
  // Unified drop target reported by whichever DragList is currently hovered
  dropTarget: ResolvedDrop | null;
  setDropTarget: (t: ResolvedDrop | null) => void;
}

export const DragContext = React.createContext<DragCtx>({
  draggingId: null,
  draggingIdRef: { current: null },
  setDraggingId: () => {},
  dropTarget: null,
  setDropTarget: () => {},
});
