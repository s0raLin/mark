import { useEffect, useMemo, useRef, useState } from "react";
import {
  Layout, Settings, Download, Palette, Smile, RotateCcw, Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
import { applyM3Theme } from "@/utils/applyM3Theme";
import General from "./SettingGeneral/SettingGeneral";
import SettingEditor from "./SettingEditor/SettingEditor";
import SettingExport from "./SettingExport/SettingExport";
import SettingAccount from "./SettingAccount/SettingAccount";
import { ModalHeader } from "../ModalHeader";
import { ModalShell } from "../ModalShell";

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
  lang: string;
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
  lang: "en",
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
  lang: string;
  setLang: (lang: string) => void;
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
  lang, setLang,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("general");
  const { t, i18n } = useTranslation();
  const originalModalBlurRef = useRef<string | null>(null);
  const committedAccentColorRef = useRef(accentColor);

  const [draft, setDraft] = useState<SettingsSnapshot>(() => ({
    editorTheme, previewTheme, particlesOn,
    fontChoice, editorFont, accentColor,
    fontSize, editorFontSize, previewFontSize,
    blurAmount, bgImage, customFonts,
    lang,
  }));

  const [saved, setSaved] = useState<SettingsSnapshot>(() => ({
    editorTheme, previewTheme, particlesOn,
    fontChoice, editorFont, accentColor,
    fontSize, editorFontSize, previewFontSize,
    blurAmount, bgImage, customFonts,
    lang,
  }));

  // isDirty：draft 与上次保存的值比较
  const isDirty = JSON.stringify(draft) !== JSON.stringify(saved);

  // 草稿 setter 工厂
  const set = <K extends keyof SettingsSnapshot>(key: K) =>
    (val: SettingsSnapshot[K]) => setDraft(prev => ({ ...prev, [key]: val }));

  // 保存：把草稿 commit 到父级
  const handleSave = () => {
    committedAccentColorRef.current = draft.accentColor;
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
    // 语言切换在保存时生效
    if (draft.lang !== i18n.language) {
      i18n.changeLanguage(draft.lang);
    }
    setLang(draft.lang);
    setSaved({ ...draft });
  };

  // 恢复默认：只改草稿，需要点保存才生效
  const handleReset = () => setDraft({ ...DEFAULT_SETTINGS });

  const restoreCommittedAccentColor = () => {
    applyM3Theme(
      committedAccentColorRef.current,
      document.documentElement.classList.contains("dark"),
    );
  };

  const handleClose = () => {
    restoreCommittedAccentColor();
    onClose();
  };

  const tabs = useMemo(
    () => [
      { id: "general", label: t("settings.tabs.general"), icon: <Layout className="w-4 h-4" /> },
      { id: "editor", label: t("settings.tabs.editor"), icon: <Palette className="w-4 h-4" /> },
      { id: "export", label: t("settings.tabs.export"), icon: <Download className="w-4 h-4" /> },
      { id: "account", label: t("settings.tabs.account"), icon: <Smile className="w-4 h-4" /> },
    ],
    [t],
  );

  useEffect(() => {
    const root = document.documentElement;
    if (originalModalBlurRef.current === null) {
      originalModalBlurRef.current = root.style.getPropertyValue("--modal-backdrop-blur");
    }
    const baseBlur = root.classList.contains("dark") ? 10 : 8;
    const blurStrength = baseBlur + draft.blurAmount * 0.5;
    root.style.setProperty("--modal-backdrop-blur", `${blurStrength}px`);

    return () => {
      if (originalModalBlurRef.current) {
        root.style.setProperty("--modal-backdrop-blur", originalModalBlurRef.current);
      } else {
        root.style.removeProperty("--modal-backdrop-blur");
      }
    };
  }, [draft.blurAmount]);

  useEffect(() => {
    committedAccentColorRef.current = accentColor;
  }, [accentColor]);

  useEffect(() => restoreCommittedAccentColor, []);

  return (
    <ModalShell onClose={handleClose} className="w-full max-w-5xl rounded-3xl h-[85vh]">
        <ModalHeader
          icon={<Settings className="w-5 h-5" />}
          title={t("settings.title")}
          subtitle={t("settings.subtitle")}
          onClose={handleClose}
        />

        <div className="flex flex-1 overflow-hidden">
          <aside className="modal-m3-sidebar w-64 p-6 flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                data-active={activeTab === tab.id}
                className={cn(
                  "modal-m3-nav-button flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "text-white scale-[1.02]"
                    : "text-slate-500",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </aside>

          <div className="flex-1 overflow-y-auto p-10">
            <div className={activeTab === "general" ? undefined : "hidden"}><General /></div>

            <div className={activeTab === "editor" ? undefined : "hidden"}>
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
            </div>

            <div className={activeTab === "export" ? undefined : "hidden"}><SettingExport /></div>
            <div className={activeTab === "account" ? undefined : "hidden"}>
              <SettingAccount
                draftLang={draft.lang}
                setDraftLang={set("lang")}
              />
            </div>
          </div>
        </div>

        <footer className="modal-m3-footer flex items-center justify-between gap-4 p-6 shrink-0">
          <button
            onClick={handleReset}
            className="modal-m3-text-button flex items-center gap-2 px-5 py-2.5 text-sm font-bold text-slate-400 transition-colors rounded-2xl"
          >
            <RotateCcw className="w-4 h-4" />
            {t("settings.resetSpace")}
          </button>

          <div className="flex items-center gap-3">
            <button
              onClick={handleClose}
              className="modal-m3-outlined-button px-6 py-2.5 text-sm font-bold text-slate-400 transition-colors rounded-2xl"
            >
              {t("settings.cancel")}
            </button>
            <button
              onClick={handleSave}
              disabled={!isDirty}
              data-disabled={!isDirty}
              className={cn(
                "modal-m3-filled-button flex items-center gap-2 px-8 py-2.5 text-sm font-bold rounded-full transition-all",
                isDirty
                  ? "text-white active:scale-95"
                  : "text-slate-400 cursor-not-allowed",
              )}
            >
              <Sparkles className="w-4 h-4" />
              {t("settings.save")}
            </button>
          </div>
        </footer>
    </ModalShell>
  );
}
