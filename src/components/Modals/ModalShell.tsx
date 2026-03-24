import { motion } from "motion/react";
import { cn } from "@/utils/cn";

interface ModalShellProps {
  children: React.ReactNode;
  onClose?: () => void;
  className?: string;
  align?: "center" | "top";
  outerClassName?: string;
}

export function ModalShell({
  children,
  onClose,
  className,
  align = "center",
  outerClassName,
}: ModalShellProps) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className={cn(
        "fixed inset-0 flex px-4 z-50",
        align === "top" ? "items-start justify-center pt-[15vh]" : "items-center justify-center p-4",
        outerClassName,
      )}
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) onClose?.();
      }}
    >
      <motion.div
        initial={{ scale: align === "top" ? 0.95 : 0.9, y: align === "top" ? -20 : 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, opacity: 0 }}
        transition={{ duration: 0.2, ease: [0.4, 0, 0.2, 1] }}
        className={cn("modal-m3-shell backdrop-blur-xl overflow-hidden flex flex-col", className)}
        onMouseDown={(e) => e.stopPropagation()}
      >
        {children}
      </motion.div>
    </motion.div>
  );
}
