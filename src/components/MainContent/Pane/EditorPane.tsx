import { useMemo, useRef, useState } from "react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import {
  markdown as markdownLang,
  markdownLanguage,
} from "@codemirror/lang-markdown";
import { json as jsonLang } from "@codemirror/lang-json";
import { javascript as jsLang } from "@codemirror/lang-javascript";
import { css as cssLang } from "@codemirror/lang-css";
import { languages } from "@codemirror/language-data";
import { linter, Diagnostic } from "@codemirror/lint";
import { autocompletion, CompletionContext } from "@codemirror/autocomplete";
import { oneDark } from "@codemirror/theme-one-dark";
import { githubLight, githubDark } from "@uiw/codemirror-theme-github";
import { vscodeDark } from "@uiw/codemirror-theme-vscode";
import { dracula } from "@uiw/codemirror-theme-dracula";
import { nord } from "@uiw/codemirror-theme-nord";
import { sublime } from "@uiw/codemirror-theme-sublime";
import { EditorView, scrollPastEnd } from "@codemirror/view";
import { EyeOff, FileType2, Image as ImageIcon, Info, Music4, Video } from "lucide-react";
import type { GetFileContentResponse } from "@/api/client";
import Toolbar from "@/components/MainContent/Toolbar/Toolbar";
import EditorContextMenu from "./EditorContextMenu";

interface EditorPaneProps {
  markdown: string;
  setMarkdown: React.Dispatch<React.SetStateAction<string>>;
  activeFileContent: GetFileContentResponse | null;
  editorTheme: string;
  editorFont: string;
  fileName: string;
  editorRef: React.RefObject<ReactCodeMirrorRef>;
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

const getThemeExtension = (themeName: string) => {
  switch (themeName) {
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
    default:
      return oneDark;
  }
};

// Markdown Linter for common errors
const markdownLinter = linter((view) => {
  const diagnostics: Diagnostic[] = [];
  const text = view.state.doc.toString();

  // Check for missing space after #
  const headingRegex = /^#+[^#\s\n]/gm;
  let match;
  while ((match = headingRegex.exec(text)) !== null) {
    diagnostics.push({
      from: match.index + match[0].lastIndexOf("#") + 1,
      to: match.index + match[0].length,
      severity: "warning",
      message: "Headings should have a space after the # characters",
      actions: [
        {
          name: "Add space",
          apply(view, from) {
            view.dispatch({ changes: { from, insert: " " } });
          },
        },
      ],
    });
  }

  // Check for unclosed bold/italic
  const boldRegex = /\*\*([^\*]+)$|\*([^\*]+)$|~~([^~]+)$/gm;
  while ((match = boldRegex.exec(text)) !== null) {
    const type = match[0].startsWith("**")
      ? "bold"
      : match[0].startsWith("~~")
        ? "strikethrough"
        : "italic";
    const marker = match[0].startsWith("**")
      ? "**"
      : match[0].startsWith("~~")
        ? "~~"
        : "*";
    diagnostics.push({
      from: match.index,
      to: match.index + match[0].length,
      severity: "info",
      message: `Unclosed ${type} syntax`,
      actions: [
        {
          name: `Close ${type}`,
          apply(view, to) {
            view.dispatch({ changes: { from: to, insert: marker } });
          },
        },
      ],
    });
  }

  // Check for empty links
  const linkRegex = /\[\]\([^\)]*\)/g;
  while ((match = linkRegex.exec(text)) !== null) {
    diagnostics.push({
      from: match.index,
      to: match.index + match[0].length,
      severity: "warning",
      message: "Empty link text",
    });
  }

  return diagnostics;
});

