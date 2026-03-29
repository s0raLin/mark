import type { StorageFileNode, StorageFileSystem } from "@/api/client";
import type { FileNode } from "@/types/filesystem";
import { arraysEqual } from "./fileSystemUtils";

function normalizeStorageNode(node: StorageFileNode): FileNode {
  return {
    ...node,
    createdAt:
      typeof node.createdAt === "string"
        ? new Date(node.createdAt).getTime()
        : node.createdAt,
    updatedAt:
      typeof node.updatedAt === "string"
        ? new Date(node.updatedAt).getTime()
        : node.updatedAt,
  };
}

export function normalizeStorageNodes(nodes: StorageFileNode[]): FileNode[] {
  return nodes.map(normalizeStorageNode);
}

export function buildFileSystemState(fileSystem?: StorageFileSystem | null) {
  const nodes = normalizeStorageNodes(fileSystem?.nodes ?? []);
  const firstFile = nodes.find((node) => node.type === "file");

  return {
    nodes,
    pinnedIds: fileSystem?.pinnedIds ?? [],
    explorerOrder: fileSystem?.explorerOrder ?? [],
    folderOrder: fileSystem?.folderOrder ?? {},
    activeFileId: firstFile?.id ?? "",
  };
}

export function reconcileExplorerOrder(
  nodes: FileNode[],
  pinnedIds: string[],
  currentOrder: string[],
) {
  const rootIds = nodes
    .filter(
      (node) =>
        (node.parentId === null || node.parentId === undefined) &&
        !pinnedIds.includes(node.id),
    )
    .map((node) => node.id);

  const next = currentOrder.filter((id) => rootIds.includes(id));
  for (const id of rootIds) {
    if (!next.includes(id)) {
      next.push(id);
    }
  }

  return arraysEqual(currentOrder, next) ? currentOrder : next;
}

export function reconcileFolderOrder(
  nodes: FileNode[],
  currentOrder: Record<string, string[]>,
) {
  const next = { ...currentOrder };
  const folderIds = nodes
    .filter((node) => node.type === "folder")
    .map((node) => node.id);

  for (const key of Object.keys(next)) {
    if (!folderIds.includes(key)) {
      delete next[key];
    }
  }

  for (const folderId of folderIds) {
    const childIds = nodes
      .filter((node) => node.parentId === folderId)
      .map((node) => node.id);
    const existing = currentOrder[folderId] ?? [];
    const filtered = existing.filter((id) => childIds.includes(id));
    const appended = childIds.filter((id) => !filtered.includes(id));
    const updated = [...filtered, ...appended];
    if (!arraysEqual(existing, updated)) {
      next[folderId] = updated;
    }
  }

  return next;
}
