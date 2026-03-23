/**
 * Web Worker: markdown → HTML blocks
 * 在主线程外解析 markdown，避免阻塞 UI
 * 使用 marked（轻量）替代 unified pipeline，Worker bundle ~30KB vs ~330KB
 */
import { marked, Lexer } from "marked";
import { gfmHeadingId } from "marked-gfm-heading-id";

export interface WorkerRequest {
  id: number;
  markdown: string;
}

export interface BlockResult {
  index: number;
  html: string;
}

export interface WorkerResponse {
  id: number;
  blocks: BlockResult[];
}

// 配置 marked
marked.use(gfmHeadingId());
marked.use({ gfm: true, breaks: false });

/**
 * 把 markdown 按顶层 token 拆成独立块
 * 每个顶层 token（段落、标题、代码块、列表等）作为一个渲染单元
 */
function splitIntoBlocks(markdown: string): string[] {
  const lexer = new Lexer({ gfm: true });
  const tokens = lexer.lex(markdown);
  const blocks: string[] = [];

  for (const token of tokens) {
    if (token.type === "space") continue;
    blocks.push((token as any).raw ?? "");
  }

  return blocks.filter((b) => b.trim().length > 0);
}

self.onmessage = (e: MessageEvent<WorkerRequest>) => {
  const { id, markdown } = e.data;
  const blocks = splitIntoBlocks(markdown);

  const results: BlockResult[] = blocks.map((block, index) => ({
    index,
    html: marked.parse(block) as string,
  }));

  self.postMessage({ id, blocks: results } satisfies WorkerResponse);
};
