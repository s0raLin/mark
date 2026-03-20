import { cn } from "@/src/utils/cn";

interface FormatOptionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  checked?: boolean;
  onChange?: () => void;
}
export function FormatOption({
  icon,
  title,
  description,
  checked,
  onChange,
}: FormatOptionProps) {
  return (
    <label
      onClick={onChange}
      className={cn(
        "group relative flex cursor-pointer items-start gap-4 rounded-2xl border-2 p-5 transition-all",
        checked
          ? "border-primary bg-white shadow-[0_4px_0_#ffd1e3]"
          : "border-border-soft bg-white hover:border-primary/30",
      )}
    >
      <input
        type="radio"
        name="format"
        className="mt-1 h-6 w-6 text-primary focus:ring-primary border-pink-200"
        checked={checked}
        onChange={onChange}
      />
      <div className="flex grow flex-col">
        <div className="flex items-center gap-2">
          {icon}
          <p className="font-bold text-slate-800">{title}</p>
        </div>
        <p className="text-sm text-slate-500 mt-2 leading-relaxed">
          {description}
        </p>
      </div>
    </label>
  );
}
