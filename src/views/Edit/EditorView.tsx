import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MainContent from "@/components/MainContent/MainContent";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Modal from "@/components/Modals/Modal";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import Sidebar from "@/components/Sidebar/Sidebar";

// Hooks
import { useFileSystem } from "./hooks/useFileSystem";
import { useFileOperations } from "./hooks/useFileOperations";
import { useEditorState } from "./hooks/useEditorState";
import { useEditorTheme } from "./hooks/useEditorTheme";
import { useMarkdownSync } from "./hooks/useMarkdownSync";
import { useStorageSync } from "./hooks/useStorageSync";
import { useModalRoute, ROUTES } from "../../hooks/useModalRoute";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";

// ── EditorView ───────────────────────────────────────────────────────────────-

export default function EditorView() {
  const toolbarRef = useRef<ReactCodeMirrorRef>(null);

  // 存储同步 Hook - 管理数据加载和保存
  const storageSync = useStorageSync();

  // 路由管理的模态框状态
  const { isModalOpen, openModal, closeModal } = useModalRoute();

  // 粒子效果状态
  const [particlesOn, setParticlesOn] = useState(false);

  // 用 useMemo 稳定引用，避免每次渲染都生成新对象触发子 hook effect
  const initialFileSystem = useMemo(
    () => storageSync.isInitialized && storageSync.userData ? storageSync.userData.fileSystem : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageSync.isInitialized], // 只在初始化完成时固定，之后不再变
  );
  const initialConfig = useMemo(
    () => storageSync.isInitialized && storageSync.userData ? storageSync.userData.editorConfig : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageSync.isInitialized],
  );

  // 文件系统 Hook
  const fileSystem = useFileSystem({ initialFileSystem });

  // 编辑器主题 Hook
  const editorTheme = useEditorTheme({ initialConfig });

  // 数据变化时自动保存
  useEffect(() => {
    if (storageSync.isInitialized) {
      console.log('[Auto-save] Triggered with data:', {
        nodes: fileSystem.nodes.length,
        fileContents: Object.keys(fileSystem.fileContents).length,
        editorTheme: editorTheme.editorTheme
      });
      storageSync.saveData({
        fileSystem: {
          nodes: fileSystem.nodes.map(n => ({
            ...n,
            createdAt: new Date(n.createdAt).toISOString(),
            updatedAt: new Date(n.updatedAt).toISOString(),
          })),
          fileContents: fileSystem.fileContents,
          pinnedIds: fileSystem.pinnedIds,
          explorerOrder: fileSystem.explorerOrder,
          folderOrder: fileSystem.folderOrder,
          updatedAt: new Date().toISOString(),
        },
        editorConfig: {
          editorTheme: editorTheme.editorTheme,
          previewTheme: editorTheme.previewTheme,
          fontChoice: editorTheme.fontChoice,
          fontSize: editorTheme.fontSize,
          accentColor: editorTheme.accentColor,
          blurAmount: editorTheme.blurAmount,
          bgImage: editorTheme.bgImage,
          particlesOn: editorTheme.particlesOn,
          customFonts: editorTheme.customFonts,
        },
      });
    } else {
      console.log('[Auto-save] Skipped: not initialized');
    }
  }, [
    storageSync.isInitialized,
    storageSync.saveData,
    fileSystem.nodes,
    fileSystem.fileContents,
    fileSystem.pinnedIds,
    fileSystem.explorerOrder,
    fileSystem.folderOrder,
    editorTheme.editorTheme,
    editorTheme.previewTheme,
    editorTheme.fontChoice,
    editorTheme.fontSize,
    editorTheme.accentColor,
    editorTheme.blurAmount,
    editorTheme.bgImage,
    editorTheme.particlesOn,
    editorTheme.customFonts,
  ]);

  // 数据初始化完成后，加载活动文件的内容到编辑器
  useEffect(() => {
    if (!storageSync.isInitialized) return;
    const content = fileSystem.fileContents[fileSystem.activeFileId];
    if (content !== undefined) markdownSync.setMarkdown(content);
  // 只在初始化完成时触发一次
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storageSync.isInitialized]);

  // 文件操作 Hook
  const fileOperations = useFileOperations({
    nodes: fileSystem.nodes,
    fileContents: fileSystem.fileContents,
    pinnedIds: fileSystem.pinnedIds,
    explorerOrder: fileSystem.explorerOrder,
    folderOrder: fileSystem.folderOrder,
    activeFileId: fileSystem.activeFileId,
    expandedFolders: fileSystem.expandedFolders,
    setNodes: fileSystem.setNodes,
    setFileContents: fileSystem.setFileContents,
    setPinnedIds: fileSystem.setPinnedIds,
    setExplorerOrder: fileSystem.setExplorerOrder,
    setFolderOrder: fileSystem.setFolderOrder,
    setExpandedFolders: fileSystem.setExpandedFolders,
  });

  // 编辑器状态 Hook
  const editorState = useEditorState({
    createFile: fileOperations.createFile,
  });

  // Markdown 同步 Hook
  const markdownSync = useMarkdownSync({
    activeFileId: fileSystem.activeFileId,
    fileContents: fileSystem.fileContents,
    setFileContents: fileSystem.setFileContents,
    setNodes: fileSystem.setNodes,
  });

  // 键盘快捷键
  useKeyboardShortcuts({
    shortcuts: [
      {
        key: "k",
        ctrl: true,
        handler: () => {
          if (isModalOpen(ROUTES.SEARCH)) {
            closeModal();
          } else {
            openModal(ROUTES.SEARCH);
          }
        },
        description: "打开/关闭搜索模态框",
      },
    ],
  });

  // 字体设置已在 useEditorTheme 内部处理

  // 打开文件时加载内容
  const handleOpenFile = useCallback(
    (id: string) => {
      fileSystem.setActiveFileId(id);
    },
    [fileSystem.setActiveFileId],
  );

  // 加载状态显示
  if (storageSync.isLoading) {
    return (
      <div className="h-screen flex items-center justify-center bg-background-light">
        <div className="flex flex-col items-center gap-4">
          <div className="w-12 h-12 border-4 border-rose-200 border-t-rose-500 rounded-full animate-spin" />
          <p className="text-slate-500 font-medium">加载中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col overflow-hidden font-display text-slate-700 relative">
      <div id="editor-bg-layer" className="absolute inset-0 z-0 pointer-events-none bg-background-light" />

      <header className="h-20 flex items-center justify-between px-8 border-b border-border-soft z-50 shrink-0 relative bg-white/70 backdrop-blur-xl">
        <Header
          viewMode={editorState.viewMode}
          onViewModeChange={editorState.handleViewModeChange}
          particlesOn={particlesOn}
          onParticlesToggle={() => setParticlesOn((prev) => !prev)}
          onNewSparkle={editorState.handleNewSparkle}
          onSave={editorState.handleSave}
          onSaveAs={() => openModal(ROUTES.SAVE_AS)}
          onExport={() => openModal(ROUTES.EXPORT)}
        />
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <aside className="w-80 h-full flex flex-col border-r border-rose-100 bg-white/80 backdrop-blur-2xl shrink-0">
          <Sidebar
            fs={{
              ...fileSystem,
              ...fileOperations,
              pinnedFiles: fileSystem.pinnedNodes,
              openFile: handleOpenFile,
            }}
            setIsSettingsModalOpen={(open) => open ? openModal(ROUTES.SETTINGS) : closeModal()}
            setIsSearchModalOpen={(open) => open ? openModal(ROUTES.SEARCH) : closeModal()}
          />
        </aside>

        <main className="flex-1 flex overflow-hidden">
          <MainContent
            toolbarRef={toolbarRef}
            markdown={markdownSync.markdown}
            setMarkdown={markdownSync.setMarkdown}
            viewMode={editorState.viewMode}
            editorTheme={editorTheme.editorTheme}
            setEditorTheme={editorTheme.setEditorTheme}
            previewTheme={editorTheme.previewTheme}
            setPreviewTheme={editorTheme.setPreviewTheme}
            fontChoice={editorTheme.fontChoice}
            setFontChoice={editorTheme.setFontChoice}
          />
        </main>
      </div>

      <footer className="h-10 bg-white/70 backdrop-blur-xl border-t border-border-soft px-6 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider shrink-0 relative z-10">
        <Footer
          isSaving={editorState.isSaving}
          lastSaved={editorState.lastSaved}
          markdown={markdownSync.markdown}
        />
      </footer>

      <Modal
        editorTheme={editorTheme.editorTheme}
        previewTheme={editorTheme.previewTheme}
        setEditorTheme={editorTheme.setEditorTheme}
        setPreviewTheme={editorTheme.setPreviewTheme}
        isExportModalOpen={isModalOpen(ROUTES.EXPORT)}
        isSaveAsModalOpen={isModalOpen(ROUTES.SAVE_AS)}
        isSettingsModalOpen={isModalOpen(ROUTES.SETTINGS)}
        isSearchModalOpen={isModalOpen(ROUTES.SEARCH)}
        setIsExportModalOpen={(open) => open ? openModal(ROUTES.EXPORT) : closeModal()}
        setIsSaveAsModalOpen={(open) => open ? openModal(ROUTES.SAVE_AS) : closeModal()}
        setIsSettingsModalOpen={(open) => open ? openModal(ROUTES.SETTINGS) : closeModal()}
        setIsSearchModalOpen={(open) => open ? openModal(ROUTES.SEARCH) : closeModal()}
        markdown={markdownSync.markdown}
        particlesOn={particlesOn}
        setParticlesOn={setParticlesOn}
        fontChoice={editorTheme.fontChoice}
        setFontChoice={editorTheme.setFontChoice}
        accentColor={editorTheme.accentColor}
        setAccentColor={editorTheme.setAccentColor}
        fontSize={editorTheme.fontSize}
        setFontSize={editorTheme.setFontSize}
        blurAmount={editorTheme.blurAmount}
        setBlurAmount={editorTheme.setBlurAmount}
        bgImage={editorTheme.bgImage}
        setBgImage={editorTheme.setBgImage}
        customFonts={editorTheme.customFonts}
        addCustomFont={editorTheme.addCustomFont}
      />
    </div>
  );
}
