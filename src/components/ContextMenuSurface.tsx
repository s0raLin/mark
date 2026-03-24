import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { cn } from "@/utils/cn";

export interface ContextMenuAction {
  id: string;
  label: string;
  icon?: React.ReactNode;
  onSelect: () => void;
  danger?: boolean;
  disabled?: boolean;
  separatorBefore?: boolean;
}

interface ContextMenuSurfaceProps {
  x: number;
  y: number;
  actions: ContextMenuAction[];
  onClose: () => void;
  minWidthClassName?: string;
}

export default function ContextMenuSurface({
  x,
  y,
  actions,
  onClose,
  minWidthClassName = "min-w-[168px]",
}: ContextMenuSurfaceProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [pos, setPos] = useState<{ top: number; left: number } | null>(null);

  useLayoutEffect(() => {
    if (!ref.current) return;
    const rect = ref.current.getBoundingClientRect();
    setPos({
      top: y + rect.height > window.innerHeight
        ? Math.max(8, window.innerHeight - rect.height - 8)
        : y,
      left: x + rect.width > window.innerWidth
        ? Math.max(8, window.innerWidth - rect.width - 8)
        : x,
    });
  }, [x, y, actions.length]);

  useEffect(() => {
    const onPointerDown = (e: MouseEvent) => {
      if (!ref.current?.contains(e.target as Node)) onClose();
    };
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("mousedown", onPointerDown);
    window.addEventListener("keydown", onEscape);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      window.removeEventListener("keydown", onEscape);
    };
  }, [onClose]);

  const displayPos = pos ?? { top: y, left: x };

  return (
    <div
      ref={ref}
      style={{ top: displayPos.top, left: displayPos.left }}
      className={cn(
        "app-m3-context-menu fixed z-[120] rounded-2xl py-1.5 text-sm",
        minWidthClassName,
      )}
    >
      {actions.map((action) => (
        <div key={action.id}>
          {action.separatorBefore && <div className="app-m3-context-separator my-1" />}
          <button
            onClick={() => {
              if (action.disabled) return;
              action.onSelect();
              onClose();
            }}
            disabled={action.disabled}
            className={cn(
              "app-m3-context-item w-full flex items-center gap-2.5 px-3 py-2 text-left",
              action.danger ? "text-red-400" : "text-slate-600",
              action.disabled && "opacity-50 cursor-not-allowed",
            )}
          >
            <span className="shrink-0">{action.icon}</span>
            <span className="truncate">{action.label}</span>
          </button>
        </div>
      ))}
    </div>
  );
}
