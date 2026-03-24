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
        "settings-m3-swatch w-11 h-11 rounded-full cursor-pointer transition-all hover:scale-110 focus:outline-none",
        active && "scale-110",
      )}
      style={{ backgroundColor: color }}
    />
  );
});
