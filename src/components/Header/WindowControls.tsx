import { Home, PanelLeft } from "lucide-react";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";

interface WindowControlsProps {
  sidebarOpen?: boolean;
  onLauncher?: () => void;
  onToggleSidebar?: () => void;
}

export default function WindowControls({
  sidebarOpen = true,
  onLauncher,
  onToggleSidebar,
}: WindowControlsProps) {
  const { t } = useTranslation();
  return (
    <div className="flex items-center gap-4">
      {/* Launcher */}
      <div className="relative group">
        <button
          onClick={onLauncher}
          className="app-m3-window-btn flex items-center justify-center transition-all duration-150 text-slate-400 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
          aria-label={t("launcher.title")}
        >
          <Home className="w-7 h-7" />
        </button>
        <div className="app-m3-tooltip pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 rounded-xl px-3 py-2 text-xs font-semibold opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 translate-y-1">
          {t("launcher.title")}
          <div className="app-m3-tooltip-arrow absolute bottom-full left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45" />
        </div>
      </div>

      {/* Toggle Sidebar */}
      <div className="relative group">
        <button
          onClick={onToggleSidebar}
          className={cn(
            "app-m3-window-btn flex items-center justify-center transition-all duration-150 active:scale-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
            sidebarOpen ? "text-primary" : "text-slate-400",
          )}
          data-active={sidebarOpen}
          aria-label={sidebarOpen ? t("sidebar.collapse") : t("sidebar.expand")}
        >
          <PanelLeft className="w-7 h-7" />
        </button>
        <div className="app-m3-tooltip pointer-events-none absolute top-full left-1/2 z-50 mt-2 -translate-x-1/2 rounded-xl px-3 py-2 text-xs font-semibold opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100 group-focus-within:translate-y-0 group-focus-within:opacity-100 translate-y-1">
          {sidebarOpen
            ? t("sidebar.collapse")
            : t("sidebar.expand")}
          <div className="app-m3-tooltip-arrow absolute bottom-full left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45" />
        </div>
      </div>
    </div>
  );
}
