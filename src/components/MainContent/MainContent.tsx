import {
  useState,
  useEffect,
  useRef,
  useMemo,
  useImperativeHandle,
} from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Download, CheckCircle2, Settings2 } from "lucide-react";
import CodeMirror, { ReactCodeMirrorRef } from "@uiw/react-codemirror";
import {
  markdown as markdownLang,
  markdownLanguage,
} from "@codemirror/lang-markdown";
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
import { cn } from "@/src/utils/cn";
import Toolbar from "@/src/components/MainContent/Toolbar/Toolbar";
import Outline from "./Outline/Outline";

interface MainContentProps {
  toolbarRef?: React.RefObject<ReactCodeMirrorRef>;
  markdown: string;
  setMarkdown: React.Dispatch<React.SetStateAction<string>>;
  viewMode: "split" | "editor" | "preview";
  editorTheme: string;
  setEditorTheme: React.Dispatch<React.SetStateAction<string>>;
  previewTheme: string;
  setPreviewTheme: React.Dispatch<React.SetStateAction<string>>;
  fontChoice: string;
  setFontChoice: React.Dispatch<React.SetStateAction<string>>;
}

interface Heading {
    text: string;
    level: number;
    id: string;
}

export default function MainContent({
  toolbarRef,
  markdown,
  setMarkdown,
  viewMode,
  editorTheme,
  previewTheme,
  fontChoice,
}: MainContentProps) {

  const [activeMenu, setActiveMenu] = useState<string | null>(null);
  const [activeOutlineId, setActiveOutlineId] = useState<string | null>(null);
  const previewRef = useRef<HTMLDivElement>(null);

  // heading 元素 ref 映射：key = headings 数组里的 id，value = DOM 元素
  // 在 ReactMarkdown 渲染时直接注册，彻底避免 id 不一致问题
  const headingRefsMap = useRef<Map<string, HTMLElement>>(new Map());

  // markdown 变化时清空映射，等待重新注册
  useEffect(() => {
    headingRefsMap.current.clear();
  }, [markdown]);

  // headings 数组：从 markdown 文本解析，用于 Outline 显示
  const headings: Heading[] = useMemo(() => {
    const lines = markdown.split("\n");
    const result: Heading[] = [];
    const counts: Record<string, number> = {};

    const makeId = (raw: string) => {
      // 去掉 inline markdown 符号后生成 slug
      let id = raw
        .replace(/[*_`~\[\]]/g, "")
        .toLowerCase()
        .replace(/[^\w\s-]/g, "")
        .replace(/\s+/g, "-")
        .replace(/^-+|-+$/g, "");
      if (!id) id = `heading-${raw.length}`;
      const base = id;
      if (counts[base] === undefined) {
        counts[base] = 0;
      } else {
        counts[base]++;
        id = `${base}-${counts[base]}`;
      }
      return id;
    };

    lines.forEach((line) => {
      const match = line.match(/^(#{1,6})\s+(.+)$/);
      if (match) {
        const level = match[1].length;
        const raw = match[2].trim();
        result.push({ text: raw, level, id: makeId(raw) });
      }
    });

    return result;
  }, [markdown]);

  // 注册 heading DOM 元素到 ref 映射的回调
  const registerHeadingRef = (id: string) => (el: HTMLElement | null) => {
    if (el) {
      headingRefsMap.current.set(id, el);
    }
  };

  // scroll 事件同步高亮
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || headings.length === 0) return;

    const syncActive = () => {
      const scrollTop = preview.scrollTop;
      let activeId = headings[0].id;

      for (const heading of headings) {
        const el = headingRefsMap.current.get(heading.id);
        if (!el) continue;
        // el.offsetTop 是相对于 preview 内部 padding div 的，需要加上 padding div 的 offsetTop
        // 用 el 相对于 preview 容器的实际偏移
        let offsetTop = 0;
        let node: HTMLElement | null = el;
        while (node && node !== preview) {
          offsetTop += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        if (offsetTop <= scrollTop + 100) {
          activeId = heading.id;
        }
      }
      setActiveOutlineId(activeId);
    };

    // 等 DOM 渲染完再初始化
    const raf = requestAnimationFrame(syncActive);
    preview.addEventListener("scroll", syncActive, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      preview.removeEventListener("scroll", syncActive);
    };
  }, [headings, viewMode]);

  const scrollToSection = (id: string) => {
    if (!id || !previewRef.current) return;
    setActiveOutlineId(id);

    const el = headingRefsMap.current.get(id);
    if (!el) return;

    // 计算 el 相对于 preview 容器的 offsetTop
    let offsetTop = 0;
    let node: HTMLElement | null = el;
    while (node && node !== previewRef.current) {
      offsetTop += node.offsetTop;
      node = node.offsetParent as HTMLElement | null;
    }

    previewRef.current.scrollTo({ top: offsetTop - 80, behavior: "smooth" });
  };

  // checkbox 状态持久化
  // key = "studiomark_checks_<markdown长度>" + 索引，markdown 变化时重新加载
  const CHECKS_KEY = `studiomark_checks_${markdown.length}_${markdown.slice(0, 40).replace(/\s/g, "")}`;
  const [checkStates, setCheckStates] = useState<Record<number, boolean>>(() => {
    try {
      return JSON.parse(localStorage.getItem(CHECKS_KEY) ?? "{}");
    } catch {
      return {};
    }
  });

  // markdown 变化时重新从 localStorage 加载对应的 checkbox 状态
  useEffect(() => {
    try {
      setCheckStates(JSON.parse(localStorage.getItem(CHECKS_KEY) ?? "{}"));
    } catch {
      setCheckStates({});
    }
  }, [CHECKS_KEY]);

  const checkIndexRef = useRef(0);
  checkIndexRef.current = 0; // 每次 render 重置

  const renderHeadingIndexRef = useRef(0);
  renderHeadingIndexRef.current = 0; // 每次 render 重置

  const editorRef = useRef<ReactCodeMirrorRef>(null);

  // Expose editorRef to parent toolbarRef
  useImperativeHandle(toolbarRef, () => editorRef.current!, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (activeMenu && !(e.target as HTMLElement).closest(".menu-container")) {
        setActiveMenu(null);
      }
    };
    window.addEventListener("click", handleClickOutside);
    return () => window.removeEventListener("click", handleClickOutside);
  }, [activeMenu]);

  useEffect(() => {
    localStorage.setItem("studiomark_editor_theme", editorTheme);
  }, [editorTheme]);

  useEffect(() => {
    localStorage.setItem("studiomark_preview_theme", previewTheme);
  }, [previewTheme]);

  useEffect(() => {
    localStorage.setItem("studiomark_font_choice", fontChoice);
    document.documentElement.style.setProperty(
      "--font-display",
      fontChoice === "Quicksand"
        ? '"Quicksand", sans-serif'
        : `"${fontChoice}", sans-serif`,
    );
  }, [fontChoice]);

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

  // 使用 useMemo 缓存 extensions 数组，避免每次渲染都重新创建
  const editorExtensions = useMemo(
    () => [
      scrollPastEnd(),
      markdownLang({
        base: markdownLanguage,
        codeLanguages: languages,
      }),
      markdownLinter,
      autocompletion({ override: [markdownCompletions] }),
      EditorView.lineWrapping,
      EditorView.theme({
        "&": {
          height: "100%",
          backgroundColor: "transparent !important",
        },
        ".cm-scroller": {
          overflow: "auto",
          maxHeight: "calc(100vh - 180px)",
          padding: "48px 12px 48px 12px",
        },
        ".cm-content": {
          fontFamily: "'JetBrains Mono', monospace",
        },
        ".cm-gutters": {
          backgroundColor: "transparent !important",
          border: "none !important",
        },
      }),
    ],
    [editorTheme],
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


  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Markdown shortcuts (Ctrl/Cmd + Key)
      if (e.ctrlKey || e.metaKey) {
        switch (e.key.toLowerCase()) {
          case "b":
            e.preventDefault();
            applyMarkdown("**", "**");
            break;
          case "i":
            e.preventDefault();
            applyMarkdown("*", "*");
            break;
          case "1":
            e.preventDefault();
            applyMarkdown("# ");
            break;
          case "2":
            e.preventDefault();
            applyMarkdown("## ");
            break;
          case "3":
            e.preventDefault();
            applyMarkdown("### ");
            break;
        }
      }

      // View mode shortcuts (Alt + Key)
      if (e.altKey) {
        switch (e.key) {
          case "1":
            e.preventDefault();
            // View mode is handled by parent
            break;
          case "2":
            e.preventDefault();
            break;
          case "3":
            e.preventDefault();
            break;
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);


  return (
    <div className="flex h-full w-full">
      {/* Editor Pane */}
      {(viewMode === "split" || viewMode === "editor") && (
        <section className="flex-1 border-r border-border-soft flex flex-col relative overflow-hidden">
          {/* Frosted glass layer over the global background — blur controlled by CSS var */}
          <div
            className="absolute inset-0 pointer-events-none z-0"
            style={{ backdropFilter: "blur(var(--editor-blur, 0px))", WebkitBackdropFilter: "blur(var(--editor-blur, 0px))", backgroundColor: "rgba(255,255,255,0.55)" }}
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
      )}

      {/* Preview Pane */}
      {(viewMode === "split" || viewMode === "preview") && (
        <section
          ref={previewRef}
          className={cn(
            "flex-1 overflow-y-auto relative transition-colors duration-500 preview-scroll",
            previewTheme,
          )}
        >
          {/* <div className="absolute top-6 left-8 text-[11px] font-extrabold text-secondary uppercase tracking-widest pointer-events-none bg-secondary/10 px-2 py-0.5 rounded-md z-10">
            Live Preview
          </div> */}
          <div className="p-16 max-w-none markdown-body">
            <ReactMarkdown
              remarkPlugins={[remarkGfm]}
              components={{
                h1: ({ node, children, ...props }) => {
                  const heading = headings[renderHeadingIndexRef.current++];
                  const id = heading?.id ?? "";
                  return <h1 ref={registerHeadingRef(id)} id={id} {...props}>{children}</h1>;
                },
                h2: ({ node, children, ...props }) => {
                  const heading = headings[renderHeadingIndexRef.current++];
                  const id = heading?.id ?? "";
                  return <h2 ref={registerHeadingRef(id)} id={id} {...props}>{children}</h2>;
                },
                h3: ({ node, children, ...props }) => {
                  const heading = headings[renderHeadingIndexRef.current++];
                  const id = heading?.id ?? "";
                  return <h3 ref={registerHeadingRef(id)} id={id} {...props}>{children}</h3>;
                },
                h4: ({ node, children, ...props }) => {
                  const heading = headings[renderHeadingIndexRef.current++];
                  const id = heading?.id ?? "";
                  return <h4 ref={registerHeadingRef(id)} id={id} {...props}>{children}</h4>;
                },
                h5: ({ node, children, ...props }) => {
                  const heading = headings[renderHeadingIndexRef.current++];
                  const id = heading?.id ?? "";
                  return <h5 ref={registerHeadingRef(id)} id={id} {...props}>{children}</h5>;
                },
                h6: ({ node, children, ...props }) => {
                  const heading = headings[renderHeadingIndexRef.current++];
                  const id = heading?.id ?? "";
                  return <h6 ref={registerHeadingRef(id)} id={id} {...props}>{children}</h6>;
                },
                input({ node, checked, disabled, ...props }: any) {
                  if (props.type === "checkbox") {
                    const idx = checkIndexRef.current++;
                    const isChecked = checkStates[idx] ?? checked ?? false;
                    return (
                      <input
                        {...props}
                        checked={isChecked}
                        onChange={(e) => {
                          const next = { ...checkStates, [idx]: e.target.checked };
                          setCheckStates(next);
                          localStorage.setItem(CHECKS_KEY, JSON.stringify(next));
                        }}
                      />
                    );
                  }
                  return <input {...props} />;
                },
                code({ node, inline, className, children, ...props }: any) {
                  const match = /language-(\w+)/.exec(className || "");
                  const [copied, setCopied] = useState(false);

                  const handleCopy = () => {
                    navigator.clipboard.writeText(String(children));
                    setCopied(true);
                    setTimeout(() => setCopied(false), 2000);
                  };

                  return !inline && match ? (
                    <div className="relative group my-8">
                      <div className="rounded-3xl overflow-hidden border-2 border-border-soft shadow-xl bg-slate-50">
                        <div className="flex items-center justify-between px-6 py-3 bg-slate-100 border-b border-border-soft">
                          <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-rose-300"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-amber-300"></div>
                            <div className="w-2.5 h-2.5 rounded-full bg-emerald-300"></div>
                            <span className="ml-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
                              {match[1]}
                            </span>
                          </div>

                          <button
                            onClick={handleCopy}
                            className={cn(
                              "flex items-center gap-1.5 px-3 py-1 rounded-lg transition-all border-2",
                              copied
                                ? "bg-green-50 border-green-100 text-green-600"
                                : "bg-white border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5",
                            )}
                          >
                            {copied ? (
                              <CheckCircle2 className="w-3.5 h-3.5" />
                            ) : (
                              <Download className="w-3.5 h-3.5 rotate-180" />
                            )}
                            <span className="text-[10px] font-bold uppercase tracking-wider">
                              {copied ? "Copied!" : "Copy"}
                            </span>
                          </button>
                        </div>
                        <SyntaxHighlighter
                          style={oneLight}
                          language={match[1]}
                          PreTag="div"
                          customStyle={{
                            margin: 0,
                            padding: "1rem",
                            fontSize: "0.875rem",
                            lineHeight: "1.7",
                            background: "#f8fafc",
                          }}
                          {...props}
                        >
                          {String(children).replace(/\n$/, "")}
                        </SyntaxHighlighter>
                      </div>
                    </div>
                  ) : (
                    <code
                      className={cn(
                        "bg-secondary/10 text-secondary px-2 py-0.5 rounded-lg font-mono text-sm font-bold",
                        className,
                      )}
                      {...props}
                    >
                      {children}
                    </code>
                  );
                },
              }}
            >
              {markdown}
            </ReactMarkdown>
          </div>
        </section>
      )}

      {/* Outline Sidebar */}
      <Outline
        headings={headings}
        activeOutlineId={activeOutlineId}
        scrollToSection={scrollToSection}
        markdown={markdown}
      />
    </div>
  );
}
