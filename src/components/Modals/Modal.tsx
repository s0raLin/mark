import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { ExportModal } from "./ExportModal/ExportModal";
import { SaveAsModal } from "./SaveAsModal/SaveAsModal";
import { SettingsModal } from "./SettingsModal/SettingsModal";
import { SearchModal } from "./SearchModal/SearchModal";
import { LauncherModal } from "./LauncherModal/LauncherModal";
import { SparkleDust } from "../../components/Modals/SparkleDust/SparkleDust";
import { useSearchParams, useNavigate } from "react-router-dom";
import { useEditorConfigContext } from "@/contexts/EditorConfig/EditorThemeProvider";
import { useMarkdownSyncContext } from "@/contexts/MarkdownSyncContext";
import { useFileSystemContext } from "@/contexts/FileSystemContext";
import { useEditorStateContext } from "@/contexts/EditorStateContext";

interface ModalProps {
  isExportModalOpen: boolean;
  isSaveAsModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isSearchModalOpen: boolean;
  setIsExportModalOpen: (open: boolean) => void;
  setIsSaveAsModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsSearchModalOpen: (open: boolean) => void;
  onLauncherSearch?: () => void;
  onLauncherSettings?: () => void;
  onLauncherExport?: () => void;
  onLauncherViewMode?: (mode: "split" | "editor" | "preview") => void;
}

export default function Modal({
  setIsExportModalOpen,
  setIsSaveAsModalOpen,
  setIsSettingsModalOpen,
  setIsSearchModalOpen,
}: ModalProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modal = searchParams.get("modal") || "";
  const editorConfig = useEditorConfigContext();
  const markdownSync = useMarkdownSyncContext();
  const fileSystem = useFileSystemContext();
  const {handleOpenFile} = useEditorStateContext();

  const hasModal =
    modal === "settings" ||
    modal === "search" ||
    modal === "save-as" ||
    modal === "export" ||
    modal === "launcher";

  return (
    <div
      className={
        hasModal ? "fixed inset-0 z-[100]" : "fixed z-[100] pointer-events-none"
      }
    >
      {/* Shared backdrop — stays mounted as long as any modal is open, no flicker on switch */}
      <AnimatePresence>
        {hasModal && (
          <motion.div
            key="backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="modal-m3-overlay fixed inset-0 pointer-events-none"
          />
        )}
      </AnimatePresence>
      <AnimatePresence>
        {modal === "launcher" && (
          <LauncherModal
            key="launcher"
            onClose={() => navigate("/")}
            onSearch={() => navigate("/?modal=search")}
            onSettings={() => navigate("/?modal=settings")}
            onExport={() => navigate("/?modal=export")}
            darkMode={editorConfig.darkMode}
            onDarkModeToggle={() => editorConfig.setDarkMode((prev) => !prev)}
          />
        )}
        {modal === "settings" && (
          <SettingsModal
            key="settings"
            onClose={() => setIsSettingsModalOpen(false)}
            editorTheme={editorConfig.editorTheme}
            setEditorTheme={editorConfig.setEditorTheme}
            previewTheme={editorConfig.previewTheme}
            setPreviewTheme={editorConfig.setPreviewTheme}
            particlesOn={editorConfig.particlesOn}
            setParticlesOn={editorConfig.setParticlesOn}
            fontChoice={editorConfig.fontChoice}
            setFontChoice={editorConfig.setFontChoice}
            editorFont={editorConfig.editorFont}
            setEditorFont={editorConfig.setEditorFont}
            accentColor={editorConfig.accentColor}
            setAccentColor={editorConfig.setAccentColor}
            fontSize={editorConfig.fontSize}
            setFontSize={editorConfig.setFontSize}
            editorFontSize={editorConfig.editorFontSize}
            setEditorFontSize={editorConfig.setEditorFontSize}
            previewFontSize={editorConfig.previewFontSize}
            setPreviewFontSize={editorConfig.setPreviewFontSize}
            blurAmount={editorConfig.blurAmount}
            setBlurAmount={editorConfig.setBlurAmount}
            bgImage={editorConfig.bgImage}
            setBgImage={editorConfig.setBgImage}
            lang={editorConfig.lang}
            setLang={editorConfig.setLang}
          />
        )}
        {modal === "search" && (
          <SearchModal
            key="search"
            onClose={() => setIsSearchModalOpen(false)}
            nodes={fileSystem.nodes}
            onOpenFile={(id) => {
              handleOpenFile(id);
              setIsSearchModalOpen(false);
            }}
          />
        )}
        {modal === "save-as" && (
          <SaveAsModal
            key="save-as"
            markdown={markdownSync.markdown}
            onClose={() => setIsSaveAsModalOpen(false)}
          />
        )}
        {modal === "export" && (
          <ExportModal
            key="export"
            markdown={markdownSync.markdown}
            onClose={() => setIsExportModalOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{editorConfig.particlesOn && <SparkleDust />}</AnimatePresence>
    </div>
  );
}

// export const ROUTES = {
//   HOME: '/',
//   SETTINGS: '/settings',
//   SEARCH: '/search',
//   EXPORT: '/export',
//   SAVE_AS: '/save-as',
//   SPARKLE: '/sparkle',
// } as const;
