import { useState, useEffect, useRef, useImperativeHandle } from "react";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import Outline from "@/components/MainContent/Outline/Outline";
import { EditorPane, PreviewPane } from "./Pane";
import { useHeadings, useCheckStates, useScrollSync } from "./hooks";
import { MainContentProps } from "./types";

export default function MainContent({
  toolbarRef,
  markdown,
  setMarkdown,
  viewMode,
  editorTheme,
  previewTheme,
  fontChoice,
  editorFont,
  activeFileName,
}: MainContentProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // 使用拆分出来的 hooks
  const headings = useHeadings(markdown);
  const { checkStates, checkIndexRef, updateCheckState } = useCheckStates();
  const { registerHeadingRef, scrollToSection } = useScrollSync({
    headings,
    viewMode,
    previewRef,
    setActiveOutlineId,
  });

  const renderHeadingIndexRef = useRef(0);
  renderHeadingIndexRef.current = 0; // 每次 render 重置

  const editorRef = useRef<ReactCodeMirrorRef>(null);

  // Expose editorRef to parent toolbarRef
  useImperativeHandle(toolbarRef, () => editorRef.current!, []);

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenu && !(e.target as HTMLElement).closest(".menu-container")) {
        setActiveMenu(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [activeMenu]);

  // 保存主题设置到 localStorage
  useEffect(() => {
    localStorage.setItem("notemark_editor_theme", editorTheme);
  }, [editorTheme]);

  useEffect(() => {
    localStorage.setItem("notemark_preview_theme", previewTheme);
  }, [previewTheme]);

  useEffect(() => {
    localStorage.setItem("notemark_font_choice", fontChoice);
    document.documentElement.style.setProperty(
      "--font-display",
      fontChoice === "Quicksand"
        ? '"Quicksand", sans-serif'
        : `"${fontChoice}", sans-serif`,
    );
  }, [fontChoice]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {/* Editor Pane */}
      {(viewMode === "split" || viewMode === "editor") && (
        <EditorPane
          markdown={markdown}
          setMarkdown={setMarkdown}
          editorTheme={editorTheme}
          editorRef={editorRef}
          editorFont={editorFont}
          fileName={activeFileName}
        />
      )}

      {/* Preview Pane */}
      {(viewMode === "split" || viewMode === "preview") && (
        <PreviewPane
          previewRef={previewRef}
          markdown={markdown}
          headings={headings}
          checkStates={checkStates}
          checkIndexRef={checkIndexRef}
          renderHeadingIndexRef={renderHeadingIndexRef}
          updateCheckState={updateCheckState}
          previewTheme={previewTheme}
          registerHeadingRef={registerHeadingRef}
        />
      )}

      {/* Outline Sidebar */}
      <Outline
        headings={headings}
        activeOutlineId={activeOutlineId}
        scrollToSection={scrollToSection}
        markdown={markdown}
      />
    </div>
  );
}
