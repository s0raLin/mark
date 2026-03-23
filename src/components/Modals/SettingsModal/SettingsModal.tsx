import { useState, useMemo } from "react";
import {
  Layout, Settings, Download, X, Palette, Smile,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import General from "./SettingGeneral/SettingGeneral";
import SettingEditor from "./SettingEditor/SettingEditor";
import SettingExport from "./SettingExport/SettingExport";
import SettingAccount from "./SettingAccount/SettingAccount";


interface SettingsModalProps {
  onClose: () => void;
  editorTheme: string;
  setEditorTheme: (theme: string) => void;
  previewTheme: string;
  setPreviewTheme: (theme: string) => void;
  particlesOn: boolean;
  setParticlesOn: (on: boolean) => void;
  fontChoice: string;
  setFontChoice: (font: string) => void;
  editorFont: string;
  setEditorFont: (font: string) => void;
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
}

export function SettingsModal({
  onClose,
  editorTheme, setEditorTheme,
  previewTheme, setPreviewTheme,
  particlesOn, setParticlesOn,
  fontChoice, setFontChoice,
  editorFont, setEditorFont,
  accentColor, setAccentColor,
  fontSize, setFontSize,
  editorFontSize, setEditorFontSize,
  previewFontSize, setPreviewFontSize,
  blurAmount, setBlurAmount,
  bgImage, setBgImage,
  customFonts, addCustomFont,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = useMemo(
    () => [
      { id: "general", label: "General", icon: <Layout className="w-4 h-4" /> },
      { id: "editor", label: "Editor", icon: <Palette className="w-4 h-4" /> },
      { id: "export", label: "Export", icon: <Download className="w-4 h-4" /> },
      { id: "account", label: "Account", icon: <Smile className="w-4 h-4" /> },
    ],
    [],
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white/70 backdrop-blur-xl w-full max-w-5xl rounded-3xl overflow-hidden shadow-sm border border-white/50 flex flex-col h-[85vh]"
      >
        <header className="flex items-center justify-between border-b border-dashed border-pink-100 px-8 py-5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center p-2.5 rounded-2xl bg-primary/20 text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-800">
                Settings
              </h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                Personalize your Sparkle space
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full h-9 w-9 bg-white/60 hover:bg-primary/20 hover:text-primary text-slate-400 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Settings Sidebar */}
          <aside className="w-64 border-r border-dashed border-pink-100 bg-white/30 p-6 flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => {
                  setActiveTab(tab.id)
                }}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]"
                    : "text-slate-500 hover:bg-primary/10 hover:text-primary",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto p-10">
            {activeTab === "general" && <General />}

            {activeTab === "editor" && (
              <SettingEditor
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
              />
            )}

            {activeTab === "export" && <SettingExport />}

            {activeTab === "account" && <SettingAccount />}
          </div>
        </div>

        <footer className="flex items-center justify-end gap-4 p-6 bg-slate-50/50 border-t border-dashed border-pink-100 shrink-0">
          <button className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-primary transition-colors">
            Reset Space
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 text-sm font-bold bg-gradient-to-r from-primary to-accent text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-pink-200 border-b-4 border-pink-400"
          >
            Sparkle & Save
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
