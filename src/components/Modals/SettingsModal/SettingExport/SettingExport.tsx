import { Download } from "lucide-react";
import React from "react";

export default function SettingExport() {
  return (
    <div className="space-y-12">
      <section>
        <h2 className="text-lg font-bold mb-6 flex items-center gap-2 text-slate-800">
          <Download className="w-5 h-5 text-primary" />
          Export Preferences
        </h2>
        <div className="space-y-4">
          <div className="p-6 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Default Format</p>
              <p className="text-xs text-slate-400">
                Preferred format when opening export modal
              </p>
            </div>
            <select className="bg-slate-50 border-2 border-slate-100 rounded-xl px-4 py-2 text-sm font-bold focus:ring-primary focus:border-primary appearance-none">
              <option>PDF</option>
              <option>HTML</option>
              <option>Markdown</option>
              <option>PNG</option>
            </select>
          </div>
          <div className="p-6 rounded-2xl bg-white border border-pink-100 shadow-sm flex items-center justify-between">
            <div>
              <p className="font-bold text-slate-800">Include Metadata</p>
              <p className="text-xs text-slate-400">
                Add creation date and word count to exports
              </p>
            </div>
            <div className="w-12 h-6 bg-primary rounded-full relative p-1 cursor-pointer">
              <div className="absolute right-1 top-1 w-4 h-4 bg-white rounded-full shadow-sm"></div>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
