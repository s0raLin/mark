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
import { EyeOff, FileType2, Info } from "lucide-react";
import Toolbar from "@/components/MainContent/Toolbar/Toolbar";
import EditorContextMenu from "./EditorContextMenu";

interface EditorPaneProps {
  markdown: string;
  setMarkdown: React.Dispatch<React.SetStateAction<string>>;
  editorTheme: string;
  editorFont: string;
  fileName: string;
  editorRef: React.RefObject<ReactCodeMirrorRef>;
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

export default function EditorPane({
  markdown,
  setMarkdown,
  editorTheme,
  editorFont,
  fileName,
  editorRef,
}: EditorPaneProps) {
  const applyMarkdownRef = useRef<((prefix: string, suffix?: string) => void) | null>(null);
  const [contextMenu, setContextMenu] = useState<{ x: number; y: number } | null>(null);

  // 根据文件扩展名选择语言扩展
  const ext = (fileName ?? "").includes(".") ? fileName.split(".").pop()!.toLowerCase() : "md";
  const isBinary = fileName ? !EDITABLE_EXTENSIONS.has(ext) : false;
  const fileTypeLabel = ext ? ext.toUpperCase() : "FILE";

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
      <div className="app-m3-toolbar editor-toolbar h-14 border-b border-border-soft flex items-center justify-center px-4 gap-1 shrink-0 relative z-10">
        <Toolbar editorRef={editorRef} />
      </div>
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
                  <EyeOff className="h-6 w-6" />
                </div>
                <div className="app-m3-binary-content min-w-0 flex-1 space-y-3">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="app-m3-binary-badge inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                      <FileType2 className="h-3.5 w-3.5" />
                      {fileTypeLabel}
                    </span>
                    <span className="app-m3-binary-muted-badge inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium">
                      Binary / Unsupported
                    </span>
                  </div>
                  <div className="space-y-1">
                    <p className="app-m3-binary-title text-lg font-semibold tracking-tight">
                      这个文件类型暂不支持编辑器预览
                    </p>
                    <p className="app-m3-binary-description text-sm leading-6">
                      当前文件更适合用外部应用打开，或者作为附件保存在项目中。
                    </p>
                  </div>
                  <div className="app-m3-binary-file rounded-2xl px-4 py-3">
                    <p className="app-m3-binary-file-name truncate text-sm font-medium">{fileName}</p>
                    <p className="app-m3-binary-file-description mt-1 text-xs">
                      已检测到不可编辑或非文本内容，因此不会在这里渲染源码或预览结果。
                    </p>
                  </div>
                  <div className="app-m3-binary-note flex items-start gap-2 rounded-2xl px-4 py-3 text-sm">
                    <Info className="app-m3-binary-note-icon mt-0.5 h-4 w-4 shrink-0" />
                    <p>如果你后续希望支持更多纯文本格式，我们也可以继续扩展可编辑文件白名单。</p>
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
          className="h-full text-sm font-mono"
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
