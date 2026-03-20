import {
  CloudUpload,
  FileText,
  Palette,
  PlusCircle,
  Sparkles,
  Terminal,
} from "lucide-react";
import React from "react";
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
  return (
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
                <option value="Playfair Display">Playfair Display</option>
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-sm font-bold text-slate-600 px-1">
                Import Custom
              </label>
              <button className="flex items-center justify-between w-full bg-pink-50/30 border-2 border-pink-100 border-dashed rounded-xl text-sm py-3 px-4 hover:bg-pink-50 transition-all group">
                <span className="text-slate-400">Upload .ttf / .woff2</span>
                <PlusCircle className="w-5 h-5 text-primary group-hover:rotate-90 transition-transform" />
              </button>
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <label className="text-sm font-bold text-slate-600">
                Text Size
              </label>
              <span className="text-xs font-bold text-primary">16px</span>
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
  );
}
