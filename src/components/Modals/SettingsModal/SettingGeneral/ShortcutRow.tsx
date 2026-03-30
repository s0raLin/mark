interface ShortcutRowProps {
  keys: string[];
  label: string;
}
export function ShortcutRow({ keys, label }: ShortcutRowProps) {
  return (
    <div className="settings-m3-card flex items-center justify-between p-4 rounded-xl">
      <span className="text-sm font-bold text-slate-700">{label}</span>
      <div className="flex gap-1.5">
        {keys.map((key) => (
          <kbd
            key={key}
            className="settings-m3-keycap px-2.5 py-1 rounded-lg text-xs font-black text-slate-700 uppercase"
          >
            {key}
          </kbd>
        ))}
      </div>
    </div>
  );
}
