import { useState, useEffect, useRef, useCallback } from "react";
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
  const prevActiveFileIdRef = useRef<string | null>(null);

  // 当 activeFileId 变化时，加载对应文件的内容
  // 只监听 activeFileId，不监听 fileContents，避免循环
  useEffect(() => {
    if (!activeFileId) return;
    
    // 如果是文件切换（不是初次加载），从 fileContents 加载内容
    if (prevActiveFileIdRef.current !== null && prevActiveFileIdRef.current !== activeFileId) {
      const content = fileContents[activeFileId];
      if (content !== undefined) {
        setMarkdown(content);
      } else {
        setMarkdown("");
      }
    }
    
    prevActiveFileIdRef.current = activeFileId;
  }, [activeFileId, fileContents]);

  // 保存内容到 fileContents - 使用 useCallback 包装避免依赖变化
  const saveToFileContents = useCallback((newMarkdown: string) => {
    if (!activeFileId) return;
    setFileContents((prev) => ({ ...prev, [activeFileId]: newMarkdown }));
    setNodes((prev) =>
      prev.map((n) =>
        n.id === activeFileId ? { ...n, updatedAt: Date.now() } : n,
      ),
    );
  }, [activeFileId, setFileContents, setNodes]);

  // 包装 setMarkdown，在更新时同步保存
  const handleSetMarkdown = useCallback((value: string | ((prev: string) => string)) => {
    setMarkdown((prev) => {
      const newValue = typeof value === "function" ? value(prev) : value;
      // 只有值真正变化时才保存
      if (newValue !== prev) {
        saveToFileContents(newValue);
      }
      return newValue;
    });
  }, [saveToFileContents]);

  return {
    markdown,
    setMarkdown: handleSetMarkdown,
  };
}
