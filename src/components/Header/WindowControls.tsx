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
          className="app-m3-window-btn flex items-center justify-center transition-all duration-150 text-slate-400 active:scale-90"
        >
          <Home className="w-7 h-7" />
        </button>
        <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md bg-slate-800 text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
          {t("launcher.title")}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
        </div>
      </div>

      {/* Toggle Sidebar */}
      <div className="relative group">
        <button
          onClick={onToggleSidebar}
          className={cn(
            "app-m3-window-btn flex items-center justify-center transition-all duration-150 active:scale-90",
            sidebarOpen ? "text-primary" : "text-slate-400",
          )}
          data-active={sidebarOpen}
        >
          <PanelLeft className="w-7 h-7" />
        </button>
        <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 px-2 py-1 rounded-md bg-slate-800 text-white text-[10px] font-medium whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50">
          {sidebarOpen
            ? t("sidebar.collapse")
            : t("sidebar.expand")}
          <div className="absolute bottom-full left-1/2 -translate-x-1/2 border-4 border-transparent border-b-slate-800" />
        </div>
      </div>
    </div>
  );
}
