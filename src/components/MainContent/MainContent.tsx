import { useState, useEffect, useRef, useImperativeHandle } from "react";
import { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import Outline from "@/components/MainContent/Outline/Outline";
import { EditorPane, PreviewPane } from "./Pane";
import { useHeadings, useCheckStates, useScrollSync } from "./hooks";
import { MainContentProps } from "./types";
import { cn } from "@/utils/cn";

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

  const headings = useHeadings(markdown);
  const { checkIndexRef } = useCheckStates();
  const { scrollToSection } = useScrollSync({
    headings,
    viewMode,
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

      <PreviewPane
        previewRef={previewRef}
        markdown={markdown}
        previewTheme={previewTheme}
        className={cn(
          viewMode === "editor" && "hidden",
          viewMode === "preview" && "flex-[1_1_100%]",
        )}
      />

      <Outline
        headings={headings}
        activeOutlineId={activeOutlineId}
        scrollToSection={scrollToSection}
        markdown={markdown}
      />
    </div>
  );
}
