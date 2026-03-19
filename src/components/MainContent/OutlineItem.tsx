import { cn } from "@/src/utils/cn";
import { motion } from "motion/react";

interface OutlineItemProps {
  label: string;
  active?: boolean;
  sub?: boolean;
  onClick?: () => void;
}
export function OutlineItem({ label, active, sub, onClick }: OutlineItemProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "flex items-center w-full text-left rounded-xl transition-all duration-300 relative overflow-hidden",
        sub
          ? "px-3 py-1.5 text-xs font-semibold text-slate-400 hover:text-primary"
          : "px-3 py-2.5 text-sm font-medium text-slate-500 hover:text-primary hover:bg-slate-50",
        active && "text-primary bg-primary/5 font-bold",
      )}
    >
      {active && (
        <motion.div
          layoutId="active-outline-indicator"
          className="absolute left-0 w-1 h-1/2 bg-primary rounded-r-full"
          transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
        />
      )}
      <span className="truncate relative z-10">{label}</span>
    </button>
  );
}
