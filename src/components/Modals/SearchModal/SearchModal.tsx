import { useState, useEffect, useRef } from "react";
import { ChevronRight, FileText, Search, Calendar, Filter } from "lucide-react";
import { motion } from "motion/react";
import { cn } from "@/utils/cn";

interface SearchModalProps {
  onClose: () => void;
}
export function SearchModal({ onClose }: SearchModalProps) {
  const [query, setQuery] = useState("");
  const [selectedType, setSelectedType] = useState("all");
  const [dateRange, setDateRange] = useState("all");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const results = [
    {
      title: "Project_Specs.md",
      folder: "Documentation",
      date: "2026-03-18",
      type: ".md",
    },
    {
      title: "Release_Notes.md",
      folder: "Documentation",
      date: "2026-03-17",
      type: ".md",
    },
    {
      title: "Getting_Started.md",
      folder: "Root",
      date: "2026-03-15",
      type: ".md",
    },
    {
      title: "API_Reference.md",
      folder: "Root",
      date: "2026-03-11",
      type: ".md",
    },
    {
      title: "config.json",
      folder: "Settings",
      date: "2026-03-10",
      type: ".json",
    },
    { title: "todo.txt", folder: "Personal", date: "2026-03-18", type: ".txt" },
  ].filter((item) => {
    const matchesQuery = item.title.toLowerCase().includes(query.toLowerCase());
    const matchesType = selectedType === "all" || item.type === selectedType;

    let matchesDate = true;
    if (dateRange !== "all") {
      const itemDate = new Date(item.date);
      const now = new Date("2026-03-18T14:47:41Z");
      const diffDays =
        (now.getTime() - itemDate.getTime()) / (1000 * 3600 * 24);

      if (dateRange === "today") matchesDate = diffDays < 1;
      else if (dateRange === "week") matchesDate = diffDays < 7;
      else if (dateRange === "month") matchesDate = diffDays < 30;
    }

    return matchesQuery && matchesType && matchesDate;
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[110] flex items-start justify-center bg-slate-900/20 backdrop-blur-sm pt-[15vh] px-4"
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.95, y: -20 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.95, y: -20 }}
        className="bg-white/70 backdrop-blur-xl w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-white/50 flex flex-col"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="p-6 flex items-center gap-4 border-b border-rose-100">
          <Search className="w-6 h-6 text-slate-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search notes, files, or commands..."
            className="flex-1 bg-transparent border-none outline-none text-lg font-medium text-slate-700 placeholder:text-slate-400"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <div className="flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-100 border border-slate-200 text-[10px] font-black text-slate-400 uppercase">
            ESC
          </div>
        </div>

        {/* Filters */}
        <div className="px-6 py-3 bg-white/30 border-b border-rose-100 flex flex-wrap gap-6 items-center">
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Filter className="w-3 h-3" />
              Type
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
                  {type === "all" ? "ALL" : type.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
          <div className="h-4 w-px bg-slate-200"></div>
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-1.5 text-[10px] font-black text-slate-400 uppercase tracking-widest">
              <Calendar className="w-3 h-3" />
              Date
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
                  {range.toUpperCase()}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-4">
          {results.length > 0 ? (
            <div className="space-y-1">
              {results.map((result, idx) => (
                <div
                  key={idx}
                  className="group flex items-center gap-4 p-4 rounded-2xl hover:bg-rose-50 cursor-pointer transition-all"
                >
                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-400 group-hover:bg-white group-hover:shadow-sm transition-all">
                    <FileText className="w-5 h-5" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-bold text-slate-800 truncate">
                      {result.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-medium">
                      {result.folder} • {result.date}
                    </p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-rose-200 opacity-0 group-hover:opacity-100 transition-all" />
                </div>
              ))}
            </div>
          ) : (
            <div className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-200 mb-4">
                <Search className="w-8 h-8" />
              </div>
              <p className="text-sm font-bold text-slate-400">
                No results found for "{query}"
              </p>
              <p className="text-xs text-slate-400 mt-1">
                Try searching for something else ✨
              </p>
            </div>
          )}
        </div>

        <div className="p-4 bg-white/30 border-t border-rose-100 flex items-center justify-between text-[10px] font-bold text-slate-500 uppercase tracking-widest">
          <div className="flex gap-4">
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-sm">
                ↑↓
              </kbd>{" "}
              Navigate
            </span>
            <span className="flex items-center gap-1.5">
              <kbd className="px-1.5 py-0.5 rounded bg-white border border-slate-200 shadow-sm">
                Enter
              </kbd>{" "}
              Open
            </span>
          </div>
          <span>{results.length} Results</span>
        </div>
      </motion.div>
    </motion.div>
  );
}
