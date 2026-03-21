import { useEffect, useRef, useCallback } from "react";
import { Heading } from "../types";

interface UseScrollSyncProps {
  headings: Heading[];
  viewMode: string;
  previewRef: React.RefObject<HTMLDivElement | null>;
  setActiveOutlineId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useScrollSync({
  headings,
  viewMode,
  previewRef,
  setActiveOutlineId,
}: UseScrollSyncProps) {
  const headingRefsMap = useRef<Map<string, HTMLElement>>(new Map());

  // markdown 变化时清空映射，等待重新注册
  useEffect(() => {
    headingRefsMap.current.clear();
  }, [headings]);

  // 注册 heading DOM 元素到 ref 映射的回调
  const registerHeadingRef = useCallback((id: string) => (el: HTMLElement | null) => {
    if (el) {
      headingRefsMap.current.set(id, el);
    }
  }, []);

  // scroll 事件同步高亮
  useEffect(() => {
    const preview = previewRef.current;
    if (!preview || headings.length === 0) return;

    const syncActive = () => {
      const scrollTop = preview.scrollTop;
      let activeId = headings[0].id;

      for (const heading of headings) {
        const el = headingRefsMap.current.get(heading.id);
        if (!el) continue;
        let offsetTop = 0;
        let node: HTMLElement | null = el;
        while (node && node !== preview) {
          offsetTop += node.offsetTop;
          node = node.offsetParent as HTMLElement | null;
        }
        if (offsetTop <= scrollTop + 100) {
          activeId = heading.id;
        }
      }
      setActiveOutlineId(activeId);
    };

    const raf = requestAnimationFrame(syncActive);
    preview.addEventListener("scroll", syncActive, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      preview.removeEventListener("scroll", syncActive);
    };
  }, [headings, viewMode, previewRef, setActiveOutlineId]);

  const scrollToSection = useCallback(
    (id: string) => {
      if (!id || !previewRef.current) return;
      setActiveOutlineId(id);

      const el = headingRefsMap.current.get(id);
      if (!el) return;

      let offsetTop = 0;
      let node: HTMLElement | null = el;
      while (node && node !== previewRef.current) {
        offsetTop += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }

      previewRef.current.scrollTo({ top: offsetTop - 80, behavior: "smooth" });
    },
    [previewRef, setActiveOutlineId],
  );

  return {
    headingRefsMap,
    registerHeadingRef,
    scrollToSection,
  };
}
