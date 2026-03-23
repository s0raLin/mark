import { LayoutGrid, X, Search, Settings, Download, Sparkles, Power, Moon, Sun } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";

interface LauncherItem {
  id: string;
  icon: React.ReactNode;
  iconBg: string;
  label: string;
  desc?: string;
  onClick?: () => void;
}

interface LauncherGroup {
  title: string;
  items: LauncherItem[];
}

interface LauncherModalProps {
  onClose: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
  onExport?: () => void;
  onParticlesToggle?: () => void;
  particlesOn?: boolean;
  darkMode?: boolean;
  onDarkModeToggle?: () => void;
}

const getElectronIPC = () => {
  try {
    return (window as Window & { require?: (m: string) => { ipcRenderer: { send: (ch: string) => void } } })
      .require?.("electron")?.ipcRenderer ?? null;
  } catch { return null; }
};

export function LauncherModal({
  onClose,
  onSearch,
  onSettings,
  onExport,
  onParticlesToggle,
  particlesOn,
  darkMode,
  onDarkModeToggle,
}: LauncherModalProps) {
  const groups: LauncherGroup[] = [
    {
      title: "工具",
      items: [
        {
          id: "search",
          icon: <Search className="w-6 h-6" />,
          iconBg: "bg-cyan-100 text-cyan-600",
          label: "搜索",
          desc: "Ctrl+K",
          onClick: () => { onSearch?.(); onClose(); },
        },
        {
          id: "settings",
          icon: <Settings className="w-6 h-6" />,
          iconBg: "bg-slate-100 text-slate-600",
          label: "设置",
          onClick: () => { onSettings?.(); onClose(); },
        },
        {
          id: "export",
          icon: <Download className="w-6 h-6" />,
          iconBg: "bg-orange-100 text-orange-600",
          label: "导出",
          onClick: () => { onExport?.(); onClose(); },
        },
      ],
    },
    {
      title: "外观",
      items: [
        {
          id: "darkmode",
          icon: darkMode ? <Sun className="w-6 h-6" /> : <Moon className="w-6 h-6" />,
          iconBg: darkMode ? "bg-amber-100 text-amber-500" : "bg-slate-200 text-slate-600",
          label: "深色模式",
          desc: darkMode ? "已开启" : "已关闭",
          onClick: () => { onDarkModeToggle?.(); onClose(); },
        },
        {
          id: "sparkle",
          icon: <Sparkles className="w-6 h-6" />,
          iconBg: particlesOn ? "bg-primary/20 text-primary" : "bg-slate-100 text-slate-400",
          label: "粒子特效",
          desc: particlesOn ? "已开启" : "已关闭",
          onClick: () => { onParticlesToggle?.(); onClose(); },
        },
      ],
    },
    {
      title: "系统",
      items: [
        {
          id: "quit",
          icon: <Power className="w-6 h-6" />,
          iconBg: "bg-red-100 text-red-500",
          label: "退出应用",
          onClick: () => { getElectronIPC()?.send("window-close"); },
        },
      ],
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4 z-50"
      onMouseDown={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-white/70 backdrop-blur-xl w-full max-w-xl rounded-3xl overflow-hidden shadow-sm border border-white/50 flex flex-col"
      >
        {/* 标题栏 */}
        <header className="flex items-center justify-between border-b border-dashed border-pink-100 px-8 py-5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center p-2.5 rounded-2xl bg-primary/20 text-primary">
              <LayoutGrid className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-800">启动台</h2>
              <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Quick Access</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full h-9 w-9 bg-white/60 hover:bg-primary/20 hover:text-primary text-slate-400 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        {/* 分组网格 */}
        <div className="p-6 space-y-6">
          {groups.map((group) => (
            <div key={group.title}>
              <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-300 mb-3 px-1">
                {group.title}
              </p>
              <div className="flex gap-2">
                {group.items.map((item) => (
                  <button
                    key={item.id}
                    onClick={item.onClick}
                    className="group flex flex-col items-center gap-2 p-3 rounded-2xl hover:bg-slate-100/80 transition-all duration-150 active:scale-95 min-w-[72px]"
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      item.iconBg,
                    )}>
                      {item.icon}
                    </div>
                    <div className="text-center">
                      <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-800 transition-colors block leading-tight">
                        {item.label}
                      </span>
                      {item.desc && (
                        <span className="text-[10px] text-slate-400 leading-tight">{item.desc}</span>
                      )}
                    </div>
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* 底部 */}
        <footer className="flex items-center justify-between px-8 py-4 bg-slate-50/50 border-t border-dashed border-pink-100 shrink-0">
          <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <span className="w-5 h-5 flex items-center justify-center bg-slate-200 rounded text-[9px] font-bold">Esc</span>
            关闭
          </span>
          <span className="text-xs font-bold text-primary">NoteMark</span>
        </footer>
      </motion.div>
    </motion.div>
  );
}
