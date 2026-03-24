// import Footer from "@/components/Footer";
import Header from "@/components/Header";
import MainContent from "@/components/MainContent/MainContent";
import { useState, useCallback, useRef, useEffect, useMemo } from "react";
import Modal from "@/components/Modals/Modal";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import Sidebar from "@/components/Sidebar/Sidebar";
import { cn } from "@/utils/cn";

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
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 存储同步 Hook - 管理数据加载和保存
  const storageSync = useStorageSync();

  // 路由管理的模态框状态
  const { isModalOpen, openModal, closeModal } = useModalRoute();

  // 粒子效果状态由 editorTheme 统一管理

  // 用 useMemo 稳定引用，避免每次渲染都生成新对象触发子 hook effect
  const initialFileSystem = useMemo(
    () =>
      storageSync.isInitialized && storageSync.userData
        ? storageSync.userData.fileSystem
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageSync.isInitialized], // 只在初始化完成时固定，之后不再变
  );
  const initialConfig = useMemo(
    () =>
      storageSync.isInitialized && storageSync.userData
        ? storageSync.userData.editorConfig
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageSync.isInitialized],
  );

  // 文件系统 Hook
  const fileSystem = useFileSystem({ initialFileSystem });

  // 编辑器主题 Hook
  const editorTheme = useEditorTheme({ initialConfig });

  // 数据变化时自动保存（文件内容已保存到真实.md文件，不再保存到JSON配置）
  useEffect(() => {
    if (storageSync.isInitialized) {
      storageSync.saveData({
        fileSystem: {
          nodes: fileSystem.nodes.map((n) => ({
            ...n,
            createdAt: new Date(n.createdAt).toISOString(),
            updatedAt: new Date(n.updatedAt).toISOString(),
          })),
          pinnedIds: fileSystem.pinnedIds,
          explorerOrder: fileSystem.explorerOrder,
          folderOrder: fileSystem.folderOrder,
          updatedAt: new Date().toISOString(),
        },
        editorConfig: {
          editorTheme: editorTheme.editorTheme,
          previewTheme: editorTheme.previewTheme,
          fontChoice: editorTheme.fontChoice,
          editorFont: editorTheme.editorFont,
          fontSize: editorTheme.fontSize,
          editorFontSize: editorTheme.editorFontSize,
          previewFontSize: editorTheme.previewFontSize,
          accentColor: editorTheme.accentColor,
          blurAmount: editorTheme.blurAmount,
          bgImage: editorTheme.bgImage,
          particlesOn: editorTheme.particlesOn,
          lang: editorTheme.lang,
          customFonts: editorTheme.customFonts,
          darkMode: editorTheme.darkMode,
        },
      });
    }
  }, [
    storageSync.isInitialized,
    storageSync.saveData,
    fileSystem.nodes,
    // 移除fileContents触发器，避免每次编辑都触发保存
    fileSystem.pinnedIds,
    fileSystem.explorerOrder,
    fileSystem.folderOrder,
    editorTheme.editorTheme,
    editorTheme.previewTheme,
    editorTheme.fontChoice,
    editorTheme.editorFont,
    editorTheme.fontSize,
    editorTheme.editorFontSize,
    editorTheme.previewFontSize,
    editorTheme.accentColor,
    editorTheme.blurAmount,
    editorTheme.bgImage,
    editorTheme.particlesOn,
    editorTheme.lang,
    editorTheme.customFonts,
    editorTheme.darkMode,
  ]);

  // 文件操作 Hook
  const fileOperations = useFileOperations({
    nodes: fileSystem.nodes,
    pinnedIds: fileSystem.pinnedIds,
    explorerOrder: fileSystem.explorerOrder,
    folderOrder: fileSystem.folderOrder,
    activeFileId: fileSystem.activeFileId,
    expandedFolders: fileSystem.expandedFolders,
    setNodes: fileSystem.setNodes,
    setPinnedIds: fileSystem.setPinnedIds,
    setExplorerOrder: fileSystem.setExplorerOrder,
    setFolderOrder: fileSystem.setFolderOrder,
    setExpandedFolders: fileSystem.setExpandedFolders,
    setActiveFileId: fileSystem.setActiveFileId,
  });

  // 编辑器状态 Hook
  const editorState = useEditorState({
    createFile: fileOperations.createFile,
  });

  // Markdown 同步 Hook
  const markdownSync = useMarkdownSync({
    activeFileId: fileSystem.activeFileId,
    activeFileType:
      fileSystem.nodes.find((n) => n.id === fileSystem.activeFileId)?.type ??
      null,
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

  // 打开文件时加载内容，并自动展开父文件夹
  const handleOpenFile = useCallback(
    (id: string) => {
      fileSystem.setActiveFileId(id);
      // 展开所有祖先文件夹，确保侧边栏能看到选中项
      const node = fileSystem.nodes.find((n) => n.id === id);
      if (!node) return;
      let parentId = node.parentId;
      while (parentId) {
        if (!fileSystem.expandedFolders.has(parentId)) {
          fileSystem.setExpandedFolders(
            (prev) => new Set([...prev, parentId!]),
          );
        }
        const parent = fileSystem.nodes.find((n) => n.id === parentId);
        parentId = parent?.parentId ?? null;
      }
    },
    [
      fileSystem.setActiveFileId,
      fileSystem.nodes,
      fileSystem.expandedFolders,
      fileSystem.setExpandedFolders,
    ],
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
    <div className="app-m3-shell h-screen flex flex-col overflow-hidden font-display text-slate-700 relative">
      <div
        id="editor-bg-layer"
        className="app-m3-bg absolute inset-0 z-0 pointer-events-none bg-background-light"
      />

      <header
        className="app-m3-topbar app-header h-20 flex items-center justify-between px-8 z-50 shrink-0 relative select-none"
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button") || target.closest("input")) return;
          if (e.button !== 0) return;

          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          const ipc = (window as any).require?.("electron")?.ipcRenderer;
          if (!ipc) return;

          const startScreenX = e.screenX;
          const startScreenY = e.screenY;

          // 异步获取窗口初始位置后开始监听拖拽
          ipc
            .invoke("get-window-pos")
            .then(([winX, winY]: [number, number]) => {
              const onMove = (me: MouseEvent) => {
                ipc.send("window-move", {
                  x: Math.round(winX + me.screenX - startScreenX),
                  y: Math.round(winY + me.screenY - startScreenY),
                });
              };
              const onUp = () => {
                window.removeEventListener("mousemove", onMove);
                window.removeEventListener("mouseup", onUp);
              };
              window.addEventListener("mousemove", onMove);
              window.addEventListener("mouseup", onUp);
            });
        }}
      >
        <Header
          viewMode={editorState.viewMode}
          onViewModeChange={editorState.handleViewModeChange}
          particlesOn={editorTheme.particlesOn}
          onParticlesToggle={() => editorTheme.setParticlesOn((prev) => !prev)}
          onNewSparkle={editorState.handleNewSparkle}
          onSave={editorState.handleSave}
          onSaveAs={() => openModal(ROUTES.SAVE_AS)}
          onExport={() => openModal(ROUTES.EXPORT)}
          onSearch={() => openModal(ROUTES.SEARCH)}
          onSettings={() => openModal(ROUTES.SETTINGS)}
          sidebarOpen={sidebarOpen}
          onLauncher={() => openModal(ROUTES.LAUNCHER)}
          onToggleSidebar={() => setSidebarOpen((v) => !v)}
        />
      </header>

      <div className="flex-1 flex overflow-hidden relative z-10">
        <aside
          className={cn(
            "app-m3-sidebar h-full flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
            sidebarOpen ? "w-80" : "w-0 border-r-0",
          )}
        >
          <Sidebar
            fs={{
              ...fileSystem,
              ...fileOperations,
              pinnedFiles: fileSystem.pinnedNodes,
              openFile: handleOpenFile,
            }}
            setIsSettingsModalOpen={(open) =>
              open ? openModal(ROUTES.SETTINGS) : closeModal()
            }
            setIsSearchModalOpen={(open) =>
              open ? openModal(ROUTES.SEARCH) : closeModal()
            }
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
            editorFont={editorTheme.editorFont}
            activeFileName={
              fileSystem.nodes.find((n) => n.id === fileSystem.activeFileId)
                ?.name ?? ""
            }
          />
        </main>
      </div>

      {/* <footer className="h-10 bg-white/70 backdrop-blur-xl border-t border-border-soft px-6 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider shrink-0 relative z-10">
        <Footer
          isSaving={editorState.isSaving}
          lastSaved={editorState.lastSaved}
          markdown={markdownSync.markdown}
        />
      </footer> */}

      <Modal
        editorTheme={editorTheme.editorTheme}
        previewTheme={editorTheme.previewTheme}
        setEditorTheme={editorTheme.setEditorTheme}
        setPreviewTheme={editorTheme.setPreviewTheme}
        isExportModalOpen={isModalOpen(ROUTES.EXPORT)}
        isSaveAsModalOpen={isModalOpen(ROUTES.SAVE_AS)}
        isSettingsModalOpen={isModalOpen(ROUTES.SETTINGS)}
        isSearchModalOpen={isModalOpen(ROUTES.SEARCH)}
        setIsExportModalOpen={(open) =>
          open ? openModal(ROUTES.EXPORT) : closeModal()
        }
        setIsSaveAsModalOpen={(open) =>
          open ? openModal(ROUTES.SAVE_AS) : closeModal()
        }
        setIsSettingsModalOpen={(open) =>
          open ? openModal(ROUTES.SETTINGS) : closeModal()
        }
        setIsSearchModalOpen={(open) =>
          open ? openModal(ROUTES.SEARCH) : closeModal()
        }
        markdown={markdownSync.markdown}
        particlesOn={editorTheme.particlesOn}
        setParticlesOn={editorTheme.setParticlesOn}
        fontChoice={editorTheme.fontChoice}
        setFontChoice={editorTheme.setFontChoice}
        editorFont={editorTheme.editorFont}
        setEditorFont={editorTheme.setEditorFont}
        accentColor={editorTheme.accentColor}
        setAccentColor={editorTheme.setAccentColor}
        fontSize={editorTheme.fontSize}
        setFontSize={editorTheme.setFontSize}
        editorFontSize={editorTheme.editorFontSize}
        setEditorFontSize={editorTheme.setEditorFontSize}
        previewFontSize={editorTheme.previewFontSize}
        setPreviewFontSize={editorTheme.setPreviewFontSize}
        blurAmount={editorTheme.blurAmount}
        setBlurAmount={editorTheme.setBlurAmount}
        bgImage={editorTheme.bgImage}
        setBgImage={editorTheme.setBgImage}
        customFonts={editorTheme.customFonts}
        addCustomFont={editorTheme.addCustomFont}
        lang={editorTheme.lang}
        setLang={editorTheme.setLang}
        nodes={fileSystem.nodes}
        onOpenFile={handleOpenFile}
        onLauncherSearch={() => openModal(ROUTES.SEARCH)}
        onLauncherSettings={() => openModal(ROUTES.SETTINGS)}
        onLauncherExport={() => openModal(ROUTES.EXPORT)}
        onLauncherViewMode={editorState.handleViewModeChange}
        onLauncherParticlesToggle={() =>
          editorTheme.setParticlesOn((prev) => !prev)
        }
        darkMode={editorTheme.darkMode}
        onDarkModeToggle={() => {
          editorTheme.setDarkMode((prev) => !prev);
        }}
      />
    </div>
  );
}
