/**
 * CodeBlock — 静态注册常用语言的语法高亮（兼容 Electron 打包）
 */
import { useMemo, useState, memo, type CSSProperties } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
import oneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light";
import oneDark from "react-syntax-highlighter/dist/esm/styles/prism/one-dark";

// 静态注册常用语言，避免 Electron 打包后动态 import 失败
import javascript from "react-syntax-highlighter/dist/esm/languages/prism/javascript";
import typescript from "react-syntax-highlighter/dist/esm/languages/prism/typescript";
import jsx from "react-syntax-highlighter/dist/esm/languages/prism/jsx";
import tsx from "react-syntax-highlighter/dist/esm/languages/prism/tsx";
import python from "react-syntax-highlighter/dist/esm/languages/prism/python";
import go from "react-syntax-highlighter/dist/esm/languages/prism/go";
import rust from "react-syntax-highlighter/dist/esm/languages/prism/rust";
import java from "react-syntax-highlighter/dist/esm/languages/prism/java";
import c from "react-syntax-highlighter/dist/esm/languages/prism/c";
import cpp from "react-syntax-highlighter/dist/esm/languages/prism/cpp";
import csharp from "react-syntax-highlighter/dist/esm/languages/prism/csharp";
import css from "react-syntax-highlighter/dist/esm/languages/prism/css";
import bash from "react-syntax-highlighter/dist/esm/languages/prism/bash";
import json from "react-syntax-highlighter/dist/esm/languages/prism/json";
import yaml from "react-syntax-highlighter/dist/esm/languages/prism/yaml";
import sql from "react-syntax-highlighter/dist/esm/languages/prism/sql";
import php from "react-syntax-highlighter/dist/esm/languages/prism/php";
import ruby from "react-syntax-highlighter/dist/esm/languages/prism/ruby";
import swift from "react-syntax-highlighter/dist/esm/languages/prism/swift";
import kotlin from "react-syntax-highlighter/dist/esm/languages/prism/kotlin";
import scala from "react-syntax-highlighter/dist/esm/languages/prism/scala";
import xml from "react-syntax-highlighter/dist/esm/languages/prism/xml-doc";
import markdown from "react-syntax-highlighter/dist/esm/languages/prism/markdown";
import toml from "react-syntax-highlighter/dist/esm/languages/prism/toml";
import docker from "react-syntax-highlighter/dist/esm/languages/prism/docker";
import nginx from "react-syntax-highlighter/dist/esm/languages/prism/nginx";

SyntaxHighlighter.registerLanguage("javascript", javascript);
SyntaxHighlighter.registerLanguage("js", javascript);
SyntaxHighlighter.registerLanguage("typescript", typescript);
SyntaxHighlighter.registerLanguage("ts", typescript);
SyntaxHighlighter.registerLanguage("jsx", jsx);
SyntaxHighlighter.registerLanguage("tsx", tsx);
SyntaxHighlighter.registerLanguage("python", python);
SyntaxHighlighter.registerLanguage("py", python);
SyntaxHighlighter.registerLanguage("go", go);
SyntaxHighlighter.registerLanguage("rust", rust);
SyntaxHighlighter.registerLanguage("rs", rust);
SyntaxHighlighter.registerLanguage("java", java);
SyntaxHighlighter.registerLanguage("c", c);
SyntaxHighlighter.registerLanguage("cpp", cpp);
SyntaxHighlighter.registerLanguage("csharp", csharp);
SyntaxHighlighter.registerLanguage("cs", csharp);
SyntaxHighlighter.registerLanguage("css", css);
SyntaxHighlighter.registerLanguage("bash", bash);
SyntaxHighlighter.registerLanguage("sh", bash);
SyntaxHighlighter.registerLanguage("shell", bash);
SyntaxHighlighter.registerLanguage("json", json);
SyntaxHighlighter.registerLanguage("yaml", yaml);
SyntaxHighlighter.registerLanguage("yml", yaml);
SyntaxHighlighter.registerLanguage("sql", sql);
SyntaxHighlighter.registerLanguage("php", php);
SyntaxHighlighter.registerLanguage("ruby", ruby);
SyntaxHighlighter.registerLanguage("rb", ruby);
SyntaxHighlighter.registerLanguage("swift", swift);
SyntaxHighlighter.registerLanguage("kotlin", kotlin);
SyntaxHighlighter.registerLanguage("kt", kotlin);
SyntaxHighlighter.registerLanguage("scala", scala);
SyntaxHighlighter.registerLanguage("xml", xml);
SyntaxHighlighter.registerLanguage("html", xml);
SyntaxHighlighter.registerLanguage("markdown", markdown);
SyntaxHighlighter.registerLanguage("md", markdown);
SyntaxHighlighter.registerLanguage("toml", toml);
SyntaxHighlighter.registerLanguage("docker", docker);
SyntaxHighlighter.registerLanguage("dockerfile", docker);
SyntaxHighlighter.registerLanguage("nginx", nginx);

interface ThemePalette {
  dark: boolean;
  frame: string;
  header: string;
  label: string;
  button: string;
  buttonCopied: string;
  blockBackground: string;
  blockBorder?: string;
  frameStyle?: CSSProperties;
  headerStyle?: CSSProperties;
  labelStyle?: CSSProperties;
  buttonStyle?: CSSProperties;
  buttonCopiedStyle?: CSSProperties;
}

