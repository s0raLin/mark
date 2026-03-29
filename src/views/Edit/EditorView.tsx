import Header from "@/components/Header/Header";
import MainContent from "@/components/MainContent/MainContent";
import { useState, useCallback, useRef, useEffect } from "react";
import Modal from "@/components/Modals/Modal";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import Sidebar from "@/components/Sidebar/Sidebar";
import { cn } from "@/utils/cn";

import { useModalRoute, ROUTES } from "../../hooks/useModalRoute";

import { useStorageSyncContext } from "@/contexts/StorageContext";
import { useFileSystemContext } from "@/contexts/FileSystemContext";
import { useEditorStateContext } from "@/contexts/EditorStateContext";
import { useEditorConfigContext } from "@/contexts/EditorConfig/EditorThemeProvider";

// ── EditorView ───────────────────────────────────────────────────────────────-

export default function EditorView() {
  const toolbarRef = useRef<ReactCodeMirrorRef>(null);
  const [sidebarOpen, setSidebarOpen] = useState(true);

  // 存储同步 Hook - 管理数据加载和保存
  const storageSync = useStorageSyncContext();

  // 路由管理的模态框状态
  const { isModalOpen, openModal, closeModal } = useModalRoute();

  const fileSystem = useFileSystemContext();
  const editorTheme = useEditorConfigContext();

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
          autoSave: editorTheme.autoSave,
          autoSaveInterval: editorTheme.autoSaveInterval,
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
    editorTheme.autoSave,
    editorTheme.autoSaveInterval,
  ]);

  const editorState = useEditorStateContext();

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
        onLauncherSearch={() => openModal(ROUTES.SEARCH)}
        onLauncherSettings={() => openModal(ROUTES.SETTINGS)}
        onLauncherExport={() => openModal(ROUTES.EXPORT)}
        onLauncherViewMode={editorState.handleViewModeChange}
      />
    </div>
  );
}
