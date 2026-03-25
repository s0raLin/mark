// import { createContext } from "react";

import {
  StorageEditorConfig,
  EditorTheme,
  FontChoice,
  PreviewTheme,
} from "@/api/client/types";
import i18n from "@/i18n";
import { createContext, ReactNode, useContext, useEffect, useRef, useState } from "react";
import { applyM3Theme } from "../utils/applyM3Theme";

const DARK_PREVIEW_THEMES: PreviewTheme[] = ["theme-heart-midnight"];
const LIGHT_PREVIEW_THEMES: PreviewTheme[] = [
  "theme-heart-classic",
  "theme-heart-golden",
  "theme-heart-organic",
];
const DEFAULT_DARK_PREVIEW_THEME: PreviewTheme = "theme-heart-midnight";
const DEFAULT_LIGHT_PREVIEW_THEME: PreviewTheme = "theme-heart-classic";

function isDarkPreviewTheme(theme: PreviewTheme) {
  return DARK_PREVIEW_THEMES.includes(theme);
}

function syncPreviewThemeWithMode(
  nextDarkMode: boolean,
  currentPreviewTheme: PreviewTheme,
): PreviewTheme {
  if (nextDarkMode) {
    return isDarkPreviewTheme(currentPreviewTheme)
      ? currentPreviewTheme
      : DEFAULT_DARK_PREVIEW_THEME;
  }

  return LIGHT_PREVIEW_THEMES.includes(currentPreviewTheme)
    ? currentPreviewTheme
    : DEFAULT_LIGHT_PREVIEW_THEME;
}

const EditorThemeContext = createContext<EditorConfigContextProps | undefined>(
  undefined,
);

export interface EditorConfigContextProps {
  editorTheme: EditorTheme;
  previewTheme: PreviewTheme;
  fontChoice: FontChoice;
  editorFont: string;
  fontSize: number;
  editorFontSize: number;
  previewFontSize: number;
  accentColor: string;
  blurAmount: number;
  bgImage: string;
  particlesOn: boolean;
  darkMode: boolean;
  lang: string;
  customFonts: Array<{ name: string; url: string }>;
  autoSave: boolean;
  autoSaveInterval: number;
  setEditorTheme: React.Dispatch<React.SetStateAction<EditorTheme>>;
  setPreviewTheme: React.Dispatch<React.SetStateAction<PreviewTheme>>;
  setFontChoice: React.Dispatch<React.SetStateAction<FontChoice>>;
  setEditorFont: React.Dispatch<React.SetStateAction<string>>;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  setEditorFontSize: React.Dispatch<React.SetStateAction<number>>;
  setPreviewFontSize: React.Dispatch<React.SetStateAction<number>>;
  setAccentColor: React.Dispatch<React.SetStateAction<string>>;
  setBlurAmount: React.Dispatch<React.SetStateAction<number>>;
  setBgImage: React.Dispatch<React.SetStateAction<string>>;
  setParticlesOn: React.Dispatch<React.SetStateAction<boolean>>;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  setLang: React.Dispatch<React.SetStateAction<string>>;
  setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
  setAutoSaveInterval: React.Dispatch<React.SetStateAction<number>>;
  addCustomFont: (font: { name: string; url: string }) => void;
  removeCustomFont: (name: string) => void;
}

