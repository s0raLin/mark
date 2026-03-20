import { memo } from "react";
import { cn } from "@/src/utils/cn";

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
      className={cn(
        "w-11 h-11 rounded-full border-4 border-white cursor-pointer transition-all hover:scale-110 shadow-lg focus:outline-none",
        active && "ring-2 ring-offset-1 ring-primary scale-110",
      )}
      style={{ backgroundColor: color }}
    />
  );
});
