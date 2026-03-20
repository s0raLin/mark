import { Settings2 } from "lucide-react";
import React from "react";
import { OutlineItem } from "./OutlineItem";

interface OutlineProps {
  headings: Heading[],
  activeOutlineId: string,
  scrollToSection: (id: string) => void,
  markdown: string,
}

interface Heading {
    text: string;
    level: number;
    id: string;
}

export default function Outline({
  headings,
  activeOutlineId,
  scrollToSection,
  markdown,
}: OutlineProps) {
  return (
    <aside className="w-56 border-l border-border-soft bg-white hidden lg:flex flex-col shrink-0">
      <div className="p-6 border-b border-border-soft flex items-center justify-between">
        <span className="text-xs font-extrabold uppercase tracking-widest text-slate-400">
          Outline
        </span>
        <Settings2 className="w-4 h-4 text-slate-300 cursor-pointer hover:text-primary transition-colors" />
      </div>
      <div className="flex-1 overflow-y-auto py-6">
        <nav className="space-y-1 pl-2">
          {headings.length > 0 ? (
            headings.map((heading) => (
              <OutlineItem
                key={heading.id}
                label={heading.text}
                active={activeOutlineId === heading.id}
                sub={heading.level > 1}
                onClick={() => scrollToSection(heading.id)}
              />
            ))
          ) : (
            <div className="px-4 py-8 text-center">
              <p className="text-xs font-bold text-slate-300 uppercase tracking-widest">
                No headings found
              </p>
            </div>
          )}
        </nav>
      </div>
      <div className="p-6 border-t border-border-soft">
        <div className="flex items-center justify-between text-[11px] font-bold text-slate-400 mb-4">
          <span className="bg-slate-100 px-2 py-0.5 rounded">
            {markdown.split(/\s+/).filter(Boolean).length} Words
          </span>
          <span className="bg-slate-100 px-2 py-0.5 rounded">
            {markdown.length} Chars
          </span>
        </div>
        <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent shadow-[0_0_8px_rgba(255,143,171,0.3)] transition-all duration-500"
            style={{
              width: `${Math.min((markdown.length / 2000) * 100, 100)}%`,
            }}
          ></div>
        </div>
      </div>
    </aside>
  );
}
