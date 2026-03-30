import i18n from "@/i18n";
import { applyM3Theme } from "@/utils/applyM3Theme";
import { useEffect } from "react";

const BOOTSTRAP_THEME_STORAGE_KEY = "notemark:bootstrap-theme";

interface EditorThemeEffectsProps {
  darkMode: boolean;
  accentColor: string;
  previewFontSize: number;
  editorFontSize: number;
  blurAmount: number;
  fontChoice: string;
  editorFont: string;
  bgImage: string;
  lang: string;
  customFonts: Array<{ name: string; url: string }>;
}

export function useEditorThemeEffects({
  darkMode,
  accentColor,
  previewFontSize,
  editorFontSize,
  blurAmount,
  fontChoice,
  editorFont,
  bgImage,
  lang,
  customFonts,
}: EditorThemeEffectsProps) {

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const bootstrapTheme = {
      darkMode,
      accentColor,
      previewFontSize,
      editorFontSize,
      blurAmount,
      fontChoice,
      editorFont,
    };

    window.localStorage.setItem(
      BOOTSTRAP_THEME_STORAGE_KEY,
      JSON.stringify(bootstrapTheme),
    );
    document.documentElement.style.colorScheme = darkMode ? "dark" : "light";
    document.documentElement.style.setProperty(
      "--bootstrap-bg",
      darkMode ? "#111827" : "#f8fafc",
    );
    document.documentElement.style.setProperty(
      "--bootstrap-fg",
      darkMode ? "#e5e7eb" : "#0f172a",
    );
    document.documentElement.style.setProperty("--bootstrap-accent", accentColor);
    document.documentElement.style.backgroundColor = darkMode ? "#111827" : "#f8fafc";
    document.body.style.backgroundColor = darkMode ? "#111827" : "#f8fafc";
    document.body.style.color = darkMode ? "#e5e7eb" : "#0f172a";
  }, [
    accentColor,
    blurAmount,
    darkMode,
    editorFont,
    editorFontSize,
    fontChoice,
    previewFontSize,
  ]);

    // ── 深色模式 class
  useEffect(() => {
    document.documentElement.classList.toggle("dark", darkMode);
  }, [darkMode]);

    // ── M3 颜色主题
  useEffect(() => {
    applyM3Theme(accentColor, darkMode);
  }, [accentColor, darkMode]);

    // ── T预览字体大小
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--markdown-font-size",
      `${previewFontSize}px`,
    );
  }, [previewFontSize]);

    // 编辑器字体大小
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--editor-font-size",
      `${editorFontSize}px`,
    );
  }, [editorFontSize]);

    // 模糊效果
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--editor-blur",
      `${blurAmount}px`,
    );
  }, [blurAmount]);

    // 显示字体
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--font-display",
      fontChoice === "Quicksand"
        ? '"Quicksand", sans-serif'
        : `"${fontChoice}", sans-serif`,
    );
  }, [fontChoice]);

    // 编辑器字体
  useEffect(() => {
    document.documentElement.style.setProperty(
      "--editor-font",
      editorFont === "monospace" ? "monospace" : `"${editorFont}", monospace`,
    );
  }, [editorFont]);

  useEffect(() => {
    if (typeof document === "undefined") {
      return;
    }

    const styleId = "notemark-custom-fonts";
    const existing = document.getElementById(styleId);
    existing?.remove();

    if (customFonts.length === 0) {
      return;
    }

    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = customFonts
      .filter((font) => font.name && font.url)
      .map((font) => `
@font-face {
  font-family: "${font.name.replace(/"/g, '\\"')}";
  src: url("${font.url.replace(/"/g, '\\"')}") format("woff2");
  font-display: swap;
}
      `.trim())
      .join("\n");
    document.head.appendChild(style);

    return () => {
      style.remove();
    };
  }, [customFonts]);

    // 背景图片
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

  useEffect(() => {
    i18n.changeLanguage(lang);
  }, [lang]);

}
