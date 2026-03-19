import { cn } from "@/src/utils/cn";

interface ThemeOptionProps {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
}
export function ThemeOption({ label, active, onClick }: ThemeOptionProps) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "px-4 py-3 rounded-xl text-xs font-bold border-2 transition-all",
        active
          ? "border-primary bg-primary/5 text-primary shadow-sm"
          : "border-slate-100 bg-white text-slate-500 hover:border-primary/30 hover:text-primary",
      )}
    >
      {label}
    </button>
  );
}
