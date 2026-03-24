import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { ExportModal } from "./ExportModal/ExportModal";
import { SaveAsModal } from "./SaveAsModal/SaveAsModal";
import { SettingsModal } from "./SettingsModal/SettingsModal";
import { SearchModal } from "./SearchModal/SearchModal";
import { LauncherModal } from "./LauncherModal/LauncherModal";
import { SparkleDust } from "../../components/Modals/SparkleDust/SparkleDust";
import { useSearchParams, useNavigate } from "react-router-dom";
import type { FileNode } from "@/types/filesystem";

interface ModalProps {
  editorTheme: string;
  previewTheme: string;
  isExportModalOpen: boolean;
  isSaveAsModalOpen: boolean;
  isSettingsModalOpen: boolean;
  isSearchModalOpen: boolean;
  setEditorTheme: React.Dispatch<React.SetStateAction<string>>;
  setPreviewTheme: React.Dispatch<React.SetStateAction<string>>;
  setIsExportModalOpen: (open: boolean) => void;
  setIsSaveAsModalOpen: (open: boolean) => void;
  setIsSettingsModalOpen: (open: boolean) => void;
  setIsSearchModalOpen: (open: boolean) => void;
  markdown: string;
  particlesOn: boolean;
  setParticlesOn: React.Dispatch<React.SetStateAction<boolean>>;
  fontChoice: string;
  setFontChoice: React.Dispatch<React.SetStateAction<string>>;
  editorFont: string;
  setEditorFont: React.Dispatch<React.SetStateAction<string>>;
  accentColor: string;
  setAccentColor: (color: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  editorFontSize: number;
  setEditorFontSize: (size: number) => void;
  previewFontSize: number;
  setPreviewFontSize: (size: number) => void;
  blurAmount: number;
  setBlurAmount: (amount: number) => void;
  bgImage: string;
  setBgImage: (url: string) => void;
  customFonts: { name: string; url: string }[];
  addCustomFont: (font: { name: string; url: string }) => void;
  lang: string;
  setLang: React.Dispatch<React.SetStateAction<string>>;
  nodes: FileNode[];
  onOpenFile: (id: string) => void;
  onLauncherSearch?: () => void;
  onLauncherSettings?: () => void;
  onLauncherExport?: () => void;
  onLauncherViewMode?: (mode: "split" | "editor" | "preview") => void;
  onLauncherParticlesToggle?: () => void;
  darkMode?: boolean;
  onDarkModeToggle?: () => void;
}

export default function Modal({
  editorTheme,
  previewTheme,
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
  editorFont,
  setEditorFont,
  accentColor,
  setAccentColor,
  fontSize,
  setFontSize,
  editorFontSize,
  setEditorFontSize,
  previewFontSize,
  setPreviewFontSize,
  blurAmount,
  setBlurAmount,
  bgImage,
  setBgImage,
  customFonts,
  addCustomFont,
  lang,
  setLang,
  nodes,
  onOpenFile,
  onLauncherParticlesToggle,
  darkMode,
  onDarkModeToggle,
}: ModalProps) {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const modal = searchParams.get("modal") || "";

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
            className="modal-m3-overlay fixed inset-0 backdrop-blur-sm pointer-events-none"
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
            onParticlesToggle={onLauncherParticlesToggle}
            particlesOn={particlesOn}
            darkMode={darkMode}
            onDarkModeToggle={onDarkModeToggle}
          />
        )}
        {modal === "settings" && (
          <SettingsModal
            key="settings"
            onClose={() => setIsSettingsModalOpen(false)}
            editorTheme={editorTheme}
            setEditorTheme={setEditorTheme}
            previewTheme={previewTheme}
            setPreviewTheme={setPreviewTheme}
            particlesOn={particlesOn}
            setParticlesOn={setParticlesOn}
            fontChoice={fontChoice}
            setFontChoice={setFontChoice}
            editorFont={editorFont}
            setEditorFont={setEditorFont}
            accentColor={accentColor}
            setAccentColor={setAccentColor}
            fontSize={fontSize}
            setFontSize={setFontSize}
            editorFontSize={editorFontSize}
            setEditorFontSize={setEditorFontSize}
            previewFontSize={previewFontSize}
            setPreviewFontSize={setPreviewFontSize}
            blurAmount={blurAmount}
            setBlurAmount={setBlurAmount}
            bgImage={bgImage}
            setBgImage={setBgImage}
            customFonts={customFonts}
            addCustomFont={addCustomFont}
            lang={lang}
            setLang={setLang}
          />
        )}
        {modal === "search" && (
          <SearchModal
            key="search"
            onClose={() => setIsSearchModalOpen(false)}
            nodes={nodes}
            onOpenFile={(id) => {
              onOpenFile(id);
              setIsSearchModalOpen(false);
            }}
          />
        )}
        {modal === "save-as" && (
          <SaveAsModal
            key="save-as"
            markdown={markdown}
            onClose={() => setIsSaveAsModalOpen(false)}
          />
        )}
        {modal === "export" && (
          <ExportModal
            key="export"
            markdown={markdown}
            onClose={() => setIsExportModalOpen(false)}
          />
        )}
      </AnimatePresence>
      <AnimatePresence>{particlesOn && <SparkleDust />}</AnimatePresence>
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
