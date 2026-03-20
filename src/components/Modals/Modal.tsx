import { AnimatePresence } from "motion/react";
import React from "react";
import { ExportModal } from "./ExportModal/ExportModal";
import { SaveAsModal } from "./SaveAsModal/SaveAsModal";
import { SettingsModal } from "./SettingsModal/SettingsModal";
import { SearchModal } from "./SearchModal/SearchModal";
import { SparkleDust } from "../../components/Modals/SparkleDust/SparkleDust";
interface ModalProps {
  editorTheme: string,
  previewTheme: string,
  isExportModalOpen: boolean;
  isSaveAsModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isSearchModalOpen: boolean;
  setEditorTheme: React.Dispatch<React.SetStateAction<string>>,
  setPreviewTheme: React.Dispatch<React.SetStateAction<string>>,
  setIsExportModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSaveAsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSettingsModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  setIsSearchModalOpen: React.Dispatch<React.SetStateAction<boolean>>;
  markdown: string;
  particlesOn: boolean;
  setParticlesOn: React.Dispatch<React.SetStateAction<boolean>>;
  fontChoice: string;
  setFontChoice: React.Dispatch<React.SetStateAction<string>>;
}

export default function Modal({
  editorTheme,
  previewTheme,
  isExportModalOpen,
  isSaveAsModalOpen,
  isSettingsModalOpen,
  isSearchModalOpen,
  setEditorTheme,
  setPreviewTheme,
  setIsExportModalOpen,
  setIsSaveAsModalOpen,
  setIsSettingsModalOpen,
  setIsSearchModalOpen,
  markdown,
  particlesOn,
  setParticlesOn,
  fontChoice,
  setFontChoice,
}: ModalProps) {
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
