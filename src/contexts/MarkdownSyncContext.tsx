import { getFileContent, saveFileContent } from "@/api/client";
import { INITIAL_MARKDOWN } from "@/constants";
import {
  useState,
  useRef,
  useEffect,
  useCallback,
  ReactNode,
  createContext,
  useContext,
  useMemo,
} from "react";
import { useFileSystemContext } from "./FileSystemContext";

export interface UseMarkdownSyncProps {
  activeFileId: string | null;
  activeFileType?: "file" | "folder" | null;
  setNodes: React.Dispatch<
    React.SetStateAction<import("@/types/filesystem").FileNode[]>
  >;
}

// 可编辑的文本扩展名白名单
const TEXT_EXTENSIONS = new Set([
  "md",
  "txt",
  "markdown",
  "mdown",
  "mkd",
  "json",
  "yaml",
  "yml",
  "toml",
  "xml",
  "js",
  "ts",
  "jsx",
  "tsx",
  "css",
  "html",
  "htm",
  "sh",
  "bash",
  "py",
  "go",
  "rs",
  "java",
  "c",
  "cpp",
  "h",
  "csv",
  "log",
  "env",
  "gitignore",
]);

function isTextFile(fileId: string): boolean {
  const ext = fileId.split(".").pop()?.toLowerCase() ?? "";
  return TEXT_EXTENSIONS.has(ext);
}

export interface MarkdownSyncContextProps {
  markdown: string;
  setMarkdown: React.Dispatch<React.SetStateAction<string>>;
}

const MarkdownSyncContext = createContext<MarkdownSyncContextProps | undefined>(
  undefined,
);
export function MarkdownSyncProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const fileSystem = useFileSystemContext();
  const activeFileId = fileSystem.activeFileId;
  const activeFileType =
    fileSystem.nodes.find((n) => n.id === fileSystem.activeFileId)?.type ??
    null;
  const setNodes = fileSystem.setNodes;
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const fileContentsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    if (!activeFileId || activeFileType === "folder") return;

    // 二进制/不支持的文件类型直接跳过，不发请求
    if (!isTextFile(activeFileId)) {
      setMarkdown("");
      return;
    }

    const load = async () => {
      try {
        const cached = fileContentsRef.current[activeFileId];
        if (cached !== undefined) {
          setMarkdown(cached);
        } else {
          const response = await getFileContent(activeFileId);
          const content = response.content || "";
          fileContentsRef.current[activeFileId] = content;
          setMarkdown(content);
        }
      } catch (err) {
        console.error("加载文件失败:", err);
        setMarkdown("");
      }
    };

    load();
  }, [activeFileId]);

  const saveToBackend = useCallback(
    (newMarkdown: string) => {
      if (!activeFileId) return;
      // 非文本文件不写回
      if (!isTextFile(activeFileId)) return;
      fileContentsRef.current[activeFileId] = newMarkdown;
      setNodes((prev) =>
        prev.map((n) =>
          n.id === activeFileId ? { ...n, updatedAt: Date.now() } : n,
        ),
      );
      saveFileContent(activeFileId, newMarkdown).catch((err) => {
        console.error("保存文件失败:", err);
      });
    },
    [activeFileId, setNodes],
  );

  const handleSetMarkdown = useCallback(
    (value: string | ((prev: string) => string)) => {
      setMarkdown((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        if (next !== prev) saveToBackend(next);
        return next;
      });
    },
    [saveToBackend],
  );

  const context = useMemo(() => {
    return { markdown, setMarkdown: handleSetMarkdown };
  }, [markdown, handleSetMarkdown]);

  return (
    <MarkdownSyncContext.Provider value={context}>
      {children}
    </MarkdownSyncContext.Provider>
  );
}

export function useMarkdownSyncContext() {
  const context = useContext(MarkdownSyncContext);
  if (!context) {
    throw Error(
      "useMarkdownSyncContext must be used within MarkdownSyncProvider",
    );
  }
  return context;
}
