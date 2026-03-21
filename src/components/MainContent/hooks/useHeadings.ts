import { useMemo } from "react";
import { Heading } from "../types";

export function useHeadings(markdown: string): Heading[] {
  return useMemo(() => {
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
}
