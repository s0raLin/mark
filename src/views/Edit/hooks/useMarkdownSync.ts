import { useState, useEffect } from "react";
import { INITIAL_MARKDOWN } from "@/src/constants";

export interface UseMarkdownSyncReturn {
  markdown: string;
  setMarkdown: React.Dispatch<React.SetStateAction<string>>;
}

export interface UseMarkdownSyncProps {
  activeFileId: string;
  fileContents: Record<string, string>;
  setFileContents: React.Dispatch<React.SetStateAction<Record<string, string>>>;
  setNodes: React.Dispatch<React.SetStateAction<import("@/src/types/filesystem").FileNode[]>>;
}

export function useMarkdownSync({
  activeFileId,
  fileContents,
  setFileContents,
  setNodes,
}: UseMarkdownSyncProps): UseMarkdownSyncReturn {
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);

  // 保存当前文件内容
  useEffect(() => {
    if (!activeFileId) return;
    setFileContents((prev) => ({ ...prev, [activeFileId]: markdown }));
    setNodes((prev) =>
      prev.map((n) =>
        n.id === activeFileId ? { ...n, updatedAt: Date.now() } : n,
      ),
    );
  }, [markdown, activeFileId, setFileContents, setNodes]);

  // 当 activeFileId 变化时加载文件内容
  useEffect(() => {
    if (!activeFileId) return;
    const content = fileContents[activeFileId];
    if (content !== undefined) {
      setMarkdown(content);
    } else {
      setMarkdown("");
    }
  }, [activeFileId, fileContents]);

  return {
    markdown,
    setMarkdown,
  };
}
