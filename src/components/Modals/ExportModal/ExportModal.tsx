import { useState } from "react";
import showdown from "showdown";
import {
  Code,
  Image as ImageIcon,
  FileText,
  Folder,
  Download,
  Share2,
  X,
  PlusCircle,
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { FormatOption } from "./FormatOption";

interface ExportModalProps {
  markdown: string;
  onClose: () => void;
}
export function ExportModal({ markdown, onClose }: ExportModalProps) {
  const [selectedFormat, setSelectedFormat] = useState<
    "pdf" | "html" | "png" | "zip"
  >("pdf");

  const handleExport = () => {
    if (selectedFormat === "html") {
      const converter = new showdown.Converter({
        tables: true,
        tasklists: true,
        strikethrough: true,
        ghCodeBlocks: true,
      });
      const htmlContent = converter.makeHtml(markdown);

      const fullHtml = `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <meta http-equiv="Content-Security-Policy" content="default-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.googleapis.com https://fonts.gstatic.com; img-src 'self' data: https:;">
    <meta http-equiv="X-Frame-Options" content="SAMEORIGIN">
    <title>StudioMark Export</title>
    <link rel="preconnect" href="https://fonts.googleapis.com">
    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
    <link href="https://fonts.googleapis.com/css2?family=Quicksand:wght@300;400;500;600;700&display=swap" rel="stylesheet">
    <style>
        * { box-sizing: border-box; }
        body {
            font-family: 'Quicksand', sans-serif;
            line-height: 1.6;
            color: #334155;
            max-width: 800px;
            margin: 40px auto;
            padding: 0 20px;
            background-color: #fdfdfd;
        }
        h1 { color: #1e293b; border-bottom: 2px solid #ff8fab; padding-bottom: 10px; }
        h2 { color: #1e293b; margin-top: 30px; }
        h3 { color: #1e293b; margin-top: 24px; }
        code { background-color: #f1f5f9; padding: 2px 4px; border-radius: 4px; font-family: monospace; }
        pre { background-color: #f1f5f9; padding: 15px; border-radius: 8px; overflow-x: auto; }
        pre code { background: none; padding: 0; }
        blockquote { border-left: 4px solid #ff8fab; padding-left: 15px; color: #64748b; font-style: italic; margin: 16px 0; }
        img { max-width: 100%; border-radius: 8px; }
        table { border-collapse: collapse; width: 100%; margin: 20px 0; }
        th, td { border: 1px solid #e2e8f0; padding: 12px; text-align: left; }
        th { background-color: #f8fafc; }
        ul, ol { padding-left: 24px; }
        li { margin: 8px 0; }
        a { color: #ff8fab; text-decoration: none; }
        a:hover { text-decoration: underline; }
        hr { border: none; border-top: 2px solid #f1f5f9; margin: 24px 0; }
    </style>
</head>
<body>
    ${htmlContent}
</body>
</html>`;

      const blob = new Blob([fullHtml], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "studiomark-export.html";
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } else {
      alert(
        `Exporting to ${selectedFormat.toUpperCase()} is coming soon! Try HTML for now.`,
      );
    }
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
        className="bg-white/70 backdrop-blur-xl w-full max-w-5xl rounded-3xl overflow-hidden shadow-2xl border border-white/50 flex flex-col max-h-[90vh]"
      >
        <header className="flex items-center justify-between border-b border-dashed border-pink-100 px-6 py-5 shrink-0">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-primary/20 text-primary shadow-sm">
              <Share2 className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-xl font-bold leading-tight tracking-tight text-slate-800">
                Export & Share
              </h2>
              <p className="text-sm font-medium text-pink-400">
                Project: Documentation.md
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex items-center justify-center rounded-full h-9 w-9 bg-white/60 hover:bg-primary/20 hover:text-primary text-slate-400 transition-all"
          >
            <X className="w-4 h-4" />
          </button>
        </header>

        <div className="flex flex-1 overflow-hidden">
          <div className="flex-1 overflow-y-auto p-10 space-y-10">
            <section>
              <h3 className="text-2xl font-bold mb-2 text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-primary"></span>
                Choose Format
              </h3>
              <p className="text-slate-500 mb-8 font-medium">
                Select how you'd like to package your document.
              </p>
              <div className="grid gap-5">
                <FormatOption
                  icon={<FileText className="w-6 h-6 text-primary" />}
                  title="PDF Document"
                  description="High-quality document for printing or formal sharing. Includes table of contents and internal links."
                  checked={selectedFormat === "pdf"}
                  onChange={() => setSelectedFormat("pdf")}
                />
                <FormatOption
                  icon={<Code className="w-6 h-6 text-secondary" />}
                  title="HTML Document"
                  description="Standalone web page with embedded styles. Perfect for documentation or self-hosting."
                  checked={selectedFormat === "html"}
                  onChange={() => setSelectedFormat("html")}
                />
                <FormatOption
                  icon={<ImageIcon className="w-6 h-6 text-accent" />}
                  title="Long Image (PNG)"
                  description="Single vertical image perfect for social media, messaging apps, or quick previews."
                  checked={selectedFormat === "png"}
                  onChange={() => setSelectedFormat("png")}
                />
                <FormatOption
                  icon={<Folder className="w-6 h-6 text-slate-400" />}
                  title="Folder Compression (ZIP)"
                  description="Bundle Markdown file with all associated local images and assets in a single archive."
                  checked={selectedFormat === "zip"}
                  onChange={() => setSelectedFormat("zip")}
                />
              </div>
            </section>

            <section className="space-y-6">
              <h3 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
                <span className="w-2 h-2 rounded-full bg-accent"></span>
                Custom Export Styles
              </h3>
              <div className="bg-white border-2 border-border-soft p-6 rounded-2xl space-y-6 shadow-[0_4px_0_#f1f3f5]">
                <div>
                  <label className="text-sm font-bold mb-4 block text-slate-600">
                    Preset Themes
                  </label>
                  <div className="flex flex-wrap gap-3">
                    <button className="px-5 py-2.5 rounded-xl bg-primary text-white text-sm font-bold shadow-sm shadow-pink-200">
                      Modern Slate
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-pink-50 text-slate-600 text-sm font-bold hover:bg-pink-100 transition-colors">
                      Classic Ivory
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-pink-50 text-slate-600 text-sm font-bold hover:bg-pink-100 transition-colors">
                      Terminal Dark
                    </button>
                    <button className="px-5 py-2.5 rounded-xl bg-pink-50 text-slate-600 text-sm font-bold hover:bg-pink-100 transition-colors">
                      Academic
                    </button>
                  </div>
                </div>
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-bold text-slate-600">
                      Custom CSS
                    </label>
                    <span className="text-xs text-primary font-bold cursor-pointer hover:underline">
                      View Documentation
                    </span>
                  </div>
                  <textarea
                    className="w-full h-36 rounded-xl border-2 border-pink-50 bg-pink-50/30 text-xs font-mono p-4 focus:ring-primary focus:border-primary transition-all"
                    placeholder="/* Add your custom CSS here */"
                    defaultValue={`body {\n  font-family: 'Quicksand', sans-serif;\n  line-height: 1.8;\n}`}
                  />
                </div>
              </div>
            </section>
          </div>

          <aside className="w-[400px] bg-pink-50/60 border-l border-dashed border-pink-200 flex flex-col">
            <div className="p-8 flex-1 flex flex-col overflow-hidden">
              <h4 className="text-xs font-black uppercase tracking-[0.2em] text-pink-400 mb-6">
                Export Preview
              </h4>
              <div className="flex-1 bg-white rounded-3xl border-4 border-border-soft shadow-2xl shadow-pink-100/20 overflow-hidden flex flex-col">
                <div className="bg-pink-50 p-4 flex items-center justify-between border-b-2 border-pink-100">
                  <div className="flex gap-2">
                    <div className="w-3 h-3 rounded-full bg-primary"></div>
                    <div className="w-3 h-3 rounded-full bg-secondary"></div>
                    <div className="w-3 h-3 rounded-full bg-accent"></div>
                  </div>
                  <span className="text-[10px] font-black text-pink-300 uppercase tracking-widest">
                    {selectedFormat === "pdf" && "Adobe PDF"}
                    {selectedFormat === "html" && "Web Browser"}
                    {selectedFormat === "png" && "Image Viewer"}
                    {selectedFormat === "zip" && "Archive Utility"}
                  </span>
                </div>

                <div className="flex-1 overflow-y-auto p-8">
                  <AnimatePresence mode="wait">
                    {selectedFormat === "pdf" && (
                      <motion.div
                        key="pdf-preview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-6"
                      >
                        <div className="h-8 w-1/2 bg-slate-100 rounded-lg mb-8"></div>
                        {[...Array(6)].map((_, i) => (
                          <div key={i} className="space-y-2">
                            <div
                              className={`h-3 bg-slate-50 rounded-md ${i % 2 === 0 ? "w-full" : "w-5/6"}`}
                            ></div>
                          </div>
                        ))}
                        <div className="pt-8 flex justify-center">
                          <div className="h-4 w-8 bg-slate-100 rounded-full"></div>
                        </div>
                      </motion.div>
                    )}

                    {selectedFormat === "html" && (
                      <motion.div
                        key="html-preview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="space-y-4"
                      >
                        <div className="h-6 w-full bg-slate-50 rounded-full border border-slate-100 flex items-center px-3 mb-6">
                          <div className="h-2 w-24 bg-slate-200 rounded-full"></div>
                        </div>
                        <div className="h-10 w-3/4 bg-primary/5 rounded-xl border border-primary/10"></div>
                        <div className="space-y-2">
                          <div className="h-3 w-full bg-slate-50 rounded-md"></div>
                          <div className="h-3 w-full bg-slate-50 rounded-md"></div>
                          <div className="h-3 w-2/3 bg-slate-50 rounded-md"></div>
                        </div>
                        <div className="h-32 w-full bg-slate-50 rounded-2xl border-2 border-slate-100 flex items-center justify-center">
                          <Code className="w-8 h-8 text-slate-200" />
                        </div>
                      </motion.div>
                    )}

                    {selectedFormat === "png" && (
                      <motion.div
                        key="png-preview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="flex flex-col items-center"
                      >
                        <div className="w-full border-2 border-slate-100 rounded-xl p-4 space-y-4 shadow-sm">
                          <div className="h-4 w-1/2 bg-slate-100 rounded-md"></div>
                          <div className="h-24 w-full bg-accent/5 rounded-lg flex items-center justify-center">
                            <ImageIcon className="w-8 h-8 text-accent/20" />
                          </div>
                          <div className="space-y-2">
                            <div className="h-2 w-full bg-slate-50 rounded-md"></div>
                            <div className="h-2 w-full bg-slate-50 rounded-md"></div>
                            <div className="h-2 w-3/4 bg-slate-50 rounded-md"></div>
                          </div>
                        </div>
                        <div className="h-12 w-[2px] bg-slate-100 my-2"></div>
                        <div className="w-full border-2 border-slate-100 rounded-xl p-4 space-y-4 opacity-50">
                          <div className="h-4 w-1/3 bg-slate-100 rounded-md"></div>
                          <div className="h-2 w-full bg-slate-50 rounded-md"></div>
                        </div>
                      </motion.div>
                    )}

                    {selectedFormat === "zip" && (
                      <motion.div
                        key="zip-preview"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="grid grid-cols-2 gap-4"
                      >
                        <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center p-4 gap-2">
                          <FileText className="w-8 h-8 text-primary/40" />
                          <span className="text-[10px] font-bold text-slate-400">
                            index.md
                          </span>
                        </div>
                        <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center p-4 gap-2">
                          <Folder className="w-8 h-8 text-secondary/40" />
                          <span className="text-[10px] font-bold text-slate-400">
                            assets/
                          </span>
                        </div>
                        <div className="aspect-square bg-slate-50 rounded-2xl border-2 border-slate-100 flex flex-col items-center justify-center p-4 gap-2">
                          <Code className="w-8 h-8 text-accent/40" />
                          <span className="text-[10px] font-bold text-slate-400">
                            styles.css
                          </span>
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
            <div className="p-8 bg-white border-t border-dashed border-pink-100 space-y-4">
              <button
                onClick={handleExport}
                className="w-full flex items-center justify-center gap-2 bg-primary text-white py-4 rounded-2xl font-bold shadow-lg shadow-pink-200/50 hover:brightness-105 active:scale-[0.98] transition-all"
              >
                <Download className="w-5 h-5" />
                Export {selectedFormat.toUpperCase()}
              </button>
              <button className="w-full flex items-center justify-center gap-2 bg-secondary/20 text-slate-700 py-4 rounded-2xl font-bold hover:bg-secondary/30 active:scale-[0.98] transition-all">
                <Share2 className="w-5 h-5" />
                Share Link
              </button>
              <p className="text-center text-[12px] text-pink-300 mt-3 font-semibold uppercase tracking-wider">
                All formatting is preserved ✨
              </p>
            </div>
          </aside>
        </div>
      </motion.div>
    </motion.div>
  );
}
