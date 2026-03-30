import {
  Check,
  ChevronDown,
  CloudUpload,
  Eye,
  FileText,
  Image as ImageIcon,
  Images,
  Palette,
  Search,
  Sparkles,
  Terminal,
  Trash2,
  X,
} from "lucide-react";
import React, { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useTranslation } from "react-i18next";
import { ThemeOption } from "./ThemeOption";
import { PreviewThemeCard } from "./PreviewThemeCard";
import { AccentCircle } from "./AccentCircle";
import { ColorPicker } from "./ColorPicker";
import { ModalHeader } from "@/components/Modals/ModalHeader";
import { ModalShell } from "@/components/Modals/ModalShell";
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
      <h2 className="flex items-center gap-2 text-base font-semibold text-slate-800">
        <span className="text-primary">{icon}</span>
        {label}
      </h2>
      {desc && <p className="mt-1.5 ml-6 text-sm leading-6 text-slate-600">{desc}</p>}
    </div>
  );
}

function FieldLabel({ children }: { children: React.ReactNode }) {
  return <label className="text-sm font-medium text-slate-600">{children}</label>;
}

function SearchableFontSelect({
  value,
  onChange,
  options,
  previewText,
  placeholderLabel,
}: {
  value: string;
  onChange: (value: string) => void;
  options: Array<{ value: string; label: string }>;
  previewText: string;
  placeholderLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const [listReady, setListReady] = useState(false);
  const [query, setQuery] = useState("");
  const [position, setPosition] = useState({ top: 0, left: 0, width: 0 });
  const triggerRef = useRef<HTMLButtonElement>(null);
  const popoverRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const deferredQuery = useDeferredValue(query);

  const selectedOption = options.find((option) => option.value === value);
  const filteredOptions = useMemo(() => {
    const keyword = deferredQuery.trim().toLowerCase();
    if (!keyword) {
      return options;
    }
    return options.filter((option) => option.label.toLowerCase().includes(keyword));
  }, [deferredQuery, options]);

  const visibleOptions = useMemo(() => {
    if (!listReady) {
      return [];
    }

    if (deferredQuery.trim()) {
      return filteredOptions;
    }

    return filteredOptions.slice(0, 120);
  }, [deferredQuery, filteredOptions, listReady]);

  const syncPosition = useCallback(() => {
    const rect = triggerRef.current?.getBoundingClientRect();
    if (!rect) {
      return;
    }
    setPosition({
      top: rect.bottom + 10,
      left: rect.left,
      width: rect.width,
    });
  }, []);

  useEffect(() => {
    if (!open) {
      setListReady(false);
      setQuery("");
      return;
    }

    syncPosition();
    window.addEventListener("resize", syncPosition);
    window.addEventListener("scroll", syncPosition, true);
    const focusFrame = window.requestAnimationFrame(() => inputRef.current?.focus());
    const listFrame = window.requestAnimationFrame(() => {
      React.startTransition(() => {
        setListReady(true);
      });
    });

    const handlePointerDown = (event: PointerEvent) => {
      const target = event.target as Node;
      const isOnTrigger = triggerRef.current?.contains(target);
      const isOnPopover = popoverRef.current?.contains(target);
      if (!isOnTrigger && !isOnPopover) {
        setOpen(false);
      }
    };

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    document.addEventListener("pointerdown", handlePointerDown, true);
    document.addEventListener("keydown", handleKeyDown);

    return () => {
      window.cancelAnimationFrame(focusFrame);
      window.cancelAnimationFrame(listFrame);
      window.removeEventListener("resize", syncPosition);
      window.removeEventListener("scroll", syncPosition, true);
      document.removeEventListener("pointerdown", handlePointerDown, true);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [open, syncPosition]);

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200/80 bg-white/90 shadow-[0_10px_24px_-20px_rgba(15,23,42,0.55)] transition-all focus-within:border-primary/40 focus-within:ring-4 focus-within:ring-primary/10">
      <div className="flex items-center gap-3 border-b border-slate-100 px-4 py-2.5">
        <span className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
          {placeholderLabel}
        </span>
        <span
          className="min-w-0 truncate text-sm font-semibold text-slate-700"
          style={{ fontFamily: value }}
        >
          {previewText}
        </span>
      </div>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        className="relative flex w-full items-center gap-3 px-4 py-3.5 text-left outline-none transition-colors hover:bg-slate-50/80"
      >
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[15px] font-medium text-slate-700"
            style={{ fontFamily: value }}
          >
            {selectedOption?.label ?? value}
          </div>
          <div className="mt-0.5 truncate text-xs text-slate-500">
            {value}
          </div>
        </div>
        <ChevronDown
          className={cn(
            "h-4 w-4 shrink-0 text-slate-400 transition-transform duration-200",
            open && "rotate-180 text-primary",
          )}
        />
      </button>
      {open && typeof document !== "undefined" && createPortal(
        <div
          ref={popoverRef}
          className="fixed z-[10010] overflow-hidden rounded-2xl border border-slate-200/90 bg-white/96 shadow-[0_24px_60px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl"
          style={{
            top: position.top,
            left: position.left,
            width: position.width,
          }}
        >
          <div style={{ fontFamily: value }}>
            <div className="border-b border-slate-100 px-3 py-3">
              <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50/80 px-3 py-2.5 focus-within:border-primary/40 focus-within:bg-white focus-within:ring-4 focus-within:ring-primary/10">
                <Search className="h-4 w-4 text-slate-400" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(event) => setQuery(event.target.value)}
                  placeholder="Search fonts"
                  className="w-full bg-transparent text-sm text-slate-700 outline-none placeholder:text-slate-400"
                />
              </div>
            </div>
            <div className="max-h-72 overflow-y-auto px-2 pb-2 pt-1">
              {!listReady ? (
                <div className="space-y-2 px-2 py-3">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div
                      key={index}
                      className="h-12 animate-pulse rounded-xl bg-slate-100/80"
                    />
                  ))}
                </div>
              ) : visibleOptions.length > 0 ? visibleOptions.map((option) => {
                const selected = option.value === value;
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => {
                      onChange(option.value);
                      setOpen(false);
                    }}
                    className={cn(
                      "flex w-full items-center gap-3 rounded-xl px-3 py-2.5 text-left transition-colors",
                      selected ? "bg-primary/10 text-primary" : "text-slate-700 hover:bg-slate-100/90",
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <div
                        className="truncate text-sm font-semibold"
                        style={{ fontFamily: option.value }}
                      >
                        {option.label}
                      </div>
                      <div className="mt-0.5 truncate text-xs text-slate-500">
                        Aa Bb Cc 123
                      </div>
                    </div>
                    <Check className={cn("h-4 w-4 shrink-0", selected ? "opacity-100" : "opacity-0")} />
                  </button>
                );
              }) : (
                <div className="px-3 py-8 text-center text-sm text-slate-500">
                  No matching fonts
                </div>
              )}
            </div>
            {listReady && !deferredQuery.trim() && filteredOptions.length > visibleOptions.length && (
              <div className="border-t border-slate-100 px-4 py-2.5 text-xs text-slate-500">
                Showing {visibleOptions.length} of {filteredOptions.length} fonts. Search to narrow the list.
              </div>
            )}
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}

function SliderField({ icon, label, value, min, max, pct, onChange }: {
  icon: React.ReactNode; label: string; value: number;
  min: number; max: number; pct: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <label className="text-sm font-medium text-slate-600 flex items-center gap-1.5">
          {icon}{label}
        </label>
        <span className="text-sm text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold tabular-nums">
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
      <div className="flex justify-between text-xs text-slate-500 px-1">
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
  const [failedImageUrls, setFailedImageUrls] = useState<string[]>([]);
  const [imageLibraryOpen, setImageLibraryOpen] = useState(false);
  const [draftBgImage, setDraftBgImage] = useState("");
  const [pendingDeleteImages, setPendingDeleteImages] = useState<string[]>([]);
  const [imageQuery, setImageQuery] = useState("");
  const [pickerOpen, setPickerOpen] = useState(false);
  const [pickerPos, setPickerPos] = useState({ top: 0, left: 0 });
  const pickerBtnRef = useRef<HTMLButtonElement>(null);
  const pickerPopoverRef = useRef<HTMLDivElement>(null);
  const bgInputRef = useRef<HTMLInputElement>(null);
  const handlerRef = useRef<((e: MouseEvent) => void) | null>(null);
  const deferredImageQuery = useDeferredValue(imageQuery);

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
    document.addEventListener("pointerdown", handlerRef.current, true);
    return () => {
      if (handlerRef.current) {
        document.removeEventListener("pointerdown", handlerRef.current, true);
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
    const preferred = ["Quicksand", fontChoice];
    const system = systemFonts.filter((font) => font !== "monospace");
    const merged = Array.from(new Set([...preferred, ...system].filter(Boolean)));
    const pinned = preferred.filter((font, index) => preferred.indexOf(font) === index);
    const others = merged.filter((font) => !pinned.includes(font)).sort((a, b) => a.localeCompare(b));
    return [...pinned, ...others];
  }, [fontChoice, systemFonts]);

  const editorFontOptions = useMemo(() => {
    const preferred = ["JetBrains Mono", "monospace", editorFont];
    const merged = Array.from(new Set([...preferred, ...systemFonts].filter(Boolean)));
    const pinned = preferred.filter((font, index) => preferred.indexOf(font) === index);
    const others = merged.filter((font) => !pinned.includes(font)).sort((a, b) => a.localeCompare(b));
    return [...pinned, ...others];
  }, [editorFont, systemFonts]);

  const filteredImages = useMemo(() => {
    const keyword = deferredImageQuery.trim().toLowerCase();
    const sorted = [...uploadedImages].sort((a, b) => {
      const aPending = pendingDeleteImages.includes(a.name) ? 1 : 0;
      const bPending = pendingDeleteImages.includes(b.name) ? 1 : 0;
      if (aPending !== bPending) return bPending - aPending;
      const aActive = a.url === draftBgImage ? 1 : 0;
      const bActive = b.url === draftBgImage ? 1 : 0;
      if (aActive !== bActive) return bActive - aActive;
      return a.name.localeCompare(b.name);
    });
    if (!keyword) return sorted;
    return sorted.filter((image) => image.name.toLowerCase().includes(keyword));
  }, [deferredImageQuery, draftBgImage, pendingDeleteImages, uploadedImages]);

  const handleBgUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setBgUploading(true);
    try {
      const image = await uploadImage(file);
      setUploadedImages((prev) => [image, ...prev.filter((item) => item.name !== image.name)]);
      setDraftBgImage(image.url);
    }
    catch (err) { console.error("Background upload failed", err); }
    finally { setBgUploading(false); e.target.value = ""; }
  };

  const handleDeleteImage = async (image: UploadedImageAsset) => {
    try {
      const deleted = await deleteUploadedImage(image.name);
      if (!deleted) return;
      setUploadedImages((prev) => prev.filter((item) => item.name !== image.name));
      if (draftBgImage === image.url) {
        setDraftBgImage("");
      }
      setPendingDeleteImages((prev) => prev.filter((name) => name !== image.name));
    } catch (err) {
      console.error("Failed to delete uploaded image", err);
    }
  };

  const openImageLibrary = () => {
    setDraftBgImage(bgImage);
    setPendingDeleteImages([]);
    setImageQuery("");
    setImageLibraryOpen(true);
  };

  const closeImageLibrary = () => {
    setDraftBgImage(bgImage);
    setPendingDeleteImages([]);
    setImageQuery("");
    setImageLibraryOpen(false);
  };

  const confirmImageLibrary = async () => {
    if (pendingDeleteImages.length > 0) {
      const deletingImages = uploadedImages.filter((image) => pendingDeleteImages.includes(image.name));
      for (const image of deletingImages) {
        await handleDeleteImage(image);
      }
      return;
    }

    if (!draftBgImage) {
      return;
    }

    setBgImage(draftBgImage);
    setImageLibraryOpen(false);
  };

  const markImageFailed = (url: string) => {
    setFailedImageUrls((prev) => (prev.includes(url) ? prev : [...prev, url]));
  };

  const canConfirmImageLibrary = pendingDeleteImages.length > 0 || Boolean(draftBgImage);

  return (
    <>
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
              className="settings-m3-swatch relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full cursor-pointer transition-all duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
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
              className="px-3 py-1 rounded-full text-white text-[11px] font-semibold tracking-wide transition-all duration-300"
              style={{ backgroundColor: accentColor }}
            >
              {t("editor.preview")}
            </div>
            <span className="text-xs font-mono text-slate-500">{accentColor}</span>
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
                onClick={(event) => {
                  event.stopPropagation();
                  openImageLibrary();
                }}
              >
                <img
                  src={bgImage || "https://picsum.photos/seed/atmosphere/800/450"}
                  alt="Atmosphere"
                  className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                  referrerPolicy="no-referrer"
                />
                {bgImage && (
                  <button
                    type="button"
                    onMouseDown={(event) => event.stopPropagation()}
                    onClick={(event) => {
                      event.stopPropagation();
                      setBgImage("");
                    }}
                    className="absolute top-2 right-2 z-20 bg-black/50 hover:bg-black/70 text-white rounded-full p-1 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                )}
                <div className="relative z-10 flex flex-col items-center gap-2 bg-white/40 backdrop-blur-md px-6 py-4 rounded-xl border border-white/50">
                  {bgUploading
                    ? <div className="w-7 h-7 border-2 border-slate-600 border-t-transparent rounded-full animate-spin" />
                    : <CloudUpload className="w-7 h-7 text-primary" />}
                  <span className="text-xs font-semibold uppercase tracking-widest text-slate-800">
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
                  <span className="text-sm text-primary bg-primary/10 px-2 py-0.5 rounded-full font-semibold">
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
                  <p className="mt-1 text-sm leading-6 text-slate-600">{t("editor.sparkleDustDesc")}</p>
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
              <div className="group">
                <SearchableFontSelect
                  value={fontChoice}
                  onChange={setFontChoice}
                  placeholderLabel={t("editor.preview")}
                  previewText={fontChoice}
                  options={interfaceFontOptions.map((font) => ({
                    value: font,
                    label: font === "Quicksand" ? `${font} (Default)` : font,
                  }))}
                />
              </div>
              <p className="text-sm text-slate-600 truncate">
                <span className="font-medium text-slate-700">{t("editor.preview")}:</span>{" "}
                <span style={{ fontFamily: fontChoice }}>{fontChoice}</span>
              </p>
              <p className="text-sm leading-6 text-slate-600">
                {systemFontsLoading
                  ? t("editor.loadingFonts")
                  : t("editor.systemFontsInline", { count: Math.max(interfaceFontOptions.length - 1, 0) })}
              </p>
            </div>

            {/* Editor Font */}
            <div className="settings-m3-inline-surface rounded-2xl p-4 flex flex-col gap-3 min-w-0">
              <FieldLabel>{t("editor.editorFont")}</FieldLabel>
              <div className="group">
                <SearchableFontSelect
                  value={editorFont}
                  onChange={setEditorFont}
                  placeholderLabel={t("editor.preview")}
                  previewText="Aa Bb Cc 123"
                  options={editorFontOptions.map((font) => ({
                    value: font,
                    label: font === "JetBrains Mono"
                      ? `${font} (Default)`
                      : font === "monospace"
                        ? `${font} (System)`
                        : font,
                  }))}
                />
              </div>
              <p className="text-sm text-slate-600 truncate">
                <span className="font-medium text-slate-700">{t("editor.preview")}:</span>{" "}
                <span style={{ fontFamily: editorFont }}>Aa Bb Cc 123</span>
              </p>
              <p className="text-sm leading-6 text-slate-600">
                {systemFontsLoading
                  ? t("editor.loadingFonts")
                  : t("editor.systemFontsInline", { count: Math.max(editorFontOptions.length - 2, 0) })}
              </p>
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
    {imageLibraryOpen && createPortal(
      <div
        className="settings-m3-overlay fixed inset-0 z-[120] flex items-center justify-center p-4"
        onMouseDown={(event) => {
          if (event.target === event.currentTarget) {
            closeImageLibrary();
          }
        }}
      >
        <div
          className="settings-m3-shell flex max-h-[86vh] w-full max-w-4xl flex-col overflow-hidden rounded-3xl"
          onMouseDown={(event) => event.stopPropagation()}
        >
          <ModalHeader
            icon={<Images className="w-5 h-5" />}
            title={t("editor.backgroundLibrary")}
            subtitle={t("editor.backgroundLibraryDesc")}
            onClose={closeImageLibrary}
          />
          <div className="flex flex-col gap-5 overflow-y-auto px-8 pb-8 pt-2">
            <div className="flex flex-wrap items-center gap-3">
              <button
                type="button"
                onClick={() => bgInputRef.current?.click()}
                disabled={bgUploading}
                className="inline-flex items-center gap-2 rounded-2xl bg-primary px-4 py-2.5 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
              >
                {bgUploading
                  ? <div className="h-4 w-4 rounded-full border-2 border-white border-t-transparent animate-spin" />
                  : <CloudUpload className="h-4 w-4" />}
                {bgUploading ? t("editor.uploading") : t("editor.readFromSystem")}
              </button>
              <span className="text-sm text-slate-600">
                {imagesLoading
                  ? t("editor.loadingAssets")
                  : t("editor.imageLibrarySummary", { count: uploadedImages.length })}
              </span>
            </div>
            {imagesLoading ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {Array.from({ length: 6 }).map((_, index) => (
                  <div
                    key={index}
                    className="settings-m3-inline-surface overflow-hidden rounded-[28px] border border-slate-200/70"
                  >
                    <div className="h-44 animate-pulse bg-slate-100/80" />
                    <div className="space-y-2 px-4 py-4">
                      <div className="h-3 rounded bg-slate-100/80" />
                      <div className="h-3 w-2/3 rounded bg-slate-100/80" />
                    </div>
                  </div>
                ))}
              </div>
            ) : uploadedImages.length === 0 ? (
              <div className="settings-m3-inline-surface rounded-[28px] border border-dashed border-slate-200/80 px-6 py-14 text-center">
                <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100/80 text-slate-400">
                  <Images className="h-6 w-6" />
                </div>
                <p className="mt-4 text-base font-semibold text-slate-600">{t("editor.noUploadedImages")}</p>
                <p className="mt-2 text-sm leading-6 text-slate-600">{t("editor.noUploadedImagesHint")}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
                {uploadedImages.map((image) => {
                  const active = draftBgImage === image.url;
                  const failed = failedImageUrls.includes(image.url);
                  const pendingDelete = pendingDeleteImages.includes(image.name);

                  return (
                    <div
                      key={image.name}
                      onClick={() => {
                        setDraftBgImage((current) => (current === image.url ? "" : image.url));
                        setPendingDeleteImages((prev) => prev.filter((name) => name !== image.name));
                      }}
                      className={cn(
                        "settings-m3-inline-surface group relative overflow-hidden rounded-[28px] border text-left transition-all cursor-pointer shadow-sm",
                        pendingDelete && "border-slate-200 bg-slate-50 opacity-55 saturate-0",
                        active
                          ? "border-primary shadow-[0_18px_40px_rgba(99,102,241,0.16)]"
                          : "border-slate-200 hover:-translate-y-1 hover:border-primary/35 hover:shadow-[0_16px_36px_rgba(15,23,42,0.08)]",
                        pendingDelete && "hover:translate-y-0 hover:border-slate-200 hover:shadow-sm",
                      )}
                    >
                      <div className="absolute left-4 top-4 z-10">
                        <span
                          className={cn(
                            "rounded-full px-3 py-1 text-[10px] font-semibold backdrop-blur-md",
                            pendingDelete
                              ? "bg-slate-900/75 text-white"
                              : active
                                ? "bg-primary text-white"
                              : "bg-white/85 text-slate-600",
                          )}
                        >
                          {pendingDelete
                            ? t("editor.pendingDelete")
                            : active
                              ? t("editor.currentBg")
                              : t("editor.useAsBg")}
                        </span>
                      </div>

                      <div className="relative h-44 w-full overflow-hidden bg-slate-100">
                        {failed ? (
                          <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(148,163,184,0.18),_rgba(255,255,255,0.92))]">
                            <div className="flex flex-col items-center gap-2 text-slate-400">
                              <ImageIcon className="h-6 w-6" />
                              <span className="text-sm font-medium">{t("editor.previewUnavailable")}</span>
                            </div>
                          </div>
                        ) : (
                          <img
                            src={image.url}
                            alt={image.name}
                            className={cn(
                              "h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.03]",
                              pendingDelete && "group-hover:scale-100",
                            )}
                            onError={() => markImageFailed(image.url)}
                          />
                        )}
                        <div className="pointer-events-none absolute inset-x-0 bottom-0 h-16 bg-gradient-to-t from-black/10 via-black/0 to-transparent" />
                      </div>

                      <div className="flex items-center justify-between gap-3 px-4 py-4">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-slate-700">{image.name}</p>
                          <p className="mt-1 text-sm text-slate-600">
                            {pendingDelete
                              ? t("editor.pendingDeleteHint")
                              : active
                                ? t("editor.selectedForBg")
                                : t("editor.clickToSelect")}
                          </p>
                        </div>
                        <button
                          type="button"
                          onClick={(event) => {
                            event.stopPropagation();
                            setPendingDeleteImages((current) =>
                              current.includes(image.name)
                                ? current.filter((name) => name !== image.name)
                                : [...current, image.name],
                            );
                          }}
                          className={cn(
                            "shrink-0 rounded-full border p-2 transition-colors",
                            pendingDelete
                              ? "border-red-200 bg-red-50 text-red-500"
                              : "border-slate-200 text-slate-400 hover:border-red-100 hover:bg-red-50 hover:text-red-500",
                          )}
                          title={t("editor.deleteImage")}
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
            <div className="flex items-center justify-end gap-3 border-t border-slate-200/70 pt-2">
              <button
                type="button"
                onClick={closeImageLibrary}
                className="rounded-2xl border border-slate-200 bg-white px-5 py-2.5 text-sm font-semibold text-slate-500 transition-colors hover:border-slate-300 hover:text-slate-700"
              >
                {t("settings.cancel")}
              </button>
              <button
                type="button"
                onClick={() => void confirmImageLibrary()}
                disabled={!canConfirmImageLibrary}
                data-disabled={!canConfirmImageLibrary}
                className={cn(
                  "rounded-full px-5 py-2.5 text-sm font-bold transition-all",
                  pendingDeleteImages.length > 0
                    ? "bg-red-500 text-white hover:opacity-90"
                    : "modal-m3-filled-button text-white active:brightness-95",
                  !canConfirmImageLibrary && "cursor-not-allowed active:scale-100",
                )}
              >
                {pendingDeleteImages.length > 0
                  ? t("editor.confirmDeleteCount", { count: pendingDeleteImages.length })
                  : t("editor.applyBackground")}
              </button>
            </div>
          </div>
        </div>
      </div>,
      document.body,
    )}
    </>
  );
}
