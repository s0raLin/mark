import { useState, useEffect, useRef, useCallback } from "react";
import { ChevronRight, FileText, Folder, Search, X, Filter, Calendar } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";
import { searchFiles } from "@/api/client";
import { useTranslation } from "react-i18next";
import type { FileNode } from "@/types/filesystem";

interface SearchResult {
  id: string;
  name: string;
  snippet: string;
  matchType: "name" | "content";
  updatedAt?: number;
}

interface SearchModalProps {
  onClose: () => void;
  nodes: FileNode[];
  onOpenFile: (id: string) => void;
}

export function SearchModal({ onClose, nodes, onOpenFile }: SearchModalProps) {
  const { t } = useTranslation();
  const [query, setQuery] = useState("");
  const [rawResults, setRawResults] = useState<SearchResult[]>([]);
  const [selectedIdx, setSelectedIdx] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedType, setSelectedType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { inputRef.current?.focus(); }, []);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => { if (e.key === "Escape") onClose(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [onClose]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    if (!query.trim()) { setRawResults([]); setSelectedIdx(0); return; }
    debounceRef.current = setTimeout(async () => {
      setIsLoading(true);
      try {
        const data = await searchFiles(query.trim());
        const enriched = data.map(r => ({
          ...r,
          updatedAt: nodes.find(n => n.id === r.id)?.updatedAt,
        }));
        setRawResults(enriched);
        setSelectedIdx(0);
      } catch {
        setRawResults([]);
      } finally {
        setIsLoading(false);
      }
    }, 200);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [query, nodes]);

  useEffect(() => { setSelectedIdx(0); }, [selectedType, dateRange]);

  const results = rawResults.filter(r => {
    if (selectedType !== "all") {
      const ext = r.name.includes(".") ? "." + r.name.split(".").pop()!.toLowerCase() : "";
      if (ext !== selectedType) return false;
    }
    if (dateRange !== "all" && r.updatedAt) {
      const now = Date.now();
      const diff = now - r.updatedAt;
      const day = 1000 * 3600 * 24;
      if (dateRange === "today" && diff > day) return false;
      if (dateRange === "week" && diff > day * 7) return false;
      if (dateRange === "month" && diff > day * 30) return false;
    }
    return true;
  });

  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${selectedIdx}"]`);
    el?.scrollIntoView({ block: "nearest" });
  }, [selectedIdx]);

  const handleOpen = useCallback((id: string) => {
    const node = nodes.find(n => n.id === id);
    if (node?.type === "file") { onOpenFile(id); onClose(); }
  }, [nodes, onOpenFile, onClose]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") { e.preventDefault(); setSelectedIdx(i => Math.min(i + 1, results.length - 1)); }
    else if (e.key === "ArrowUp") { e.preventDefault(); setSelectedIdx(i => Math.max(i - 1, 0)); }
    else if (e.key === "Enter" && results[selectedIdx]) handleOpen(results[selectedIdx].id);
  };

  const highlight = (text: string, q: string) => {
    if (!q) return <>{text}</>;
    const idx = text.toLowerCase().indexOf(q.toLowerCase());
    if (idx < 0) return <>{text}</>;
    return (
      <>
        {text.slice(0, idx)}
        <mark className="bg-primary/20 text-primary rounded px-0.5 not-italic">{text.slice(idx, idx + q.length)}</mark>
        {text.slice(idx + q.length)}
      </>
    );
  };

  const fileNodes = nodes.filter(n => {
    if (n.type !== "file") return false;
    if (selectedType !== "all") {
      const ext = n.name.includes(".") ? "." + n.name.split(".").pop()!.toLowerCase() : "";
      if (ext !== selectedType) return false;
    }
    if (dateRange !== "all" && n.updatedAt) {
      const now = Date.now();
      const diff = now - n.updatedAt;
      const day = 1000 * 3600 * 24;
      if (dateRange === "today" && diff > day) return false;
      if (dateRange === "week" && diff > day * 7) return false;
      if (dateRange === "month" && diff > day * 30) return false;
    }
    return true;
  });

  const dateLabels: Record<string, string> = {
    all: t("search.dateAll"),
    today: t("search.dateToday"),
    week: t("search.dateWeek"),
    month: t("search.dateMonth"),
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 flex items-start justify-center bg-slate-900/20 backdrop-blur-sm pt-[15vh] px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: -20 }}
        className="bg-white/70 backdrop-blur-xl w-full max-w-2xl rounded-3xl overflow-hidden shadow-sm border border-white/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="p-6 flex items-center gap-4 border-b border-rose-100">
          <Search className={cn("w-6 h-6 shrink-0 transition-colors", isLoading ? "text-primary animate-pulse" : "text-slate-400")} />
          <input
            ref={inputRef}
            type="text"
            placeholder={t("search.placeholder")}
            className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-700 placeholder:text-slate-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-slate-300 hover:text-slate-500 transition-colors">
              <X className="w-4 h-4" />
            </button>
          )}
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-400 uppercase">
            ESC
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-white/30 border-b border-rose-100 flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Filter className="w-3 h-3" />
              {t("search.filterType")}
            </div>
            <div className="flex gap-1">
              {["all", ".md", ".txt", ".json"].map((type) => (
                <button
                  key={type}
                  onClick={() => setSelectedType(type)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                    selectedType === type
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white text-slate-500 hover:bg-rose-50 border border-slate-200",
                  )}
                >
                  {type === "all" ? t("search.dateAll") : type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="h-4 w-px bg-slate-200" />
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Calendar className="w-3 h-3" />
              {t("search.filterDate")}
            </div>
            <div className="flex gap-1">
              {["all", "today", "week", "month"].map((range) => (
                <button
                  key={range}
                  onClick={() => setDateRange(range)}
                  className={cn(
                    "px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all",
                    dateRange === range
                      ? "bg-primary text-white shadow-sm"
                      : "bg-white text-slate-500 hover:bg-rose-50 border border-slate-200",
                  )}
                >
                  {dateLabels[range]}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-[60vh] overflow-y-auto p-4">
          {query.trim() === "" ? (
            <div className="space-y-1">
              {fileNodes.map((node, idx) => (
                <div
                  key={node.id}
                  data-idx={idx}
                  onClick={() => handleOpen(node.id)}
                  className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-50 cursor-pointer transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">{node.name}</h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {new Date(node.updatedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-200 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
          ) : results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, idx) => {
                const node = nodes.find(n => n.id === result.id);
                const isFolder = node?.type === "folder";
                return (
                  <div
                    key={result.id}
                    data-idx={idx}
                    onClick={() => handleOpen(result.id)}
                    className={cn(
                      "group flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all",
                      selectedIdx === idx ? "bg-primary/10 border border-primary/20" : "hover:bg-rose-50",
                    )}
                  >
                    <div className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center transition-all",
                      selectedIdx === idx ? "bg-primary/20 text-primary" : "bg-rose-50 text-rose-400 group-hover:bg-white group-hover:shadow-sm",
                    )}>
                      {isFolder ? <Folder className="w-5 h-5" /> : <FileText className="w-5 h-5" />}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className="text-sm font-bold text-slate-800 truncate">
                        {highlight(result.name, query)}
                      </h3>
                      {result.snippet ? (
                        <p className="text-xs text-slate-500 font-medium truncate mt-0.5">
                          {highlight(result.snippet, query)}
                        </p>
                      ) : (
                        <p className="text-xs text-slate-500 font-medium">
                          {node?.updatedAt ? new Date(node.updatedAt).toLocaleDateString() : ""}
                        </p>
                      )}
                    </div>
                    <span className={cn(
                      "text-[9px] font-black uppercase tracking-wider px-1.5 py-0.5 rounded-md shrink-0",
                      result.matchType === "name" ? "bg-blue-50 text-blue-400" : "bg-amber-50 text-amber-400",
                    )}>
                      {result.matchType === "name" ? t("search.matchName") : t("search.matchContent")}
                    </span>
                    <ChevronRight className="w-4 h-4 text-rose-200 opacity-0 group-hover:opacity-100 transition-all" />
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-200 mb-4">
                <Search className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-400">{t("search.noResults", { query })}</p>
              <p className="text-xs text-slate-400 mt-1">{t("search.noResultsHint")}</p>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 bg-white/30 border-t border-rose-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-sm">↑↓</kbd>
              {t("search.navigate")}
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-sm">Enter</kbd>
              {t("search.open")}
            </span>
          </div>
          <span>
            {query.trim()
              ? `${results.length} ${t("search.results")}`
              : `${fileNodes.length} ${t("search.files")}`}
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}