function CopyButton({ code, palette }: { code: string; palette: ThemePalette }) {
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
        copied ? palette.buttonCopied : palette.button,
      )}
      style={copied ? palette.buttonCopiedStyle : palette.buttonStyle}
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
  previewTheme: string;
}

export const CodeBlock = memo(function CodeBlock({ language, code, previewTheme }: CodeBlockProps) {
  const palette = useMemo<ThemePalette>(() => {
    switch (previewTheme) {
      case "theme-heart-classic":
        return {
          dark: false,
          frame: "border-rose-100 bg-rose-50/90",
          header: "bg-rose-100/90 border-rose-100",
          label: "text-rose-400",
          button: "bg-white border-rose-100 text-rose-300 hover:text-rose-500 hover:border-rose-200 hover:bg-rose-50",
          buttonCopied: "bg-emerald-50 border-emerald-100 text-emerald-600",
          blockBackground: "#ffebee",
        };
      case "theme-heart-golden":
        return {
          dark: false,
          frame: "border-amber-100 bg-amber-50/90",
          header: "bg-amber-100/80 border-amber-100",
          label: "text-amber-700",
          button: "bg-white border-amber-100 text-amber-500 hover:text-amber-700 hover:border-amber-200 hover:bg-amber-50",
          buttonCopied: "bg-emerald-50 border-emerald-100 text-emerald-600",
          blockBackground: "#fffaf0",
        };
      case "theme-heart-organic":
        return {
          dark: false,
          frame: "border-emerald-100 bg-emerald-50/90",
          header: "bg-emerald-100/75 border-emerald-100",
          label: "text-emerald-700",
          button: "bg-white border-emerald-100 text-emerald-500 hover:text-emerald-700 hover:border-emerald-200 hover:bg-emerald-50",
          buttonCopied: "bg-emerald-50 border-emerald-100 text-emerald-700",
          blockBackground: "#f6fdf9",
        };
      case "theme-heart-midnight":
        return {
          dark: true,
          frame: "border-2 shadow-xl",
          header: "border-b",
          label: "",
          button: "",
          buttonCopied: "",
          blockBackground: "#111318",
          frameStyle: {
            borderColor: "color-mix(in srgb, var(--md-primary-tone-80) 16%, rgba(255,255,255,0.08))",
            background: "linear-gradient(180deg, rgba(17,19,24,0.98), rgba(23,23,28,0.98))",
          },
          headerStyle: {
            background: "color-mix(in srgb, var(--md-primary-tone-80) 8%, rgba(29,31,37,0.98))",
            borderColor: "color-mix(in srgb, var(--md-primary-tone-80) 14%, rgba(255,255,255,0.08))",
          },
          labelStyle: {
            color: "var(--md-primary-tone-90)",
          },
          buttonStyle: {
            background: "rgba(29,31,37,0.96)",
            borderColor: "color-mix(in srgb, var(--md-primary-tone-80) 12%, rgba(255,255,255,0.08))",
            color: "#f4eff4",
          },
          buttonCopiedStyle: {
            background: "rgba(16, 185, 129, 0.14)",
            borderColor: "rgba(52, 211, 153, 0.24)",
            color: "#a7f3d0",
          },
        };
      default:
        return {
          dark: false,
          frame: "border-border-soft bg-slate-50",
          header: "bg-slate-100 border-border-soft",
          label: "text-slate-500",
          button: "bg-white border-slate-100 text-slate-400 hover:text-primary hover:border-primary/20 hover:bg-primary/5",
          buttonCopied: "bg-green-50 border-green-100 text-green-600",
          blockBackground: "#f1f5f9",
          blockBorder: "1px solid rgba(148, 163, 184, 0.16)",
        };
    }
  }, [previewTheme]);

  const syntaxTheme = useMemo(() => {
    const baseTheme = palette.dark ? oneDark : oneLight;
    return {
      ...baseTheme,
      'pre[class*="language-"]': {
        ...baseTheme['pre[class*="language-"]'],
        background: palette.blockBackground,
      },
      'code[class*="language-"]': {
        ...baseTheme['code[class*="language-"]'],
        background: "none",
        textShadow: "none",
      },
    };
  }, [palette]);

  return (
    <div className="relative group my-8">
      <div className={cn("rounded-3xl overflow-hidden", palette.frame)} style={palette.frameStyle}>
        <div
          className={cn("flex items-center justify-between px-6 py-3", palette.header)}
          style={palette.headerStyle}
        >
          <div className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-rose-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-amber-300" />
            <div className="w-2.5 h-2.5 rounded-full bg-emerald-300" />
            <span
              className={cn("ml-3 text-[10px] font-black uppercase tracking-[0.2em]", palette.label)}
              style={palette.labelStyle}
            >
              {language}
            </span>
          </div>
          <CopyButton code={code} palette={palette} />
        </div>

        <SyntaxHighlighter
          style={syntaxTheme}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "0.875rem",
            lineHeight: "1.7",
            background: palette.blockBackground,
            borderTop: palette.blockBorder ?? "none",
            textIndent: 0,
          }}
          codeTagProps={{
            style: {
              display: "block",
              background: "none",
              backgroundColor: "transparent",
            },
          }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});
