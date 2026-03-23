import { useState, useEffect, useRef, useCallback } from "react";
import { INITIAL_MARKDOWN } from "@/constants";
import { saveFileContent, getFileContent } from "@/api";

export interface UseMarkdownSyncReturn {
  markdown: string;
  setMarkdown: React.Dispatch<React.SetStateAction<string>>;
}

export interface UseMarkdownSyncProps {
  activeFileId: string | null;
  activeFileType?: "file" | "folder" | null;
  setNodes: React.Dispatch<React.SetStateAction<import("@/types/filesystem").FileNode[]>>;
}

export function useMarkdownSync({
  activeFileId,
  activeFileType,
  setNodes,
}: UseMarkdownSyncProps): UseMarkdownSyncReturn {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const fileContentsRef = useRef<Record<string, string>>({});

  useEffect(() => {
    // 只对文件类型请求内容，文件夹跳过
    if (!activeFileId || activeFileType === "folder") return;

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

  return { markdown, setMarkdown: handleSetMarkdown };
}
