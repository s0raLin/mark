import { memo } from "react";
import { cn } from "@/utils/cn";
import { CheckCircle2 } from "lucide-react";

interface PreviewThemeCardProps {
  title: string;
  subtitle: string;
  colors: string[];
  active?: boolean;
  onClick?: () => void;
  isDark?: boolean;
}

export const PreviewThemeCard = memo(function PreviewThemeCard({
  title,
  subtitle,
  colors,
  active,
  onClick,
  isDark,
}: PreviewThemeCardProps) {
  const bgColor = colors[0];
  const titleColor = isDark ? "#e2e8f0" : "#1e293b";
  const subtitleColor = isDark ? "#cbd5e1" : "#475569";

  return (
    <div
      onClick={onClick}
      data-active={active}
      className={cn(
        "settings-m3-preview-card p-4 rounded-2xl border-2 transition-all cursor-pointer flex items-center gap-4",
        active
          ? "scale-[1.01]"
          : "",
      )}
      style={{ backgroundColor: bgColor }}
    >
      <div className="flex -space-x-2 shrink-0">
        {colors.map((color, i) => (
          <div
            key={i}
            className="w-8 h-8 rounded-full border-2 shadow-sm"
            style={{
              backgroundColor: color,
              borderColor: isDark ? "rgba(255,255,255,0.15)" : "rgba(255,255,255,0.9)",
            }}
          />
        ))}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-bold text-sm" style={{ color: titleColor }}>
          {title}
        </p>
        <p
          className="text-xs font-bold uppercase tracking-widest mt-1"
          style={{ color: subtitleColor }}
        >
          {subtitle}
        </p>
      </div>
      {active && (
        <CheckCircle2 className="w-5 h-5 shrink-0 text-primary" />
      )}
    </div>
  );
});
