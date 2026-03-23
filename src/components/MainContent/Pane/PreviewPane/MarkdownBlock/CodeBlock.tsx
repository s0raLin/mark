/**
 * CodeBlock — 按需加载语言的语法高亮
 * 只在该语言第一次出现时动态 import，避免打包全量 prism 语言包
 */
import { useState, useEffect, memo } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";

// 已加载的语言缓存（模块级，跨组件共享）
const loadedLanguages = new Map<string, any>();

async function loadLanguage(lang: string): Promise<any> {
  if (loadedLanguages.has(lang)) return loadedLanguages.get(lang);

  try {
    // 动态按需加载 prism 语言
    const mod = await import(
      /* @vite-ignore */
      `react-syntax-highlighter/dist/esm/languages/prism/${lang}`
    );
    loadedLanguages.set(lang, mod.default ?? mod);
    return loadedLanguages.get(lang);
  } catch {
    // 语言不存在时降级为纯文本
    loadedLanguages.set(lang, null);
    return null;
  }
}

function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <button
      onClick={() => {
        navigator.clipboard.writeText(code);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      }}
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
  );
}

interface CodeBlockProps {
  language: string;
  code: string;
}

export const CodeBlock = memo(function CodeBlock({ language, code }: CodeBlockProps) {
  const [SyntaxHighlighter, setSyntaxHighlighter] = useState<any>(null);
  const [style, setStyle] = useState<any>(null);
  const [, setLangDef] = useState<any>(undefined);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      // 并行加载 highlighter core + 语言定义
      const [{ PrismLight }, { oneLight }, langModule] = await Promise.all([
        import("react-syntax-highlighter/dist/esm/prism-light"),
        import("react-syntax-highlighter/dist/esm/styles/prism/one-light"),
        loadLanguage(language),
      ]);

      if (cancelled) return;

      if (langModule) {
        PrismLight.registerLanguage(language, langModule);
      }

      setSyntaxHighlighter(() => PrismLight);
      setStyle(oneLight);
      setLangDef(langModule);
    }

    load();
    return () => { cancelled = true; };
  }, [language]);

  return (
    <div className="relative group my-8">
      <div className="rounded-3xl overflow-hidden border-2 border-border-soft shadow-xl bg-slate-50">
        <div className="flex items-center justify-between px-6 py-3 bg-slate-100 border-b border-border-soft">
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
            <span className="ml-3 text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">
              {language}
            </span>
          </div>
          <CopyButton code={code} />
        </div>

        {SyntaxHighlighter && style ? (
          <SyntaxHighlighter
            style={style}
            language={language}
            PreTag="div"
            customStyle={{
              margin: 0,
              padding: "1rem",
              fontSize: "0.875rem",
              lineHeight: "1.7",
              background: "#f8fafc",
            }}
          >
            {code}
          </SyntaxHighlighter>
        ) : (
          // 加载中：纯文本占位，避免 layout shift
          <pre
            style={{
              margin: 0,
              padding: "1rem",
              fontSize: "0.875rem",
              lineHeight: "1.7",
              background: "#f8fafc",
              overflowX: "auto",
            }}
          >
            <code>{code}</code>
          </pre>
        )}
      </div>
    </div>
  );
});
