import {
  Upload, FilePlus, Save, FileDown, Search, Settings, Sparkles,
} from "lucide-react";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
import WindowControls from "./WindowControls";
import { useEditorConfigContext } from "@/contexts/EditorConfig/EditorThemeProvider";

interface HeaderProps {
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
          "app-m3-quick-btn h-10 w-10 flex items-center justify-center rounded-full transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
          active
            ? "text-primary"
            : "text-slate-400",
        )}
        data-active={active}
        aria-label={label}
      >
        {icon}
      </button>
      {/* Tooltip */}
      <div className="app-m3-tooltip pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 rounded-xl px-3 py-2 text-xs font-semibold opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 translate-y-1">
        {label}
        <div className="app-m3-tooltip-arrow absolute bottom-full left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45" />
      </div>
    </div>
  );
}

export default function Header({
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
  const { particlesOn, setParticlesOn } = useEditorConfigContext();
  
  const actions: ActionBtn[] = [
    { icon: <FilePlus className="w-4 h-4" />, label: t("header.newFile"), onClick: onNewSparkle },
    { icon: <Save className="w-4 h-4" />, label: t("header.save"), onClick: onSave },
    { icon: <FileDown className="w-4 h-4" />, label: t("header.saveAs"), onClick: onSaveAs, dividerAfter: true },
    { icon: <Search className="w-4 h-4" />, label: t("header.search"), onClick: onSearch, dividerAfter: true },
    { icon: <Sparkles className="w-4 h-4" />, label: t("header.sparkleDust"), onClick: () => setParticlesOn((prev) => !prev), active: particlesOn },
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
        <div className="app-m3-quickbar header-quickbar flex items-center gap-1 rounded-full px-2 py-1">
          {actions.map((action, i) => (
            <div key={i} className="flex items-center">
              <QuickBtn {...action} />
              {action.dividerAfter && (
                <div className="app-m3-divider h-5 w-px mx-1" />
              )}
            </div>
          ))}
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
