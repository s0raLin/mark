import { useState, useMemo } from "react";
import {
  Edit3,
  Layout,
  Terminal,
  Settings,
  Sparkles,
  FileText,
  Download,
  X,
  PlusCircle,
  Palette,
  CloudUpload,
  Smile,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/src/utils/cn";
import { ShortcutRow } from "./ShortcutRow";
import { ThemeOption } from "./ThemeOption";
import { PreviewThemeCard } from "./PreviewThemeCard";
import { AccentCircle } from "./AccentCircle";

interface SettingsModalProps {
  onClose: () => void;
  editorTheme: string;
  setEditorTheme: (theme: string) => void;
  previewTheme: string;
  setPreviewTheme: (theme: string) => void;
  particlesOn: boolean;
  setParticlesOn: (on: boolean) => void;
  fontChoice: string;
  setFontChoice: (font: string) => void;
}

export function SettingsModal({
  onClose,
  editorTheme,
  setEditorTheme,
  previewTheme,
  setPreviewTheme,
  particlesOn,
  setParticlesOn,
  fontChoice,
  setFontChoice,
}: SettingsModalProps) {
  const [activeTab, setActiveTab] = useState("general");

  const tabs = useMemo(
    () => [
      { id: "general", label: "General", icon: <Layout className="w-4 h-4" /> },
      { id: "editor", label: "Editor", icon: <Palette className="w-4 h-4" /> },
      { id: "export", label: "Export", icon: <Download className="w-4 h-4" /> },
      { id: "account", label: "Account", icon: <Smile className="w-4 h-4" /> },
    ],
    []
  );

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white/70 backdrop-blur-xl w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-white/50 flex flex-col h-[85vh]"
      >
        <header className="flex items-center justify-between border-b border-dashed border-pink-100 px-8 py-5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center p-2.5 rounded-2xl bg-primary/20 text-primary">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-800">
                Settings
              </h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">
                Personalize your Sparkle space
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full h-9 w-9 bg-slate-100 hover:bg-primary/20 hover:text-primary transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          {/* Settings Sidebar */}
          <aside className="w-64 border-r border-dashed border-pink-100 bg-white/30 p-6 flex flex-col gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={cn(
                  "flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-bold transition-all",
                  activeTab === tab.id
                    ? "bg-primary text-white shadow-lg shadow-primary/30 scale-[1.02]"
                    : "text-slate-500 hover:bg-primary/10 hover:text-primary",
                )}
              >
                {tab.icon}
                {tab.label}
              </button>
            ))}
          </aside>

          {/* Settings Content */}
          <div className="flex-1 overflow-y-auto p-10">
            {activeTab === "general" && (
              <div className="space-y-12">
                <section>
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <Layout className="w-5 h-5 text-primary" />
                    Workspace Settings
                  </h2>
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">
                          Workspace Name
                        </p>
                        <p className="text-xs text-slate-400">
                          How your workspace appears in the sidebar
                        </p>
                      </div>
                      <input
                        type="text"
                        defaultValue="NoteBuddy"
                        className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:ring-primary focus:border-primary"
                      />
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">Auto-Save</p>
                        <p className="text-xs text-slate-400">
                          Automatically save your sparkles to local storage
                        </p>
                      </div>
                      <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <Terminal className="w-5 h-5 text-primary" />
                    Keyboard Shortcuts
                  </h2>
                  <div className="grid grid-cols-1 gap-3">
                    <ShortcutRow keys={["Ctrl", "K"]} label="Global Search" />
                    <ShortcutRow keys={["Ctrl", "B"]} label="Bold Text" />
                    <ShortcutRow keys={["Ctrl", "I"]} label="Italic Text" />
                    <ShortcutRow keys={["Alt", "1"]} label="Split View" />
                    <ShortcutRow keys={["Alt", "2"]} label="Editor Only" />
                    <ShortcutRow keys={["Alt", "3"]} label="Preview Only" />
                  </div>
                </section>
              </div>
            )}

            {activeTab === "editor" && (
              <div className="space-y-12">
                <section>
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <Terminal className="w-5 h-5 text-primary" />
                    Editor Theme
                  </h2>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <ThemeOption
                      label="One Dark"
                      value="oneDark"
                      active={editorTheme === "oneDark"}
                      onClick={() => setEditorTheme("oneDark")}
                    />
                    <ThemeOption
                      label="GitHub Light"
                      value="githubLight"
                      active={editorTheme === "githubLight"}
                      onClick={() => setEditorTheme("githubLight")}
                    />
                    <ThemeOption
                      label="GitHub Dark"
                      value="githubDark"
                      active={editorTheme === "githubDark"}
                      onClick={() => setEditorTheme("githubDark")}
                    />
                    <ThemeOption
                      label="VS Code Dark"
                      value="vscodeDark"
                      active={editorTheme === "vscodeDark"}
                      onClick={() => setEditorTheme("vscodeDark")}
                    />
                    <ThemeOption
                      label="Dracula"
                      value="dracula"
                      active={editorTheme === "dracula"}
                      onClick={() => setEditorTheme("dracula")}
                    />
                    <ThemeOption
                      label="Nord"
                      value="nord"
                      active={editorTheme === "nord"}
                      onClick={() => setEditorTheme("nord")}
                    />
                    <ThemeOption
                      label="Sublime"
                      value="sublime"
                      active={editorTheme === "sublime"}
                      onClick={() => setEditorTheme("sublime")}
                    />
                  </div>
                </section>

                <section>
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <Palette className="w-5 h-5 text-primary" />
                    Preview Theme
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <PreviewThemeCard
                      title="Classic Heart"
                      subtitle="Cream & Rose"
                      colors={["#fffafb", "#ff4d6d", "#ffb3c1"]}
                      active={previewTheme === "theme-heart-classic"}
                      onClick={() => setPreviewTheme("theme-heart-classic")}
                    />
                    <PreviewThemeCard
                      title="Midnight Pulse"
                      subtitle="Ruby & Charcoal"
                      colors={["#1a1a1a", "#ff002b", "#800015"]}
                      active={previewTheme === "theme-heart-midnight"}
                      onClick={() => setPreviewTheme("theme-heart-midnight")}
                    />
                    <PreviewThemeCard
                      title="Golden Love"
                      subtitle="Terracotta & Gold"
                      colors={["#fdf6e3", "#b58900", "#cb4b16"]}
                      active={previewTheme === "theme-heart-golden"}
                      onClick={() => setPreviewTheme("theme-heart-golden")}
                    />
                    <PreviewThemeCard
                      title="Organic Pulse"
                      subtitle="Sage & Dusty Rose"
                      colors={["#f0f4f0", "#6c5ce7", "#00b894"]}
                      active={previewTheme === "theme-heart-organic"}
                      onClick={() => setPreviewTheme("theme-heart-organic")}
                    />
                  </div>
                </section>

                <section>
                  <h3 className="text-sm font-bold mb-4 uppercase tracking-widest text-slate-400">
                    Sweet Accents
                  </h3>
                  <div className="flex flex-wrap gap-4 items-center">
                    <AccentCircle color="#ff9a9e" active />
                    <AccentCircle color="#a1c4fd" />
                    <AccentCircle color="#c2e9fb" />
                    <AccentCircle color="#d4fc79" />
                    <AccentCircle color="#f6d365" />
                    <div className="h-8 w-px bg-pink-100 mx-2"></div>
                    <button className="flex items-center gap-2 text-xs font-bold px-4 py-2.5 rounded-full bg-primary/10 text-primary hover:bg-primary hover:text-white transition-all">
                      <Palette className="w-4 h-4" />
                      Custom Mix
                    </button>
                  </div>
                </section>

                <section className="bg-pink-50/50 p-6 rounded-xl border border-pink-100">
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <Sparkles className="w-5 h-5 text-primary" />
                    Magical Effects
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                    <div className="flex flex-col gap-4">
                      <label className="text-sm font-bold text-slate-600">
                        Atmosphere
                      </label>
                      <div className="group relative aspect-video rounded-xl overflow-hidden bg-white border-4 border-white shadow-xl flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-[1.02]">
                        <img
                          src="https://picsum.photos/seed/atmosphere/800/450"
                          alt="Atmosphere"
                          className="absolute inset-0 w-full h-full object-cover opacity-60 group-hover:scale-110 transition-transform duration-700"
                          referrerPolicy="no-referrer"
                        />
                        <div className="relative z-10 flex flex-col items-center gap-2 bg-white/40 backdrop-blur-md px-6 py-4 rounded-xl border border-white/50">
                          <CloudUpload className="w-8 h-8 text-primary" />
                          <span className="text-[10px] font-bold uppercase tracking-widest text-slate-800">
                            Choose Background
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex flex-col gap-8 justify-center">
                      <div className="flex flex-col gap-3">
                        <div className="flex justify-between items-center">
                          <label className="text-sm font-bold text-slate-600">
                            Softness (Blur)
                          </label>
                          <span className="text-xs bg-primary/20 text-primary px-2 py-0.5 rounded-full font-bold">
                            12px
                          </span>
                        </div>
                        <input
                          type="range"
                          className="w-full accent-primary"
                          defaultValue={12}
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

                <section>
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <FileText className="w-5 h-5 text-primary" />
                    Lettering
                  </h2>
                  <div className="flex flex-col gap-8">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                          <option value="Playfair Display">
                            Playfair Display
                          </option>
                        </select>
                      </div>
                      <div className="flex flex-col gap-2">
                        <label className="text-sm font-bold text-slate-600 px-1">
                          Import Custom
                        </label>
                        <button className="flex items-center justify-between w-full bg-pink-50/30 border-2 border-pink-100 border-dashed rounded-xl text-sm py-3 px-4 hover:bg-pink-50 transition-all group">
                          <span className="text-slate-400">
                            Upload .ttf / .woff2
                          </span>
                          <PlusCircle className="w-5 h-5 text-primary group-hover:rotate-90 transition-transform" />
                        </button>
                      </div>
                    </div>
                    <div className="flex flex-col gap-4">
                      <div className="flex justify-between items-center">
                        <label className="text-sm font-bold text-slate-600">
                          Text Size
                        </label>
                        <span className="text-xs font-bold text-primary">
                          16px
                        </span>
                      </div>
                      <input
                        type="range"
                        className="w-full h-3 bg-pink-100 rounded-full appearance-none cursor-pointer accent-primary"
                        max="24"
                        min="12"
                        defaultValue={16}
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
            )}

            {activeTab === "export" && (
              <div className="space-y-12">
                <section>
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <Download className="w-5 h-5 text-primary" />
                    Export Preferences
                  </h2>
                  <div className="space-y-4">
                    <div className="p-6 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">
                          Default Format
                        </p>
                        <p className="text-xs text-slate-400">
                          Preferred format when opening export modal
                        </p>
                      </div>
                      <select className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:ring-primary focus:border-primary appearance-none">
                        <option>PDF</option>
                        <option>HTML</option>
                        <option>Markdown</option>
                        <option>PNG</option>
                      </select>
                    </div>
                    <div className="p-6 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
                      <div>
                        <p className="font-bold text-slate-800">
                          Include Metadata
                        </p>
                        <p className="text-xs text-slate-400">
                          Add creation date and word count to exports
                        </p>
                      </div>
                      <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
                        <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
                      </div>
                    </div>
                  </div>
                </section>
              </div>
            )}

            {activeTab === "account" && (
              <div className="space-y-12">
                <section>
                  <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
                    <Smile className="w-5 h-5 text-primary" />
                    Account Profile
                  </h2>
                  <div className="p-8 rounded-3xl bg-gradient-to-br from-pink-50 to-white border border-pink-100 shadow-sm">
                    <div className="flex items-center gap-6 mb-8">
                      <div className="w-20 h-20 rounded-full bg-primary flex items-center justify-center text-white text-3xl font-black shadow-xl shadow-primary/20">
                        G
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-slate-800">
                          gl0wniapar
                        </h3>
                        <p className="text-sm text-slate-500">
                          gl0wniapar@gmail.com
                        </p>
                        <div className="mt-2 flex items-center gap-2">
                          <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-wider">
                            Pro Member
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <button className="p-4 rounded-2xl bg-white border border-pink-100 text-sm font-bold text-slate-600 hover:bg-pink-50 transition-all">
                        Edit Profile
                      </button>
                      <button className="p-4 rounded-2xl bg-white border border-pink-100 text-sm font-bold text-rose-400 hover:bg-rose-50 transition-all">
                        Sign Out
                      </button>
                    </div>
                  </div>
                </section>

                <section className="flex flex-col items-center justify-center py-6 text-center">
                  <div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-white shadow-xl shadow-primary/30 mb-4">
                    <Edit3 className="w-8 h-8" />
                  </div>
                  <h2 className="text-xl font-black text-slate-800 mb-1">
                    NoteBuddy Pro
                  </h2>
                  <p className="text-primary font-bold uppercase tracking-[0.3em] text-[10px] mb-4">
                    Version 2.4.0 "Sparkle"
                  </p>
                  <p className="text-xs text-slate-400 max-w-xs">
                    Crafted with love for writers, dreamers, and builders.
                  </p>
                </section>
              </div>
            )}
          </div>
        </div>

        <footer className="flex items-center justify-end gap-4 p-6 bg-slate-50/50 border-t border-dashed border-pink-100 shrink-0">
          <button className="px-6 py-2.5 text-sm font-bold text-slate-400 hover:text-primary transition-colors">
            Reset Space
          </button>
          <button
            onClick={onClose}
            className="px-8 py-3 text-sm font-bold bg-gradient-to-r from-primary to-accent text-white rounded-full hover:scale-105 active:scale-95 transition-all shadow-xl shadow-pink-200 border-b-4 border-pink-400"
          >
            Sparkle & Save
          </button>
        </footer>
      </motion.div>
    </motion.div>
  );
}
