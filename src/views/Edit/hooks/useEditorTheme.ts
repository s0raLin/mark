import { useState, useEffect, useRef } from "react";
import { EditorTheme, PreviewTheme, FontChoice } from "@/types/editor";
import type { StorageEditorConfig } from "../../../api/types";

/**
 * useEditorTheme Hook 参数接口
 */
export interface UseEditorThemeProps {
  /** 可选的初始编辑器配置（从存储加载） */
  initialConfig?: StorageEditorConfig | null;
}

/**
 * useEditorTheme Hook 返回值接口
 */
export interface UseEditorThemeReturn {
  editorTheme: EditorTheme;
  previewTheme: PreviewTheme;
  fontChoice: FontChoice;
  fontSize: number;
  accentColor: string;
  blurAmount: number;
  bgImage: string;
  particlesOn: boolean;
  customFonts: Array<{ name: string; url: string }>;
  setEditorTheme: React.Dispatch<React.SetStateAction<EditorTheme>>;
  setPreviewTheme: React.Dispatch<React.SetStateAction<PreviewTheme>>;
  setFontChoice: React.Dispatch<React.SetStateAction<FontChoice>>;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  setAccentColor: React.Dispatch<React.SetStateAction<string>>;
  setBlurAmount: React.Dispatch<React.SetStateAction<number>>;
  setBgImage: React.Dispatch<React.SetStateAction<string>>;
  setParticlesOn: React.Dispatch<React.SetStateAction<boolean>>;
  addCustomFont: (font: { name: string; url: string }) => void;
  removeCustomFont: (name: string) => void;
}

/**
 * 编辑器主题Hook
 */
export function useEditorTheme(props?: UseEditorThemeProps): UseEditorThemeReturn {
  const { initialConfig } = props ?? {};

  const defaultConfig: StorageEditorConfig = {
    editorTheme: "oneDark",
    previewTheme: "theme-heart-classic",
    fontChoice: "Quicksand",
    fontSize: 16,
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
  const [fontSize, setFontSize] = useState<number>(() => config.fontSize);
  const [accentColor, setAccentColor] = useState<string>(() => config.accentColor);
  const [blurAmount, setBlurAmount] = useState<number>(() => config.blurAmount);
  const [bgImage, setBgImage] = useState<string>(() => config.bgImage);
  const [particlesOn, setParticlesOn] = useState<boolean>(() => config.particlesOn);
  const [customFonts, setCustomFonts] = useState<Array<{ name: string; url: string }>>(() => config.customFonts ?? []);

  // 当初始配置异步加载完成后，同步到状态
  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current || !initialConfig) return;
    hasInitialized.current = true;
    setEditorTheme(initialConfig.editorTheme as EditorTheme);
    setPreviewTheme(initialConfig.previewTheme as PreviewTheme);
    setFontChoice(initialConfig.fontChoice as FontChoice);
    setFontSize(initialConfig.fontSize);
    setAccentColor(initialConfig.accentColor);
    setBlurAmount(initialConfig.blurAmount);
    setBgImage(initialConfig.bgImage);
    setParticlesOn(initialConfig.particlesOn);
    setCustomFonts(initialConfig.customFonts ?? []);
  }, [initialConfig]);

  // 应用 CSS 变量 — 状态变化时立即生效，不依赖 SettingEditor 是否挂载
  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", accentColor);
  }, [accentColor]);

  useEffect(() => {
    document.documentElement.style.setProperty("--markdown-font-size", `${fontSize}px`);
  }, [fontSize]);

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
    editorTheme,
    previewTheme,
    fontChoice,
    fontSize,
    accentColor,
    blurAmount,
    bgImage,
    particlesOn,
    customFonts,
    setEditorTheme,
    setPreviewTheme,
    setFontChoice,
    setFontSize,
    setAccentColor,
    setBlurAmount,
    setBgImage,
    setParticlesOn,
    addCustomFont,
    removeCustomFont,
  };
}
