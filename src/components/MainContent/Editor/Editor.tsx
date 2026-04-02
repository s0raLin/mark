import { useEffect, useRef, useState, type CSSProperties } from "react";
import { FileType2, Braces, LayoutTemplate, Lock, Music4 } from "lucide-react";
import { Crepe, CrepeFeature } from "@milkdown/crepe";
import { replaceAll } from "@milkdown/kit/utils";
import { Milkdown, MilkdownProvider, useEditor } from "@milkdown/react";
import { highlight, highlightPluginConfig } from "@milkdown/plugin-highlight";
import { createParser } from "@milkdown/plugin-highlight/sugar-high";
import CodeMirror from "@uiw/react-codemirror";
import { markdown as markdownLanguage } from "@codemirror/lang-markdown";
import { languages } from "@codemirror/language-data";
import { oneDark } from "@codemirror/theme-one-dark";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { nord } from "@uiw/codemirror-theme-nord";
import { sublime } from "@uiw/codemirror-theme-sublime";
import { uploadImage, type EditorTheme, type GetFileContentResponse } from "@/api/client";
import { useEditorConfigContext } from "@/contexts/EditorConfig/EditorThemeProvider";
import { useMarkdownSyncContext } from "@/contexts/MarkdownSyncContext";
import { cn } from "@/utils/cn";

type EditorMode = "code" | "direct";

interface MilkdownEditorProps {
  fileKey: string;
  markdown: string;
  setMarkdown: React.Dispatch<React.SetStateAction<string>>;
  activeFileContent: GetFileContentResponse | null;
  editorTheme: EditorTheme;
  darkMode: boolean;
  editorFont: string;
  editorFontSize: number;
}

function getCodeMirrorTheme(editorTheme: EditorTheme) {
  switch (editorTheme) {
    case "githubLight":
      return githubLight;
    case "githubDark":
      return githubDark;
    case "vscodeDark":
      return vscodeDark;
    case "dracula":
      return dracula;
    case "nord":
      return nord;
    case "sublime":
      return sublime;
    case "oneDark":
    default:
      return oneDark;
  }
}

function getSourceEditorTheme(editorTheme: EditorTheme, darkMode: boolean) {
  if (editorTheme === "githubLight" && darkMode) {
    return githubDark;
  }
  return getCodeMirrorTheme(editorTheme);
}

