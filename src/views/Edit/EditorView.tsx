import Footer from "@/src/components/Footer";
import Header from "@/src/components/Header";
import MainContent from "@/src/components/MainContent/MainContent";
import Toolbar from "@/src/components/Toolbar/Toolbar";
import React, { useRef, useState, useEffect } from "react";
import Modal from "@/src/components/Modals/Modal";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import { INITIAL_MARKDOWN } from "@/src/constants";

export default function EditorView() {
  const toolbarRef = useRef<ReactCodeMirrorRef>(null);

  // State managed at EditorView level
  const [markdown, setMarkdown] = useState(() => {
    const saved = localStorage.getItem("studiomark_content");
    return saved || INITIAL_MARKDOWN;
  });

  const [viewMode, setViewMode] = useState<"split" | "editor" | "preview">("split");
  const [particlesOn, setParticlesOn] = useState(false);
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [editorTheme, setEditorTheme] = useState(() => {
    return localStorage.getItem("studiomark_editor_theme") || "oneDark";
  });
  const [previewTheme, setPreviewTheme] = useState(() => {
    return localStorage.getItem("studiomark_preview_theme") || "theme-heart-classic";
  });
  const [fontChoice, setFontChoice] = useState(() => {
    return localStorage.getItem("studiomark_font_choice") || "Quicksand";
  });

  // Auto-save effect
  useEffect(() => {
    const timer = setTimeout(() => {
      setIsSaving(true);
      localStorage.setItem("studiomark_content", markdown);
      setLastSaved(new Date());
      const doneTimer = setTimeout(() => setIsSaving(false), 800);
      return () => clearTimeout(doneTimer);
    }, 1500);
    return () => clearTimeout(timer);
  }, [markdown]);

  // Persist editor theme
  useEffect(() => {
    localStorage.setItem("studiomark_editor_theme", editorTheme);
  }, [editorTheme]);

  // Persist preview theme
  useEffect(() => {
    localStorage.setItem("studiomark_preview_theme", previewTheme);
  }, [previewTheme]);

  // Persist font choice
  useEffect(() => {
    localStorage.setItem("studiomark_font_choice", fontChoice);
    document.documentElement.style.setProperty(
      "--font-display",
      fontChoice === "Quicksand" ? '"Quicksand", sans-serif' : `"${fontChoice}", sans-serif`
    );
  }, [fontChoice]);

  // Handlers
  const handleNewSparkle = () => {
    setMarkdown("# New Sparkle\n\nStart writing here...");
  };

  const handleSave = () => {
    localStorage.setItem("studiomark_content", markdown);
    setLastSaved(new Date());
    setIsSaving(true);
    setTimeout(() => setIsSaving(false), 800);
  };

  const handleSaveAs = () => {
    // TODO: Implement save as modal
    console.log("Save As clicked");
  };

  const handleExport = () => {
    // TODO: Implement export modal
    console.log("Export clicked");
  };

  const handleParticlesToggle = () => {
    setParticlesOn(!particlesOn);
  };

  const handleViewModeChange = (mode: "split" | "editor" | "preview") => {
    setViewMode(mode);
  };

  return (
    <div className="h-screen flex flex-col overflow-hidden bg-background-light font-display text-slate-700">
      {/* Header */}
      <header className="h-20 flex items-center justify-between px-8 border-b border-border-soft cute-glass z-50 shrink-0">
        <Header
          viewMode={viewMode}
          onViewModeChange={handleViewModeChange}
          particlesOn={particlesOn}
          onParticlesToggle={handleParticlesToggle}
          onNewSparkle={handleNewSparkle}
          onSave={handleSave}
          onSaveAs={handleSaveAs}
          onExport={handleExport}
        />
      </header>

      {/* Toolbar */}
      <div className="h-14 border-b border-border-soft bg-white/50 flex items-center justify-center px-4 gap-1 shrink-0">
        <Toolbar editorRef={toolbarRef} />
      </div>

      {/* Main Content */}
      <main className="flex-1 flex overflow-hidden">
        <MainContent
          toolbarRef={toolbarRef}
          markdown={markdown}
          setMarkdown={setMarkdown}
          viewMode={viewMode}
          editorTheme={editorTheme}
          setEditorTheme={setEditorTheme}
          previewTheme={previewTheme}
          setPreviewTheme={setPreviewTheme}
          fontChoice={fontChoice}
          setFontChoice={setFontChoice}
        />
      </main>

      {/* Footer */}
      <footer className="h-10 bg-white border-t border-border-soft px-6 flex items-center justify-between text-[11px] text-slate-400 font-bold uppercase tracking-wider shrink-0">
        <Footer
          isSaving={isSaving}
          lastSaved={lastSaved}
          markdown={markdown}
        />
      </footer>

      {/* Modals */}
      <Modal />
    </div>
  );
}
