/**
 * CodeBlock — 静态注册常用语言的语法高亮（兼容 Electron 打包）
 */
import { useState, memo } from "react";
import { Download, CheckCircle2 } from "lucide-react";
import { cn } from "@/utils/cn";
import SyntaxHighlighter from "react-syntax-highlighter/dist/esm/prism-light";
import oneLight from "react-syntax-highlighter/dist/esm/styles/prism/one-light";

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

        <SyntaxHighlighter
          style={{
            ...oneLight,
            'pre[class*="language-"]': {
              ...oneLight['pre[class*="language-"]'],
              background: "#f8fafc",
            },
            'code[class*="language-"]': {
              ...oneLight['code[class*="language-"]'],
              background: "none",
              textShadow: "none",
            },
          }}
          language={language}
          PreTag="div"
          customStyle={{
            margin: 0,
            padding: "1rem",
            fontSize: "0.875rem",
            lineHeight: "1.7",
            background: "#f8fafc",
            textIndent: 0,
          }}
          codeTagProps={{ style: { display: "block", background: "none" } }}
        >
          {code}
        </SyntaxHighlighter>
      </div>
    </div>
  );
});
