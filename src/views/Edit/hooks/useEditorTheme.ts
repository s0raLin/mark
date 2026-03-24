import { useState, useEffect, useRef } from "react";
import { EditorTheme, PreviewTheme, FontChoice } from "@/types/editor";
import type { StorageEditorConfig } from "@/api/client/types";
import i18n from "@/i18n";
import {
  argbFromHex,
  hexFromArgb,
  themeFromSourceColor,
  applyTheme,
  Hct,
} from "@material/material-color-utilities";

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

function mixHex(colorA: string, colorB: string, weightB: number) {
  const normalizedWeightB = Math.max(0, Math.min(1, weightB));
  const normalizedWeightA = 1 - normalizedWeightB;

  const parseHex = (hex: string) => {
    const safeHex = hex.replace("#", "");
    return {
      r: parseInt(safeHex.slice(0, 2), 16),
      g: parseInt(safeHex.slice(2, 4), 16),
      b: parseInt(safeHex.slice(4, 6), 16),
    };
  };

  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  const a = parseHex(colorA);
  const b = parseHex(colorB);

  return `#${toHex(Math.round(a.r * normalizedWeightA + b.r * normalizedWeightB))}${toHex(
    Math.round(a.g * normalizedWeightA + b.g * normalizedWeightB),
  )}${toHex(Math.round(a.b * normalizedWeightA + b.b * normalizedWeightB))}`;
}

// ─── M3 Token Generator (Actify-style) ───────────────────────────────────────
// Key insight: HCT tonal palette shifts hue/chroma during tone mapping, so
// palette.tone(75) for a pink seed looks brownish. We use the seed hex directly
// as the primary fill color so "pink stays pink", and only use the tonal palette
// for text/icon roles where we need guaranteed contrast on white/dark backgrounds.

