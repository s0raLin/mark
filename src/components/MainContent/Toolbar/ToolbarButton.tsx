import { useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";

interface ToolbarButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
}
export function ToolbarButton({ title, icon, onClick }: ToolbarButtonProps) {
  const buttonRef = useRef<HTMLButtonElement | null>(null);
  const [isVisible, setIsVisible] = useState(false);
  const [position, setPosition] = useState<{ top: number; left: number } | null>(null);

  useEffect(() => {
    if (!isVisible) {
      return;
    }

    const updatePosition = () => {
      const rect = buttonRef.current?.getBoundingClientRect();
      if (!rect) {
        return;
      }

      setPosition({
        left: rect.left + rect.width / 2,
        top: rect.top - 12,
      });
    };

    updatePosition();
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);

    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, [isVisible]);

  return (
    <div className="relative group">
      <button
        ref={buttonRef}
        onClick={onClick}
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        onFocus={() => setIsVisible(true)}
        onBlur={() => setIsVisible(false)}
        className="app-m3-tool-button p-2.5 text-slate-500 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/35 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent"
        aria-label={title}
      >
        {icon}
      </button>
      {isVisible && position && typeof document !== "undefined" && createPortal(
        <div
          className="pointer-events-none fixed z-[9999]"
          style={{
            left: position.left,
            top: position.top,
            transform: "translate(-50%, -100%)",
          }}
        >
          <div className="editor-toolbar-tooltip whitespace-nowrap rounded-xl px-3.5 py-2 text-xs font-semibold tracking-[0.01em]">
            {title}
            <div className="editor-toolbar-tooltip-arrow absolute top-full left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-[225deg]" />
          </div>
        </div>,
        document.body,
      )}
    </div>
  );
}
