import { Layout, Terminal } from "lucide-react";
import React from "react";
import { ShortcutRow } from "./ShortcutRow";

export default function SettingGeneral() {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Layout className="w-5 h-5 text-primary" />
          Workspace Settings
        </h2>
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Workspace Name</p>
              <p className="text-xs text-slate-400">
                How your workspace appears in the sidebar
              </p>
            </div>
            <input
              type="text"
              defaultValue="NoteBuddy"
              className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:ring-primary focus:border-primary"
            />
          </div>
          <div className="p-6 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Auto-Save</p>
              <p className="text-xs text-slate-400">
                Automatically save your sparkles to local storage
              </p>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>
      </section>

      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Terminal className="w-5 h-5 text-primary" />
          Keyboard Shortcuts
        </h2>
        <div className="grid grid-cols-1 gap-3">
          <ShortcutRow keys={["Ctrl", "K"]} label="Global Search" />
          <ShortcutRow keys={["Ctrl", "B"]} label="Bold Text" />
          <ShortcutRow keys={["Ctrl", "I"]} label="Italic Text" />
          <ShortcutRow keys={["Alt", "1"]} label="Split View" />
          <ShortcutRow keys={["Alt", "2"]} label="Editor Only" />
          <ShortcutRow keys={["Alt", "3"]} label="Preview Only" />
        </div>
      </section>
    </div>
  );
}
