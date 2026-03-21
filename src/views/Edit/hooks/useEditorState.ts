import { useState, useCallback } from "react";

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
export interface UseEditorStateReturn {
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

/**
 * useEditorState Hook 参数接口
 */
export interface UseEditorStateProps {
  /** 创建文件的函数，用于新建Sparkle */
  createFile: (
    name: string,
    parentId?: string | null,
    opts?: { open?: boolean; initialContent?: string },
  ) => string;
}

/**
 * 编辑器UI状态Hook
 * 管理编辑器的视图模式和用户交互状态
 *
 * @param props - 依赖的函数（createFile）
 * @returns 编辑器UI状态和处理函数
 */
export function useEditorState({
  createFile,
}: UseEditorStateProps): UseEditorStateReturn {
  // ===== 编辑器UI状态 =====

  /** 当前视图模式：分屏/仅编辑器/仅预览 */
  const [viewMode, setViewMode] = useState<ViewMode>("split");

  /** 是否显示粒子效果（装饰功能） */
  const [particlesOn, setParticlesOn] = useState(false);

  /** 上次保存的时间 */
  const [lastSaved, setLastSaved] = useState<Date | null>(null);

  /** 是否正在保存中 */
  const [isSaving, setIsSaving] = useState(false);

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
    setLastSaved(new Date());
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
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
    handleNewSparkle,
  };
}
