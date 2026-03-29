import {
  useState,
  useCallback,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useMemo,
} from "react";
import { useMarkdownSyncContext } from "./MarkdownSyncContext";

import { useFileSystemContext } from "./FileSystemContext";
import { useEditorConfigContext } from "./EditorConfig/EditorThemeProvider";

/**
 * 视图模式类型
 * - split: 分屏模式（编辑器+预览）
 * - editor: 仅编辑器模式
 * - preview: 仅预览模式
 */
export type ViewMode = "split" | "editor" | "preview";

/**
 * useEditorState Hook 返回值接口
 */
export interface EditorStateContextProps {
  /** 当前视图模式 */
  viewMode: ViewMode;
  /** 是否显示粒子效果 */
  particlesOn: boolean;
  /** 是否正在保存 */
  isSaving: boolean;
  /** 上次保存的时间 */
  lastSaved: Date | null;
  /** 切换视图模式 */
  handleViewModeChange: (mode: ViewMode) => void;
  /** 切换粒子效果显示 */
  handleParticlesToggle: () => void;
  /** 保存文件 */
  handleSave: () => void;
  /** 另存为 */
  handleSaveAs: () => void;
  handleOpenFile: (id: string) => void;
  /** 导出文件 */
  handleExport: () => void;
  /** 新建Sparkle（新建文件） */
  handleNewSparkle: () => void;
}

const EditorStateContext = createContext<EditorStateContextProps | undefined>(
  undefined,
);
/**
 * 编辑器UI状态Hook
 * 管理编辑器的视图模式和用户交互状态
 *
 * @param props - 依赖的函数（createFile）
 * @returns 编辑器UI状态和处理函数
 */
export function EditorStateProvider({
  children,
}: {
  children: ReactNode;
}): ReactNode {
  const { markdown, setMarkdown } = useMarkdownSyncContext();
  const { autoSave, autoSaveInterval } = useEditorConfigContext();
  const {
    nodes,
    activeFileId,
    createFile,
    setActiveFileId,
    expandedFolders,
    setExpandedFolders,
  } = useFileSystemContext();
  const [viewMode, setViewMode] = useState<ViewMode>("split");
  const [particlesOn, setParticlesOn] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const performSave = useCallback(() => {
    if (activeFileId) {
      setMarkdown(markdown);
      setLastSaved(new Date());
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 800);
    }
  }, [activeFileId, markdown, setMarkdown]);

  const handleSave = useCallback(() => {
    performSave();
  }, [performSave]);

  const handleNewSparkle = useCallback(
    () => {
      void createFile("New_Sparkle");
    },
    [createFile],
  );

  const handleParticlesToggle = useCallback(
    () => setParticlesOn((prev) => !prev),
    [],
  );

  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  const handleSaveAs = useCallback(() => {
  }, []);

  const handleExport = useCallback(() => {
  }, []);

  useEffect(() => {
    if (!autoSave || !activeFileId) return;

    const timer = setTimeout(() => {
      performSave();
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [autoSave, autoSaveInterval, activeFileId, markdown, setMarkdown]);

  const handleOpenFile = useCallback(
    (id: string) => {
      setActiveFileId(id);
      const node = nodes.find((n) => n.id === id);
      if (!node) return;
      let parentId = node.parentId;
      while (parentId) {
        if (!expandedFolders.has(parentId)) {
          setExpandedFolders((prev) => new Set([...prev, parentId!]));
        }
        const parent = nodes.find((n) => n.id === parentId);
        parentId = parent?.parentId ?? null;
      }
    },
    [setActiveFileId, nodes, expandedFolders, setExpandedFolders],
  );

  const contextValue = useMemo(() => {
    return {
      viewMode,
      particlesOn,
      isSaving,
      lastSaved,
      handleViewModeChange,
      handleParticlesToggle,
      handleSave,
      handleSaveAs,
      handleExport,
      handleOpenFile,
      handleNewSparkle,
    };
  }, [
    viewMode,
    particlesOn,
    isSaving,
    lastSaved,
    handleViewModeChange,
    handleParticlesToggle,
    handleSave,
    handleSaveAs,
    handleExport,
    handleOpenFile,
    handleNewSparkle,
  ]);

  return (
    <EditorStateContext.Provider value={contextValue}>
      {children}
    </EditorStateContext.Provider>
  );
}

export function useEditorStateContext() {
  const context = useContext(EditorStateContext);
  if (!context) {
    throw new Error(
      "EditorStateContext must be used within EditorStateProvider",
    );
  }
  return context;
}
