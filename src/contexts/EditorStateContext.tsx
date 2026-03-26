import {
  useState,
  useCallback,
  ReactNode,
  createContext,
  useContext,
  useEffect,
  useRef,
  useMemo,
} from "react";
import { useFileOperationsContext } from "./FileOperationContext";
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
  // 文件操作
  const { createFile } = useFileOperationsContext();
  // Markdown 同步
  const { markdown, setMarkdown } = useMarkdownSyncContext();
  // 编辑器配置
  const { autoSave, autoSaveInterval } = useEditorConfigContext();
  // 文件系统
  const {
    nodes,
    activeFileId,
    setActiveFileId,
    expandedFolders,
    setExpandedFolders,
  } = useFileSystemContext();

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

  // --- 内部辅助：保存逻辑抽离 ---
  // 使用 useCallback 避免函数重建，并供手动保存和自动保存复用
  const performSave = useCallback(() => {
    if (activeFileId && markdown) {
      setMarkdown(markdown); // 触发实际保存
      setLastSaved(new Date());
      setIsSaving(true);
      setTimeout(() => setIsSaving(false), 800);
    }
  }, [activeFileId, markdown, setMarkdown]);

  /**
   * 保存文件
   * 更新保存状态，显示保存指示器，800ms后自动结束
   */
  const handleSave = useCallback(() => {
    performSave();
  }, [performSave]);

  /**
   * 新建Sparkle
   * 创建一个名为"New_Sparkle"的新文件
   */
  const handleNewSparkle = useCallback(
    () => createFile("New_Sparkle"),
    [createFile],
  );

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

  // 自动保存逻辑
  useEffect(() => {
    if (!autoSave || !activeFileId || !markdown) return;

    const timer = setTimeout(() => {
      performSave();
    }, autoSaveInterval);

    return () => clearTimeout(timer);
  }, [autoSave, autoSaveInterval, activeFileId, markdown, setMarkdown]);

  // 打开文件时加载内容，并自动展开父文件夹
  const handleOpenFile = useCallback(
    (id: string) => {
      setActiveFileId(id);
      // 展开所有祖先文件夹，确保侧边栏能看到选中项
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
  // --- Memoize Context Value ---
  const contextValue = useMemo(() => {
    return {
      viewMode,
      particlesOn,
      isSaving,
      lastSaved,
      handleViewModeChange,
      handleParticlesToggle,
      handleSave,
      handleSaveAs: () => {}, //占位
      handleExport: () => {}, //占位
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
    handleSaveAs, //占位
    handleExport, //占位
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
