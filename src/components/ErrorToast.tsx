import { AnimatePresence, motion } from "motion/react";
import { X, AlertTriangle, ServerCrash } from "lucide-react";
import { useError } from "@/contexts/ErrorContext";

export default function ErrorToast() {
  const { errors, dismissError } = useError();

  return (
    <div className="fixed top-6 right-6 z-[9999] flex flex-col gap-2 pointer-events-none">
      <AnimatePresence>
        {errors.map((err) => {
          const is5xx = err.status && err.status >= 500;
          return (
            <motion.div
              key={err.id}
              initial={{ opacity: 0, x: 40, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 40, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto flex items-start gap-3 bg-white/95 backdrop-blur-xl border border-red-100 rounded-2xl px-4 py-3 shadow-sm max-w-sm w-full"
            >
              <div className={`shrink-0 mt-0.5 p-1.5 rounded-xl ${is5xx ? "bg-red-100 text-red-500" : "bg-orange-100 text-orange-500"}`}>
                {is5xx
                  ? <ServerCrash className="w-4 h-4" />
                  : <AlertTriangle className="w-4 h-4" />
                }
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  {err.status && (
                    <span className={`text-[10px] font-extrabold px-1.5 py-0.5 rounded-md ${is5xx ? "bg-red-100 text-red-500" : "bg-orange-100 text-orange-500"}`}>
                      {err.status}
                    </span>
                  )}
                  <p className="text-sm font-semibold text-slate-700 truncate">{err.message}</p>
                </div>
                {err.detail && (
                  <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{err.detail}</p>
                )}
              </div>
              <button
                onClick={() => dismissError(err.id)}
                className="shrink-0 text-slate-300 hover:text-slate-500 transition-colors mt-0.5"
              >
                <X className="w-4 h-4" />
              </button>
            </motion.div>
          );
        })}
      </AnimatePresence>
    </div>
  );
}
