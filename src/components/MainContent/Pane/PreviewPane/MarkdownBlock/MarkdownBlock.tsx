/**
 * MarkdownBlock — 渲染单个 markdown 块（已是 HTML 字符串）
 * 处理代码块的按需高亮替换，其余内容直接 dangerouslySetInnerHTML
 */
import { useMemo, memo } from "react";
import { CodeBlock } from "./CodeBlock";

// 从 HTML 中提取代码块，替换为占位符
export function extractCodeBlocks(html: string): {
  processed: string;
  codeBlocks: Array<{ lang: string; code: string; placeholder: string }>;
} {
  const codeBlocks: Array<{ lang: string; code: string; placeholder: string }> = [];
  // 匹配 <code class="language-xxx">...</code> 在 <pre> 内
  const processed = html.replace(
    /<pre[^>]*><code(?:\s+class="language-([^"]*)")?>([\s\S]*?)<\/code><\/pre>/g,
    (_, lang, rawCode) => {
      const language = lang || "text";
      // 反转义 HTML 实体，去除首尾空白（markdown 解析器会在 <code> 内容前后加换行）
      const code = rawCode
        .replace(/&lt;/g, "<")
        .replace(/&gt;/g, ">")
        .replace(/&amp;/g, "&")
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .trim();
      const placeholder = `__CODE_BLOCK_${codeBlocks.length}__`;
      codeBlocks.push({ lang: language, code, placeholder });
      return `<div data-code-placeholder="${placeholder}"></div>`;
    },
  );
  return { processed, codeBlocks };
}

export const MarkdownBlock = memo(function MarkdownBlock({ html }: { html: string }) {
  const { processed, codeBlocks } = useMemo(() => extractCodeBlocks(html), [html]);

  if (codeBlocks.length === 0) {
    return (
      <div
        dangerouslySetInnerHTML={{ __html: html }}
      />
    );
  }

  // 把 HTML 按占位符分割，穿插 CodeBlock 组件
  const parts = processed.split(
    /(<div data-code-placeholder="__CODE_BLOCK_\d+__"><\/div>)/,
  );

  return (
    <>
      {parts.map((part, i) => {
        const match = part.match(/data-code-placeholder="(__CODE_BLOCK_(\d+)__)"/);
        if (match) {
          const idx = parseInt(match[2], 10);
          const cb = codeBlocks[idx];
          return <CodeBlock key={i} language={cb.lang} code={cb.code} />;
        }
        if (!part.trim()) return null;
        return <div key={i} dangerouslySetInnerHTML={{ __html: part }} />;
      })}
    </>
  );
});
