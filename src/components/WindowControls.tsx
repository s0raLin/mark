import { useState, useEffect } from "react";
import { Minus, Square, Maximize2, X } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import { ROUTES } from "../hooks/useModalRoute";

const isElectron =
  typeof window !== "undefined" &&
  typeof (window as Window & { require?: unknown }).require !== "undefined";

const getElectronAPI = () => {
  if (!isElectron) return null;
  try {
    return (
      window as Window & {
        require: (m: string) => {
          ipcRenderer: {
            send: (channel: string, ...args: unknown[]) => void;
            on: (channel: string, cb: (...args: unknown[]) => void) => void;
            removeListener: (channel: string, cb: (...args: unknown[]) => void) => void;
          };
        };
      }
    ).require("electron").ipcRenderer;
  } catch {
    return null;
  }
};

// 从 ROUTES 值中排除 HOME 空字符串，获取所有模态框路由
const MODAL_ROUTES: string[] = Object.values(ROUTES).filter(Boolean) as string[];

export default function WindowControls() {
  const [isMaximized, setIsMaximized] = useState(false);
  const [searchParams] = useSearchParams();
  const electronAPI = getElectronAPI();
  
  // 检测是否有模态框打开
  const modalParam = searchParams.get('modal') || '';
  const isModalOpen = MODAL_ROUTES.includes(modalParam);

  useEffect(() => {
    if (!electronAPI) return;
    const handler = (_e: unknown, maximized: boolean) => setIsMaximized(maximized);
    electronAPI.on("window-maximized", handler);
    return () => electronAPI.removeListener("window-maximized", handler);
  }, [electronAPI]);

  if (!isElectron) return null;

  return (
    <div className={`
      flex items-center gap-1.5 px-2 py-1.5 rounded-xl shadow-lg border backdrop-blur-xl transition-all duration-300
      ${isModalOpen 
        ? 'bg-red-50/90 border-red-100/50' 
        : 'bg-slate-100/80 border-slate-200/50'}
    `} style={{ zIndex: 100 }}>
      {/* 关闭按钮 - 始终可见且可点击 */}
      <button
        onClick={() => electronAPI?.send("window-close")}
        title="关闭"
        className={`
          group relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
          ${isModalOpen 
            ? 'bg-red-500 hover:bg-red-600 active:scale-90' 
            : 'bg-slate-200 hover:bg-red-500 active:scale-90'}
        `}
      >
        <X className={`w-4 h-4 transition-all duration-200 ${
          isModalOpen ? 'text-white' : 'text-slate-600 group-hover:text-white'
        }`} />
        {/* 悬浮提示 */}
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          关闭窗口
        </span>
      </button>
      
      {/* 最小化按钮 */}
      <button
        onClick={() => electronAPI?.send("window-minimize")}
        title="最小化"
        className={`
          group relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
          ${isModalOpen 
            ? 'bg-slate-200/50 hover:bg-yellow-400 active:scale-90' 
            : 'bg-slate-200 hover:bg-yellow-400 active:scale-90'}
        `}
      >
        <Minus className={`w-4 h-4 transition-all duration-200 ${
          isModalOpen ? 'text-slate-400' : 'text-slate-600'
        }`} />
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          最小化
        </span>
      </button>
      
      {/* 最大化/还原按钮 */}
      <button
        onClick={() => electronAPI?.send("window-maximize")}
        title={isMaximized ? "还原" : "最大化"}
        className={`
          group relative w-9 h-9 rounded-xl flex items-center justify-center transition-all duration-200
          ${isModalOpen 
            ? 'bg-slate-200/50 hover:bg-green-400 active:scale-90' 
            : 'bg-slate-200 hover:bg-green-400 active:scale-90'}
        `}
      >
        {isMaximized ? (
          <Maximize2 className={`w-4 h-4 transition-all duration-200 ${
            isModalOpen ? 'text-slate-400' : 'text-slate-600'
          }`} />
        ) : (
          <Square className={`w-3.5 h-3.5 transition-all duration-200 ${
            isModalOpen ? 'text-slate-400' : 'text-slate-600'
          }`} />
        )}
        <span className="absolute -bottom-8 left-1/2 -translate-x-1/2 px-2 py-1 bg-slate-800 text-white text-[10px] font-medium rounded-md opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap">
          {isMaximized ? '还原' : '最大化'}
        </span>
      </button>
    </div>
  );
}
