import { X } from "lucide-react";

interface ModalHeaderProps {
  icon: React.ReactNode;
  title: string;
  subtitle: string;
  onClose: () => void;
}

export function ModalHeader({ icon, title, subtitle, onClose }: ModalHeaderProps) {
  return (
    <header className="modal-m3-header flex items-center justify-between px-8 py-5 shrink-0">
      <div className="flex items-center gap-4">
        <div className="modal-m3-header-icon flex items-center justify-center w-11 h-11 rounded-2xl text-primary shrink-0">
          {icon}
        </div>
        <div>
          <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-800">{title}</h2>
          <p className="text-xs text-primary/80 font-bold uppercase tracking-[0.16em]">{subtitle}</p>
        </div>
      </div>
      <button
        onClick={onClose}
        className="modal-m3-icon-button flex items-center justify-center rounded-full h-9 w-9 text-slate-400 transition-all shrink-0"
      >
        <X className="w-4 h-4" />
      </button>
    </header>
  );
}
