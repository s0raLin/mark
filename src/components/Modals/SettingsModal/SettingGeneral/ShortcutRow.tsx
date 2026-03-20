interface ShortcutRowProps {
  keys: string[];
  label: string;
}
export function ShortcutRow({ keys, label }: ShortcutRowProps) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-white border border-pink-50 shadow-sm">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="flex gap-1.5">
        {keys.map((key) => (
          <kbd
            key={key}
            className="px-2.5 py-1 rounded-lg bg-slate-100 border-b-2 border-slate-300 text-[10px] font-black text-slate-600 uppercase"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
