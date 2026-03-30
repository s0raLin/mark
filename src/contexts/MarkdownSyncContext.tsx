import { getFileContent, updateFileContent, type GetFileContentResponse } from "@/api/client";
import { errorBus } from "./errorBus";
import { INITIAL_MARKDOWN } from "@/constants";
import { DEFAULT_FILE_ID } from "./utils/fileSystemUtils";
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

export interface MarkdownSyncContextProps {
  markdown: string;
  setMarkdown: React.Dispatch<React.SetStateAction<string>>;
  activeFileContent: GetFileContentResponse | null;
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
  const activeNode = fileSystem.nodes.find((n) => n.id === activeFileId) ?? null;
  const activeFileType = activeNode?.type ?? null;
  const setNodes = fileSystem.setNodes;
  const [markdown, setMarkdown] = useState(INITIAL_MARKDOWN);
  const [activeFileContent, setActiveFileContent] = useState<GetFileContentResponse | null>(null);
  const fileContentsRef = useRef<Record<string, GetFileContentResponse>>({});
  const prevMarkdownRef = useRef<string>(INITIAL_MARKDOWN);

  useEffect(() => {
    if (!activeFileId || !activeNode || activeFileType === "folder") {
      setMarkdown("");
      setActiveFileContent(null);
      return;
    }

    if (activeFileId === DEFAULT_FILE_ID) {
      const response: GetFileContentResponse = {
        id: DEFAULT_FILE_ID,
        content: fileContentsRef.current[DEFAULT_FILE_ID]?.content ?? INITIAL_MARKDOWN,
        kind: "text",
        mimeType: "text/markdown",
        size: INITIAL_MARKDOWN.length,
        editable: true,
        previewable: true,
      };
      fileContentsRef.current[DEFAULT_FILE_ID] = response;
      setActiveFileContent(response);
      setMarkdown(response.content);
      return;
    }

    const load = async () => {
      try {
        const cached = fileContentsRef.current[activeFileId];
        if (cached !== undefined) {
          setActiveFileContent(cached);
          setMarkdown(cached.kind === "text" ? cached.content || "" : "");
        } else {
          const response = await getFileContent(activeFileId);
          fileContentsRef.current[activeFileId] = response;
          setActiveFileContent(response);
          setMarkdown(response.kind === "text" ? response.content || "" : "");
        }
      } catch (err) {
        console.error("加载文件失败:", err);
        errorBus.fromException("无法打开文件", err, {
          message: "文件内容读取失败，请稍后重试。",
          dedupeKey: `load-file:${activeFileId}`,
        });
        setActiveFileContent(null);
        setMarkdown("");
      }
    };

    load();
  }, [activeFileId, activeFileType, activeNode]);

  const saveToBackend = useCallback(
    (newMarkdown: string) => {
      if (!activeFileId) return;
      if (activeFileContent?.editable === false) return;
      const previous = fileContentsRef.current[activeFileId];
      fileContentsRef.current[activeFileId] = {
        ...(previous ?? {
          id: activeFileId,
          kind: "text",
          mimeType: "text/plain",
          mediaDataUrl: undefined,
          size: 0,
          editable: true,
          previewable: true,
        }),
        content: newMarkdown,
        kind: "text",
        editable: true,
        previewable: true,
      };
      setActiveFileContent((prev) => (prev?.id === activeFileId
        ? {
            ...(prev ?? {
              id: activeFileId,
              kind: "text",
              mimeType: "text/plain",
              mediaDataUrl: undefined,
              size: 0,
              editable: true,
              previewable: true,
            }),
            content: newMarkdown,
            kind: "text",
            editable: true,
            previewable: true,
          }
        : prev));
      setNodes((prev) =>
        prev.map((n) =>
          n.id === activeFileId ? { ...n, updatedAt: Date.now() } : n,
        ),
      );
      if (activeFileId === DEFAULT_FILE_ID) {
        return;
      }
      updateFileContent(activeFileId, newMarkdown).catch((err) => {
        console.error("保存文件失败:", err);
        errorBus.fromException("自动保存失败", err, {
          message: "内容暂时没有保存成功，我们会在你下次修改时继续尝试。",
          dedupeKey: `save-file:${activeFileId}`,
        });
      });
    },
    [activeFileContent?.editable, activeFileId, setNodes],
  );

  const handleSetMarkdown = useCallback(
    (value: string | ((prev: string) => string)) => {
      setMarkdown((prev) => {
        const next = typeof value === "function" ? value(prev) : value;
        return next;
      });
    },
    [],
  );

  // 使用 useEffect 来监听 markdown 变化并保存，避免在渲染期间调用 setState
  useEffect(() => {
    if (markdown !== prevMarkdownRef.current) {
      prevMarkdownRef.current = markdown;
      saveToBackend(markdown);
    }
  }, [markdown, saveToBackend]);

  const context = useMemo(() => {
    return { markdown, setMarkdown: handleSetMarkdown, activeFileContent };
  }, [activeFileContent, markdown, handleSetMarkdown]);

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
