import { useState, useCallback, ReactNode, createContext, useContext, useEffect, useRef } from "react";
import { useFileOperationsContext } from "./FileOperationContext";
import { useMarkdownSyncContext } from "./MarkdownSyncContext";
import { useEditorConfigContext } from "./EditorConfigContext";
import { useFileSystemContext } from "./FileSystemContext";

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
  // 文件操作
  const { createFile } = useFileOperationsContext();
  // Markdown 同步
  const markdownSync = useMarkdownSyncContext();
  // 编辑器配置
  const editorConfig = useEditorConfigContext();
  // 文件系统
  const fileSystem = useFileSystemContext();
  
  // ===== 编辑器UI状态 =====

  /** 当前视图模式：分屏/仅编辑器/仅预览 */
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  /** 是否显示粒子效果（装饰功能） */
  const [particlesOn, setParticlesOn] = useState(false);

  /** 上次保存的时间 */
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  /** 是否正在保存中 */
  const [isSaving, setIsSaving] = useState(false);

  // 自动保存定时器引用
  const autoSaveTimerRef = useRef<NodeJS.Timeout | null>(null);

  // ===== UI处理函数 =====

  /**
   * 新建Sparkle
   * 创建一个名为"New_Sparkle"的新文件
   */
  const handleNewSparkle = useCallback(
    () => createFile("New_Sparkle"),
    [createFile],
  );

  /**
   * 保存文件
   * 更新保存状态，显示保存指示器，800ms后自动结束
   */
  const handleSave = useCallback(() => {
    // 触发保存到后端
    if (fileSystem.activeFileId && markdownSync.markdown) {
      markdownSync.setMarkdown(markdownSync.markdown);
    }
    setLastSaved(new Date());
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  }, [fileSystem.activeFileId, markdownSync.markdown, markdownSync.setMarkdown]);

  // 自动保存逻辑
  useEffect(() => {
    // 清除之前的定时器
    if (autoSaveTimerRef.current) {
      clearInterval(autoSaveTimerRef.current);
      autoSaveTimerRef.current = null;
    }

    // 如果自动保存开启且有活动文件，设置定时器
    if (editorConfig.autoSave && fileSystem.activeFileId) {
      autoSaveTimerRef.current = setInterval(() => {
        if (fileSystem.activeFileId && markdownSync.markdown) {
          markdownSync.setMarkdown(markdownSync.markdown);
          setLastSaved(new Date());
          setIsSaving(true);
          setTimeout(() => setIsSaving(false), 800);
        }
      }, editorConfig.autoSaveInterval);
    }

    // 清理函数
    return () => {
      if (autoSaveTimerRef.current) {
        clearInterval(autoSaveTimerRef.current);
        autoSaveTimerRef.current = null;
      }
    };
  }, [editorConfig.autoSave, editorConfig.autoSaveInterval, fileSystem.activeFileId, markdownSync.markdown, markdownSync.setMarkdown]);

  /**
   * 另存为
   * 实际行为由父组件通过modal状态处理
   */
  const handleSaveAs = useCallback(() => {
    // This will be handled by the parent component via modal state
  }, []);

  /**
   * 导出文件
   * 实际行为由父组件通过modal状态处理
   */
  const handleExport = useCallback(() => {
    // This will be handled by the parent component via modal state
  }, []);

  /**
   * 切换粒子效果显示状态
   */
  const handleParticlesToggle = useCallback(
    () => setParticlesOn((prev) => !prev),
    [],
  );

  /**
   * 切换视图模式
   *
   * @param mode - 新的视图模式
   */
  const handleViewModeChange = useCallback((mode: ViewMode) => {
    setViewMode(mode);
  }, []);

  return (
    <EditorStateContext.Provider
      value={{
        viewMode,
        particlesOn,
        isSaving,
        lastSaved,
        handleViewModeChange,
        handleParticlesToggle,
        handleSave,
        handleSaveAs,
        handleExport,
        handleNewSparkle,
      }}
    >
        {children}
    </EditorStateContext.Provider>
  );
}


export function useEditorStateContext() {
    const context = useContext(EditorStateContext);
    if (!context) {
        throw new Error("EditorStateContext must be used within EditorStateProvider");
    }
    return context;
}