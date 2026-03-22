import { useMemo, useRef } from "react";
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
import Toolbar from "@/components/MainContent/Toolbar/Toolbar";

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

export default function EditorPane({
  markdown,
  setMarkdown,
  editorTheme,
  editorFont,
  fileName,
  editorRef,
}: EditorPaneProps) {
  const applyMarkdownRef = useRef<((prefix: string, suffix?: string) => void) | null>(null);

  // 根据文件扩展名选择语言扩展
  const ext = (fileName ?? "").includes(".") ? fileName.split(".").pop()!.toLowerCase() : "md";

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
          ".cm-scroller": {
            overflow: "auto",
            maxHeight: "calc(100vh - 180px)",
            padding: "48px 12px 48px 12px",
          },
          ".cm-content": { fontFamily: "var(--editor-font, 'JetBrains Mono', monospace)", fontSize: "var(--editor-font-size, 14px)" },
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

  // Expose applyMarkdown to parent via ref callback
  if (editorRef.current) {
    (editorRef as any).current?.view?.dispatch;
  }

  return (
    <section className="flex-1 border-r border-border-soft flex flex-col relative overflow-hidden">
      {/* Frosted glass layer over the global background — blur controlled by CSS var */}
      <div
        className="absolute inset-0 pointer-events-none z-0"
        style={{
          backdropFilter: "blur(var(--editor-blur, 0px))",
          WebkitBackdropFilter: "blur(var(--editor-blur, 0px))",
          backgroundColor: "rgba(255,255,255,0.55)",
        }}
      />
      {/* Toolbar */}
      <div className="h-14 border-b border-border-soft bg-white/40 backdrop-blur-sm flex items-center justify-center px-4 gap-1 shrink-0 relative z-10">
        <Toolbar editorRef={editorRef} />
      </div>
      <div className="flex-1 overflow-hidden flex flex-col relative z-10">
        <CodeMirror
          ref={editorRef}
          value={markdown}
          height="100%"
          className="flex-1 text-sm font-mono"
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
      </div>
    </section>
  );
}
