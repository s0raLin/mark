import { useState, useEffect, useRef } from "react";
import { EditorTheme, PreviewTheme, FontChoice } from "@/types/editor";
import type { StorageEditorConfig } from "../../../api/types";

export interface UseEditorThemeProps {
  initialConfig?: StorageEditorConfig | null;
}

export interface UseEditorThemeReturn {
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
  customFonts: Array<{ name: string; url: string }>;
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
  addCustomFont: (font: { name: string; url: string }) => void;
  removeCustomFont: (name: string) => void;
}

export function useEditorTheme(props?: UseEditorThemeProps): UseEditorThemeReturn {
  const { initialConfig } = props ?? {};

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
    customFonts: [],
  };

  const config = initialConfig ?? defaultConfig;

  const [editorTheme, setEditorTheme] = useState<EditorTheme>(() => config.editorTheme as EditorTheme);
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>(() => config.previewTheme as PreviewTheme);
  const [fontChoice, setFontChoice] = useState<FontChoice>(() => config.fontChoice as FontChoice);
  const [editorFont, setEditorFont] = useState<string>(() => config.editorFont ?? "JetBrains Mono");
  const [fontSize, setFontSize] = useState<number>(() => config.fontSize);
  // 向后兼容：旧数据没有 editorFontSize/previewFontSize 时，用 fontSize 作为默认值
  const [editorFontSize, setEditorFontSize] = useState<number>(() => config.editorFontSize ?? config.fontSize ?? 14);
  const [previewFontSize, setPreviewFontSize] = useState<number>(() => config.previewFontSize ?? config.fontSize ?? 16);
  const [accentColor, setAccentColor] = useState<string>(() => config.accentColor);
  const [blurAmount, setBlurAmount] = useState<number>(() => config.blurAmount);
  const [bgImage, setBgImage] = useState<string>(() => config.bgImage);
  const [particlesOn, setParticlesOn] = useState<boolean>(() => config.particlesOn);
  const [darkMode, setDarkMode] = useState<boolean>(false);
  const [customFonts, setCustomFonts] = useState<Array<{ name: string; url: string }>>(() => config.customFonts ?? []);

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current || !initialConfig) return;
    hasInitialized.current = true;
    setEditorTheme(initialConfig.editorTheme as EditorTheme);
    setPreviewTheme(initialConfig.previewTheme as PreviewTheme);
    setFontChoice(initialConfig.fontChoice as FontChoice);
    setEditorFont(initialConfig.editorFont ?? "JetBrains Mono");
    setFontSize(initialConfig.fontSize);
    setEditorFontSize(initialConfig.editorFontSize ?? initialConfig.fontSize ?? 14);
    setPreviewFontSize(initialConfig.previewFontSize ?? initialConfig.fontSize ?? 16);
    setAccentColor(initialConfig.accentColor);
    setBlurAmount(initialConfig.blurAmount);
    setBgImage(initialConfig.bgImage);
    setParticlesOn(initialConfig.particlesOn);
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
  }, [initialConfig]);

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add("dark");
    } else {
      document.documentElement.classList.remove("dark");
    }
  }, [darkMode]);

  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.style.setProperty("--markdown-font-size", `${previewFontSize}px`);
  }, [previewFontSize]);

  useEffect(() => {
    document.documentElement.style.setProperty("--editor-font-size", `${editorFontSize}px`);
  }, [editorFontSize]);

  useEffect(() => {
    document.documentElement.style.setProperty("--editor-blur", `${blurAmount}px`);
  }, [blurAmount]);

  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-display",
      fontChoice === "Quicksand" ? '"Quicksand", sans-serif' : `"${fontChoice}", sans-serif`,
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
    setCustomFonts(prev => [...prev, font]);
  };

  const removeCustomFont = (name: string) => {
    setCustomFonts(prev => prev.filter(f => f.name !== name));
  };

  return {
    editorTheme, previewTheme, fontChoice, editorFont,
    fontSize, editorFontSize, previewFontSize,
    accentColor, blurAmount, bgImage, particlesOn, darkMode, customFonts,
    setEditorTheme, setPreviewTheme, setFontChoice, setEditorFont,
    setFontSize, setEditorFontSize, setPreviewFontSize,
    setAccentColor, setBlurAmount, setBgImage, setParticlesOn, setDarkMode,
    addCustomFont, removeCustomFont,
  };
}
