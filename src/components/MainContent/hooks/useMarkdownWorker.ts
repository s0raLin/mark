/**
 * useMarkdownWorker
 * 把 markdown 解析丢到 Web Worker，主线程只负责 UI
 * 带 debounce，避免每次击键都触发解析
 */
import { useState, useEffect, useRef, useCallback } from "react";
import type { BlockResult } from "@/workers/markdownWorker";

export type { BlockResult };

const DEBOUNCE_MS = 120;

export function useMarkdownWorker(markdown: string) {
  const [blocks, setBlocks] = useState<BlockResult[]>([]);
  const [isParsing, setIsParsing] = useState(false);
  const workerRef = useRef<Worker | null>(null);
  const reqIdRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 初始化 worker（Vite worker import）
  useEffect(() => {
    const worker = new Worker(
      new URL("@/workers/markdownWorker.ts", import.meta.url),
      { type: "module" },
    );
    workerRef.current = worker;
    return () => {
      worker.terminate();
      workerRef.current = null;
    };
  }, []);

  const parse = useCallback((md: string) => {
    const worker = workerRef.current;
    if (!worker) return;

    const id = ++reqIdRef.current;
    setIsParsing(true);

    worker.onmessage = (e) => {
      // 丢弃过期响应（用户继续输入时）
      if (e.data.id !== reqIdRef.current) return;
      setBlocks(e.data.blocks);
      setIsParsing(false);
    };

    worker.postMessage({ id, markdown: md });
  }, []);

  // debounce
  useEffect(() => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => parse(markdown), DEBOUNCE_MS);
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [markdown, parse]);

  return { blocks, isParsing };
}
