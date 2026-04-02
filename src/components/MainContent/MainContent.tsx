import { useState, useEffect, useRef } from "react";
import Outline from "@/components/MainContent/Outline/Outline";
import { useHeadings, useScrollSync } from "./hooks";
import { MainContentProps } from "./types";
import { useEditorConfigContext } from "@/contexts/EditorConfig/EditorThemeProvider";
import { useMarkdownSyncContext } from "@/contexts/MarkdownSyncContext";
import { MilkdownEditorWrapper } from "./Editor/Editor";

export default function MainContent({
  activeFileName,
}: MainContentProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);
  const editorScrollRef = useRef<HTMLDivElement>(null);
  const editorConfig = useEditorConfigContext();
  const markdownSync = useMarkdownSyncContext();

  const headings = useHeadings(markdownSync.markdown);
  const { scrollToSection } = useScrollSync({
    headings,
    containerRef: editorScrollRef,
    setActiveOutlineId,
  });

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
      <MilkdownEditorWrapper />
      <Outline
        headings={headings}
        activeOutlineId={activeOutlineId ?? ""}
        scrollToSection={scrollToSection}
        markdown={markdownSync.markdown}
      />
    </div>
  );
}
