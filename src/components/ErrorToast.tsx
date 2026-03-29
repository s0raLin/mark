import { AnimatePresence, motion } from "motion/react";
import { AlertTriangle, Info, X } from "lucide-react";
import { useError } from "@/contexts/ErrorContext";

const toneMap = {
  error: {
    icon: AlertTriangle,
    iconClassName: "bg-rose-100 text-rose-600",
    borderClassName: "border-rose-200/80",
  },
  warning: {
    icon: AlertTriangle,
    iconClassName: "bg-amber-100 text-amber-600",
    borderClassName: "border-amber-200/80",
  },
  info: {
    icon: Info,
    iconClassName: "bg-sky-100 text-sky-600",
    borderClassName: "border-sky-200/80",
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
              className={`pointer-events-auto rounded-2xl border bg-white/96 p-4 shadow-lg backdrop-blur-xl ${tone.borderClassName}`}
            >
              <div className="flex items-start gap-3">
                <div className={`mt-0.5 rounded-xl p-2 ${tone.iconClassName}`}>
                  <Icon className="h-4 w-4" />
                </div>

                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2">
                    <p className="truncate text-sm font-semibold text-slate-800">
                      {notification.title}
                    </p>
                    {notification.status ? (
                      <span className="rounded-md bg-slate-100 px-1.5 py-0.5 text-[10px] font-bold text-slate-500">
                        {notification.status}
                      </span>
                    ) : null}
                  </div>

                  {notification.message ? (
                    <p className="mt-1 text-sm leading-5 text-slate-600">
                      {notification.message}
                    </p>
                  ) : null}

                  {import.meta.env.DEV && notification.debugMessage ? (
                    <p className="mt-2 rounded-xl bg-slate-50 px-2.5 py-2 text-xs leading-5 text-slate-500">
                      {notification.debugMessage}
                    </p>
                  ) : null}
                </div>

                <button
                  onClick={() => dismissNotification(notification.id)}
                  className="text-slate-300 transition-colors hover:text-slate-500"
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
