import { useState, useRef } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter";
import { oneLight } from "react-syntax-highlighter/dist/esm/styles/prism";
import { Download, CheckCircle2 } from "lucide-react";
import { cn } from "@/src/utils/cn";
import { Heading, CheckStates } from "../types";

interface PreviewPaneProps {
  previewRef: React.RefObject<HTMLDivElement>;
  markdown: string;
  headings: Heading[];
  checkStates: CheckStates;
  checkIndexRef: React.RefObject<number>;
  renderHeadingIndexRef: React.RefObject<number>;
  updateCheckState: (idx: number, checked: boolean) => void;
  previewTheme: string;
  registerHeadingRef: (id: string) => (el: HTMLElement | null) => void;
}

// Separate component to handle useState for copy button
function CodeCopyButton({ children }: { children: string }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(children);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
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
  );
}

export default function PreviewPane({
  previewRef,
  markdown,
  headings,
  checkStates,
  checkIndexRef,
  renderHeadingIndexRef,
  updateCheckState,
  previewTheme,
  registerHeadingRef,
}: PreviewPaneProps) {
  return (
    <section
      ref={previewRef}
      className={cn(
        "flex-1 overflow-y-auto relative transition-colors duration-500 preview-scroll",
        previewTheme,
      )}
    >
      <div className="p-16 max-w-none markdown-body">
        <ReactMarkdown
          remarkPlugins={[remarkGfm]}
          components={{
            h1: ({ node, children, ...props }) => {
              const heading = headings[renderHeadingIndexRef.current++];
              const id = heading?.id ?? "";
              return (
                <h1 ref={registerHeadingRef(id)} id={id} {...props}>
                  {children}
                </h1>
              );
            },
            h2: ({ node, children, ...props }) => {
              const heading = headings[renderHeadingIndexRef.current++];
              const id = heading?.id ?? "";
              return (
                <h2 ref={registerHeadingRef(id)} id={id} {...props}>
                  {children}
                </h2>
              );
            },
            h3: ({ node, children, ...props }) => {
              const heading = headings[renderHeadingIndexRef.current++];
              const id = heading?.id ?? "";
              return (
                <h3 ref={registerHeadingRef(id)} id={id} {...props}>
                  {children}
                </h3>
              );
            },
            h4: ({ node, children, ...props }) => {
              const heading = headings[renderHeadingIndexRef.current++];
              const id = heading?.id ?? "";
              return (
                <h4 ref={registerHeadingRef(id)} id={id} {...props}>
                  {children}
                </h4>
              );
            },
            h5: ({ node, children, ...props }) => {
              const heading = headings[renderHeadingIndexRef.current++];
              const id = heading?.id ?? "";
              return (
                <h5 ref={registerHeadingRef(id)} id={id} {...props}>
                  {children}
                </h5>
              );
            },
            h6: ({ node, children, ...props }) => {
              const heading = headings[renderHeadingIndexRef.current++];
              const id = heading?.id ?? "";
              return (
                <h6 ref={registerHeadingRef(id)} id={id} {...props}>
                  {children}
                </h6>
              );
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
                      updateCheckState(idx, e.target.checked);
                    }}
                  />
                );
              }
              return <input {...props} />;
            },
            code({ node, inline, className, children, ...props }: any) {
              const match = /language-(\w+)/.exec(className || "");

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

                      <CodeCopyButton>{String(children)}</CodeCopyButton>
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
  );
}