function formatFileSize(size?: number) {
  if (!size) return "0 B";

  const units = ["B", "KB", "MB", "GB"];
  let value = size;
  let unitIndex = 0;

  while (value >= 1024 && unitIndex < units.length - 1) {
    value /= 1024;
    unitIndex += 1;
  }

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function BinaryFallback({
  activeFileContent,
}: {
  activeFileContent: GetFileContentResponse | null;
}) {
  const binarySummary =
    activeFileContent && activeFileContent.kind !== "text"
      ? {
          label: (activeFileContent.id.split(".").pop() || "FILE").toUpperCase(),
          mime: activeFileContent.mimeType || "application/octet-stream",
          size: formatFileSize(activeFileContent.size),
        }
      : null;

  return (
    <section className="flex min-w-0 flex-1 items-center justify-center border-r border-border-soft bg-white/35 px-8 py-10">
      <div className="app-m3-binary-card w-full max-w-xl rounded-[28px] p-8">
        <div className="flex items-start gap-4">
          <div className="app-m3-binary-icon flex h-14 w-14 items-center justify-center rounded-2xl">
            {activeFileContent?.kind === "audio" ? (
              <Music4 className="h-6 w-6" />
            ) : (
              <FileType2 className="h-6 w-6" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-slate-800">
              <h2 className="truncate text-lg font-bold">
                {activeFileContent?.id || "Untitled"}
              </h2>
              {activeFileContent?.editable === false && (
                <span className="app-m3-chip inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-semibold">
                  <Lock className="h-3.5 w-3.5" />
                  Read only
                </span>
              )}
            </div>
            <p className="mt-2 text-sm text-slate-500">
              当前文件不是可编辑文本文件，Milkdown 编辑器会在文本文件上启用。
            </p>
          </div>
        </div>

        {binarySummary && (
          <dl className="mt-6 grid gap-3 text-sm text-slate-600 sm:grid-cols-3">
            <div className="rounded-2xl border border-border-soft bg-white/70 px-4 py-3">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Type</dt>
              <dd className="mt-1 font-semibold text-slate-700">{binarySummary.label}</dd>
            </div>
            <div className="rounded-2xl border border-border-soft bg-white/70 px-4 py-3">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">MIME</dt>
              <dd className="mt-1 break-all font-semibold text-slate-700">{binarySummary.mime}</dd>
            </div>
            <div className="rounded-2xl border border-border-soft bg-white/70 px-4 py-3">
              <dt className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Size</dt>
              <dd className="mt-1 font-semibold text-slate-700">{binarySummary.size}</dd>
            </div>
          </dl>
        )}
      </div>
    </section>
  );
}

function MilkdownEditorInner({
  markdown,
  setMarkdown,
  activeFileContent,
  editorTheme,
  darkMode,
  editorFont,
  editorFontSize,
  mode,
}: Omit<MilkdownEditorProps, "fileKey"> & { mode: EditorMode }) {
  const lastAppliedMarkdownRef = useRef(markdown);
  const crepeRef = useRef<Crepe | null>(null);

  const { get, loading } = useEditor((root) => {
    const editor = new Crepe({
      root,
      defaultValue: markdown,
      features: {
        [CrepeFeature.CodeMirror]: false,
        [CrepeFeature.Latex]: false,
        [CrepeFeature.TopBar]: true,
        [CrepeFeature.Toolbar]: true,
      },
      featureConfigs: {
        [CrepeFeature.Placeholder]: {
          text: "Write something beautiful...",
          mode: "doc",
        },
        [CrepeFeature.ImageBlock]: {
          onUpload: async (file) => {
            const uploaded = await uploadImage(file);
            return uploaded.url;
          },
        },
      },
    });

    const highlightParser = createParser();
    editor.addFeature((milkdownEditor) => {
      milkdownEditor.config((ctx) => {
        ctx.set(highlightPluginConfig.key, {
          parser: highlightParser,
        });
      }).use(highlight);
    });

    editor.on((listener) => {
      listener.markdownUpdated((_ctx, nextMarkdown) => {
        lastAppliedMarkdownRef.current = nextMarkdown;
        setMarkdown((prev) => (prev === nextMarkdown ? prev : nextMarkdown));
      });
    });

    crepeRef.current = editor;
    return editor;
  }, [setMarkdown]);

  const isEditableText = activeFileContent?.kind !== "text"
    ? false
    : activeFileContent?.editable !== false;

  useEffect(() => {
    const editor = crepeRef.current;
    if (loading || !editor) {
      return;
    }

    editor.setReadonly(!isEditableText);
  }, [isEditableText, loading]);

  useEffect(() => {
    if (loading) {
      return;
    }

    const createdEditor = get();
    if (!createdEditor || markdown === lastAppliedMarkdownRef.current) {
      return;
    }

    createdEditor.action(replaceAll(markdown, true));
    lastAppliedMarkdownRef.current = markdown;
  }, [get, loading, markdown]);

  const editorSurfaceStyle: CSSProperties = {
    ["--editor-font" as keyof CSSProperties]: `${editorFont}, "JetBrains Mono", monospace`,
    ["--editor-font-size" as keyof CSSProperties]: `${editorFontSize}px`,
  };

  return (
    <div
      className="milkdown-editor-shell flex h-full min-w-0 flex-1 overflow-hidden p-0"
      data-mode={mode}
      style={editorSurfaceStyle}
    >
      <div
        className={cn(
          "flex h-full w-full flex-col rounded-none border-0 shadow-none",
          "milkdown-surface",
          `milkdown-theme-${editorTheme}`,
          darkMode && "milkdown-surface-dark",
        )}
      >
        <div className={cn("min-h-0 flex-1 overflow-hidden", mode === "direct" && "milkdown-preview-fill")}>
          <div className="h-full min-h-0 overflow-auto">
            <div className="milkdown-root-host h-full min-h-0">
              <Milkdown />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export function MilkdownEditor({
  fileKey,
  markdown,
  setMarkdown,
  activeFileContent,
  editorTheme,
  darkMode,
  editorFont,
  editorFontSize,
}: MilkdownEditorProps) {
  const [mode, setMode] = useState<EditorMode>("direct");
  const [sourceValue, setSourceValue] = useState(markdown);
  const isBinaryLikeFile =
    activeFileContent !== null && activeFileContent.kind !== "text";
  const isEditableText = activeFileContent?.kind !== "text"
    ? false
    : activeFileContent?.editable !== false;

  const editorSurfaceStyle: CSSProperties = {
    ["--editor-font" as keyof CSSProperties]: `${editorFont}, "JetBrains Mono", monospace`,
    ["--editor-font-size" as keyof CSSProperties]: `${editorFontSize}px`,
  };

  useEffect(() => {
    setSourceValue(markdown);
  }, [fileKey, markdown]);

  if (isBinaryLikeFile) {
    return <BinaryFallback activeFileContent={activeFileContent} />;
  }

  return (
    <section className="flex min-w-0 flex-1 border-r border-border-soft bg-white/35 dark:bg-slate-800/40">
      <div className="flex h-full min-w-0 flex-1 flex-col overflow-hidden">
        <div className="flex items-center justify-between border-b border-border-soft bg-white/55 px-3 py-2 dark:bg-slate-800/60 md:px-4">
          <div className="text-[11px] font-bold uppercase tracking-[0.16em] text-slate-400 dark:text-slate-400">
            Document Workspace
          </div>

          <div className="milkdown-mode-toggle relative inline-grid grid-cols-2 rounded-full border border-border-soft bg-white/70 p-1 dark:border-slate-600/50 dark:bg-slate-700/50">
            <div
              className={cn(
                "milkdown-mode-toggle-indicator absolute top-1 bottom-1 w-[calc(50%-0.25rem)] rounded-full transition-transform duration-300",
                mode === "direct" && "translate-x-full",
              )}
            />
            <button
              type="button"
              onClick={() => setMode("code")}
              className={cn(
                "relative z-10 inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                mode === "code" ? "text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
              )}
            >
              <Braces className="h-3.5 w-3.5" />
              Markdown Source
            </button>
            <button
              type="button"
              onClick={() => setMode("direct")}
              className={cn(
                "relative z-10 inline-flex min-w-[120px] items-center justify-center gap-2 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors",
                mode === "direct" ? "text-white" : "text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200",
              )}
            >
              <LayoutTemplate className="h-3.5 w-3.5" />
              Rich Preview
            </button>
          </div>
        </div>
        {mode === "code" ? (
          <div className="milkdown-editor-shell milkdown-code-shell flex h-full min-w-0 flex-1 overflow-hidden p-0" data-mode={mode} style={editorSurfaceStyle}>
            <div className={cn("flex h-full w-full flex-col rounded-none border-0 shadow-none", "milkdown-surface", "milkdown-code-surface", `milkdown-theme-${editorTheme}`, darkMode && "milkdown-surface-dark")}>
              <div className="milkdown-code-editor min-h-0 flex-1 overflow-hidden">
                <CodeMirror
                  className="milkdown-code-mirror h-full"
                  value={sourceValue}
                  height="100%"
                  minHeight="100%"
                  theme={getSourceEditorTheme(editorTheme, darkMode)}
                  editable={isEditableText}
                  readOnly={!isEditableText}
                  extensions={[markdownLanguage({ codeLanguages: languages })]}
                  basicSetup={{
                    lineNumbers: true,
                    foldGutter: true,
                    highlightActiveLine: true,
                    highlightActiveLineGutter: true,
                  }}
                  style={{
                    fontFamily: `${editorFont}, "JetBrains Mono", monospace`,
                    fontSize: `${editorFontSize}px`,
                  }}
                  onChange={(value) => {
                    setSourceValue(value);
                    setMarkdown((prev) => (prev === value ? prev : value));
                  }}
                />
              </div>
            </div>
          </div>
        ) : (
          <MilkdownProvider key={`${fileKey}-${mode}`}>
            <MilkdownEditorInner
              markdown={markdown}
              setMarkdown={setMarkdown}
              activeFileContent={activeFileContent}
              editorTheme={editorTheme}
              darkMode={darkMode}
              editorFont={editorFont}
              editorFontSize={editorFontSize}
              mode={mode}
            />
          </MilkdownProvider>
        )}
      </div>
    </section>
  );
}

export function MilkdownEditorWrapper() {
  const editorConfig = useEditorConfigContext();
  const markdownSync = useMarkdownSyncContext();

  return (
    <MilkdownEditor
      fileKey={markdownSync.activeFileContent?.id ?? "milkdown-editor"}
      markdown={markdownSync.markdown}
      setMarkdown={markdownSync.setMarkdown}
      activeFileContent={markdownSync.activeFileContent}
      editorTheme={editorConfig.editorTheme}
      darkMode={editorConfig.darkMode}
      editorFont={editorConfig.editorFont}
      editorFontSize={editorConfig.editorFontSize}
    />
  );
}

export function Editor() {
  return <MilkdownEditorWrapper />;
}
