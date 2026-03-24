import {
  CloudUpload,
  Eye,
  FileText,
  Palette,
  PlusCircle,
  Sparkles,
  Terminal,
  X,
} from "lucide-react";
import React, { useState, useRef } from "react";
import { useTranslation } from "react-i18next";
import { ThemeOption } from "./ThemeOption";
import { PreviewThemeCard } from "./PreviewThemeCard";
import { AccentCircle } from "./AccentCircle";
import { cn } from "@/utils/cn";
import { ACCENT_COLORS, EDITOR_THEMES, PREVIEW_THEMES } from "@/constants/theme";
import { uploadFont, uploadImage } from "@/api/client";

interface SettingEditorProps {
  editorTheme: string;
  setEditorTheme: React.Dispatch<React.SetStateAction<string>>;
  previewTheme: string;
  setPreviewTheme: React.Dispatch<React.SetStateAction<string>>;
  particlesOn: boolean;
  setParticlesOn: React.Dispatch<React.SetStateAction<boolean>>;
  fontChoice: string;
  setFontChoice: React.Dispatch<React.SetStateAction<string>>;
  editorFont: string;
  setEditorFont: React.Dispatch<React.SetStateAction<string>>;
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

export default function SettingEditor({
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
}: SettingEditorProps) {
  // const settingEditorService = new SettingEditorService();
  const { t } = useTranslation();
  const [bgUploading, setBgUploading] = useState(false);
  const [fontUploading, setFontUploading] = useState(false);

  const bgInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

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
      const { url } = await uploadImage(file);
      setBgImage(url);
    } catch (err) {
      console.error("Background upload failed", err);
    } finally {
      setBgUploading(false);
      e.target.value = "";
    }
  };

  const handleClearBg = () => setBgImage("");

  const handleFontUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFontUploading(true);
    try {
      const { url, fontFamily } = await uploadFont(file);
      const font = { name: fontFamily, url };
      injectFontFace(font);
      addCustomFont(font);
      setFontChoice(fontFamily);
    } catch (err) {
      console.error("Font upload failed", err);
    } finally {
      setFontUploading(false);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-12">
      {/* ── Editor Theme ── */}
      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Terminal className="w-5 h-5 text-primary" />
          {t("editor.editorTheme")}
        </h2>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {EDITOR_THEMES.map((theme) => (
            <ThemeOption
              key={theme.value}
              label={theme.label}
              value={theme.value}
              active={editorTheme === theme.value}
              onClick={() => setEditorTheme(theme.value)}
              colors={theme.colors}
              isDark={"isDark" in theme ? theme.isDark : false}
            />
          ))}
        </div>
      </section>

      {/* ── Preview Theme ── */}
      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Palette className="w-5 h-5 text-primary" />
          {t("editor.previewTheme")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {PREVIEW_THEMES.map((theme) => (
            <PreviewThemeCard
              key={theme.value}
              title={theme.title}
              subtitle={theme.subtitle}
              colors={theme.colors}
              isDark={theme.isDark}
              active={previewTheme === theme.value}
              onClick={() => setPreviewTheme(theme.value)}
            />
          ))}
        </div>
      </section>

      {/* ── Accent Color ── */}
      <section className="bg-white/60 border border-pink-100 rounded-2xl p-6">
        <h3 className="text-sm font-bold mb-1 uppercase tracking-widest text-slate-400">
          {t("editor.sweetAccents")}
        </h3>
        <p className="text-xs text-slate-400 mb-5">{t("editor.accentDesc")}</p>
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
            {t("editor.customMix")}
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
            {t("editor.preview")}
          </div>
          <span className="text-[10px] font-mono text-slate-400 uppercase">{accentColor}</span>
        </div>
      </section>

      {/* ── Magical Effects ── */}
      <section className="bg-pink-50/50 p-6 rounded-xl border border-pink-100">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Sparkles className="w-5 h-5 text-primary" />
          {t("editor.magicalEffects")}
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          {/* Left: Atmosphere background */}
          <div className="flex flex-col gap-4">
            <label className="text-sm font-bold text-slate-600">
              {t("editor.atmosphere")}
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
                  {bgUploading ? t("editor.uploading") : t("editor.chooseBg")}
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
                  {t("editor.softness")}
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
                <p className="text-sm font-bold">{t("editor.sparkleDust")}</p>
                <p className="text-xs text-slate-400">{t("editor.sparkleDustDesc")}</p>
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
                />
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Lettering ── */}
      <section className="bg-blue-50/40 p-6 rounded-xl border border-blue-100/60">
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <FileText className="w-5 h-5 text-primary" />
          {t("editor.lettering")}
        </h2>
        <div className="flex flex-col gap-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Font Choice */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                {t("editor.fontChoice")}
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
                    {f.name} ({t("editor.custom")})
                  </option>
                ))}
              </select>
            </div>

            {/* Editor Font */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                {t("editor.editorFont")}
              </label>
              <select
                value={editorFont}
                onChange={(e) => setEditorFont(e.target.value)}
                className="w-full bg-white border-2 border-slate-100 rounded-xl text-sm py-3 px-4 focus:ring-primary focus:border-primary appearance-none font-mono"
              >
                <option value="JetBrains Mono">JetBrains Mono (Default)</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Source Code Pro">Source Code Pro</option>
                <option value="Cascadia Code">Cascadia Code</option>
                <option value="Inconsolata">Inconsolata</option>
                <option value="monospace">System Monospace</option>
                {customFonts.map((f) => (
                  <option key={f.name} value={f.name}>
                    {f.name} ({t("editor.custom")})
                  </option>
                ))}
              </select>
            </div>

            {/* Import Custom Font */}
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                {t("editor.importCustom")}
              </label>
              <button
                onClick={() => fontInputRef.current?.click()}
                disabled={fontUploading}
                className="flex items-center justify-between w-full bg-pink-50/30 border-2 border-pink-100 border-dashed rounded-xl text-sm py-3 px-4 hover:bg-pink-50 transition-all group disabled:opacity-60"
              >
                <span className="text-slate-400">
                  {fontUploading ? t("editor.uploading") : t("editor.uploadFont")}
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
          <div className="flex flex-col gap-6">
            {/* Editor Font Size */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <Terminal className="w-4 h-4 text-primary" />
                  {t("editor.editorSize")}
                </label>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {editorFontSize}px
                </span>
              </div>
              <input
                type="range"
                className="w-full pretty-slider"
                style={{ "--slider-pct": `${((editorFontSize - 12) / 12) * 100}%` } as React.CSSProperties}
                min={12} max={24} value={editorFontSize}
                onChange={(e) => setEditorFontSize(Number(e.target.value))}
              />
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black tracking-widest px-2">
                <span>12px</span><span>18px</span><span>24px</span>
              </div>
            </div>

            {/* Preview Font Size */}
            <div className="flex flex-col gap-3">
              <div className="flex justify-between items-center">
                <label className="text-sm font-bold text-slate-600 flex items-center gap-2">
                  <Eye className="w-4 h-4 text-primary" />
                  {t("editor.previewSize")}
                </label>
                <span className="text-xs font-bold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                  {previewFontSize}px
                </span>
              </div>
              <input
                type="range"
                className="w-full pretty-slider"
                style={{ "--slider-pct": `${((previewFontSize - 12) / 12) * 100}%` } as React.CSSProperties}
                min={12} max={24} value={previewFontSize}
                onChange={(e) => setPreviewFontSize(Number(e.target.value))}
              />
              <div className="flex justify-between text-[10px] text-slate-400 uppercase font-black tracking-widest px-2">
                <span>12px</span><span>18px</span><span>24px</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
