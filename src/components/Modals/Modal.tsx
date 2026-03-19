import { AnimatePresence } from "motion/react";
import React from "react";
import { ExportModal } from "./ExportModal/ExportModal";
import { SaveAsModal } from "./SaveAsModal/SaveAsModal";
import { SettingsModal } from "./SettingsModal/SettingsModal";
import { SearchModal } from "./SearchModal/SearchModal";
import { useState } from "react";
import { INITIAL_MARKDOWN } from "@/src/constants";
import { SparkleDust } from "../../components/Modals/SparkleDust/SparkleDust";

export default function Modal() {
  const [markdown, setMarkdown] = useState(() => {
    const saved = localStorage.getItem("studiomark_content");
    return saved || INITIAL_MARKDOWN;
  });
  const [isExportModalOpen, setIsExportModalOpen] = useState(false);
  const [isSaveAsModalOpen, setIsSaveAsModalOpen] = useState(false);
  const [isSettingsModalOpen, setIsSettingsModalOpen] = useState(false);
  const [isSearchModalOpen, setIsSearchModalOpen] = useState(false);

  const [particlesOn, setParticlesOn] = useState(false);
  const [editorTheme, setEditorTheme] = useState(() => {
    return localStorage.getItem("studiomark_editor_theme") || "oneDark";
  });
  const [previewTheme, setPreviewTheme] = useState(() => {
    return (
      localStorage.getItem("studiomark_preview_theme") || "theme-heart-classic"
    );
  });
  const [fontChoice, setFontChoice] = useState(() => {
    return localStorage.getItem("studiomark_font_choice") || "Quicksand";
  });
  return (
    <div>
      <AnimatePresence>
        {isExportModalOpen && (
          <ExportModal
            markdown={markdown}
            onClose={() => setIsExportModalOpen(false)}
          />
        )}
        {isSaveAsModalOpen && (
          <SaveAsModal
            markdown={markdown}
            onClose={() => setIsSaveAsModalOpen(false)}
          />
        )}
        {isSettingsModalOpen && (
          <SettingsModal
            onClose={() => setIsSettingsModalOpen(false)}
            editorTheme={editorTheme}
            setEditorTheme={setEditorTheme}
            previewTheme={previewTheme}
            setPreviewTheme={setPreviewTheme}
            particlesOn={particlesOn}
            setParticlesOn={setParticlesOn}
            fontChoice={fontChoice}
            setFontChoice={setFontChoice}
          />
        )}
        {isSearchModalOpen && (
          <SearchModal onClose={() => setIsSearchModalOpen(false)} />
        )}
      </AnimatePresence>
      <AnimatePresence>{particlesOn && <SparkleDust />}</AnimatePresence>
    </div>
  );
}
