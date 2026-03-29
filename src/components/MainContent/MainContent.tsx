import { useState, useEffect, useRef, useImperativeHandle } from "react";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import Outline from "@/components/MainContent/Outline/Outline";
import { EditorPane, PreviewPane } from "./Pane";
import { useHeadings, useCheckStates, useScrollSync } from "./hooks";
import { MainContentProps } from "./types";
import { cn } from "@/utils/cn";
import { useEditorConfigContext } from "@/contexts/EditorConfig/EditorThemeProvider";
import { useEditorStateContext } from "@/contexts/EditorStateContext";
import { useMarkdownSyncContext } from "@/contexts/MarkdownSyncContext";

export default function MainContent({
  toolbarRef,
  activeFileName,
}: MainContentProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);
  const editorConfig = useEditorConfigContext();
  const editorState = useEditorStateContext();
  const markdownSync = useMarkdownSyncContext();

  const headings = useHeadings(markdownSync.markdown);
  const { checkIndexRef } = useCheckStates();
  const { scrollToSection } = useScrollSync({
    headings,
    viewMode: editorState.viewMode,
    previewRef,
    setActiveOutlineId,
  });

  const renderHeadingIndexRef = useRef(0);
  renderHeadingIndexRef.current = 0;

  const editorRef = useRef<ReactCodeMirrorRef>(null);

  useImperativeHandle(toolbarRef, () => editorRef.current!, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenu && !(e.target as HTMLElement).closest(".menu-container")) {
        setActiveMenu(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [activeMenu]);

  return (
    <div className="flex h-full w-full overflow-hidden">
      {(editorState.viewMode === "split" || editorState.viewMode === "editor") && (
        <EditorPane
          markdown={markdownSync.markdown}
          setMarkdown={markdownSync.setMarkdown}
          activeFileContent={markdownSync.activeFileContent}
          editorTheme={editorConfig.editorTheme}
          editorRef={editorRef}
          editorFont={editorConfig.editorFont}
          fileName={activeFileName}
        />
      )}

      <PreviewPane
        previewRef={previewRef}
        markdown={markdownSync.markdown}
        activeFileContent={markdownSync.activeFileContent}
        previewTheme={editorConfig.previewTheme}
        className={cn(
          editorState.viewMode === "editor" && "hidden",
          editorState.viewMode === "preview" && "flex-[1_1_100%]",
        )}
      />

      <Outline
        headings={headings}
        activeOutlineId={activeOutlineId}
        scrollToSection={scrollToSection}
        markdown={markdownSync.markdown}
      />
    </div>
  );
}
