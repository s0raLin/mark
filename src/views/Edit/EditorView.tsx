import Footer from "@/src/components/Footer";
import Header from "@/src/components/Header";
import MainContent from "@/src/components/MainContent/MainContent";
import { useState, useEffect, useCallback, useRef } from "react";
import Modal from "@/src/components/Modals/Modal";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import Sidebar from "@/src/components/Sidebar/Sidebar";

// Hooks
import { useFileSystem } from "./hooks/useFileSystem";
import { useFileOperations } from "./hooks/useFileOperations";
import { useEditorState } from "./hooks/useEditorState";
import { useEditorTheme } from "./hooks/useEditorTheme";
import { useMarkdownSync } from "./hooks/useMarkdownSync";

// ── EditorView ────────────────────────────────────────────────────────────────

export default function EditorView() {
  const toolbarRef = useRef<ReactCodeMirrorRef>(null);

  // Modal 状态
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [particlesOn, setParticlesOn] = useState(false);

  // 文件系统 Hook
  const fileSystem = useFileSystem();

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

  // 主题 Hook
  const editorTheme = useEditorTheme();

  // Markdown 同步 Hook
  const markdownSync = useMarkdownSync({
    activeFileId: fileSystem.activeFileId,
    fileContents: fileSystem.fileContents,
    setFileContents: fileSystem.setFileContents,
    setNodes: fileSystem.setNodes,
  });

  // 键盘快捷键
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "k") {
        e.preventDefault();
        setIsSearchModalOpen((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // 字体设置
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-display",
      editorTheme.fontChoice === "Quicksand"
        ? '"Quicksand", sans-serif'
        : `"${editorTheme.fontChoice}", sans-serif`,
    );
  }, [editorTheme.fontChoice]);

  // 打开文件时加载内容
  const handleOpenFile = useCallback(
    (id: string) => {
      const content = fileSystem.fileContents[id] ?? "";
      markdownSync.setMarkdown(content);
      fileSystem.setActiveFileId(id);
    },
    [
      fileSystem.fileContents,
      fileSystem.setActiveFileId,
      markdownSync.setMarkdown,
    ],
  );

  return (
    <div className="h-screen flex flex-col overflow-hidden font-display text-slate-700 relative">
      <div
        id="editor-bg-layer"
        className="absolute inset-0 z-0 pointer-events-none bg-background-light"
      />

      <header className="h-20 flex items-center justify-between px-8 border-b border-border-soft z-50 shrink-0 relative bg-white/70 backdrop-blur-xl">
        <Header
          viewMode={editorState.viewMode}
          onViewModeChange={editorState.handleViewModeChange}
          particlesOn={particlesOn}
          onParticlesToggle={() => setParticlesOn((prev) => !prev)}
          onNewSparkle={editorState.handleNewSparkle}
          onSave={editorState.handleSave}
          onSaveAs={() => setIsSaveAsModalOpen(true)}
          onExport={() => setIsExportModalOpen(true)}
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
            setIsSettingsModalOpen={setIsSettingsModalOpen}
            setIsSearchModalOpen={setIsSearchModalOpen}
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
        isExportModalOpen={isExportModalOpen}
        isSaveAsModalOpen={isSaveAsModalOpen}
        isSettingsModalOpen={isSettingsModalOpen}
        isSearchModalOpen={isSearchModalOpen}
        setIsExportModalOpen={setIsExportModalOpen}
        setIsSaveAsModalOpen={setIsSaveAsModalOpen}
        setIsSettingsModalOpen={setIsSettingsModalOpen}
        setIsSearchModalOpen={setIsSearchModalOpen}
        markdown={markdownSync.markdown}
        particlesOn={particlesOn}
        setParticlesOn={setParticlesOn}
        fontChoice={editorTheme.fontChoice}
        setFontChoice={editorTheme.setFontChoice}
      />
    </div>
  );
}
