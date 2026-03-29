import { FileSystemAPI } from "@/types/filesystem";
import { errorBus } from "@/contexts/errorBus";

function uint8ToBase64(bytes: Uint8Array) {
  let binary = "";
  const chunkSize = 0x8000;

  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }

  return btoa(binary);
}

function normalizeRelativePath(path: string) {
  return path.replaceAll("\\", "/").replace(/^\/+|\/+$/g, "");
}

function stripSharedRoot(paths: string[]) {
  if (paths.length === 0) {
    return paths;
  }

  const splitPaths = paths.map((path) => normalizeRelativePath(path).split("/").filter(Boolean));
  const firstSegments = splitPaths.map((segments) => segments[0]).filter(Boolean);
  if (firstSegments.length !== splitPaths.length) {
    return paths.map(normalizeRelativePath);
  }

  const sharedRoot = firstSegments.every((segment) => segment === firstSegments[0])
    ? firstSegments[0]
    : null;

  if (!sharedRoot) {
    return paths.map(normalizeRelativePath);
  }

  return splitPaths.map((segments) => segments.slice(1).join("/"));
}

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
): Promise<number> {
  if (entry?.isFile) {
    const file = await fileEntryToFile(entry);
    const name = file.name;
    if (isMarkdownLikeName(name, file.type)) {
      const content = await file.text();
      await fs.createFile(name, parentId, { open: false, initialContent: content });
    } else {
      const bytes = new Uint8Array(await file.arrayBuffer());
      await fs.createFile(name, parentId, {
        open: false,
        initialBinaryContentBase64: uint8ToBase64(bytes),
      });
    }
    return 1;
  }

  if (entry?.isDirectory) {
    const folderId = await fs.createFolder(entry.name, parentId);
    const reader = entry.createReader();
    const childEntries = await readAllDirectoryEntries(reader);
    let importedCount = 0;
    for (const child of childEntries) {
      importedCount += await importEntryIntoFs(child, fs, folderId);
    }
    return importedCount;
  }

  return 0;
}

export async function importDroppedIntoFs(
  dataTransfer: DataTransfer,
  fs: FileSystemAPI,
  parentId: string | null,
): Promise<void> {
  try {
    let importedCount = 0;
    const files = Array.from(dataTransfer.files ?? []);
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

    const hasDirectoryEntry = webkitEntries.some((entry: any) => entry?.isDirectory);

    if (hasDirectoryEntry) {
      for (const entry of webkitEntries) {
        importedCount += await importEntryIntoFs(entry, fs, parentId);
      }
    } else {
      for (const file of files) {
        const name = file.name;
        if (isMarkdownLikeName(name, file.type)) {
          const content = await file.text();
          await fs.createFile(name, parentId, { open: false, initialContent: content });
        } else {
          const bytes = new Uint8Array(await file.arrayBuffer());
          await fs.createFile(name, parentId, {
            open: false,
            initialBinaryContentBase64: uint8ToBase64(bytes),
          });
        }
        importedCount += 1;
      }
    }

    if (importedCount > 0) {
      errorBus.info("导入完成", {
        message: `已导入 ${importedCount} 个文件${parentId ? "到当前文件夹" : "到工作区"}`,
        dedupeKey: `import-success:${parentId ?? "root"}:${importedCount}`,
        durationMs: 2400,
      });
      return;
    }

    errorBus.warning("没有检测到可导入的文件", {
      message: "这次拖拽里没有读取到文件内容，请再试一次。",
      dedupeKey: `import-empty:${parentId ?? "root"}`,
      durationMs: 2800,
    });
  } catch (error) {
    errorBus.fromException("拖拽导入失败", error, {
      message: "文件没有成功导入，请再试一次。",
      dedupeKey: `import-failed:${parentId ?? "root"}`,
      durationMs: 4200,
    });
    throw error;
  }
}

export async function importFileListIntoFs(
  files: FileList | File[],
  fs: FileSystemAPI,
  options?: { parentId?: string | null; replaceExisting?: boolean },
): Promise<void> {
  const fileArray = Array.from(files ?? []);
  const parentId = options?.parentId ?? null;

  if (fileArray.length === 0) {
    errorBus.warning("没有检测到可导入的文件", {
      message: "文件夹里没有可读取的文件，请重新选择。",
      dedupeKey: "import-file-list-empty",
      durationMs: 2800,
    });
    return;
  }

  try {
    if (options?.replaceExisting) {
      await fs.resetWorkspace();
    }

    const rawPaths = fileArray.map((file) => file.webkitRelativePath || file.name);
    const normalizedPaths = stripSharedRoot(rawPaths);
    const folderIdByPath = new Map<string, string>();
    let importedCount = 0;

    for (let index = 0; index < fileArray.length; index += 1) {
      const file = fileArray[index];
      const normalizedPath = normalizedPaths[index] || file.name;
      const segments = normalizeRelativePath(normalizedPath).split("/").filter(Boolean);
      const fileName = segments.pop() || file.name;

      let currentParentId = parentId;
      let currentPath = "";

      for (const folderName of segments) {
        currentPath = currentPath ? `${currentPath}/${folderName}` : folderName;
        const existingFolderId = folderIdByPath.get(currentPath);
        if (existingFolderId) {
          currentParentId = existingFolderId;
          continue;
        }

        const folderId = await fs.createFolder(folderName, currentParentId);
        folderIdByPath.set(currentPath, folderId);
        currentParentId = folderId;
      }

      if (isMarkdownLikeName(fileName, file.type)) {
        const content = await file.text();
        await fs.createFile(fileName, currentParentId, {
          open: false,
          initialContent: content,
        });
      } else {
        const bytes = new Uint8Array(await file.arrayBuffer());
        await fs.createFile(fileName, currentParentId, {
          open: false,
          initialBinaryContentBase64: uint8ToBase64(bytes),
        });
      }

      importedCount += 1;
    }

    errorBus.info("工作区已打开", {
      message: `已导入 ${importedCount} 个文件`,
      dedupeKey: `workspace-opened:${importedCount}`,
      durationMs: 2600,
    });
  } catch (error) {
    errorBus.fromException("打开工作区失败", error, {
      message: "选择的文件夹没有成功导入，请再试一次。",
      dedupeKey: "workspace-open-failed",
      durationMs: 4200,
    });
    throw error;
  }
}