export function applyM3Theme(seed: string, isDark: boolean) {
  const argb = argbFromHex(seed);
  const theme = themeFromSourceColor(argb);

  // Write all --md-sys-color-* tokens (surface, outline, container roles etc.)
  applyTheme(theme, { target: document.documentElement, dark: isDark });

  const root = document.documentElement;
  const palette = theme.palettes.primary;
  const neutralPalette = theme.palettes.neutral;
  const neutralVariantPalette = theme.palettes.neutralVariant;
  const seedHct = Hct.fromInt(argb);
  const seedTone = seedHct.tone;

  // ── Primary fill: use seed hex directly so color is visually preserved ──
  // Dark mode: use tone-80 (light variant for dark bg), light mode: seed itself
  const fillHex = isDark ? hexFromArgb(palette.tone(80)) : seed;

  // ── on-primary: white for dark/saturated fills, dark for very light fills ──
  const onPrimaryHex = (isDark || seedTone < 65) ? "#ffffff" : hexFromArgb(palette.tone(10));

  // ── Text/icon primary: must be readable on white (tone ≤ 50) ──
  const textTone = isDark ? 80 : Math.min(50, seedTone);
  const textHex = hexFromArgb(palette.tone(textTone));

  root.style.setProperty("--md-sys-color-primary", fillHex);
  root.style.setProperty("--md-sys-color-on-primary", onPrimaryHex);

  // Tailwind aliases
  root.style.setProperty("--color-primary", textHex);
  root.style.setProperty("--color-accent", hexFromArgb(palette.tone(isDark ? 30 : 90)));
  root.style.setProperty("--color-primary-text", textHex);

  // Palette tone refs
  root.style.setProperty("--md-primary-tone-80", hexFromArgb(palette.tone(80)));
  root.style.setProperty("--md-primary-tone-40", hexFromArgb(palette.tone(40)));
  root.style.setProperty("--md-primary-tone-90", hexFromArgb(palette.tone(90)));
  root.style.setProperty("--md-primary-tone-10", hexFromArgb(palette.tone(10)));

  // ── M3 surface container roles (used by dark mode CSS) ──
  // M3 spec: surface=N-6, surface-container=N-12, surface-container-high=N-17
  const primaryTintSurface = hexFromArgb(palette.tone(isDark ? 24 : 94));
  const primaryTintSurfaceHigh = hexFromArgb(palette.tone(isDark ? 30 : 90));
  const neutralSurfaceContainer = hexFromArgb(
    neutralPalette.tone(isDark ? 12 : 94),
  );
  const neutralSurfaceContainerHigh = hexFromArgb(
    neutralPalette.tone(isDark ? 17 : 92),
  );
  const surfaceContainerHex = mixHex(
    neutralSurfaceContainer,
    primaryTintSurface,
    isDark ? 0.16 : 0.12,
  );
  const surfaceContainerHighHex = mixHex(
    neutralSurfaceContainerHigh,
    primaryTintSurfaceHigh,
    isDark ? 0.2 : 0.16,
  );
  root.style.setProperty(
    "--md-sys-color-surface-container",
    surfaceContainerHex,
  );
  root.style.setProperty(
    "--md-sys-color-surface-container-high",
    surfaceContainerHighHex,
  );

  // ── Convenience aliases for legacy CSS vars ──
  const surfaceHex = mixHex(
    isDark ? hexFromArgb(neutralPalette.tone(6)) : hexFromArgb(neutralPalette.tone(98)),
    hexFromArgb(palette.tone(isDark ? 20 : 96)),
    isDark ? 0.12 : 0.08,
  );
  const softBgHex = mixHex(
    isDark ? hexFromArgb(neutralPalette.tone(10)) : hexFromArgb(neutralPalette.tone(96)),
    hexFromArgb(palette.tone(isDark ? 24 : 94)),
    isDark ? 0.16 : 0.12,
  );
  const surfaceVariantHex = mixHex(
    hexFromArgb(neutralVariantPalette.tone(isDark ? 30 : 90)),
    hexFromArgb(palette.tone(isDark ? 42 : 86)),
    isDark ? 0.18 : 0.14,
  );
  const borderSoftHex = mixHex(
    hexFromArgb(neutralVariantPalette.tone(isDark ? 26 : 88)),
    hexFromArgb(palette.tone(isDark ? 55 : 76)),
    isDark ? 0.22 : 0.18,
  );
  root.style.setProperty("--color-background-light", surfaceHex);
  root.style.setProperty("--color-soft-bg", softBgHex);
  root.style.setProperty("--color-border-soft", borderSoftHex);
  root.style.setProperty("--md-sys-color-surface-variant", surfaceVariantHex);
}

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
  lang: string;
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
  setLang: React.Dispatch<React.SetStateAction<string>>;
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
    lang: "en",
    customFonts: [],
    darkMode: false
  };

  const config = initialConfig ?? defaultConfig;

  const [editorTheme, setEditorTheme] = useState<EditorTheme>(() => config.editorTheme as EditorTheme);
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>(() => config.previewTheme as PreviewTheme);
  const [fontChoice, setFontChoice] = useState<FontChoice>(() => config.fontChoice as FontChoice);
  const [editorFont, setEditorFont] = useState<string>(() => config.editorFont ?? "JetBrains Mono");
  const [fontSize, setFontSize] = useState<number>(() => config.fontSize || 16);
  const [editorFontSize, setEditorFontSize] = useState<number>(() => config.editorFontSize || config.fontSize || 14);
  const [previewFontSize, setPreviewFontSize] = useState<number>(() => config.previewFontSize || config.fontSize || 16);
  const [accentColor, setAccentColor] = useState<string>(() => config.accentColor);
  const [blurAmount, setBlurAmount] = useState<number>(() => config.blurAmount);
  const [bgImage, setBgImage] = useState<string>(() => config.bgImage);
  const [particlesOn, setParticlesOn] = useState<boolean>(() => config.particlesOn);
  const [darkMode, setDarkMode] = useState<boolean>(() => config.darkMode);
  const [lang, setLang] = useState<string>(() => config.lang || "en");
  const [customFonts, setCustomFonts] = useState<Array<{ name: string; url: string }>>(() => config.customFonts ?? []);

  const hasInitialized = useRef(false);
  useEffect(() => {
    if (hasInitialized.current || !initialConfig) return;
    hasInitialized.current = true;
    setEditorTheme(initialConfig.editorTheme as EditorTheme);
    setPreviewTheme(initialConfig.previewTheme as PreviewTheme);
    setFontChoice(initialConfig.fontChoice as FontChoice);
    setEditorFont(initialConfig.editorFont ?? "JetBrains Mono");
    setFontSize(initialConfig.fontSize || 16);
    setEditorFontSize(initialConfig.editorFontSize || initialConfig.fontSize || 14);
    setPreviewFontSize(initialConfig.previewFontSize || initialConfig.fontSize || 16);
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

  return {
    editorTheme, previewTheme, fontChoice, editorFont,
    fontSize, editorFontSize, previewFontSize,
    accentColor, blurAmount, bgImage, particlesOn, darkMode, lang, customFonts,
    setEditorTheme, setPreviewTheme, setFontChoice, setEditorFont,
    setFontSize, setEditorFontSize, setPreviewFontSize,
    setAccentColor, setBlurAmount, setBgImage, setParticlesOn, setDarkMode: setDarkModeWithPreviewSync, setLang,
    addCustomFont, removeCustomFont,
  };
}
