interface ToolbarButtonProps {
  title: string;
  icon: React.ReactNode;
  onClick?: () => void;
}
export function ToolbarButton({ title, icon, onClick }: ToolbarButtonProps) {
  return (
    <button
      onClick={onClick}
      className="p-2.5 hover:bg-primary/10 text-slate-500 hover:text-primary rounded-lg transition-colors"
      title={title}
    >
      {icon}
    </button>
  );
}
