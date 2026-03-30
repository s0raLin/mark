import { memo } from "react";
import { cn } from "@/utils/cn";
import { CheckCircle2 } from "lucide-react";

interface ThemeOptionProps {
  label: string;
  value: string;
  active: boolean;
  onClick: () => void;
  // preview colors: [background, text, accent]
  colors: [string, string, string];
  isDark?: boolean;
}

export const ThemeOption = memo(function ThemeOption({
  label,
  active,
  onClick,
  colors,
  isDark,
}: ThemeOptionProps) {
  const [bg, text, accent] = colors;
  return (
    <button
      onClick={onClick}
      data-active={active}
      className={cn(
        "settings-m3-theme-option relative flex flex-col gap-2 p-3 rounded-xl border-2 transition-all text-left overflow-hidden",
        active
          ? "scale-[1.02]"
          : "",
      )}
      style={{ backgroundColor: bg }}
    >
      {/* Mini code preview */}
      <div className="flex flex-col gap-1 w-full">
        <div className="flex gap-1 items-center">
          <div className="w-2 h-2 rounded-full" style={{ backgroundColor: accent }} />
          <div className="h-1.5 rounded-full flex-1 opacity-60" style={{ backgroundColor: accent }} />
        </div>
        <div className="h-1 rounded-full w-3/4 opacity-40" style={{ backgroundColor: text }} />
        <div className="h-1 rounded-full w-1/2 opacity-30" style={{ backgroundColor: text }} />
      </div>
      <span
        className="text-xs font-bold uppercase tracking-wider"
        style={{ color: text }}
      >
        {label}
      </span>
      {active && (
        <CheckCircle2
          className="absolute top-2 right-2 w-4 h-4"
          style={{ color: accent }}
        />
      )}
    </button>
  );
});
