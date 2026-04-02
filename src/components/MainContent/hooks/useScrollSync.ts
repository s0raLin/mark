import { useEffect, useCallback } from "react";
import { Heading } from "../types";

interface UseScrollSyncProps {
  headings: Heading[];
  containerRef: React.RefObject<HTMLElement | null>;
  setActiveOutlineId: React.Dispatch<React.SetStateAction<string | null>>;
}

export function useScrollSync({
  headings,
  containerRef,
  setActiveOutlineId,
}: UseScrollSyncProps) {
  const getHeadingElement = useCallback(
    (id: string) => {
      const container = containerRef.current;
      if (!container) {
        return null;
      }

      return container.querySelector<HTMLElement>(`[data-outline-id="${id}"]`);
    },
    [containerRef],
  );

  useEffect(() => {
    const container = containerRef.current;
    if (!container || headings.length === 0) return;

    const syncActive = () => {
      const scrollTop = container.scrollTop;
      let activeId = headings[0].id;

      for (const heading of headings) {
        const el = getHeadingElement(heading.id);
        if (!el) continue;
        let offsetTop = 0;
        let node: HTMLElement | null = el;
        while (node && node !== container) {
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
    container.addEventListener("scroll", syncActive, { passive: true });

    return () => {
      cancelAnimationFrame(raf);
      container.removeEventListener("scroll", syncActive);
    };
  }, [containerRef, getHeadingElement, headings, setActiveOutlineId]);

  const scrollToSection = useCallback(
    (id: string) => {
      const container = containerRef.current;
      if (!id || !container) return;
      setActiveOutlineId(id);

      const el = getHeadingElement(id);
      if (!el) return;

      let offsetTop = 0;
      let node: HTMLElement | null = el;
      while (node && node !== container) {
        offsetTop += node.offsetTop;
        node = node.offsetParent as HTMLElement | null;
      }

      container.scrollTo({ top: offsetTop - 80, behavior: "smooth" });
    },
    [containerRef, getHeadingElement, setActiveOutlineId],
  );

  return {
    scrollToSection,
  };
}
