import {
  CloudUpload,
  FileText,
  Palette,
  PlusCircle,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import React, { useState, useEffect, useRef } from "react";
import { ThemeOption } from "./ThemeOption";
import { PreviewThemeCard } from "./PreviewThemeCard";
import { AccentCircle } from "./AccentCircle";
import { cn } from "@/src/utils/cn";

interface SettingEditorProps {
  editorTheme: string;
  setEditorTheme: React.Dispatch<React.SetStateAction<string>>;
  previewTheme: string;
  setPreviewTheme: React.Dispatch<React.SetStateAction<string>>;
  particlesOn: boolean;
  setParticlesOn: React.Dispatch<React.SetStateAction<boolean>>;
  fontChoice: string;
  setFontChoice: React.Dispatch<React.SetStateAction<string>>;
}

const EDITOR_THEMES = [
  {
    value: "githubLight",
    label: "GitHub Light",
    colors: ["#ffffff", "#24292e", "#0366d6"] as [string, string, string],
  },
  {
    value: "oneDark",
    label: "One Dark",
    colors: ["#282c34", "#abb2bf", "#61afef"] as [string, string, string],
    isDark: true,
  },
  {
    value: "githubDark",
    label: "GitHub Dark",
    colors: ["#0d1117", "#c9d1d9", "#58a6ff"] as [string, string, string],
    isDark: true,
  },
  {
    value: "vscodeDark",
    label: "VS Code Dark",
    colors: ["#1e1e1e", "#d4d4d4", "#569cd6"] as [string, string, string],
    isDark: true,
  },
  {
    value: "dracula",
    label: "Dracula",
    colors: ["#282a36", "#f8f8f2", "#bd93f9"] as [string, string, string],
    isDark: true,
  },
  {
    value: "nord",
    label: "Nord",
    colors: ["#2e3440", "#d8dee9", "#88c0d0"] as [string, string, string],
    isDark: true,
  },
] as const;

const PREVIEW_THEMES = [
  {
    value: "theme-heart-classic",
    title: "Classic Heart",
    subtitle: "Cream & Rose",
    colors: ["#fffafb", "#ff4d6d", "#ffb3c1"],
    isDark: false,
  },
  {
    value: "theme-heart-midnight",
    title: "Midnight Pulse",
    subtitle: "Ruby & Charcoal",
    colors: ["#1a1a1a", "#ff002b", "#800015"],
    isDark: true,
  },
  {
    value: "theme-heart-golden",
    title: "Golden Love",
    subtitle: "Terracotta & Gold",
    colors: ["#fdf6e3", "#b58900", "#cb4b16"],
    isDark: false,
  },
  {
    value: "theme-heart-organic",
    title: "Organic Pulse",
    subtitle: "Sage & Violet",
    colors: ["#f0f4f0", "#6c5ce7", "#00b894"],
    isDark: false,
  },
];

const ACCENT_COLORS = [
  "#ff9a9e",
  "#a1c4fd",
  "#c2e9fb",
  "#d4fc79",
  "#f6d365",
  "#ffecd2",
];

export default function SettingEditor({
  editorTheme,
  setEditorTheme,
  previewTheme,
  setPreviewTheme,
  particlesOn,
  setParticlesOn,
  fontChoice,
  setFontChoice,
}: SettingEditorProps) {
  const [accentColor, setAccentColor] = useState(() => {
    return localStorage.getItem("studiomark_accent_color") || "#ff9a9e";
  });
  const [fontSize, setFontSize] = useState(() => {
    return Number(localStorage.getItem("studiomark_font_size") || "16");
  });
  const [blurAmount, setBlurAmount] = useState(() => {
    return Number(localStorage.getItem("studiomark_blur_amount") || "12");
  });
  const [bgImage, setBgImage] = useState(() => {
    return localStorage.getItem("studiomark_bg_image") || "";
  });
  const [bgUploading, setBgUploading] = useState(false);
  const [customFonts, setCustomFonts] = useState<{ name: string; url: string }[]>(() => {
    try {
      return JSON.parse(localStorage.getItem("studiomark_custom_fonts") || "[]");
    } catch {
      return [];
    }
  });
  const [fontUploading, setFontUploading] = useState(false);

  const bgInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

  // Apply accent color
  useEffect(() => {
    document.documentElement.style.setProperty("--color-primary", accentColor);
    localStorage.setItem("studiomark_accent_color", accentColor);
  }, [accentColor]);

  // Apply font size
  useEffect(() => {
    document.documentElement.style.setProperty("--markdown-font-size", `${fontSize}px`);
    localStorage.setItem("studiomark_font_size", String(fontSize));
  }, [fontSize]);

  // Persist blur
  useEffect(() => {
    localStorage.setItem("studiomark_blur_amount", String(blurAmount));
  }, [blurAmount]);

  // Apply background image to the editor wrapper
  useEffect(() => {
    const el = document.getElementById("editor-bg-layer");
    if (!el) return;
    if (bgImage) {
      el.style.backgroundImage = `url(${bgImage})`;
      el.style.backgroundSize = "cover";
      el.style.backgroundPosition = "center";
      el.style.filter = `blur(${blurAmount}px)`;
    } else {
      el.style.backgroundImage = "";
      el.style.filter = "";
    }
  }, [bgImage, blurAmount]);

  // Re-inject custom font @font-face on mount
  useEffect(() => {
    customFonts.forEach(injectFontFace);
  }, []);

  function injectFontFace(font: { name: string; url: string }) {
    const styleId = `custom-font-${font.name.replace(/\s/g, "-")}`;
    if (document.getElementById(styleId)) return;
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `@font-face { font-family: "${font.name}"; src: url("${font.url}"); }`;
    document.head.appendChild(style);
  }

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setBgImage(data.url);
        localStorage.setItem("studiomark_bg_image", data.url);
      }
    } catch (err) {
      console.error("Background upload failed", err);
    } finally {
      setBgUploading(false);
      e.target.value = "";
    }
  };

  const handleClearBg = () => {
    setBgImage("");
    localStorage.removeItem("studiomark_bg_image");
  };

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFontUploading(true);
    try {
      const formData = new FormData();
      formData.append("font", file);
      const res = await fetch("/api/upload-font", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        const font = { name: data.fontFamily, url: data.url };
        injectFontFace(font);
        const next = [...customFonts, font];
        setCustomFonts(next);
        localStorage.setItem("studiomark_custom_fonts", JSON.stringify(next));
        // Auto-select the new font
        setFontChoice(data.fontFamily);
      }
    } catch (err) {
      console.error("Font upload failed", err);
    } finally {
      setFontUploading(false);
      e.target.value = "";
    }
  };

  const fontSizeLabel =
    fontSize <= 13 ? "Tiny" : fontSize <= 16 ? "Normal" : "Comfy";

  return (
    <div className="space-y-12">
      {/* ── Editor Theme ── */}
      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Terminal className="w-5 h-5 text-primary" />
          Editor Theme
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {EDITOR_THEMES.map((t) => (
            <ThemeOption
              key={t.value}
              label={t.label}
              value={t.value}
              active={editorTheme === t.value}
              onClick={() => setEditorTheme(t.value)}
              colors={t.colors}
              isDark={"isDark" in t ? t.isDark : false}
            />
          ))}
        </div>
      </section>

      {/* ── Preview Theme ── */}
      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Palette className="w-5 h-5 text-primary" />
          Preview Theme
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PREVIEW_THEMES.map((t) => (
            <PreviewThemeCard
              key={t.value}
              title={t.title}
              subtitle={t.subtitle}
              colors={t.colors}
              isDark={t.isDark}
              active={previewTheme === t.value}
              onClick={() => setPreviewTheme(t.value)}
            />
          ))}
        </div>
      </section>

      {/* ── Accent Color ── */}
      <section className="bg-white/60 border border-pink-100 rounded-2xl p-6">
        <h3 className="text-sm font-bold mb-1 uppercase tracking-widest text-slate-400">
          Sweet Accents
        </h3>
        <p className="text-xs text-slate-400 mb-5">选择主题强调色，即时应用到整个界面</p>
        <div className="flex flex-wrap gap-4 items-center mb-5">
          {ACCENT_COLORS.map((color) => (
            <AccentCircle
              key={color}
              color={color}
              active={accentColor === color}
              onClick={() => setAccentColor(color)}
            />
          ))}
          <div className="h-8 w-px bg-pink-100 mx-2" />
          <label
            className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all cursor-pointer"
            title="Pick custom accent color"
          >
            <Palette className="w-4 h-4" />
            Custom Mix
            <input
              type="color"
              value={accentColor}
              onChange={(e) => setAccentColor(e.target.value)}
              className="sr-only"
            />
          </label>
        </div>
        {/* Live preview strip */}
        <div className="flex items-center gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
          <div
            className="w-8 h-8 rounded-full shadow-md shrink-0 transition-all duration-300"
            style={{ backgroundColor: accentColor }}
          />
          <div className="flex-1 flex flex-col gap-1.5">
            <div className="h-2.5 rounded-full w-2/3 transition-all duration-300" style={{ backgroundColor: accentColor, opacity: 0.9 }} />
            <div className="h-2 rounded-full w-1/2 transition-all duration-300" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
          </div>
          <div
            className="px-3 py-1.5 rounded-full text-white text-[10px] font-bold uppercase tracking-wider shadow-sm transition-all duration-300"
            style={{ backgroundColor: accentColor }}
          >
            Preview
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">{accentColor}</span>
        </div>
      </section>

      {/* ── Magical Effects ── */}
      <section className="bg-pink-50/50 p-6 rounded-xl border border-pink-100">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Sparkles className="w-5 h-5 text-primary" />
          Magical Effects
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Atmosphere background */}
          <div className="flex flex-col gap-4">
            <label className="text-sm font-bold text-slate-600">
              Atmosphere
            </label>
            <div
              className="group relative aspect-video rounded-xl overflow-hidden bg-white border-4 border-white shadow-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.02]"
              onClick={() => bgInputRef.current?.click()}
            >
              <img
                src={bgImage || "https://picsum.photos/seed/atmosphere/800/450"}
                alt="Atmosphere"
                className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                referrerPolicy="no-referrer"
              />
              {bgImage && (
                <button
                  onClick={(e) => { e.stopPropagation(); handleClearBg(); }}
                  className="absolute top-2 right-2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                  title="Remove background"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
              <div className="relative z-10 flex flex-col items-center gap-2 bg-white/40 backdrop-blur-md px-6 py-4 rounded-xl border border-white/50">
                {bgUploading ? (
                  <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <CloudUpload className="w-8 h-8 text-primary" />
                )}
                <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800">
                  {bgUploading ? "Uploading…" : "Choose Background"}
                </span>
              </div>
            </div>
            <input
              ref={bgInputRef}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={handleBgUpload}
            />
          </div>

          {/* Right: Blur + Sparkle Dust */}
          <div className="flex flex-col gap-8 justify-center">
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-600">
                  Softness (Blur)
                </label>
                <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                  {blurAmount}px
                </span>
              </div>
              <input
                type="range"
                className="w-full pretty-slider"
                style={{ "--slider-pct": `${(blurAmount / 24) * 100}%` } as React.CSSProperties}
                min={0}
                max={24}
                value={blurAmount}
                onChange={(e) => setBlurAmount(Number(e.target.value))}
              />
            </div>

            <div className="flex items-center justify-between p-5 rounded-xl bg-white shadow-sm border border-pink-50">
              <div className="flex flex-col">
                <p className="text-sm font-bold">Sparkle Dust</p>
                <p className="text-xs text-slate-400">
                  Tiny floating stars & hearts
                </p>
              </div>
              <div
                onClick={() => setParticlesOn(!particlesOn)}
                className={cn(
                  "w-12 h-6 rounded-full relative p-1 cursor-pointer transition-colors",
                  particlesOn ? "bg-primary" : "bg-slate-200",
                )}
              >
                <div
                  className={cn(
                    "absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all",
                    particlesOn ? "right-1" : "left-1",
                  )}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Lettering ── */}
      <section className="bg-blue-50/40 p-6 rounded-xl border border-blue-100/60">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <FileText className="w-5 h-5 text-primary" />
          Lettering
        </h2>
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Font Choice */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                Font Choice
              </label>
              <select
                value={fontChoice}
                onChange={(e) => setFontChoice(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-xl text-sm py-3 px-4 focus:ring-primary focus:border-primary appearance-none"
              >
                <option value="Quicksand">Quicksand (Default)</option>
                <option value="Bubblegum Sans">Bubblegum Sans</option>
                <option value="Patrick Hand">Patrick Hand</option>
                <option value="Comfortaa">Comfortaa</option>
                <option value="Playfair Display">Playfair Display</option>
                {customFonts.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} (Custom)
                  </option>
                ))}
              </select>
            </div>

            {/* Import Custom Font */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                Import Custom
              </label>
              <button
                onClick={() => fontInputRef.current?.click()}
                disabled={fontUploading}
                className="flex items-center justify-between w-full bg-pink-50/30 border-2 border-pink-100 border-dashed rounded-xl text-sm py-3 px-4 hover:bg-pink-50 transition-all group disabled:opacity-60"
              >
                <span className="text-slate-400">
                  {fontUploading ? "Uploading…" : "Upload .ttf / .woff2"}
                </span>
                {fontUploading ? (
                  <div className="w-5 h-5 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                ) : (
                  <PlusCircle className="w-5 h-5 text-primary group-hover:rotate-90 transition-transform" />
                )}
              </button>
              <input
                ref={fontInputRef}
                type="file"
                accept=".ttf,.woff,.woff2,.otf"
                className="sr-only"
                onChange={handleFontUpload}
              />
              {customFonts.length > 0 && (
                <div className="flex flex-wrap gap-2 mt-1">
                  {customFonts.map((f) => (
                    <span
                      key={f.name}
                      className="text-[10px] font-bold px-2 py-1 rounded-full bg-primary/10 text-primary"
                      style={{ fontFamily: f.name }}
                    >
                      {f.name}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Text Size */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-600">
                Text Size
              </label>
              <span className="text-xs font-bold text-primary">
                {fontSize}px · {fontSizeLabel}
              </span>
            </div>
            <input
              type="range"
              className="w-full pretty-slider"
              style={{ "--slider-pct": `${((fontSize - 12) / 12) * 100}%` } as React.CSSProperties}
              max={24}
              min={12}
              value={fontSize}
              onChange={(e) => setFontSize(Number(e.target.value))}
            />
            <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black tracking-widest px-2">
              <span>Tiny</span>
              <span>Normal</span>
              <span>Comfy</span>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
