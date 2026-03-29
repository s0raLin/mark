/**
 * PreviewPane — 性能优化版
 * - markdown 解析在 Web Worker 中完成，主线程不阻塞
 * - 按段落/块渲染，每块独立 memo，减少不必要重渲染
 * - 语法高亮按需加载（见 CodeBlock.tsx）
 * - 超链接使用 shell.openExternal 在外部浏览器打开
 */
import { useCallback } from "react";
import { cn } from "@/utils/cn";
import { useMarkdownWorker } from "../../hooks/useMarkdownWorker";
import { MarkdownBlock } from "./MarkdownBlock/MarkdownBlock";
import { openExternalUrl } from "@/api/client";
import type { GetFileContentResponse } from "@/api/client";
import { FileType2, Music4 } from "lucide-react";

interface PreviewPaneProps {
  previewRef: React.RefObject<HTMLDivElement>;
  markdown: string;
  activeFileContent: GetFileContentResponse | null;
  previewTheme: string;
  className?: string;
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

export default function PreviewPane({
  previewRef,
  markdown,
  activeFileContent,
  previewTheme,
  className,
}: PreviewPaneProps) {
  const previewMarkdown = activeFileContent?.kind === "text" ? markdown : "";
  const { blocks, isParsing } = useMarkdownWorker(previewMarkdown);

  // 处理超链接点击 - 在外部浏览器中打开
  const handleClick = useCallback((e: React.MouseEvent) => {
    if (activeFileContent?.kind && activeFileContent.kind !== "text") {
      return;
    }
    const target = e.target as HTMLElement;
    const anchor = target.closest("a");
    if (anchor) {
        const href = anchor.getAttribute("href");
        if (href && (href.startsWith("http://") || href.startsWith("https://"))) {
          e.preventDefault();
          e.stopPropagation();
          openExternalUrl(href);
        }
      }
  }, [activeFileContent]);

  const renderBinaryPreview = () => {
    if (!activeFileContent || activeFileContent.kind === "text") {
      return null;
    }

    const mediaDataUrl = activeFileContent.mediaDataUrl;

    if (activeFileContent.kind === "image" && mediaDataUrl) {
      return (
        <div className="flex h-full w-full items-center justify-center p-8 md:p-12">
          <img src={mediaDataUrl} alt={activeFileContent.id} className="max-h-full max-w-full rounded-[28px] object-contain shadow-[0_24px_80px_rgba(15,23,42,0.18)]" />
        </div>
      );
    }

    if (activeFileContent.kind === "video" && mediaDataUrl) {
      return (
        <div className="flex h-full w-full items-center justify-center p-8 md:p-12">
          <video src={mediaDataUrl} controls className="max-h-full max-w-full rounded-[28px] bg-black shadow-[0_24px_80px_rgba(15,23,42,0.24)]" />
        </div>
      );
    }

    if (activeFileContent.kind === "audio" && mediaDataUrl) {
      return (
        <div className="flex h-full w-full items-center justify-center p-8 md:p-12">
          <div className="app-m3-binary-card w-full max-w-2xl rounded-[28px] p-8">
            <div className="flex items-center gap-4">
              <div className="app-m3-binary-icon flex h-14 w-14 items-center justify-center rounded-2xl">
                <Music4 className="h-6 w-6" />
              </div>
              <div className="min-w-0">
                <p className="app-m3-binary-title text-lg font-semibold">音频文件预览</p>
                <p className="app-m3-binary-description text-sm">{activeFileContent.mimeType || "audio/*"} · {formatFileSize(activeFileContent.size)}</p>
              </div>
            </div>
            <div className="mt-6 rounded-2xl border border-white/50 bg-white/55 p-4">
              <audio src={mediaDataUrl} controls className="w-full" />
            </div>
          </div>
        </div>
      );
    }

    return (
      <div className="flex h-full w-full items-center justify-center p-8 md:p-12">
        <div className="app-m3-binary-card w-full max-w-2xl rounded-[28px] p-8">
          <div className="flex items-start gap-4">
            <div className="app-m3-binary-icon flex h-14 w-14 items-center justify-center rounded-2xl">
              <FileType2 className="h-6 w-6" />
            </div>
            <div className="min-w-0 space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="app-m3-binary-badge inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.14em]">
                  <FileType2 className="h-3.5 w-3.5" />
                  {(activeFileContent.id.split(".").pop() || "FILE").toUpperCase()}
                </span>
                <span className="app-m3-binary-muted-badge inline-flex items-center rounded-full px-2.5 py-1 text-[11px] font-medium">
                  Binary
                </span>
              </div>
              <p className="app-m3-binary-title text-lg font-semibold">这个二进制文件当前没有可内嵌预览的内容</p>
              <p className="app-m3-binary-description text-sm leading-6">
                我们已经识别到它不是文本文件，但也不是当前支持直接播放的图片、视频或音频类型，所以预览区只展示文件信息。
              </p>
              <div className="app-m3-binary-file rounded-2xl px-4 py-3">
                <p className="app-m3-binary-file-name truncate text-sm font-medium">{activeFileContent.id}</p>
                <p className="app-m3-binary-file-description mt-1 text-xs">{activeFileContent.mimeType || "application/octet-stream"} · {formatFileSize(activeFileContent.size)}</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

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
      {activeFileContent && activeFileContent.kind !== "text" ? (
        <div className="relative z-10 flex h-full min-h-0 items-center justify-center">
          {renderBinaryPreview()}
        </div>
      ) : (
        <div className="relative z-10 p-16 max-w-none markdown-body">
          {blocks.map((block) => (
            <MarkdownBlock key={block.index} html={block.html} previewTheme={previewTheme} />
          ))}
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
      )}
    </section>
  );
}
