import { FileNode, FileSystemAPI } from "@/types/filesystem";
import { createContext, ReactNode, useContext } from "react";
import { useFileOperations } from "./hooks/useFileOperations";

interface FileOperationsProps {
  children: ReactNode;
}

interface FileOperationsContextProps {
  openFile: (id: string) => void;
  createFile: (
    name: string,
    parentId?: string | null,
    opts?: { open?: boolean; initialContent?: string },
  ) => string;
  createFolder: (name: string, parentId?: string | null) => string;
  deleteNode: (id: string) => void;
  renameNode: (id: string, newName: string) => void;
  togglePin: (id: string) => void;
  toggleFolder: (id: string) => void;
  reorderPinned: (fromIndex: number, toIndex: number) => void;
  reorderExplorer: (fromIndex: number, toIndex: number) => void;
  moveNode: (
    id: string,
    newParentId: string | null,
    insertBeforeId: string | null,
  ) => void;
  getNode: (id: string) => FileNode | undefined;
  getRootNodes: () => FileNode[];
  getChildren: (parentId: string) => FileNode[];
  fs: FileSystemAPI;
}

const FileOperationsContext = createContext<
  FileOperationsContextProps | undefined
>(undefined);



export const remapId = (s: string, oldPrefix: string, newPrefix: string) => {
    if (s === oldPrefix) return newPrefix;
    if (s.startsWith(oldPrefix + "/"))
        return newPrefix + s.slice(oldPrefix.length);
    return s;
};

export function FileOperationsProvider({
  children,
}: FileOperationsProps): ReactNode {
  
  const context = useFileOperations();

  return (
    <FileOperationsContext.Provider
      value={context}
    >
      {children}
    </FileOperationsContext.Provider>
  );
}

export function useFileOperationsContext() {
  const context = useContext(FileOperationsContext);
  if (!context) {
    throw new Error(
      "useFileOperationsContext must be used within FileOperationsProvider",
    );
  }
  return context;
}
