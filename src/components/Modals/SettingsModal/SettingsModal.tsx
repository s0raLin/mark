import { useState, useMemo } from "react";
import {
  Layout, Settings, Download, X, Palette, Smile, RotateCcw, Sparkles,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import General from "./SettingGeneral/SettingGeneral";
import SettingEditor from "./SettingEditor/SettingEditor";
import SettingExport from "./SettingExport/SettingExport";
import SettingAccount from "./SettingAccount/SettingAccount";

// 所有可设置项的快照类型
interface SettingsSnapshot {
  editorTheme: string;
  previewTheme: string;
  particlesOn: boolean;
  fontChoice: string;
  editorFont: string;
  accentColor: string;
  fontSize: number;
  editorFontSize: number;
  previewFontSize: number;
  blurAmount: number;
  bgImage: string;
  customFonts: { name: string; url: string }[];
}

const DEFAULT_SETTINGS: SettingsSnapshot = {
  editorTheme: "oneDark",
  previewTheme: "theme-heart-classic",
  fontChoice: "Quicksand",
  editorFont: "JetBrains Mono",
  fontSize: 16,
  editorFontSize: 14,
  previewFontSize: 16,
  accentColor: "#ff9a9e",
  blurAmount: 0,
  bgImage: "",
  particlesOn: false,
  customFonts: [],
};

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

  // 草稿 state：打开时快照当前值，操作只改草稿，不影响父级
  const [draft, setDraft] = useState<SettingsSnapshot>(() => ({
    editorTheme, previewTheme, particlesOn,
    fontChoice, editorFont, accentColor,
    fontSize, editorFontSize, previewFontSize,
    blurAmount, bgImage, customFonts,
  }));

  // 已保存的快照，用于判断是否有未保存的改动
  const [saved, setSaved] = useState<SettingsSnapshot>(() => ({
    editorTheme, previewTheme, particlesOn,
    fontChoice, editorFont, accentColor,
    fontSize, editorFontSize, previewFontSize,
    blurAmount, bgImage, customFonts,
  }));

  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

  // 草稿 setter 工厂
  const set = <K extends keyof SettingsSnapshot>(key: K) =>
    (val: SettingsSnapshot[K]) => setDraft(prev => ({ ...prev, [key]: val }));

  // 保存：把草稿 commit 到父级，不关闭
  const handleSave = () => {
    setEditorTheme(draft.editorTheme);
    setPreviewTheme(draft.previewTheme);
    setParticlesOn(draft.particlesOn);
    setFontChoice(draft.fontChoice);
    setEditorFont(draft.editorFont);
    setAccentColor(draft.accentColor);
    setFontSize(draft.fontSize);
    setEditorFontSize(draft.editorFontSize);
    setPreviewFontSize(draft.previewFontSize);
    setBlurAmount(draft.blurAmount);
    setBgImage(draft.bgImage);
    for (const font of draft.customFonts) {
      if (!customFonts.find(f => f.name === font.name)) addCustomFont(font);
    }
    setSaved({ ...draft });
  };

  // 恢复默认：把草稿重置为默认值
  const handleReset = () => setDraft({ ...DEFAULT_SETTINGS });

  // 关闭（不保存）：直接关，草稿丢弃，父级 state 未变
  const handleClose = () => onClose();

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
              <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-800">Settings</h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                Personalize your Sparkle space
              </p>
            </div>
          </div>
          <button
            onClick={handleClose}
            className="flex items-center justify-center rounded-full h-9 w-9 bg-white/60 hover:bg-primary/20 hover:text-primary text-slate-400 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Sidebar */}
          <aside className="w-64 border-r border-dashed border-pink-100 bg-white/30 p-6 flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
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

          {/* Content — 全部操作草稿 draft */}
          <div className="flex-1 overflow-y-auto p-10">
            {activeTab === "general" && <General />}

            {activeTab === "editor" && (
              <SettingEditor
                editorTheme={draft.editorTheme}
                setEditorTheme={set("editorTheme")}
                previewTheme={draft.previewTheme}
                setPreviewTheme={set("previewTheme")}
                particlesOn={draft.particlesOn}
                setParticlesOn={set("particlesOn")}
                fontChoice={draft.fontChoice}
                setFontChoice={set("fontChoice")}
                editorFont={draft.editorFont}
                setEditorFont={set("editorFont")}
                accentColor={draft.accentColor}
                setAccentColor={set("accentColor")}
                fontSize={draft.fontSize}
                setFontSize={set("fontSize")}
                editorFontSize={draft.editorFontSize}
                setEditorFontSize={set("editorFontSize")}
                previewFontSize={draft.previewFontSize}
                setPreviewFontSize={set("previewFontSize")}
                blurAmount={draft.blurAmount}
                setBlurAmount={set("blurAmount")}
                bgImage={draft.bgImage}
                setBgImage={set("bgImage")}
                customFonts={draft.customFonts}
                addCustomFont={(font) => setDraft(prev => ({
                  ...prev,
                  customFonts: [...prev.customFonts, font],
                }))}
              />
            )}

            {activeTab === "export" && <SettingExport />}
            {activeTab === "account" && <SettingAccount />}
          </div>
        </div>

        <footer className="flex items-center justify-between gap-4 p-6 bg-slate-50/50 border-t border-dashed border-pink-100 shrink-0">
          {/* 左侧：恢复默认 */}
          <button
            onClick={handleReset}
            className="flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-400 hover:text-rose-400 transition-colors rounded-2xl hover:bg-rose-50"
          >
            <RotateCcw className="w-4 h-4" />
            Reset Space
          </button>

          {/* 右侧：取消 + 保存 */}
          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-slate-600 transition-colors rounded-2xl hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              className={cn(
                "flex items-center gap-2 px-8 py-3 text-sm font-bold rounded-full transition-all border-b-4",
                isDirty
                  ? "bg-gradient-to-r from-primary to-accent text-white shadow-xl shadow-pink-200 border-pink-400 hover:brightness-105 active:brightness-95"
                  : "bg-slate-200 text-slate-400 border-slate-300 cursor-not-allowed grayscale",
              )}
            >
              <Sparkles className="w-4 h-4" />
              Sparkle & Save
            </button>
          </div>
        </footer>
      </motion.div>
    </motion.div>
  );
}
