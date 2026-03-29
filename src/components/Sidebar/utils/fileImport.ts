import { FileSystemAPI } from "@/types/filesystem";

export function isMarkdownLikeName(name: string, mimeType?: string) {
  return (
    mimeType === "text/plain" ||
    name.endsWith(".md") ||
    name.endsWith(".markdown")
  );
}

export async function readAllDirectoryEntries(reader: any): Promise<any[]> {
  const results: any[] = [];
  await new Promise<void>((resolve) => {
    const readBatch = () => {
      reader.readEntries(
        (entries: any[]) => {
          if (!entries || entries.length === 0) return resolve();
          results.push(...entries);
          readBatch();
        },
        () => resolve(),
      );
    };
    readBatch();
  });
  return results;
}

export async function fileEntryToFile(entry: any): Promise<File> {
  return new Promise<File>((resolve) => {
    entry.file((file: File) => resolve(file));
  });
}

export async function importEntryIntoFs(
  entry: any,
  fs: FileSystemAPI,
  parentId: string | null,
): Promise<void> {
  if (entry?.isFile) {
    const file = await fileEntryToFile(entry);
    const name = file.name;
    if (isMarkdownLikeName(name, file.type)) {
      const content = await file.text();
      await fs.createFile(name, parentId, { open: false, initialContent: content });
    } else {
      await fs.createFile(name, parentId, { open: false });
    }
    return;
  }

  if (entry?.isDirectory) {
    const folderId = await fs.createFolder(entry.name, parentId);
    const reader = entry.createReader();
    const childEntries = await readAllDirectoryEntries(reader);
    for (const child of childEntries) {
      await importEntryIntoFs(child, fs, folderId);
    }
  }
}

export async function importDroppedIntoFs(
  dataTransfer: DataTransfer,
  fs: FileSystemAPI,
  parentId: string | null,
): Promise<void> {
  const items = Array.from(dataTransfer.items ?? []);
  const webkitEntries = items
    .map((item) => {
      try {
        return (item as any).webkitGetAsEntry?.() ?? null;
      } catch {
        return null;
      }
    })
    .filter(Boolean);

  if (webkitEntries.length > 0) {
    for (const entry of webkitEntries) {
      await importEntryIntoFs(entry, fs, parentId);
    }
    return;
  }

  // Fallback: flat import (no folder structure).
  const files = Array.from(dataTransfer.files ?? []);
  for (const file of files) {
    const name = file.name;
    if (isMarkdownLikeName(name, file.type)) {
      const content = await file.text();
      await fs.createFile(name, parentId, { open: false, initialContent: content });
    } else {
      await fs.createFile(name, parentId, { open: false });
    }
  }
}
