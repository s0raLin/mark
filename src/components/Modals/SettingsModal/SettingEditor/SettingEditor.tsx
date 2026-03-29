import {
  CloudUpload,
  Eye,
  FileText,
  Palette,
  Sparkles,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ThemeOption } from "./ThemeOption";
import { PreviewThemeCard } from "./PreviewThemeCard";
import { AccentCircle } from "./AccentCircle";
import { ColorPicker } from "./ColorPicker";
import { cn } from "@/utils/cn";
import { ACCENT_COLORS, EDITOR_THEMES, PREVIEW_THEMES } from "@/constants/theme";
import {
  deleteUploadedImage,
  listSystemFonts,
  listUploadedImages,
  uploadImage,
  type UploadedImageAsset,
} from "@/api/client";
import { applyM3Theme } from "@/utils/applyM3Theme";

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
}: SettingEditorProps) {
  const { t } = useTranslation();
  const [bgUploading, setBgUploading] = useState(false);
  const [imagesLoading, setImagesLoading] = useState(true);
  const [systemFontsLoading, setSystemFontsLoading] = useState(true);
  const [uploadedImages, setUploadedImages] = useState<UploadedImageAsset[]>([]);
  const [systemFonts, setSystemFonts] = useState<string[]>([]);
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const pickerBtnRef = useRef<HTMLButtonElement>(null);
  const pickerPopoverRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const handlerRef = useRef<((e: MouseEvent) => void) | null>(null);

  useEffect(() => {
    if (!pickerOpen) return;
    handlerRef.current = (e: MouseEvent) => {
      const target = e.target as Node;
      const isClickOnButton = pickerBtnRef.current?.contains(target);
      const isClickOnPopover = pickerPopoverRef.current?.contains(target);
      if (!isClickOnButton && !isClickOnPopover) {
        setPickerOpen(false);
      }
    };
    document.addEventListener("mousedown", handlerRef.current);
    return () => {
      if (handlerRef.current) {
        document.removeEventListener("mousedown", handlerRef.current);
      }
    };
  }, [pickerOpen]);

  const openPicker = () => {
    if (pickerOpen) { setPickerOpen(false); return; }
    const rect = pickerBtnRef.current?.getBoundingClientRect();
    if (rect) setPickerPos({ top: rect.bottom + 12, left: rect.left + rect.width / 2 });
    setPickerOpen(true);
  };

  useEffect(() => {
    let active = true;

    void listUploadedImages()
      .then((images) => {
        if (active) {
          setUploadedImages(images);
        }
      })
      .catch((err) => {
        console.error("Failed to load uploaded images", err);
      })
      .finally(() => {
        if (active) {
          setImagesLoading(false);
        }
      });

    void listSystemFonts()
      .then((fonts) => {
        if (active) {
          setSystemFonts(fonts);
        }
      })
      .catch((err) => {
        console.error("Failed to load system fonts", err);
      })
      .finally(() => {
        if (active) {
          setSystemFontsLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  const interfaceFontOptions = useMemo(() => {
    const preferred = [
      "Quicksand",
      "Bubblegum Sans",
      "Patrick Hand",
      "Comfortaa",
      "Playfair Display",
      fontChoice,
    ];
    return Array.from(new Set([...preferred, ...systemFonts].filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [fontChoice, systemFonts]);

  const editorFontOptions = useMemo(() => {
    const preferred = [
      "JetBrains Mono",
      "Fira Code",
      "Source Code Pro",
      "Cascadia Code",
      "Inconsolata",
      "monospace",
      editorFont,
    ];
    return Array.from(new Set([...preferred, ...systemFonts].filter(Boolean))).sort((a, b) =>
      a.localeCompare(b),
    );
  }, [editorFont, systemFonts]);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgUploading(true);
    try {
      const image = await uploadImage(file);
      setUploadedImages((prev) => [image, ...prev.filter((item) => item.name !== image.name)]);
      setBgImage(image.url);
    }
    catch (err) { console.error("Background upload failed", err); }
    finally { setBgUploading(false); e.target.value = ""; }
  };

  const handleDeleteImage = async (image: UploadedImageAsset) => {
    try {
      const deleted = await deleteUploadedImage(image.name);
      if (!deleted) return;
      setUploadedImages((prev) => prev.filter((item) => item.name !== image.name));
      if (bgImage === image.url) {
        setBgImage("");
      }
    } catch (err) {
      console.error("Failed to delete uploaded image", err);
    }
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
                onMouseDown={(e) => e.stopPropagation()}
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
              <div className="settings-m3-inline-surface rounded-2xl p-4 flex flex-col gap-3">
                <div className="flex items-center justify-between gap-3">
                  <FieldLabel>{t("editor.uploadedImages")}</FieldLabel>
                  <span className="text-[11px] font-medium text-slate-400">
                    {imagesLoading ? t("editor.loadingAssets") : uploadedImages.length}
                  </span>
                </div>

                {imagesLoading ? (
                  <p className="text-xs text-slate-400">{t("editor.loadingAssets")}</p>
                ) : uploadedImages.length === 0 ? (
                  <p className="text-xs text-slate-400">{t("editor.noUploadedImages")}</p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {uploadedImages.map((image) => {
                      const active = bgImage === image.url;
                      return (
                        <div
                          key={image.name}
                          onClick={() => setBgImage(image.url)}
                          className={cn(
                            "group relative overflow-hidden rounded-2xl border text-left transition-all cursor-pointer",
                            active
                              ? "border-primary shadow-[0_0_0_1px_rgba(99,102,241,0.25)]"
                              : "border-slate-200 hover:border-primary/40",
                          )}
                        >
                          <img
                            src={image.url}
                            alt={image.name}
                            className="h-28 w-full object-cover"
                          />
                          <div className="flex items-center justify-between gap-2 bg-white/90 px-3 py-2">
                            <span className="truncate text-[11px] font-medium text-slate-600">
                              {image.name}
                            </span>
                            <button
                              type="button"
                              onClick={(event) => {
                                event.stopPropagation();
                                void handleDeleteImage(image);
                              }}
                              className="rounded-full p-1 text-slate-400 transition-colors hover:bg-red-50 hover:text-red-500"
                              title={t("editor.deleteImage")}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
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
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 items-start">
            {/* Font Choice */}
            <div className="settings-m3-inline-surface rounded-2xl p-4 flex flex-col gap-3 min-w-0">
              <FieldLabel>{t("editor.fontChoice")}</FieldLabel>
              <select
                value={fontChoice}
                onChange={(e) => setFontChoice(e.target.value)}
                className="w-full min-w-0 bg-white border border-slate-200 rounded-xl text-sm py-2.5 px-3 focus:ring-primary focus:border-primary appearance-none text-slate-700 font-display"
              >
                {interfaceFontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font}
                    {font === "Quicksand" ? " (Default)" : ""}
                  </option>
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
                {editorFontOptions.map((font) => (
                  <option key={font} value={font}>
                    {font}
                    {font === "JetBrains Mono" ? " (Default)" : ""}
                    {font === "monospace" ? " (System)" : ""}
                  </option>
                ))}
              </select>
              <p className="text-xs text-slate-400 truncate">
                <span className="font-medium text-slate-500">{t("editor.preview")}:</span>{" "}
                <span style={{ fontFamily: editorFont }}>Aa Bb Cc 123</span>
              </p>
            </div>

            <div className="settings-m3-inline-surface rounded-2xl p-4 flex flex-col gap-3 min-w-0">
              <FieldLabel>{t("editor.systemFonts")}</FieldLabel>
              <p className="text-xs text-slate-400 leading-relaxed">
                {systemFontsLoading
                  ? t("editor.loadingFonts")
                  : t("editor.systemFontsDesc", { count: systemFonts.length })}
              </p>
              <div className="rounded-xl border border-slate-200 bg-white px-3 py-2">
                <p className="truncate text-sm text-slate-600">
                  {systemFontsLoading
                    ? t("editor.loadingFonts")
                    : systemFonts.slice(0, 6).join(", ") || t("editor.noSystemFonts")}
                </p>
              </div>
            </div>
          </div>

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
