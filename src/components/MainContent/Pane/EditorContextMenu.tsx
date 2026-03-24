import {
  Clipboard,
  Copy,
  Scissors,
  WholeWord,
  Bold,
  Italic,
  Code2,
} from "lucide-react";
import ContextMenuSurface, { ContextMenuAction } from "@/components/ContextMenuSurface";

interface EditorContextMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  hasSelection: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onSelectAll: () => void;
  onBold: () => void;
  onItalic: () => void;
  onInlineCode: () => void;
}

export default function EditorContextMenu({
  x,
  y,
  onClose,
  hasSelection,
  onCut,
  onCopy,
  onPaste,
  onSelectAll,
  onBold,
  onItalic,
  onInlineCode,
}: EditorContextMenuProps) {
  const actions: ContextMenuAction[] = [
    {
      id: "cut",
      label: "Cut",
      icon: <Scissors className="w-3.5 h-3.5 text-primary" />,
      onSelect: onCut,
      disabled: !hasSelection,
    },
    {
      id: "copy",
      label: "Copy",
      icon: <Copy className="w-3.5 h-3.5 text-primary" />,
      onSelect: onCopy,
      disabled: !hasSelection,
    },
    {
      id: "paste",
      label: "Paste",
      icon: <Clipboard className="w-3.5 h-3.5 text-primary" />,
      onSelect: onPaste,
    },
    {
      id: "select-all",
      label: "Select All",
      icon: <WholeWord className="w-3.5 h-3.5 text-primary" />,
      onSelect: onSelectAll,
      separatorBefore: true,
    },
    {
      id: "bold",
      label: "Bold",
      icon: <Bold className="w-3.5 h-3.5 text-primary" />,
      onSelect: onBold,
      separatorBefore: true,
    },
    {
      id: "italic",
      label: "Italic",
      icon: <Italic className="w-3.5 h-3.5 text-primary" />,
      onSelect: onItalic,
    },
    {
      id: "inline-code",
      label: "Inline Code",
      icon: <Code2 className="w-3.5 h-3.5 text-primary" />,
      onSelect: onInlineCode,
    },
  ];

  return <ContextMenuSurface x={x} y={y} actions={actions} onClose={onClose} minWidthClassName="min-w-[176px]" />;
}
