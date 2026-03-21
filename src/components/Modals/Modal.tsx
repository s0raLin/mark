import { AnimatePresence } from "motion/react";
import React from "react";
import { ExportModal } from "./ExportModal/ExportModal";
import { SaveAsModal } from "./SaveAsModal/SaveAsModal";
import { SettingsModal } from "./SettingsModal/SettingsModal";
import { SearchModal } from "./SearchModal/SearchModal";
import { SparkleDust } from "../../components/Modals/SparkleDust/SparkleDust";
import { useSearchParams } from "react-router-dom";
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
  accentColor: string;
  setAccentColor: (color: string) => void;
  fontSize: number;
  setFontSize: (size: number) => void;
  blurAmount: number;
  setBlurAmount: (amount: number) => void;
  bgImage: string;
  setBgImage: (url: string) => void;
  customFonts: { name: string; url: string }[];
  addCustomFont: (font: { name: string; url: string }) => void;
}

export default function Modal({
  editorTheme, previewTheme,
  isExportModalOpen, isSaveAsModalOpen, isSettingsModalOpen, isSearchModalOpen,
  setEditorTheme, setPreviewTheme,
  setIsExportModalOpen, setIsSaveAsModalOpen, setIsSettingsModalOpen, setIsSearchModalOpen,
  markdown, particlesOn, setParticlesOn, fontChoice, setFontChoice,
  accentColor, setAccentColor, fontSize, setFontSize,
  blurAmount, setBlurAmount, bgImage, setBgImage, customFonts, addCustomFont,
}: ModalProps) {
  const [searchParams] = useSearchParams();
  const modal = searchParams.get('modal') || '';

  return (
    <div>
      <AnimatePresence>
        {modal === 'settings' && (
          <SettingsModal
            onClose={() => setIsSettingsModalOpen(false)}
            editorTheme={editorTheme} setEditorTheme={setEditorTheme}
            previewTheme={previewTheme} setPreviewTheme={setPreviewTheme}
            particlesOn={particlesOn} setParticlesOn={setParticlesOn}
            fontChoice={fontChoice} setFontChoice={setFontChoice}
            accentColor={accentColor} setAccentColor={setAccentColor}
            fontSize={fontSize} setFontSize={setFontSize}
            blurAmount={blurAmount} setBlurAmount={setBlurAmount}
            bgImage={bgImage} setBgImage={setBgImage}
            customFonts={customFonts} addCustomFont={addCustomFont}
          />
        )}
        {modal === 'search' && (
          <SearchModal onClose={() => setIsSearchModalOpen(false)} />
        )}
        {modal === 'save-as' && (
          <SaveAsModal
            markdown={markdown}
            onClose={() => setIsSaveAsModalOpen(false)}
          />
        )}
        {modal === 'export' && (
          <ExportModal
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
