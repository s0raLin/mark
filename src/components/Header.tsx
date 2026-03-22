import {
  Eye, Layout, Terminal, Upload,
  FilePlus, Save, FileDown, Search,
  Settings, Sparkles, Columns2,
} from "lucide-react";
import { cn } from "../utils/cn";
import WindowControls from "./WindowControls";

interface HeaderProps {
  viewMode?: "split" | "editor" | "preview";
  onViewModeChange?: (mode: "split" | "editor" | "preview") => void;
  particlesOn?: boolean;
  onParticlesToggle?: () => void;
  onNewSparkle?: () => void;
  onSave?: () => void;
  onSaveAs?: () => void;
  onExport?: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
}

interface ActionBtn {
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  active?: boolean;
  dividerAfter?: boolean;
}

function QuickBtn({ icon, label, onClick, active }: ActionBtn) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className={cn(
          "h-8 w-8 flex items-center justify-center rounded-lg transition-all",
          active
            ? "bg-primary/15 text-primary"
            : "text-slate-400 hover:bg-slate-100 hover:text-slate-700",
        )}
      >
        {icon}
      </button>
      {/* Tooltip */}
      <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md bg-slate-800 text-white text-[11px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
        {label}
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
      </div>
    </div>
  );
}

export default function Header({
  viewMode = "split",
  onViewModeChange,
  particlesOn,
  onParticlesToggle,
  onNewSparkle,
  onSave,
  onSaveAs,
  onExport,
  onSearch,
  onSettings,
}: HeaderProps) {
  const actions: ActionBtn[] = [
    { icon: <FilePlus className="w-4 h-4" />, label: "New File  Ctrl+N", onClick: onNewSparkle },
    { icon: <Save className="w-4 h-4" />, label: "Save  Ctrl+S", onClick: onSave },
    { icon: <FileDown className="w-4 h-4" />, label: "Save As…", onClick: onSaveAs, dividerAfter: true },
    { icon: <Search className="w-4 h-4" />, label: "Search  Ctrl+K", onClick: onSearch, dividerAfter: true },
    { icon: <Sparkles className="w-4 h-4" />, label: "Sparkle Dust", onClick: onParticlesToggle, active: particlesOn },
    { icon: <Settings className="w-4 h-4" />, label: "Settings", onClick: onSettings },
  ];

  return (
    <div className="flex items-center w-full relative [-webkit-app-region:drag]">
      {/* Left - Window controls */}
      <div className="fixed top-4 left-4 z-[1000] [-webkit-app-region:no-drag]">
        <WindowControls />
      </div>

      {/* Center - Quick Action Bar */}
      <div className="absolute left-1/2 -translate-x-1/2 [-webkit-app-region:no-drag]">
        <div className="flex items-center gap-0.5 bg-white/80 backdrop-blur-sm border border-slate-200/80 rounded-xl px-2 py-1 shadow-sm">
          {actions.map((action, i) => (
            <div key={i} className="flex items-center">
              <QuickBtn {...action} />
              {action.dividerAfter && (
                <div className="w-px h-5 bg-slate-200 mx-1.5" />
              )}
            </div>
          ))}

          {/* View mode divider + switcher */}
          <div className="w-px h-5 bg-slate-200 mx-1.5" />
          <div className="flex items-center gap-0.5">
            {(
              [
                { mode: "split" as const, icon: <Columns2 className="w-4 h-4" />, label: "Split View" },
                { mode: "editor" as const, icon: <Terminal className="w-4 h-4" />, label: "Editor Only" },
                { mode: "preview" as const, icon: <Eye className="w-4 h-4" />, label: "Preview Only" },
              ] as { mode: "split" | "editor" | "preview"; icon: React.ReactNode; label: string }[]
            ).map(({ mode, icon, label }) => (
              <QuickBtn
                key={mode}
                icon={icon}
                label={label}
                active={viewMode === mode}
                onClick={() => onViewModeChange?.(mode)}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Right - Publish */}
      <div className="flex items-center ml-auto shrink-0 [-webkit-app-region:no-drag]">
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
