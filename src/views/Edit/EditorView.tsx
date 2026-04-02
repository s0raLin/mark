import Header from "@/components/Header/Header";
import MainContent from "@/components/MainContent/MainContent";
import { useState, useCallback, useRef, useEffect } from "react";
import Modal from "@/components/Modals/Modal";
import Sidebar from "@/components/Sidebar/Sidebar";
import { importDroppedIntoFs } from "@/components/Sidebar/utils";
import { importFileListIntoFs } from "@/components/Sidebar/utils";
import { cn } from "@/utils/cn";

import { useModalRoute, ROUTES } from "../../hooks/useModalRoute";

import { useStorageSyncContext } from "@/contexts/StorageContext";
import { useFileSystemContext } from "@/contexts/FileSystemContext";
import { useEditorStateContext } from "@/contexts/EditorStateContext";
import { useEditorConfigContext } from "@/contexts/EditorConfig/EditorThemeProvider";
import { errorBus } from "@/contexts/errorBus";
import {
  getDesktopWindowPosition,
  setDesktopWindowPosition,
  supportsDesktopShell,
} from "@/api/client";

// ── EditorView ───────────────────────────────────────────────────────────────-

export default function EditorView() {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [sidebarWidth, setSidebarWidth] = useState(() => {
    if (typeof window === "undefined") {
      return 320;
    }

    const raw = window.localStorage.getItem("notemark:sidebar-width");
    const parsed = raw ? Number(raw) : NaN;
    return Number.isFinite(parsed) ? Math.min(Math.max(parsed, 240), 520) : 320;
  });
  const [isWorkspaceDragOver, setIsWorkspaceDragOver] = useState(false);
  const dragDepthRef = useRef(0);
  const workspacePickerRef = useRef<HTMLInputElement>(null);

  // 存储同步 Hook - 管理数据加载和保存
  const storageSync = useStorageSyncContext();

  // 路由管理的模态框状态
  const { isModalOpen, openModal, closeModal } = useModalRoute();

  const fileSystem = useFileSystemContext();
  const fileSystemRef = useRef(fileSystem);
  const editorTheme = useEditorConfigContext();

  useEffect(() => {
    fileSystemRef.current = fileSystem;
  }, [fileSystem]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem("notemark:sidebar-width", String(sidebarWidth));
  }, [sidebarWidth]);

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

  const handleOpenWorkspace = useCallback(() => {
    workspacePickerRef.current?.click();
  }, []);

  const handleWorkspaceSelection = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) {
      return;
    }

    await importFileListIntoFs(files, fileSystem, { replaceExisting: true });
    event.target.value = "";
  }, [fileSystem]);

  const handleNewProject = useCallback(async () => {
    await fileSystem.resetWorkspace();
    errorBus.info("已创建空项目", {
      message: "当前工作区已经清空，你可以开始新内容。",
      dedupeKey: "new-empty-project",
      durationMs: 2400,
    });
  }, [fileSystem]);

  const isExternalFileDrag = useCallback((dataTransfer: DataTransfer | null) => {
    if (!dataTransfer) {
      return false;
    }

    return Array.from(dataTransfer.types ?? []).includes("Files");
  }, []);

  const handleWorkspaceDragOver = useCallback((e: React.DragEvent) => {
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    setIsWorkspaceDragOver(true);
  }, [isExternalFileDrag]);

  const handleWorkspaceDragLeave = useCallback((e: React.DragEvent) => {
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    const nextTarget = e.relatedTarget as Node | null;
    if (nextTarget && e.currentTarget.contains(nextTarget)) {
      return;
    }

    setIsWorkspaceDragOver(false);
  }, [isExternalFileDrag]);

  const handleWorkspaceDrop = useCallback(async (e: React.DragEvent) => {
    if (!isExternalFileDrag(e.dataTransfer)) {
      return;
    }

    e.preventDefault();
    setIsWorkspaceDragOver(false);
    await importDroppedIntoFs(e.dataTransfer, fileSystem, null);
  }, [fileSystem, isExternalFileDrag]);

  useEffect(() => {
    const isExternalFiles = (dataTransfer: DataTransfer | null) =>
      Boolean(dataTransfer && Array.from(dataTransfer.types ?? []).includes("Files"));

    const handleWindowDragEnter = (event: DragEvent) => {
      if (!isExternalFiles(event.dataTransfer)) {
        return;
      }

      dragDepthRef.current += 1;
      setIsWorkspaceDragOver(true);
    };

    const handleWindowDragOver = (event: DragEvent) => {
      if (!isExternalFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      if (event.dataTransfer) {
        event.dataTransfer.dropEffect = "copy";
      }
      setIsWorkspaceDragOver(true);
    };

    const handleWindowDragLeave = (event: DragEvent) => {
      if (!isExternalFiles(event.dataTransfer)) {
        return;
      }

      dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
      if (dragDepthRef.current === 0) {
        setIsWorkspaceDragOver(false);
      }
    };

    const handleWindowDrop = async (event: DragEvent) => {
      if (!isExternalFiles(event.dataTransfer)) {
        return;
      }

      event.preventDefault();
      dragDepthRef.current = 0;
      setIsWorkspaceDragOver(false);

      if (!event.dataTransfer) {
        errorBus.warning("没有检测到可导入的文件", {
          message: "这次拖拽没有读取到文件内容，请再试一次。",
          dedupeKey: "window-drop-empty",
          durationMs: 2800,
        });
        return;
      }

      try {
        await importDroppedIntoFs(event.dataTransfer, fileSystemRef.current, null);
      } catch {
        // importDroppedIntoFs already emits a toast with the real error
      }
    };

    window.addEventListener("dragenter", handleWindowDragEnter, true);
    window.addEventListener("dragover", handleWindowDragOver, true);
    window.addEventListener("dragleave", handleWindowDragLeave, true);
    window.addEventListener("drop", handleWindowDrop, true);

    return () => {
      window.removeEventListener("dragenter", handleWindowDragEnter, true);
      window.removeEventListener("dragover", handleWindowDragOver, true);
      window.removeEventListener("dragleave", handleWindowDragLeave, true);
      window.removeEventListener("drop", handleWindowDrop, true);
    };
  }, []);

  return (
    <div className="app-m3-shell h-screen flex flex-col overflow-hidden font-display text-slate-700 relative">
      <div
        id="editor-bg-layer"
        className="app-m3-bg absolute inset-0 z-0 pointer-events-none bg-background-light"
      />
      <input
        ref={workspacePickerRef}
        type="file"
        multiple
        className="sr-only"
        onChange={handleWorkspaceSelection}
        {...({ webkitdirectory: "", directory: "" } as Record<string, string>)}
      />

      <header
        className="app-m3-topbar app-header h-20 flex items-center justify-between px-8 z-50 shrink-0 relative select-none"
        onMouseDown={(e) => {
          const target = e.target as HTMLElement;
          if (target.closest("button") || target.closest("input")) return;
          if (e.button !== 0) return;
          if (!supportsDesktopShell()) return;

          const startScreenX = e.screenX;
          const startScreenY = e.screenY;

          getDesktopWindowPosition()
            .then(([winX, winY]: [number, number]) => {
              const onMove = (me: MouseEvent) => {
                setDesktopWindowPosition({
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

      <div
        className="flex-1 flex overflow-hidden relative z-10"
        onDragOver={handleWorkspaceDragOver}
        onDragLeave={handleWorkspaceDragLeave}
        onDrop={handleWorkspaceDrop}
      >
        {isWorkspaceDragOver && (
          <div className="pointer-events-none absolute inset-0 z-40 bg-primary/[0.05] ring-2 ring-inset ring-primary/30" />
        )}
        <aside
          style={sidebarOpen ? { width: `${sidebarWidth}px` } : { width: 0 }}
          className={cn(
            "app-m3-sidebar h-full flex flex-col shrink-0 transition-all duration-300 overflow-hidden",
            sidebarOpen ? "border-r border-border-soft" : "w-0 border-r-0",
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
          {sidebarOpen && (
            <div
              role="separator"
              aria-orientation="vertical"
              aria-label="Resize sidebar"
              className="absolute right-0 top-0 h-full w-2 translate-x-1/2 cursor-col-resize z-30 group/sidebar-resize"
              onMouseDown={(event) => {
                event.preventDefault();
                const startX = event.clientX;
                const startWidth = sidebarWidth;

                const handleMove = (moveEvent: MouseEvent) => {
                  const nextWidth = Math.min(
                    Math.max(startWidth + moveEvent.clientX - startX, 240),
                    520,
                  );
                  setSidebarWidth(nextWidth);
                };

                const handleUp = () => {
                  window.removeEventListener("mousemove", handleMove);
                  window.removeEventListener("mouseup", handleUp);
                };

                window.addEventListener("mousemove", handleMove);
                window.addEventListener("mouseup", handleUp);
              }}
            >
              <div className="mx-auto h-full w-px bg-transparent transition-colors group-hover/sidebar-resize:bg-primary/35" />
            </div>
          )}
        </aside>

        <main className="flex-1 flex overflow-hidden">
          <MainContent
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
        onOpenWorkspace={handleOpenWorkspace}
        onNewProject={handleNewProject}
      />
    </div>
  );
}
