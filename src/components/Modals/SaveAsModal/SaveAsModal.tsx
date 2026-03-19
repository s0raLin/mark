import { useState } from "react";
import { FileText, X, AlertCircle } from "lucide-react";
import { motion } from "motion/react";

interface SaveAsModalProps {
  markdown: string;
  onClose: () => void;
}
export function SaveAsModal({ markdown, onClose }: SaveAsModalProps) {
  const [fileName, setFileName] = useState("Documentation");
  const [fileType, setFileType] = useState(".md");

  const handleSave = () => {
    const fullFileName = fileName.endsWith(fileType)
      ? fileName
      : `${fileName}${fileType}`;
    const blob = new Blob([markdown], {
      type: fileType === ".md" ? "text/markdown" : "text/plain",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = fullFileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-900/20 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.9, y: 20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 20 }}
        className="bg-background-light w-full max-w-md rounded-3xl overflow-hidden shadow-2xl flex flex-col"
      >
        <header className="flex items-center justify-between border-b-4 border-border-soft px-6 py-5 bg-white">
          <div className="flex items-center gap-4">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/20 text-primary shadow-sm">
              <FileText className="w-5 h-5" />
            </div>
            <h2 className="text-lg font-bold tracking-tight text-slate-800">
              Save As...
            </h2>
          </div>
          <button
            onClick={onClose}
            className="flex h-8 w-8 items-center justify-center rounded-lg hover:bg-pink-50 transition-colors"
          >
            <X className="w-4 h-4 text-slate-400" />
          </button>
        </header>

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              File Name
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="flex-1 bg-white border-2 border-border-soft rounded-xl px-4 py-3 text-sm font-bold focus:ring-primary focus:border-primary transition-all outline-none"
                placeholder="Enter filename..."
                autoFocus
              />
              <select
                value={fileType}
                onChange={(e) => setFileType(e.target.value)}
                className="bg-slate-100 border-2 border-border-soft rounded-xl px-3 py-3 text-sm font-bold outline-none cursor-pointer"
              >
                <option value=".md">.md</option>
                <option value=".txt">.txt</option>
              </select>
            </div>
          </div>

          <div className="bg-pink-50/50 p-4 rounded-2xl border-2 border-dashed border-primary/20">
            <div className="flex items-center gap-3 text-primary">
              <AlertCircle className="w-4 h-4" />
              <p className="text-[11px] font-bold uppercase tracking-wider">
                Storage Info
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
              Saving will download a copy to your device. The cloud version will
              remain synced to your current session.
            </p>
          </div>
        </div>

        <div className="p-6 bg-white border-t-4 border-border-soft flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-3 rounded-xl font-bold text-slate-500 hover:bg-slate-50 transition-all"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="flex-1 py-3 bg-primary text-white rounded-xl font-bold shadow-lg shadow-pink-200/50 hover:brightness-105 active:scale-[0.98] transition-all"
          >
            Save File
          </button>
        </div>
      </motion.div>
    </motion.div>
  );
}
