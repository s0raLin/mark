import { memo } from "react";
import { cn } from "@/utils/cn";

interface AccentCircleProps {
  color: string;
  active?: boolean;
  onClick?: () => void;
}

export const AccentCircle = memo(function AccentCircle({
  color,
  active,
  onClick,
}: AccentCircleProps) {
  return (
    <button
      onClick={onClick}
      title={color}
      data-active={active}
      className={cn(
        "settings-m3-swatch w-11 h-11 rounded-full cursor-pointer transition-all duration-150 hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary/30 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
        active && "-translate-y-0.5",
      )}
      style={{ backgroundColor: color }}
    />
  );
});
