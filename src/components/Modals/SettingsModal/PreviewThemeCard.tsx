import { memo } from "react";
import { cn } from "@/src/utils/cn";
import { CheckCircle2 } from "lucide-react";

interface PreviewThemeCard {
  title: string;
  subtitle: string;
  colors: string[];
  active?: boolean;
  onClick?: () => void;
}

export const PreviewThemeCard = memo(function PreviewThemeCard({
  title,
  subtitle,
  colors,
  active,
  onClick,
}: PreviewThemeCard) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "p-4 rounded-2xl border-2 transition-all cursor-pointer group flex items-center gap-4",
        active
          ? "border-primary bg-pink-50/50 shadow-sm"
          : "border-slate-100 bg-white hover:border-primary/30",
      )}
    >
      <div className="flex -space-x-2">
        {colors.map((color, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full border-2 border-white shadow-sm"
            style={{ backgroundColor: color }}
          />
        ))}
      </div>
      <div className="flex-1">
        <p className="font-bold text-slate-800 text-sm">{title}</p>
        <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest mt-0.5">
          {subtitle}
        </p>
      </div>
      {active && <CheckCircle2 className="w-5 h-5 text-primary" />}
    </div>
  );
});
