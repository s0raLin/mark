import { cn } from "@/utils/cn";
import { Zap } from "lucide-react";

interface FooterProps {
  isSaving: boolean;
  lastSaved: Date;
  markdown: string;
}

// 已弃用
export default function Footer({ isSaving, lastSaved, markdown }: FooterProps) {


  // Calculate line and column from markdown
  const getLineColumn = () => {
    const lines = markdown.split("\n");
    return { line: lines.length, column: lines[lines.length - 1].length + 1 };
  };
  const { line, column } = getLineColumn();

  return (
    <div className="flex items-center justify-between w-full">
      {/* Left side - save status */}
      <div className="flex items-center gap-6">
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "w-2.5 h-2.5 rounded-full transition-all duration-500",
              isSaving
                ? "bg-amber-400 animate-pulse shadow-[0_0_8px_rgba(251,191,36,0.5)]"
                : "bg-green-400 shadow-[0_0_5px_rgba(74,222,128,0.5)]",
            )}
          ></span>
          <span className="transition-all duration-300">
            {isSaving
              ? "Saving Sparkles..."
              : lastSaved
                ? `Saved at ${lastSaved.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
                : "Synced to Cloud"}
          </span>
        </div>
        <span className="text-slate-300">
          Line {line}, Column {column}
        </span>
      </div>
      {/* Right side - file info */}
      <div className="flex items-center gap-6">
        <span className="hover:text-primary cursor-pointer transition-colors">
          Markdown
        </span>
        <span className="hover:text-primary cursor-pointer transition-colors">
          UTF-8
        </span>
        <div className="flex items-center gap-1.5 text-secondary bg-secondary/10 px-3 py-1 rounded-full">
          <Zap className="w-3 h-3" />
          <span>Pro Active</span>
        </div>
      </div>
    </div>
  );
}