// Markdown Autocompletion
const markdownCompletions = (context: CompletionContext) => {
  const word = context.matchBefore(/#+|\[|!\[|`+/);
  if (!word) return null;
  if (word.from === word.to && !context.explicit) return null;

  return {
    from: word.from,
    options: [
      { label: "# Heading 1", type: "text", apply: "# " },
      { label: "## Heading 2", type: "text", apply: "## " },
      { label: "### Heading 3", type: "text", apply: "### " },
      { label: "[Link](url)", type: "text", apply: "[text](url)" },
      { label: "![Image](url)", type: "text", apply: "![alt](url)" },
      { label: "```Code Block", type: "text", apply: "```\n\n```" },
      { label: "- Bullet List", type: "text", apply: "- " },
      { label: "1. Numbered List", type: "text", apply: "1. " },
      { label: "- [ ] Checklist", type: "text", apply: "- [ ] " },
      { label: "> Blockquote", type: "text", apply: "> " },
      { label: "--- Horizontal Rule", type: "text", apply: "---\n" },
    ],
  };
};

// 可编辑的文本扩展名白名单（与 useMarkdownSync 保持一致）
const EDITABLE_EXTENSIONS = new Set([
  "md", "txt", "markdown", "mdown", "mkd",
  "json", "yaml", "yml", "toml", "xml",
  "js", "ts", "jsx", "tsx", "css", "html", "htm",
  "sh", "bash", "py", "go", "rs", "java", "c", "cpp", "h",
  "csv", "log", "env", "gitignore",
]);

function extractMarkdownImages(markdown: string) {
  const images: Array<{ alt: string; url: string }> = [];
  const seen = new Set<string>();
  const imagePattern = /!\[([^\]]*)\]\(([^)\s]+(?:\s+"[^"]*")?)\)/g;

  let match: RegExpExecArray | null;
  while ((match = imagePattern.exec(markdown)) !== null) {
    const alt = match[1]?.trim() || "Image";
    const rawUrl = match[2]?.trim() || "";
    const url = rawUrl.replace(/\s+".*"$/, "").replace(/^<|>$/g, "");
    if (!url || seen.has(url)) {
      continue;
    }
    seen.add(url);
    images.push({ alt, url });
  }

  return images;
}

export default function EditorPane({
  markdown,
  setMarkdown,
  activeFileContent,
  editorTheme,
  editorFont,
  fileName,
  editorRef,
}: EditorPaneProps) {
  const applyMarkdownRef = useRef<((prefix: string, suffix?: string) => void) | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // 根据文件扩展名选择语言扩展
  const ext = (fileName ?? "").includes(".") ? fileName.split(".").pop()!.toLowerCase() : "md";
  const isBinary = activeFileContent
    ? activeFileContent.editable === false || activeFileContent.kind !== "text"
    : (fileName ? !EDITABLE_EXTENSIONS.has(ext) : false);
  const fileTypeLabel = ext ? ext.toUpperCase() : "FILE";
  const fileKind = activeFileContent?.kind ?? (isBinary ? "binary" : "text");
  const mediaDataUrl = activeFileContent?.mediaDataUrl;
  const markdownImages = useMemo(
    () => ((ext === "md" || ext === "markdown") ? extractMarkdownImages(markdown) : []),
    [ext, markdown],
  );

  const editorExtensions = useMemo(
    () => {
      const langExt = (() => {
        switch (ext) {
          case "json": return jsonLang();
          case "js": case "jsx": return jsLang();
          case "ts": case "tsx": return jsLang({ typescript: true });
          case "css": return cssLang();
          case "md": case "markdown": default:
            return markdownLang({ base: markdownLanguage, codeLanguages: languages });
        }
      })();

      const base = [
        scrollPastEnd(),
        langExt,
        autocompletion({ override: ext === "md" || ext === "markdown" ? [markdownCompletions] : [] }),
        EditorView.lineWrapping,
        EditorView.theme({
          "&": { height: "100%", backgroundColor: "transparent !important" },
          ".cm-scroller": { overflow: "auto", height: "100%", paddingBottom: "120px" },
          ".cm-gutters": { backgroundColor: "transparent !important", border: "none !important" },
        }),
      ];

      // markdown linter 只对 .md 文件启用
      if (ext === "md" || ext === "markdown") base.splice(2, 0, markdownLinter);

      return base;
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [ext],
  );

  const applyMarkdown = (prefix: string, suffix: string = "") => {
    if (!editorRef.current?.view) return;
    const view = editorRef.current.view;
    const { from, to } = view.state.selection.main;

    const selectedText = view.state.doc.sliceString(from, to);
    const replacement = prefix + selectedText + suffix;

    view.dispatch({
      changes: { from, to, insert: replacement },
      selection: { anchor: from + prefix.length, head: to + prefix.length },
    });

    view.focus();
  };

  const getSelectionText = () => {
    const view = editorRef.current?.view;
    if (!view) return "";
    const { from, to } = view.state.selection.main;
    return view.state.doc.sliceString(from, to);
  };

  const replaceSelection = (text: string) => {
    const view = editorRef.current?.view;
    if (!view) return;
    const { from, to } = view.state.selection.main;
    view.dispatch({
      changes: { from, to, insert: text },
      selection: { anchor: from + text.length, head: from + text.length },
    });
    view.focus();
  };

  const handleCopy = async () => {
    const selection = getSelectionText();
    if (!selection) return;
    await navigator.clipboard.writeText(selection);
  };

  const handleCut = async () => {
    const selection = getSelectionText();
    if (!selection) return;
    await navigator.clipboard.writeText(selection);
    replaceSelection("");
  };

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (!text) return;
      replaceSelection(text);
    } catch (err) {
      console.error("Paste failed", err);
    }
  };

  const handleSelectAll = () => {
    const view = editorRef.current?.view;
    if (!view) return;
    view.dispatch({
      selection: { anchor: 0, head: view.state.doc.length },
    });
    view.focus();
  };

  // Expose applyMarkdown to parent via ref callback
  if (editorRef.current) {
    (editorRef as any).current?.view?.dispatch;
  }

  const mediaSummary = (() => {
    switch (fileKind) {
      case "image":
        return {
          icon: <ImageIcon className="h-6 w-6" />,
          badge: "Image",
          title: "这是一个可预览的图片文件",
          description: "图片会在右侧预览区直接显示，编辑区保留为文件信息视图，避免误改二进制内容。",
        };
      case "video":
        return {
          icon: <Video className="h-6 w-6" />,
          badge: "Video",
          title: "这是一个可播放的视频文件",
          description: "视频会在右侧预览区使用内嵌播放器打开，编辑区只展示文件信息和快速预览。",
        };
      case "audio":
        return {
          icon: <Music4 className="h-6 w-6" />,
          badge: "Audio",
          title: "这是一个可播放的音频文件",
          description: "音频会在右侧预览区使用播放器打开，编辑区保留为只读信息卡片。",
        };
      default:
        return {
          icon: <EyeOff className="h-6 w-6" />,
          badge: "Binary",
          title: "这个二进制文件没有可内嵌预览的实质内容",
          description: "当前类型适合作为附件保留在项目中，暂不在编辑器里显示源码或播放内容。",
        };
    }
  })();

  return (
    <section className="app-m3-editor-surface flex-1 border-r border-border-soft flex flex-col relative overflow-hidden">
      {/* Frosted glass layer over the global background — blur controlled by CSS var */}
      <div
        className="editor-glass-overlay absolute inset-0 pointer-events-none z-0"
        style={{
          backdropFilter: "blur(var(--editor-blur, 0px))",
          WebkitBackdropFilter: "blur(var(--editor-blur, 0px))",
          backgroundColor: "rgba(255,255,255,0.55)",
        }}
      />
      {/* Toolbar */}
      <div className="app-m3-toolbar editor-toolbar h-15 border-b border-border-soft flex items-center justify-center px-5 shrink-0 relative z-10">
        <Toolbar editorRef={editorRef} />
      </div>
      {!isBinary && markdownImages.length > 0 && (
        <div className="relative z-10 border-b border-border-soft px-4 py-3">
          <div className="flex gap-3 overflow-x-auto pb-1">
            {markdownImages.map((image) => (
              <div
                key={image.url}
                className="min-w-[180px] max-w-[180px] overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm"
              >
                <img
                  src={image.url}
                  alt={image.alt}
                  className="h-24 w-full object-cover"
                />
                <div className="px-3 py-2">
                  <p className="truncate text-xs font-medium text-slate-600">{image.alt}</p>
                  <p className="truncate text-[11px] text-slate-400">{image.url}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      <div
        className="flex-1 min-h-0 overflow-hidden relative z-10"
        onContextMenu={(e) => {
          if (isBinary) return;
          e.preventDefault();
          setContextMenu({ x: e.clientX, y: e.clientY });
        }}
      >
        {isBinary ? (
          <div className="h-full flex items-center justify-center p-8 md:p-12">
            <div className="app-m3-binary-card w-full max-w-xl rounded-[28px] backdrop-blur-xl">
              <div className="flex items-start gap-4 p-6 md:p-7">
                <div className="app-m3-binary-icon flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl">
                  {mediaSummary.icon}
                </div>
                <div className="app-m3-binary-content min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="app-m3-binary-badge inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                      <FileType2 className="h-3.5 w-3.5" />
                      {fileTypeLabel}
                    </span>
                    <span className="app-m3-binary-muted-badge inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium">
                      {mediaSummary.badge}
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="app-m3-binary-title text-lg font-semibold tracking-tight">
                      {mediaSummary.title}
                    </p>
                    <p className="app-m3-binary-description text-sm leading-6">
                      {mediaSummary.description}
                    </p>
                  </div>
                  {fileKind === "image" && mediaDataUrl && (
                    <div className="overflow-hidden rounded-2xl border border-white/50 bg-white/55">
                      <img src={mediaDataUrl} alt={fileName} className="max-h-64 w-full object-contain bg-white/50" />
                    </div>
                  )}
                  {fileKind === "video" && mediaDataUrl && (
                    <div className="overflow-hidden rounded-2xl border border-white/50 bg-black/65 p-3">
                      <video src={mediaDataUrl} controls className="max-h-64 w-full rounded-xl" />
                    </div>
                  )}
                  {fileKind === "audio" && mediaDataUrl && (
                    <div className="rounded-2xl border border-white/50 bg-white/55 p-4">
                      <audio src={mediaDataUrl} controls className="w-full" />
                    </div>
                  )}
                  <div className="app-m3-binary-file rounded-2xl px-4 py-3">
                    <p className="app-m3-binary-file-name truncate text-sm font-medium">{fileName}</p>
                    <p className="app-m3-binary-file-description mt-1 text-xs">
                      {activeFileContent?.mimeType || "application/octet-stream"} · {formatFileSize(activeFileContent?.size)}
                    </p>
                  </div>
                  <div className="app-m3-binary-note flex items-start gap-2 rounded-2xl px-4 py-3 text-sm">
                    <Info className="app-m3-binary-note-icon mt-0.5 h-4 w-4 shrink-0" />
                    <p>{fileKind === "binary" ? "如果你后续想支持更多可预览文件类型，我们可以继续补充识别和内嵌查看器。" : "媒体文件本身不会进入源码编辑模式，避免编辑器把二进制内容当文本处理。"} </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <CodeMirror
          ref={editorRef}
          value={markdown}
          height="100%"
          className="h-full font-mono"
          theme={getThemeExtension(editorTheme)}
          extensions={editorExtensions}
          onChange={(value) => setMarkdown(value)}
          basicSetup={{
            lineNumbers: true,
            highlightActiveLineGutter: true,
            highlightSpecialChars: true,
            history: true,
            drawSelection: true,
            dropCursor: true,
            allowMultipleSelections: true,
            indentOnInput: true,
            syntaxHighlighting: true,
            bracketMatching: true,
            closeBrackets: true,
            autocompletion: true,
            rectangularSelection: true,
            crosshairCursor: true,
            highlightActiveLine: true,
            highlightSelectionMatches: true,
            closeBracketsKeymap: true,
            defaultKeymap: true,
            searchKeymap: true,
            historyKeymap: true,
            foldKeymap: true,
            completionKeymap: true,
            lintKeymap: true,
          }}
        />
        )}
      </div>
      {contextMenu && (
        <EditorContextMenu
          x={contextMenu.x}
          y={contextMenu.y}
          onClose={() => setContextMenu(null)}
          hasSelection={Boolean(getSelectionText())}
          onCut={handleCut}
          onCopy={handleCopy}
          onPaste={handlePaste}
          onSelectAll={handleSelectAll}
          onBold={() => applyMarkdown("**", "**")}
          onItalic={() => applyMarkdown("*", "*")}
          onInlineCode={() => applyMarkdown("`", "`")}
        />
      )}
    </section>
  );
}
