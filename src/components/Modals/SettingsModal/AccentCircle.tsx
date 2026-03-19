import { cn } from "@/src/utils/cn";

interface AccentCircleProps {
  color: string;
  active?: boolean;
}
export function AccentCircle({ color, active }: AccentCircleProps) {
  return (
    <div
      className={cn(
        "w-11 h-11 rounded-full border-4 border-white cursor-pointer transition-transform hover:scale-110 shadow-lg",
        active && "ring-2 ring-primary",
      )}
      style={{ backgroundColor: color }}
    />
  );
}
