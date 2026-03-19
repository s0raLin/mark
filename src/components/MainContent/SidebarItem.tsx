import { cn } from "@/src/utils/cn";
import clsx, { ClassValue } from "clsx";
import { ChevronRight, GripVertical } from "lucide-react";
import { twMerge } from "tailwind-merge";

interface SidebarItemProps {
  icon: React.ReactNode;
  label: string;
  active?: boolean;
  hasChevron?: boolean;
  isOpen?: boolean;
  small?: boolean;
  onClick?: () => void;
}

export function SidebarItem({
  icon,
  label,
  active,
  hasChevron,
  isOpen,
  small,
  onClick,
}: SidebarItemProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group flex items-center gap-3 rounded-2xl px-3 transition-colors cursor-pointer",
        small ? "py-2 rounded-xl" : "py-2.5",
        active ? "bg-primary/10 text-slate-800" : "hover:bg-rose-50",
      )}
    >
      {icon}
      <span
        className={cn(
          "flex-1 truncate",
          small ? "text-xs font-medium text-slate-500" : "text-sm font-medium",
          active && "font-bold",
        )}
      >
        {label}
      </span>
      {hasChevron && (
        <ChevronRight
          className={cn("w-4 h-4 text-rose-200", isOpen && "rotate-90")}
        />
      )}
      {!hasChevron && !small && (
        <GripVertical className="w-4 h-4 opacity-0 group-hover:opacity-100 cursor-grab text-rose-300" />
      )}
    </div>
  );
}
