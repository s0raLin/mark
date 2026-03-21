import React from "react";
import { FileSystemAPI } from "@/types/filesystem";

export interface SidebarProps {
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsSearchModalOpen: (open: boolean) => void;
  fs: FileSystemAPI;
}

// drop target types
export type DropTarget =
  | { kind: "reorder"; insertBeforeId: string | null }
  | { kind: "into"; folderId: string };

// Drag context
export interface DragCtx {
  draggingId: string | null;
  draggingIdRef: React.RefObject<string | null>;
  setDraggingId: (id: string | null) => void;
}

// Create context with default value
export const DragContext = React.createContext<DragCtx>({
  draggingId: null,
  draggingIdRef: { current: null },
  setDraggingId: () => {},
});
