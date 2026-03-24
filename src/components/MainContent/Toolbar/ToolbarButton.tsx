interface ToolbarButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
}
export function ToolbarButton({ title, icon, onClick }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className="app-m3-tool-button p-2.5 text-slate-500 rounded-lg transition-colors"
      title={title}
    >
      {icon}
    </button>
  );
}
