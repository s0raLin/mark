import { useState } from "react";
import { FileText, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { ModalHeader } from "../ModalHeader";
import { ModalShell } from "../ModalShell";

interface SaveAsModalProps {
  markdown: string;
  onClose: () => void;
}

export function SaveAsModal({ markdown, onClose }: SaveAsModalProps) {
  const { t } = useTranslation();
  const [fileName, setFileName] = useState("Documentation");
  const [fileType, setFileType] = useState(".md");

  const handleSave = () => {
    const fullFileName = fileName.endsWith(fileType) ? fileName : `${fileName}${fileType}`;
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
    <ModalShell onClose={onClose} className="w-full max-w-md rounded-3xl">
        <ModalHeader
          icon={<FileText className="w-5 h-5" />}
          title={t("saveAs.title")}
          subtitle={t("saveAs.fileName")}
          onClose={onClose}
        />

        <div className="p-8 space-y-6">
          <div className="space-y-2">
            <label className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">
              {t("saveAs.fileName")}
            </label>
            <div className="flex gap-2">
              <input
                type="text"
                value={fileName}
                onChange={(e) => setFileName(e.target.value)}
                className="flex-1 bg-white border-2 border-border-soft rounded-xl px-4 py-3 text-sm font-bold focus:ring-primary focus:border-primary transition-all outline-none"
                placeholder={t("saveAs.fileNamePlaceholder")}
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

          <div className="modal-m3-card p-4 rounded-2xl border-2">
            <div className="flex items-center gap-3 text-primary">
              <AlertCircle className="w-4 h-4" />
              <p className="text-[11px] font-bold uppercase tracking-wider">
                {t("saveAs.storageInfo")}
              </p>
            </div>
            <p className="text-xs text-slate-500 mt-2 font-medium leading-relaxed">
              {t("saveAs.storageDesc")}
            </p>
          </div>
        </div>

        <div className="modal-m3-footer p-6 flex gap-3">
          <button
            onClick={onClose}
            className="modal-m3-outlined-button flex-1 py-3 rounded-xl font-bold text-slate-500 transition-all"
          >
            {t("saveAs.cancel")}
          </button>
          <button
            onClick={handleSave}
            className="modal-m3-filled-button flex-1 py-3 rounded-xl font-bold active:scale-[0.98] transition-all"
          >
            {t("saveAs.save")}
          </button>
        </div>
    </ModalShell>
  );
}
