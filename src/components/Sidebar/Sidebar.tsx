import React, { useState, useEffect } from "react";
import { SidebarItem } from "./SidebarItem";
import {
  FileText,
  Folder,
  FolderOpen,
  ImageIcon,
  Pin,
  PlusCircle,
  Search,
  Settings,
  History,
} from "lucide-react";

interface SidebarProps {
  setIsSettingsModalOpen: React.Dispatch<React.SetStateAction<string>>;
  setIsSearchModalOpen: React.Dispatch<React.SetStateAction<string>>;
}

export default function Sidebar({
  setIsSettingsModalOpen,
  setIsSearchModalOpen,
}: SidebarProps) {
  return (
    <div>
      <div className="flex-1 overflow-y-auto px-3 py-6 space-y-6">
        <section>
          <div className="px-3 mb-2 flex items-center justify-between">
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-300">
              Pinned
            </h2>
          </div>
          <div className="space-y-1">
            <SidebarItem
              icon={<Pin className="w-4 h-4 text-primary" />}
              label="Project_Specs.md"
              active
            />
            <SidebarItem
              icon={<Pin className="w-4 h-4 text-rose-200" />}
              label="Release_Notes.md"
            />
          </div>
        </section>

        <section>
          <div className="px-3 mb-2 flex items-center justify-between">
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-300">
              Explorer
            </h2>
            <PlusCircle className="w-4 h-4 text-rose-300 cursor-pointer hover:text-primary transition-colors" />
          </div>
          <div className="space-y-1">
            <SidebarItem
              icon={<Folder className="w-5 h-5 text-secondary" />}
              label="Documentation"
              hasChevron
            />
            <div className="flex flex-col">
              <SidebarItem
                icon={<FolderOpen className="w-5 h-5 text-accent" />}
                label="Assets"
                isOpen
              />
              <div className="ml-6 border-l-2 border-rose-100 pl-3 mt-1 space-y-1">
                <SidebarItem
                  icon={<ImageIcon className="w-4 h-4 text-green-300" />}
                  label="hero-bg.png"
                  small
                />
                <SidebarItem
                  icon={<ImageIcon className="w-4 h-4 text-purple-300" />}
                  label="logo-dark.svg"
                  small
                />
              </div>
            </div>
            <SidebarItem
              icon={<FileText className="w-5 h-5 text-primary/70" />}
              label="Getting_Started.md"
            />
            <SidebarItem
              icon={<FileText className="w-5 h-5 text-primary/70" />}
              label="API_Reference.md"
            />
          </div>
        </section>

        <section>
          <div className="px-3 mb-2">
            <h2 className="text-[11px] font-extrabold uppercase tracking-[0.15em] text-rose-300">
              Recent
            </h2>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-3 rounded-2xl px-3 py-2.5 hover:bg-rose-50 transition-colors cursor-pointer">
              <History className="w-5 h-5 text-rose-200" />
              <div className="flex flex-col flex-1 truncate">
                <span className="truncate text-sm font-medium">
                  Changelog.md
                </span>
                <span className="text-[10px] text-rose-300 font-bold uppercase">
                  2 hours ago
                </span>
              </div>
            </div>
          </div>
        </section>
      </div>

      <div className="p-4 border-t border-rose-100 space-y-1">
        <SidebarItem
          icon={<Search className="w-5 h-5 text-slate-400" />}
          label="Search"
          onClick={() => setIsSearchModalOpen(true)}
        />
        <SidebarItem
          icon={<Settings className="w-5 h-5 text-slate-400" />}
          label="Settings"
          onClick={() => setIsSettingsModalOpen(true)}
        />
      </div>
    </div>
  );
}
