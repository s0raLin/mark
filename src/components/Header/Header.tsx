import {
  Eye, Terminal, Upload,
  FilePlus, Save, FileDown, Search,
  Settings, Sparkles, Columns2,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
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
  sidebarOpen?: boolean;
  onLauncher?: () => void;
  onToggleSidebar?: () => void;
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
          "app-m3-quick-btn h-8 w-8 flex items-center justify-center rounded-lg transition-all",
          active
            ? "text-primary"
            : "text-slate-400",
        )}
        data-active={active}
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
  sidebarOpen,
  onLauncher,
  onToggleSidebar,
}: HeaderProps) {
  const { t } = useTranslation();
  const actions: ActionBtn[] = [
    { icon: <FilePlus className="w-4 h-4" />, label: t("header.newFile"), onClick: onNewSparkle },
    { icon: <Save className="w-4 h-4" />, label: t("header.save"), onClick: onSave },
    { icon: <FileDown className="w-4 h-4" />, label: t("header.saveAs"), onClick: onSaveAs, dividerAfter: true },
    { icon: <Search className="w-4 h-4" />, label: t("header.search"), onClick: onSearch, dividerAfter: true },
    { icon: <Sparkles className="w-4 h-4" />, label: t("header.sparkleDust"), onClick: onParticlesToggle, active: particlesOn },
    { icon: <Settings className="w-4 h-4" />, label: t("header.settings"), onClick: onSettings },
  ];

  return (
    <div className="flex items-center w-full relative [-webkit-app-region:drag]">
      {/* Left - Window controls */}
      <div className="fixed left-6 top-0 h-20 flex items-center z-[1000] [-webkit-app-region:no-drag]">
        <WindowControls
          sidebarOpen={sidebarOpen}
          onLauncher={onLauncher}
          onToggleSidebar={onToggleSidebar}
        />
      </div>

      {/* Center - Quick Action Bar */}
      <div className="absolute left-1/2 -translate-x-1/2 [-webkit-app-region:no-drag]">
        <div className="app-m3-quickbar header-quickbar flex items-center gap-0.5 rounded-xl px-2 py-1">
          {actions.map((action, i) => (
            <div key={i} className="flex items-center">
              <QuickBtn {...action} />
              {action.dividerAfter && (
                <div className="app-m3-divider w-px h-5 mx-1.5" />
              )}
            </div>
          ))}

          {/* View mode divider + switcher */}
          <div className="app-m3-divider w-px h-5 mx-1.5" />
          <div className="flex items-center gap-0.5">
            {(
              [
                { mode: "split" as const, icon: <Columns2 className="w-4 h-4" />, label: t("header.splitView") },
                { mode: "editor" as const, icon: <Terminal className="w-4 h-4" />, label: t("header.editorOnly") },
                { mode: "preview" as const, icon: <Eye className="w-4 h-4" />, label: t("header.previewOnly") },
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
          className="app-m3-filled-button h-10 px-6 rounded-xl text-sm font-bold transition-all flex items-center gap-2"
          title={t("header.publish")}
        >
          <Upload className="w-4 h-4" />
          {t("header.publish")}
        </button>
      </div>
    </div>
  );
}