export interface EditorConfigProps {
  children: ReactNode;
  initialConfig?: StorageEditorConfig | null;
}
export function EditorThemeProvider({
  children,
  initialConfig,
}: EditorConfigProps): ReactNode {
  // const { initialConfig } = props ?? {};

  const defaultConfig: StorageEditorConfig = {
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
    lang: "en",
    customFonts: [],
    darkMode: false,
    autoSave: true,
    autoSaveInterval: 500,
  };

  const config = initialConfig ?? defaultConfig;

  const [editorTheme, setEditorTheme] = useState<EditorTheme>(
    () => config.editorTheme as EditorTheme,
  );
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>(
    () => config.previewTheme as PreviewTheme,
  );
  const [fontChoice, setFontChoice] = useState<FontChoice>(
    () => config.fontChoice as FontChoice,
  );
  const [editorFont, setEditorFont] = useState<string>(
    () => config.editorFont ?? "JetBrains Mono",
  );
  const [fontSize, setFontSize] = useState<number>(() => config.fontSize || 16);
  const [editorFontSize, setEditorFontSize] = useState<number>(
    () => config.editorFontSize || config.fontSize || 14,
  );
  const [previewFontSize, setPreviewFontSize] = useState<number>(
    () => config.previewFontSize || config.fontSize || 16,
  );
  const [accentColor, setAccentColor] = useState<string>(
    () => config.accentColor,
  );
  const [blurAmount, setBlurAmount] = useState<number>(() => config.blurAmount);
  const [bgImage, setBgImage] = useState<string>(() => config.bgImage);
  const [particlesOn, setParticlesOn] = useState<boolean>(
    () => config.particlesOn,
  );
  const [darkMode, setDarkMode] = useState<boolean>(() => config.darkMode);
  const [lang, setLang] = useState<string>(() => config.lang || "en");
  const [customFonts, setCustomFonts] = useState<
    Array<{ name: string; url: string }>
  >(() => config.customFonts ?? []);
  const [autoSave, setAutoSave] = useState<boolean>(() => config.autoSave ?? true);
  const [autoSaveInterval, setAutoSaveInterval] = useState<number>(() => config.autoSaveInterval ?? 3000);

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current || !initialConfig) return;
    hasInitialized.current = true;
    setEditorTheme(initialConfig.editorTheme as EditorTheme);
    setPreviewTheme(initialConfig.previewTheme as PreviewTheme);
    setFontChoice(initialConfig.fontChoice as FontChoice);
    setEditorFont(initialConfig.editorFont ?? "JetBrains Mono");
    setFontSize(initialConfig.fontSize || 16);
    setEditorFontSize(
      initialConfig.editorFontSize || initialConfig.fontSize || 14,
    );
    setPreviewFontSize(
      initialConfig.previewFontSize || initialConfig.fontSize || 16,
    );
    setAccentColor(initialConfig.accentColor);
    setBlurAmount(initialConfig.blurAmount);
    setBgImage(initialConfig.bgImage);
    setParticlesOn(initialConfig.particlesOn);
    const savedLang = initialConfig.lang || "en";
    setLang(savedLang);
    i18n.changeLanguage(savedLang);
    setCustomFonts(initialConfig.customFonts ?? []);
    for (const font of initialConfig.customFonts ?? []) {
      const styleId = `custom-font-${font.name.replace(/\s/g, "-")}`;
      if (!document.getElementById(styleId)) {
        const style = document.createElement("style");
        style.id = styleId;
        style.textContent = `@font-face { font-family: "${font.name}"; src: url("${font.url}"); }`;
        document.head.appendChild(style);
      }
    }
    setDarkMode(initialConfig.darkMode || false);
    setAutoSave(initialConfig.autoSave ?? true);
    setAutoSaveInterval(initialConfig.autoSaveInterval ?? 500);
  }, [initialConfig]);

  // ── Dark mode class ──
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

  // ── M3 color tokens (official HCT algorithm) ──
  useEffect(() => {
    applyM3Theme(accentColor, darkMode);
  }, [accentColor, darkMode]);

  // ── Typography / layout CSS vars ──
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--markdown-font-size",
      `${previewFontSize}px`,
    );
  }, [previewFontSize]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${editorFontSize}px`,
    );
  }, [editorFontSize]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--editor-blur",
      `${blurAmount}px`,
    );
  }, [blurAmount]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-display",
      fontChoice === "Quicksand"
        ? '"Quicksand", sans-serif'
        : `"${fontChoice}", sans-serif`,
    );
  }, [fontChoice]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--editor-font",
      editorFont === "monospace" ? "monospace" : `"${editorFont}", monospace`,
    );
  }, [editorFont]);

  useEffect(() => {
    const el = document.getElementById("editor-bg-layer");
    if (!el) return;
    if (bgImage) {
      el.style.backgroundImage = `url(${bgImage})`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
    } else {
      el.style.backgroundImage = "";
    }
  }, [bgImage]);

  const addCustomFont = (font: { name: string; url: string }) => {
    setCustomFonts((prev) => [...prev, font]);
  };

  const removeCustomFont = (name: string) => {
    setCustomFonts((prev) => prev.filter((f) => f.name !== name));
  };

  const setDarkModeWithPreviewSync: React.Dispatch<
    React.SetStateAction<boolean>
  > = (value) => {
    setDarkMode((prevDarkMode) => {
      const nextDarkMode =
        typeof value === "function" ? value(prevDarkMode) : value;

      setPreviewTheme((prevPreviewTheme) =>
        syncPreviewThemeWithMode(nextDarkMode, prevPreviewTheme),
      );

      return nextDarkMode;
    });
  };

  return (
    <EditorThemeContext.Provider
      value={{
        editorTheme,
        previewTheme,
        fontChoice,
        editorFont,
        fontSize,
        editorFontSize,
        previewFontSize,
        accentColor,
        blurAmount,
        bgImage,
        particlesOn,
        darkMode,
        lang,
        customFonts,
        autoSave,
        autoSaveInterval,
        setEditorTheme,
        setPreviewTheme,
        setFontChoice,
        setEditorFont,
        setFontSize,
        setEditorFontSize,
        setPreviewFontSize,
        setAccentColor,
        setBlurAmount,
        setBgImage,
        setParticlesOn,
        setDarkMode: setDarkModeWithPreviewSync,
        setLang,
        setAutoSave,
        setAutoSaveInterval,
        addCustomFont,
        removeCustomFont,
      }}
    >
      {children}
    </EditorThemeContext.Provider>
  );
}

export const useEditorConfigContext = () => {
  const context = useContext(EditorThemeContext);
  if (!context) {
    throw new Error("useEditorThemeContext must be used within EditorThemeProvider");
  }
  return context;
}