interface ToolbarButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
}
export function ToolbarButton({ title, icon, onClick }: ToolbarButtonProps) {
  return (
    <div className="relative group">
      <button
        onClick={onClick}
        className="app-m3-tool-button p-2.5 text-slate-500 rounded-lg transition-colors"
        aria-label={title}
      >
        {icon}
      </button>
      <div className="editor-toolbar-tooltip pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 translate-y-1 whitespace-nowrap rounded-xl px-3 py-1.5 text-[11px] font-semibold opacity-0 transition-all duration-200 group-hover:translate-y-0 group-hover:opacity-100">
        {title}
        <div className="editor-toolbar-tooltip-arrow absolute bottom-full left-1/2 h-2.5 w-2.5 -translate-x-1/2 rotate-45" />
      </div>
    </div>
  );
}
