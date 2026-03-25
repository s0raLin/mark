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
import React, { useState, useRef, useEffect } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ThemeOption } from "./ThemeOption";
import { PreviewThemeCard } from "./PreviewThemeCard";
import { AccentCircle } from "./AccentCircle";
import { ColorPicker } from "./ColorPicker";
import { cn } from "@/utils/cn";
import { ACCENT_COLORS, EDITOR_THEMES, PREVIEW_THEMES } from "@/constants/theme";
import { uploadFont, uploadImage } from "@/api/client";
import { applyM3Theme } from "@/views/Edit/hooks/useEditorTheme";

// Live preview: reuse the same applyM3Theme so colors match exactly
function previewM3Theme(seed: string) {
  try { applyM3Theme(seed, document.documentElement.classList.contains("dark")); }
  catch { /* ignore invalid hex during typing */ }
}

// ── Shared typography primitives ──
function SectionTitle({ icon, label, desc }: { icon: React.ReactNode; label: string; desc?: string }) {
  return (
    <div className="mb-4">
      <h2 className="flex items-center gap-2 text-sm font-semibold text-slate-700">
        <span className="text-primary">{icon}</span>
        {label}
      </h2>
      {desc && <p className="text-xs text-slate-400 mt-0.5 ml-6">{desc}</p>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-xs font-medium text-slate-500">{children}</label>;
}

function SliderField({ icon, label, value, min, max, pct, onChange }: {
  icon: React.ReactNode; label: string; value: number;
  min: number; max: number; pct: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-xs font-medium text-slate-500 flex items-center gap-1.5">
          {icon}{label}
        </label>
        <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold tabular-nums">
          {value}px
        </span>
      </div>
      <input
        type="range"
        className="w-full pretty-slider"
        style={{ "--slider-pct": `${pct}%` } as React.CSSProperties}
        min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
      <div className="flex justify-between text-[10px] text-slate-400 px-1">
        <span>{min}px</span><span>{max}px</span>
      </div>
    </div>
  );
}

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
  const { t } = useTranslation();
  const [bgUploading, setBgUploading] = useState(false);
  const [fontUploading, setFontUploading] = useState(false);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const pickerBtnRef = useRef<HTMLButtonElement>(null);
  const pickerPopoverRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const fontInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    const handler = (e: MouseEvent) => {
      if (
        pickerBtnRef.current && !pickerBtnRef.current.contains(e.target as Node) &&
        pickerPopoverRef.current && !pickerPopoverRef.current.contains(e.target as Node)
      ) setPickerOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [pickerOpen]);

  const openPicker = () => {
    if (pickerOpen) { setPickerOpen(false); return; }
    const rect = pickerBtnRef.current?.getBoundingClientRect();
    if (rect) setPickerPos({ top: rect.bottom + 12, left: rect.left + rect.width / 2 });
    setPickerOpen(true);
  };

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
    try { const { url } = await uploadImage(file); setBgImage(url); }
    catch (err) { console.error("Background upload failed", err); }
    finally { setBgUploading(false); e.target.value = ""; }
  };

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
    } catch (err) { console.error("Font upload failed", err); }
    finally { setFontUploading(false); e.target.value = ""; }
  };

  return (
    <div className="space-y-10">
      {/* ── Editor Theme ── */}
      <section>
        <SectionTitle icon={<Terminal className="w-4 h-4" />} label={t("editor.editorTheme")} />
        <div className="settings-m3-card rounded-2xl p-5">
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
        </div>
      </section>

      {/* ── Preview Theme ── */}
      <section>
        <SectionTitle icon={<Palette className="w-4 h-4" />} label={t("editor.previewTheme")} />
        <div className="settings-m3-card rounded-2xl p-5">
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
        </div>
      </section>

      {/* ── Accent Color ── */}
      <section>
        <SectionTitle icon={<Palette className="w-4 h-4" />} label={t("editor.sweetAccents")} desc={t("editor.accentDesc")} />
        <div className="settings-m3-card rounded-2xl p-5">
          <div className="flex items-center gap-3 mb-4">
            {ACCENT_COLORS.map((color) => (
              <AccentCircle
                key={color}
                color={color}
                active={accentColor === color}
                onClick={() => { setAccentColor(color); previewM3Theme(color); setPickerOpen(false); }}
              />
            ))}
            <button
              ref={pickerBtnRef}
              onClick={openPicker}
              data-active={!ACCENT_COLORS.includes(accentColor)}
              className="settings-m3-swatch relative w-11 h-11 rounded-full cursor-pointer transition-all hover:scale-110 flex items-center justify-center shrink-0"
              style={{
                backgroundColor: !ACCENT_COLORS.includes(accentColor) ? accentColor : "#f1f5f9",
              }}
              title="Custom color"
            >
              <Palette
                className="w-4 h-4"
                style={{ color: !ACCENT_COLORS.includes(accentColor) ? "white" : "#94a3b8" }}
              />
            </button>
            {pickerOpen && createPortal(
              <div
                ref={pickerPopoverRef}
                className="settings-m3-popover fixed z-[9999] rounded-2xl p-4 w-64"
                style={{
                  top: pickerPos.top,
                  left: pickerPos.left,
                  transform: "translateX(-50%)",
                }}
                onMouseDown={e => e.stopPropagation()}
              >
                <div
                  className="settings-m3-popover-arrow absolute -top-[7px] left-1/2 -translate-x-1/2 w-3.5 h-3.5 rotate-45"
                />
                <ColorPicker value={accentColor} onChange={(c) => { setAccentColor(c); previewM3Theme(c); }} />
              </div>,
              document.body,
            )}
          </div>
          {/* Live preview strip */}
          <div className="settings-m3-inline-surface flex items-center gap-3 p-3 rounded-xl">
            <div className="w-7 h-7 rounded-full shadow-sm shrink-0 transition-all duration-300" style={{ backgroundColor: accentColor }} />
            <div className="flex-1 flex flex-col gap-1.5">
              <div className="h-2 rounded-full w-2/3 transition-all duration-300" style={{ backgroundColor: accentColor, opacity: 0.9 }} />
              <div className="h-1.5 rounded-full w-1/2 transition-all duration-300" style={{ backgroundColor: accentColor, opacity: 0.4 }} />
            </div>
            <div
              className="px-3 py-1 rounded-full text-white text-[10px] font-semibold tracking-wide transition-all duration-300"
              style={{ backgroundColor: accentColor }}
            >
              {t("editor.preview")}
            </div>
            <span className="text-[10px] font-mono text-slate-400">{accentColor}</span>
          </div>
        </div>
      </section>

      {/* ── Magical Effects ── */}
      <section>
        <SectionTitle icon={<Sparkles className="w-4 h-4" />} label={t("editor.magicalEffects")} />
        <div className="settings-m3-card rounded-2xl p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left: Atmosphere background */}
            <div className="flex flex-col gap-3">
              <FieldLabel>{t("editor.atmosphere")}</FieldLabel>
              <div
                className="group relative aspect-video rounded-xl overflow-hidden bg-white shadow-sm flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.02]"
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
                    onClick={(e) => { e.stopPropagation(); setBgImage(""); }}
                    className="absolute top-2 right-2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="relative z-10 flex flex-col items-center gap-2 bg-white/40 backdrop-blur-md px-6 py-4 rounded-xl border border-white/50">
                  {bgUploading
                    ? <div className="w-7 h-7 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                    : <CloudUpload className="w-7 h-7 text-primary" />}
                  <span className="text-[10px] font-semibold uppercase tracking-widest text-slate-700">
                    {bgUploading ? t("editor.uploading") : t("editor.chooseBg")}
                  </span>
                </div>
              </div>
              <input ref={bgInputRef} type="file" accept="image/*" className="sr-only" onChange={handleBgUpload} />
            </div>

            {/* Right: Blur + Sparkle Dust */}
            <div className="flex flex-col gap-6 justify-center">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center">
                  <FieldLabel>{t("editor.softness")}</FieldLabel>
                  <span className="text-xs text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold">
                    {blurAmount}px
                  </span>
                </div>
                <input
                  type="range"
                  className="w-full pretty-slider"
                  style={{ "--slider-pct": `${(blurAmount / 24) * 100}%` } as React.CSSProperties}
                  min={0} max={24} value={blurAmount}
                  onChange={(e) => setBlurAmount(Number(e.target.value))}
                />
              </div>

              <div className="settings-m3-inline-surface flex items-center justify-between p-4 rounded-xl">
                <div>
                  <p className="text-sm font-semibold text-slate-700">{t("editor.sparkleDust")}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{t("editor.sparkleDustDesc")}</p>
                </div>
                <div
                  onClick={() => setParticlesOn(!particlesOn)}
                  className={cn(
                    "w-11 h-6 rounded-full relative p-1 cursor-pointer transition-colors shrink-0",
                    particlesOn ? "bg-primary" : "bg-slate-200",
                  )}
                >
                  <div className={cn("absolute top-1 w-4 h-4 bg-white rounded-full shadow-sm transition-all", particlesOn ? "right-1" : "left-1")} />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Lettering ── */}
      <section>
        <SectionTitle icon={<FileText className="w-4 h-4" />} label={t("editor.lettering")} />
        <div className="settings-m3-card rounded-2xl p-5 flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)_minmax(240px,0.9fr)] items-start">
            {/* Font Choice */}
            <div className="settings-m3-inline-surface rounded-2xl p-4 flex flex-col gap-3 min-w-0">
              <FieldLabel>{t("editor.fontChoice")}</FieldLabel>
              <select
                value={fontChoice}
                onChange={(e) => setFontChoice(e.target.value)}
                className="w-full min-w-0 bg-white border border-slate-200 rounded-xl text-sm py-2.5 px-3 focus:ring-primary focus:border-primary appearance-none text-slate-700 font-display"
              >
                <option value="Quicksand">Quicksand (Default)</option>
                <option value="Bubblegum Sans">Bubblegum Sans</option>
                <option value="Patrick Hand">Patrick Hand</option>
                <option value="Comfortaa">Comfortaa</option>
                <option value="Playfair Display">Playfair Display</option>
                {customFonts.map((f) => (
                  <option key={f.name} value={f.name}>{f.name} ({t("editor.custom")})</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 truncate">
                <span className="font-medium text-slate-500">{t("editor.preview")}:</span>{" "}
                <span style={{ fontFamily: fontChoice }}>{fontChoice}</span>
              </p>
            </div>

            {/* Editor Font */}
            <div className="settings-m3-inline-surface rounded-2xl p-4 flex flex-col gap-3 min-w-0">
              <FieldLabel>{t("editor.editorFont")}</FieldLabel>
              <select
                value={editorFont}
                onChange={(e) => setEditorFont(e.target.value)}
                className="w-full min-w-0 bg-white border border-slate-200 rounded-xl text-sm py-2.5 px-3 focus:ring-primary focus:border-primary appearance-none font-display text-slate-700"
              >
                <option value="JetBrains Mono">JetBrains Mono (Default)</option>
                <option value="Fira Code">Fira Code</option>
                <option value="Source Code Pro">Source Code Pro</option>
                <option value="Cascadia Code">Cascadia Code</option>
                <option value="Inconsolata">Inconsolata</option>
                <option value="monospace">System Monospace</option>
                {customFonts.map((f) => (
                  <option key={f.name} value={f.name}>{f.name} ({t("editor.custom")})</option>
                ))}
              </select>
              <p className="text-xs text-slate-400 truncate">
                <span className="font-medium text-slate-500">{t("editor.preview")}:</span>{" "}
                <span style={{ fontFamily: editorFont }}>Aa Bb Cc 123</span>
              </p>
            </div>

            {/* Import Custom Font */}
            <div className="settings-m3-inline-surface rounded-2xl p-4 flex flex-col gap-3 min-w-0">
              <FieldLabel>{t("editor.importCustom")}</FieldLabel>
              <button
                onClick={() => fontInputRef.current?.click()}
                disabled={fontUploading}
                className="settings-m3-outlined-button flex items-center justify-between w-full min-h-11 border-2 border-dashed rounded-xl text-sm py-2.5 px-3 transition-all group disabled:opacity-60 font-display shrink-0"
              >
                <span className="text-slate-400 text-sm truncate pr-3">
                  {fontUploading ? t("editor.uploading") : t("editor.uploadFont")}
                </span>
                {fontUploading
                  ? <div className="w-4 h-4 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                  : <PlusCircle className="w-4 h-4 text-primary/60 group-hover:text-primary group-hover:rotate-90 transition-all" />}
              </button>
              <input ref={fontInputRef} type="file" accept=".ttf,.woff,.woff2,.otf" className="sr-only" onChange={handleFontUpload} />
              <p className="text-xs text-slate-400 leading-relaxed">
                {customFonts.length > 0 ? `${customFonts.length} ${t("editor.custom")}` : t("editor.uploadFont")}
              </p>
            </div>
          </div>

          {customFonts.length > 0 && (
            <div className="settings-m3-inline-surface rounded-2xl p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <FieldLabel>{t("editor.importCustom")}</FieldLabel>
                <span className="text-[11px] font-medium text-slate-400">{customFonts.length}</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {customFonts.map((f) => (
                  <span
                    key={f.name}
                    className="max-w-full text-[11px] px-3 py-1 rounded-full bg-primary/10 text-primary truncate"
                    style={{ fontFamily: f.name }}
                    title={f.name}
                  >
                    {f.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Font Sizes */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <SliderField
              icon={<Terminal className="w-3.5 h-3.5 text-primary" />}
              label={t("editor.editorSize")}
              value={editorFontSize}
              min={12} max={24}
              pct={((editorFontSize - 12) / 12) * 100}
              onChange={(v) => setEditorFontSize(v)}
            />
            <SliderField
              icon={<Eye className="w-3.5 h-3.5 text-primary" />}
              label={t("editor.previewSize")}
              value={previewFontSize}
              min={12} max={24}
              pct={((previewFontSize - 12) / 12) * 100}
              onChange={(v) => setPreviewFontSize(v)}
            />
          </div>
        </div>
      </section>
    </div>
  );
}
