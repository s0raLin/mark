import { useState } from "react";
import showdown from "showdown";
import {
  Code, Image as ImageIcon, FileText, Folder, Download, Share2, PlusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { useTranslation } from "react-i18next";
import { FormatOption } from "./FormatOption";
import { ModalHeader } from "../ModalHeader";
import { ModalShell } from "../ModalShell";
import { errorBus } from "@/contexts/errorBus";
import { hasTauriRuntime, saveDesktopTextFile } from "@/api/client";

interface ExportModalProps {
  markdown: string;
  onClose: () => void;
}

export function ExportModal({ markdown, onClose }: ExportModalProps) {
  const { t } = useTranslation();
  const [selectedFormat, setSelectedFormat] = useState<"pdf" | "html" | "png" | "zip">("pdf");
  const [selectedPreset, setSelectedPreset] = useState<"modern" | "ivory" | "terminal" | "academic">("modern");
  const [customCss, setCustomCss] = useState(`body {\n  font-family: 'Quicksand', sans-serif;\n  line-height: 1.8;\n}`);

  const presetCssMap = {
    modern: `
      body { font-family: 'Quicksand', sans-serif; background: #f8fafc; color: #334155; }
      h1 { color: #0f172a; border-bottom: 2px solid #ff8fab; }
      h2, h3 { color: #1e293b; }
      a { color: #ff8fab; }
    `,
    ivory: `
      body { font-family: Georgia, 'Times New Roman', serif; background: #fffdf7; color: #4b3621; }
      h1, h2, h3 { color: #3d2f1e; }
      blockquote { border-left-color: #c08457; color: #7c5c3b; background: #fff7e6; }
      code, pre { background: #f5efe2; color: #5b4330; }
      a { color: #b45309; }
    `,
    terminal: `
      body { font-family: 'JetBrains Mono', monospace; background: #0f172a; color: #d1fae5; }
      h1, h2, h3 { color: #86efac; border-bottom-color: #14532d; }
      code, pre { background: #111827; color: #a7f3d0; }
      blockquote { border-left-color: #22c55e; color: #bbf7d0; background: rgba(34,197,94,0.08); }
      th { background: #111827; }
      th, td { border-color: #1f2937; }
      a { color: #5eead4; }
    `,
    academic: `
      body { font-family: 'Playfair Display', Georgia, serif; background: #ffffff; color: #1f2937; max-width: 900px; }
      h1, h2, h3 { color: #111827; letter-spacing: 0.01em; }
      p, li { font-size: 1.02rem; }
      blockquote { border-left-color: #6366f1; color: #4b5563; background: #f8fafc; }
      a { color: #4338ca; }
    `,
  } as const;

  const handleExport = async () => {
    if (selectedFormat === "html") {
      const converter = new showdown.Converter({
        tables: true, tasklists: true, strikethrough: true, ghCodeBlocks: true,
      });
      const htmlContent = converter.makeHtml(markdown);
      const presetCss = presetCssMap[selectedPreset];
      const fullHtml = `<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>NoteMark Export</title>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body { font-family: 'Quicksand', sans-serif; line-height: 1.6; color: #334155; max-width: 800px; margin: 40px auto; padding: 0 20px; background-color: #fdfdfd; }
        h1 { color: #1e293b; border-bottom: 2px solid #ff8fab; padding-bottom: 10px; }
        h2, h3 { color: #1e293b; margin-top: 30px; }
        code { background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
        pre { background-color: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 4px solid #ff8fab; padding-left: 15px; color: #64748b; font-style: italic; margin: 16px 0; }
        img { max-width: 100%; border-radius: 8px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background-color: #f8fafc; }
        a { color: #ff8fab; text-decoration: none; }
        a:hover { text-decoration: underline; }
        ${presetCss}
        ${customCss}
    </style>
</head>
<body>${htmlContent}</body>
</html>`;
      if (hasTauriRuntime()) {
        const saved = await saveDesktopTextFile(
          "notemark-export.html",
          fullHtml,
          [{ name: "HTML", extensions: ["html"] }],
        );

        if (!saved) {
          errorBus.warning("已取消导出", {
            message: "你还没有选择保存位置。",
            dedupeKey: "export-cancelled",
            durationMs: 2200,
          });
        }
        return;
      }

      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "notemark-export.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      errorBus.info("该导出格式还在完善中", {
        message: `目前已完整支持带自定义样式的 HTML 导出，${selectedFormat.toUpperCase()} 会继续补上。`,
        dedupeKey: `export-format-pending:${selectedFormat}`,
        durationMs: 3200,
      });
    }
  };

  const previewLabel: Record<string, string> = {
    pdf: "Adobe PDF",
    html: "Web Browser",
    png: "Image Viewer",
    zip: "Archive Utility",
  };

  return (
    <ModalShell onClose={onClose} className="w-full max-w-5xl rounded-3xl max-h-[90vh]">
        <ModalHeader
          icon={<Share2 className="w-5 h-5" />}
          title={t("exportModal.title")}
          subtitle="Project: Documentation.md"
          onClose={onClose}
        />

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-10 space-y-10">
            <section>
              <h3 className="text-2xl font-bold mb-2 text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary" />
                {t("exportModal.chooseFormat")}
              </h3>
              <p className="text-slate-500 mb-8 font-medium">{t("exportModal.chooseFormatDesc")}</p>
              <div className="grid gap-5">
                <FormatOption
                  icon={<FileText className="w-6 h-6 text-primary" />}
                  title={t("exportModal.formatPdf")}
                  description={t("exportModal.formatPdfDesc")}
                  checked={selectedFormat === "pdf"}
                  onChange={() => setSelectedFormat("pdf")}
                />
                <FormatOption
                  icon={<Code className="w-6 h-6 text-secondary" />}
                  title={t("exportModal.formatHtml")}
                  description={t("exportModal.formatHtmlDesc")}
                  checked={selectedFormat === "html"}
                  onChange={() => setSelectedFormat("html")}
                />
                <FormatOption
                  icon={<ImageIcon className="w-6 h-6 text-accent" />}
                  title={t("exportModal.formatPng")}
                  description={t("exportModal.formatPngDesc")}
                  checked={selectedFormat === "png"}
                  onChange={() => setSelectedFormat("png")}
                />
                <FormatOption
                  icon={<Folder className="w-6 h-6 text-slate-400" />}
                  title={t("exportModal.formatZip")}
                  description={t("exportModal.formatZipDesc")}
                  checked={selectedFormat === "zip"}
                  onChange={() => setSelectedFormat("zip")}
                />
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent" />
                {t("exportModal.customStyles")}
              </h3>
              <div className="bg-white border-2 border-border-soft p-6 rounded-2xl space-y-6 shadow-[0_4px_0_#f1f3f5]">
                <div>
                  <label className="text-sm font-bold mb-4 block text-slate-600">
                    {t("exportModal.presetThemes")}
                  </label>
                  <div className="flex flex-wrap gap-3">
                    {[
                      ["modern", "Modern Slate"],
                      ["ivory", "Classic Ivory"],
                      ["terminal", "Terminal Dark"],
                      ["academic", "Academic"],
                    ].map(([id, label]) => (
                      <button
                        key={id}
                        type="button"
                        onClick={() => setSelectedPreset(id as keyof typeof presetCssMap)}
                        className={
                          selectedPreset === id
                            ? "px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-sm shadow-primary/20"
                            : "px-5 py-2.5 rounded-xl bg-primary/10 text-slate-600 text-sm font-bold hover:bg-primary/20 transition-colors"
                        }
                      >
                        {label}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-600">{t("exportModal.customCss")}</label>
                    <span className="text-xs text-primary font-bold cursor-pointer hover:underline">
                      {t("exportModal.viewDocs")}
                    </span>
                  </div>
                  <textarea
                    className="w-full h-36 rounded-xl border-2 border-primary/10 bg-primary/5 text-xs font-mono p-4 focus:ring-primary focus:border-primary transition-all"
                    placeholder="/* Add your custom CSS here */"
                    value={customCss}
                    onChange={(event) => setCustomCss(event.target.value)}
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="w-[400px] bg-primary/5 border-l border-primary/20 flex flex-col">
            <div className="p-8 flex-1 flex flex-col overflow-hidden">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-primary/60 mb-6">
                {t("exportModal.exportPreview")}
              </h4>
              <div className="flex-1 bg-white rounded-3xl border-4 border-border-soft shadow-2xl shadow-primary/10 overflow-hidden flex flex-col">
                <div className="bg-primary/5 p-4 flex items-center justify-between border-b-2 border-primary/10">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary" />
                    <div className="w-3 h-3 rounded-full bg-secondary" />
                    <div className="w-3 h-3 rounded-full bg-accent" />
                  </div>
                  <span className="text-[10px] font-black text-primary/40 uppercase tracking-widest">
                    {previewLabel[selectedFormat]}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  <AnimatePresence mode="wait">
                    {selectedFormat === "pdf" && (
                      <motion.div key="pdf" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-6">
                        <div className="h-8 w-1/2 bg-slate-100 rounded-lg mb-8" />
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <div className={`h-3 bg-slate-50 rounded-md ${i % 2 === 0 ? "w-full" : "w-5/6"}`} />
                          </div>
                        ))}
                        <div className="pt-8 flex justify-center">
                          <div className="h-4 w-8 bg-slate-100 rounded-full" />
                        </div>
                      </motion.div>
                    )}
                    {selectedFormat === "html" && (
                      <motion.div key="html" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="space-y-4">
                        <div className="h-6 w-full bg-slate-50 rounded-full border border-slate-100 flex items-center px-3 mb-6">
                          <div className="h-2 w-24 bg-slate-200 rounded-full" />
                        </div>
                        <div className="h-10 w-3/4 bg-primary/5 rounded-xl border border-primary/10" />
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-slate-50 rounded-md" />
                          <div className="h-3 w-full bg-slate-50 rounded-md" />
                          <div className="h-3 w-2/3 bg-slate-50 rounded-md" />
                        </div>
                        <div className="h-32 w-full bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center">
                          <Code className="w-8 h-8 text-slate-200" />
                        </div>
                      </motion.div>
                    )}
                    {selectedFormat === "png" && (
                      <motion.div key="png" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="flex flex-col items-center">
                        <div className="w-full border-2 border-slate-100 rounded-xl p-4 space-y-4 shadow-sm">
                          <div className="h-4 w-1/2 bg-slate-100 rounded-md" />
                          <div className="h-24 w-full bg-accent/5 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-accent/20" />
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-50 rounded-md" />
                            <div className="h-2 w-full bg-slate-50 rounded-md" />
                            <div className="h-2 w-3/4 bg-slate-50 rounded-md" />
                          </div>
                        </div>
                        <div className="h-12 w-[2px] bg-slate-100 my-2" />
                        <div className="w-full border-2 border-slate-100 rounded-xl p-4 space-y-4 opacity-50">
                          <div className="h-4 w-1/3 bg-slate-100 rounded-md" />
                          <div className="h-2 w-full bg-slate-50 rounded-md" />
                        </div>
                      </motion.div>
                    )}
                    {selectedFormat === "zip" && (
                      <motion.div key="zip" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} className="grid grid-cols-2 gap-4">
                        <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center p-4 gap-2">
                          <FileText className="w-8 h-8 text-primary/40" />
                          <span className="text-[10px] font-bold text-slate-400">index.md</span>
                        </div>
                        <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center p-4 gap-2">
                          <Folder className="w-8 h-8 text-secondary/40" />
                          <span className="text-[10px] font-bold text-slate-400">assets/</span>
                        </div>
                        <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center p-4 gap-2">
                          <Code className="w-8 h-8 text-accent/40" />
                          <span className="text-[10px] font-bold text-slate-400">styles.css</span>
                        </div>
                        <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center p-4 gap-2 opacity-40">
                          <PlusCircle className="w-6 h-6 text-slate-300" />
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="modal-m3-footer p-8 space-y-4">
              <button
                onClick={handleExport}
                className="modal-m3-filled-button w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5" />
                {t("exportModal.exportBtn")} {selectedFormat.toUpperCase()}
              </button>
              <button className="modal-m3-outlined-button w-full flex items-center justify-center gap-2 py-4 rounded-2xl font-bold active:scale-[0.98] transition-all">
                <Share2 className="w-5 h-5" />
                {t("exportModal.shareLink")}
              </button>
              <p className="text-center text-[12px] text-primary/40 mt-3 font-semibold uppercase tracking-wider">
                {t("exportModal.preserved")}
              </p>
            </div>
          </aside>
        </div>
    </ModalShell>
  );
}
