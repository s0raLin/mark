import { useState, useRef, useEffect } from "react";

interface NewItemDialogProps {
  type: "file" | "folder";
  onConfirm: (name: string) => void;
  onCancel: () => void;
}

export default function NewItemDialog({
  type,
  onConfirm,
  onCancel,
}: NewItemDialogProps) {
  const [val, setVal] = useState("");
  const ref = useRef<HTMLInputElement>(null);

  useEffect(() => {
    ref.current?.focus();
  }, []);

  return (
    <div className="px-3 py-2">
      <input
        ref={ref}
        value={val}
        placeholder={type === "file" ? "filename.md" : "folder name"}
        onChange={(e) => setVal(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" && val.trim()) onConfirm(val.trim());
          if (e.key === "Escape") onCancel();
        }}
        onBlur={() => {
          if (val.trim()) onConfirm(val.trim());
          else onCancel();
        }}
        className="w-full text-sm bg-white border border-primary/30 rounded-lg px-2 py-1.5 outline-none focus:ring-2 focus:ring-primary/20"
      />
    </div>
  );
}
