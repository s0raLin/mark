import { useState } from "react";
import {
  Eye,
  Layout,
  Terminal,
  Upload,
  Sparkles,
  FileText,
  FolderOpen,
  Download,
  Share2,
  PlusCircle,
} from "lucide-react";
import { cn } from "../utils/cn";

interface HeaderProps {
  viewMode?: "split" | "editor" | "preview";
  onViewModeChange?: (mode: "split" | "editor" | "preview") => void;
  particlesOn?: boolean;
  onParticlesToggle?: () => void;
  onNewSparkle?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onExport?: () => void;
}

export default function Header({
  viewMode = "split",
  onViewModeChange,
  particlesOn = false,
  onParticlesToggle,
  onNewSparkle,
  onSave,
  onSaveAs,
  onExport,
}: HeaderProps) {
  const [activeMenu, setActiveMenu] = useState<string | null>(null);

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - VS Code Style Menu Bar */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-1 menu-container">
          <div className="relative">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setActiveMenu(activeMenu === "file" ? null : "file");
              }}
              className={cn(
                "px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-slate-100",
                activeMenu === "file" && "bg-slate-100 text-primary"
              )}
            >
              File
            </button>
            {activeMenu === "file" && (
              <div className="absolute top-full left-0 mt-1 w-56 bg-white border border-slate-200 rounded-xl shadow-2xl z-[100] p-1.5 animate-in fade-in zoom-in duration-200">
                <button
                  onClick={() => {
                    onNewSparkle?.();
                    setActiveMenu(null);
                  }}
                  className="flex items-center justify-between w-full px-3 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-all text-slate-700 font-medium group"
                >
                  <div className="flex items-center gap-3">
                    <PlusCircle className="w-4 h-4 text-primary" />
                    <span>New Sparkle</span>
                  </div>
                  <span className="text-[10px] text-slate-400 font-bold bg-slate-100 px-1.5 py-0.5 rounded">
                    Ctrl+N
                  </span>
                </button>
                <div className="h-[1px] bg-slate-100 my-1.5 mx-2"></div>
                <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-all text-slate-700 font-medium">
                  <FolderOpen className="w-4 h-4 text-slate-400" />
                  Open File...
                </button>
                <button
                  onClick={() => {
                    onSave?.();
                    setActiveMenu(null);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-all text-slate-700 font-medium"
                >
                  <Download className="w-4 h-4 text-slate-400" />
                  Save
                </button>
                <button
                  onClick={() => {
                    onSaveAs?.();
                    setActiveMenu(null);
                  }}
                  className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-all text-slate-700 font-medium"
                >
                  <FileText className="w-4 h-4 text-slate-400" />
                  Save As...
                </button>
                <div className="h-[1px] bg-slate-100 my-1.5 mx-2"></div>
                <button className="flex items-center gap-3 w-full px-3 py-2.5 rounded-lg text-sm hover:bg-slate-50 transition-all text-slate-700 font-medium">
                  <Share2 className="w-4 h-4 text-slate-400" />
                  Share
                </button>
              </div>
            )}
          </div>
          <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-slate-100">
            Edit
          </button>
          <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-slate-100">
            Selection
          </button>
          <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-slate-100">
            View
          </button>
          <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-slate-100">
            Go
          </button>
          <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-slate-100">
            Run
          </button>
          <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-slate-100">
            Terminal
          </button>
          <button className="px-3 py-1.5 rounded-lg text-sm font-medium transition-all hover:bg-slate-100">
            Help
          </button>
        </div>
      </div>

      {/* Right side - controls */}
      <div className="flex items-center gap-4">
        {/* <button
          onClick={onParticlesToggle}
          className={cn(
            "h-10 flex items-center gap-2 px-4 rounded-xl bg-white hover:bg-slate-50 transition-all border border-slate-200 text-xs font-bold shadow-sm",
            particlesOn ? "text-primary border-primary/30" : "text-slate-600"
          )}
        >
          <Sparkles
            className={cn(
              "w-4 h-4",
              particlesOn ? "text-primary" : "text-yellow-400"
            )}
          />
          Particles {particlesOn ? "On" : "Off"}
        </button> */}

        <div className="h-10 flex items-center gap-1 bg-slate-100 p-1 rounded-xl border border-slate-200">
          <button
            onClick={() => onViewModeChange?.("split")}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg transition-all",
              viewMode === "split"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-400 hover:text-primary"
            )}
          >
            <Layout className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange?.("editor")}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg transition-all",
              viewMode === "editor"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-400 hover:text-primary"
            )}
          >
            <Terminal className="w-5 h-5" />
          </button>
          <button
            onClick={() => onViewModeChange?.("preview")}
            className={cn(
              "h-8 w-8 flex items-center justify-center rounded-lg transition-all",
              viewMode === "preview"
                ? "bg-white text-primary shadow-sm"
                : "text-slate-400 hover:text-primary"
            )}
          >
            <Eye className="w-5 h-5" />
          </button>
        </div>

        <button
          onClick={onExport}
          className="h-10 bg-primary hover:bg-primary/90 text-white px-6 rounded-xl text-sm font-bold transition-all flex items-center gap-2 shadow-cute"
        >
          <Upload className="w-4 h-4" />
          Publish
        </button>
      </div>
    </div>
  );
}
