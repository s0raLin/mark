import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Info, X } from "lucide-react";
import { useError } from "@/contexts/ErrorContext";

const toneMap = {
  error: {
    icon: AlertTriangle,
    iconClassName: "bg-rose-100 text-rose-600 dark:bg-rose-500/18 dark:text-rose-200",
    borderClassName: "border-rose-200/80 dark:border-rose-400/20",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "bg-amber-100 text-amber-600 dark:bg-amber-400/18 dark:text-amber-200",
    borderClassName: "border-amber-200/80 dark:border-amber-300/20",
  },
  info: {
    icon: Info,
    iconClassName: "bg-sky-100 text-sky-600 dark:bg-sky-400/18 dark:text-sky-200",
    borderClassName: "border-sky-200/80 dark:border-sky-300/20",
  },
} as const;

export default function ErrorToast() {
  const { notifications, dismissNotification } = useError();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex w-[min(92vw,24rem)] flex-col gap-3 pointer-events-none">
      <AnimatePresence>
        {notifications.map((notification) => {
          const tone = toneMap[notification.severity];
          const Icon = tone.icon;

          return (
            <motion.div
              key={notification.id}
              initial={{ opacity: 0, y: -10, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.97 }}
              transition={{ duration: 0.18 }}
              className={`pointer-events-auto rounded-2xl border p-4 shadow-lg backdrop-blur-xl ${tone.borderClassName}`}
              style={{
                background: "color-mix(in srgb, var(--md-sys-color-surface-container-high) 96%, transparent)",
                color: "var(--md-sys-color-on-surface)",
                boxShadow:
                  "0 20px 48px -24px color-mix(in srgb, var(--md-sys-color-shadow, #000000) 40%, transparent), 0 10px 24px -18px color-mix(in srgb, var(--md-sys-color-primary) 16%, transparent)",
              }}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-xl p-2 ${tone.iconClassName}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800 dark:text-slate-100">
                      {notification.title}
                    </p>
                    {notification.status ? (
                      <span
                        className="rounded-md px-1.5 py-0.5 text-[10px] font-bold text-slate-500 dark:text-slate-200"
                        style={{
                          background: "color-mix(in srgb, var(--md-sys-color-surface-variant) 82%, transparent)",
                        }}
                      >
                        {notification.status}
                      </span>
                    ) : null}
                  </div>

                  {notification.message ? (
                    <p className="mt-1 text-sm leading-5 text-slate-600 dark:text-slate-300">
                      {notification.message}
                    </p>
                  ) : null}

                  {import.meta.env.DEV && notification.debugMessage ? (
                    <p
                      className="mt-2 rounded-xl px-2.5 py-2 text-xs leading-5 text-slate-500 dark:text-slate-300"
                      style={{
                        background: "color-mix(in srgb, var(--md-sys-color-surface) 72%, transparent)",
                        border: "1px solid color-mix(in srgb, var(--md-sys-color-outline-variant) 58%, transparent)",
                      }}
                    >
                      {notification.debugMessage}
                    </p>
                  ) : null}
                </div>

                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-slate-300 transition-colors hover:text-slate-500 dark:text-slate-400 dark:hover:text-slate-100"
                  aria-label="Dismiss notification"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
