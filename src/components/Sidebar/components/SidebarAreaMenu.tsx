import { FilePlus, FolderPlus, Search, Settings } from "lucide-react";
import ContextMenuSurface, { ContextMenuAction } from "@/components/ContextMenuSurface";

interface SidebarAreaMenuProps {
  x: number;
  y: number;
  onClose: () => void;
  onNewFile: () => void;
  onNewFolder: () => void;
  onSearch: () => void;
  onSettings: () => void;
}

export default function SidebarAreaMenu({
  x,
  y,
  onClose,
  onNewFile,
  onNewFolder,
  onSearch,
  onSettings,
}: SidebarAreaMenuProps) {
  const actions: ContextMenuAction[] = [
    {
      id: "new-file",
      label: "New File",
      icon: <FilePlus className="w-3.5 h-3.5 text-primary" />,
      onSelect: onNewFile,
    },
    {
      id: "new-folder",
      label: "New Folder",
      icon: <FolderPlus className="w-3.5 h-3.5 text-secondary" />,
      onSelect: onNewFolder,
    },
    {
      id: "search",
      label: "Search",
      icon: <Search className="w-3.5 h-3.5 text-primary" />,
      onSelect: onSearch,
      separatorBefore: true,
    },
    {
      id: "settings",
      label: "Settings",
      icon: <Settings className="w-3.5 h-3.5 text-primary" />,
      onSelect: onSettings,
    },
  ];

  return <ContextMenuSurface x={x} y={y} actions={actions} onClose={onClose} />;
}
