/**
 * PreviewPane — 性能优化版
 * - markdown 解析在 Web Worker 中完成，主线程不阻塞
 * - 按段落/块渲染，每块独立 memo，减少不必要重渲染
 * - 语法高亮按需加载（见 CodeBlock.tsx）
 * - 超链接使用 shell.openExternal 在外部浏览器打开
 */
import { useMemo, memo, useCallback } from "react";
import { cn } from "@/utils/cn";
import { useMarkdownWorker } from "../../hooks/useMarkdownWorker";
import { MarkdownBlock } from "./MarkdownBlock/MarkdownBlock";

// 获取 Electron IPC 对象
const getElectronIPC = () => {
  try {
    return (window as Window & { require?: (m: string) => { ipcRenderer: { send: (ch: string, ...args: unknown[]) => void } } })
      .require?.("electron")?.ipcRenderer ?? null;
  } catch { return null; }
};

interface PreviewPaneProps {
  previewRef: React.RefObject<HTMLDivElement>;
  markdown: string;
  previewTheme: string;
  className?: string;
}

export default function PreviewPane({
  previewRef,
  markdown,
  previewTheme,
  className,
}: PreviewPaneProps) {
  const { blocks, isParsing } = useMarkdownWorker(markdown);

  // 处理超链接点击 - 在外部浏览器中打开
  const handleClick = useCallback((e: React.MouseEvent) => {
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor) {
      const href = anchor.getAttribute("href");
      if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
        e.preventDefault();
        e.stopPropagation();
        getElectronIPC()?.send("open-external", href);
      }
    }
  }, []);

  return (
    <section
      ref={previewRef}
      className={cn(
        "app-m3-preview-surface flex-1 overflow-y-auto relative transition-colors duration-500 preview-scroll",
        previewTheme,
        className,
      )}
      style={{
        backdropFilter: "blur(var(--editor-blur, 0px))",
        WebkitBackdropFilter: "blur(var(--editor-blur, 0px))",
      }}
      onClick={handleClick}
    >
      <div className="relative z-10 p-16 max-w-none markdown-body">
        {blocks.map((block) => (
          <MarkdownBlock key={block.index} html={block.html} previewTheme={previewTheme} />
        ))}
        {/* 首次加载占位，避免空白闪烁 */}
        {blocks.length === 0 && isParsing && (
          <div className="animate-pulse space-y-3 opacity-30">
            {[...Array(6)].map((_, i) => (
              <div
                key={i}
                className="h-4 bg-slate-300 rounded"
                style={{ width: `${70 + (i % 3) * 10}%` }}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
