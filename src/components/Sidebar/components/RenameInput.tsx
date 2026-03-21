import { useState, useRef, useEffect } from "react";

interface RenameInputProps {
  initial: string;
  onConfirm: (v: string) => void;
  onCancel: () => void;
}

export default function RenameInput({
  initial,
  onConfirm,
  onCancel,
}: RenameInputProps) {
  const [val, setVal] = useState(initial.replace(/\.md$/, ""));
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.select();
  }, []);

  return (
    <input
      ref={ref}
      value={val}
      onChange={(e) => setVal(e.target.value)}
      onKeyDown={(e) => {
        if (e.key === "Enter") onConfirm(val);
        if (e.key === "Escape") onCancel();
      }}
      onBlur={() => onConfirm(val)}
      onClick={(e) => e.stopPropagation()}
      className="flex-1 text-sm bg-white border border-primary/30 rounded-lg px-2 py-0.5 outline-none focus:ring-2 focus:ring-primary/20 min-w-0"
    />
  );
}
