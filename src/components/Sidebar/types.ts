import React from "react";
import { FileSystemAPI } from "@/src/types/filesystem";

export interface SidebarProps {
  setIsSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSearchModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
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
