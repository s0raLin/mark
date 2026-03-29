import {
  LayoutGrid,
  Search,
  Settings,
  Download,
  Sparkles,
  Power,
  Moon,
  Sun,
  RotateCw,
} from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import { useTranslation } from "react-i18next";
import { ModalHeader } from "../ModalHeader";
import { ModalShell } from "../ModalShell";
import { useEditorConfigContext } from "@/contexts/EditorConfig/EditorThemeProvider";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { emit } from '@tauri-apps/api/event';
import { useEffect } from "react";

const appWindow = getCurrentWindow();

interface LauncherModalProps {
  onClose: () => void;
  onSearch?: () => void;
  onSettings?: () => void;
  onExport?: () => void;
  darkMode?: boolean;
  onDarkModeToggle?: () => void;
}

export function LauncherModal({
  onClose,
  onSearch,
  onSettings,
  onExport,
  darkMode,
  onDarkModeToggle,
}: LauncherModalProps) {
  const { t } = useTranslation();
  const { particlesOn, setParticlesOn } = useEditorConfigContext();
  

  
  const groups = [
    {
      title: t("launcher.groupTools"),
      items: [
        {
          id: "search",
          icon: <Search className="w-6 h-6" />,
          iconBg: "bg-cyan-100 text-cyan-600",
          label: t("launcher.search"),
          desc: "Ctrl+K",
          onClick: () => {
            onSearch?.();
          },
        },
        {
          id: "settings",
          icon: <Settings className="w-6 h-6" />,
          iconBg: "bg-slate-100 text-slate-600",
          label: t("launcher.settings"),
          onClick: () => {
            onSettings?.();
          },
        },
        {
          id: "export",
          icon: <Download className="w-6 h-6" />,
          iconBg: "bg-orange-100 text-orange-600",
          label: t("launcher.export"),
          onClick: () => {
            onExport?.();
          },
        },
      ],
    },
    {
      title: t("launcher.groupAppearance"),
      items: [
        {
          id: "darkmode",
          icon: darkMode ? (
            <Sun className="w-6 h-6" />
          ) : (
            <Moon className="w-6 h-6" />
          ),
          iconBg: darkMode
            ? "bg-amber-100 text-amber-500"
            : "bg-slate-200 text-slate-600",
          label: t("launcher.darkMode"),
          desc: darkMode ? t("launcher.darkModeOn") : t("launcher.darkModeOff"),
          onClick: () => {
            onDarkModeToggle?.();
            onClose();
          },
        },
        {
          id: "sparkle",
          icon: <Sparkles className="w-6 h-6" />,
          iconBg: particlesOn
            ? "bg-primary/20 text-primary"
            : "bg-slate-100 text-slate-400",
          label: t("launcher.particles"),
          desc: particlesOn
            ? t("launcher.particlesOn")
            : t("launcher.particlesOff"),
          onClick: () => {
            setParticlesOn((prev) => !prev);
            onClose();
          },
        },
      ],
    },
    {
      title: t("launcher.groupSystem"),
      items: [
        {
          id: "reload",
          icon: <RotateCw className="w-6 h-6" />,
          iconBg: "bg-blue-100 text-blue-500",
          label: t("launcher.reload"),
          onClick: () => {
            window.location.reload();
          },
        },
        {
          id: "quit",
          icon: <Power className="w-6 h-6" />,
          iconBg: "bg-red-100 text-red-500",
          label: t("launcher.quit"),
          onClick: async () => {
            await appWindow.close();
          },
        },
      ],
    },
  ];


  useEffect(() => {
    const unlisten = appWindow.onCloseRequested(async (event) => {
      //阻止默认行为
      event.preventDefault()

      //添加关闭动画
      document.body.classList.add('window-closing')
      
      //等待动画完成后发送事件到后端处理
      setTimeout(async () => {
        await emit('close_requested')
      }, 200)
    })

    return () => {
      unlisten.then(fn => fn())
    }
  }, [])

  return (
    <ModalShell onClose={onClose} className="w-full max-w-xl rounded-3xl">
      <ModalHeader
        icon={<LayoutGrid className="w-5 h-5" />}
        title={t("launcher.title")}
        subtitle={t("launcher.subtitle")}
        onClose={onClose}
      />

      <div className="p-6 space-y-6">
        {groups.map((group) => (
          <div key={group.title}>
            <p className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-primary/60 mb-3 px-1">
              {group.title}
            </p>
            <div className="flex gap-2">
              {group.items.map((item) => (
                <button
                  key={item.id}
                  onClick={item.onClick}
                  className="modal-m3-outlined-button group flex flex-col items-center gap-2 p-3 rounded-2xl transition-all duration-150 active:scale-95 min-w-[72px]"
                >
                  <div
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center",
                      item.iconBg,
                    )}
                  >
                    {item.icon}
                  </div>
                  <div className="text-center">
                    <span className="text-[11px] font-semibold text-slate-600 group-hover:text-slate-800 transition-colors block leading-tight">
                      {item.label}
                    </span>
                    {item.desc && (
                      <span className="text-[10px] text-slate-400 leading-tight">
                        {item.desc}
                      </span>
                    )}
                  </div>
                </button>
              ))}
            </div>
          </div>
        ))}
      </div>

      <footer className="modal-m3-footer flex items-center justify-between px-8 py-4 shrink-0">
        <span className="flex items-center gap-1.5 text-[11px] text-slate-400">
          <span className="modal-m3-keycap w-5 h-5 flex items-center justify-center rounded text-[9px] font-bold">
            Esc
          </span>
          {t("launcher.close")}
        </span>
        <span className="text-[11px] font-bold text-primary">NoteMark</span>
      </footer>
    </ModalShell>
  );
}
