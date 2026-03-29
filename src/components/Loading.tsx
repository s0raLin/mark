import { useEffect, useState } from "react";

const BOOTSTRAP_THEME_STORAGE_KEY = "notemark:bootstrap-theme";

interface LoadingProps {
  /** 加载提示文本 */
  message?: string;
  /** 是否显示加载动画 */
  show?: boolean;
}

export default function Loading({ message = "加载中...", show = true }: LoadingProps) {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");
  const [bootstrapTheme, setBootstrapTheme] = useState(() => {
    if (typeof window === "undefined") {
      return { darkMode: false, accentColor: "#ff9a9e" };
    }

    try {
      const raw = window.localStorage.getItem(BOOTSTRAP_THEME_STORAGE_KEY);
      if (!raw) {
        return { darkMode: document.documentElement.classList.contains("dark"), accentColor: "#ff9a9e" };
      }

      const parsed = JSON.parse(raw) as { darkMode?: boolean; accentColor?: string } | null;
      return {
        darkMode: Boolean(parsed?.darkMode),
        accentColor: parsed?.accentColor || "#ff9a9e",
      };
    } catch {
      return { darkMode: document.documentElement.classList.contains("dark"), accentColor: "#ff9a9e" };
    }
  });
  const isDark = bootstrapTheme.darkMode;

  const backgroundColor = isDark
    ? "var(--bootstrap-bg, #111827)"
    : "var(--bootstrap-bg, #f8fafc)";
  const textColor = isDark
    ? "var(--bootstrap-fg, #e5e7eb)"
    : "var(--bootstrap-fg, #0f172a)";
  const mutedTextColor = isDark ? "rgba(226, 232, 240, 0.72)" : "#64748b";
  const trackColor = isDark ? "rgba(148, 163, 184, 0.22)" : "#e2e8f0";
  const accentColor = bootstrapTheme.accentColor || "var(--bootstrap-accent, var(--md-sys-color-primary, #ff9a9e))";
  const accentSoftColor = isDark ? "rgba(255, 154, 158, 0.16)" : "rgba(255, 154, 158, 0.14)";

  useEffect(() => {
    if (!show || typeof window === "undefined") {
      return;
    }

    try {
      const raw = window.localStorage.getItem(BOOTSTRAP_THEME_STORAGE_KEY);
      if (!raw) {
        return;
      }

      const parsed = JSON.parse(raw) as { darkMode?: boolean; accentColor?: string } | null;
      setBootstrapTheme({
        darkMode: Boolean(parsed?.darkMode),
        accentColor: parsed?.accentColor || "#ff9a9e",
      });
    } catch {
      // ignore malformed cache
    }
  }, [show]);

  // 模拟进度条动画
  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return 90; // 保持在90%，等待实际加载完成
        return prev + Math.random() * 15;
      });
    }, 200);

    return () => clearInterval(interval);
  }, [show]);

  // 点动画效果
  useEffect(() => {
    if (!show) return;

    const interval = setInterval(() => {
      setDots((prev) => {
        if (prev.length >= 3) return "";
        return prev + ".";
      });
    }, 400);

    return () => clearInterval(interval);
  }, [show]);

  if (!show) return null;

  return (
    <div
      className="loading-container"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: `radial-gradient(circle at top, ${accentSoftColor}, transparent 42%), ${backgroundColor}`,
        zIndex: 9999,
        transition: "background-color 0.3s ease",
      }}
    >
      {/* Logo 区域 */}
      <div
        className="loading-logo"
        style={{
          marginBottom: "48px",
          position: "relative",
        }}
      >
        {/* 外圈动画 */}
        <svg
          width="120"
          height="120"
          viewBox="0 0 120 120"
          style={{
            animation: "loading-spin 2s linear infinite",
          }}
        >
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={trackColor}
            strokeWidth="4"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke={accentColor}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray="339.292"
            strokeDashoffset="84.823"
            style={{
              animation: "loading-dash 1.5s ease-in-out infinite",
            }}
          />
        </svg>

        {/* 中心图标 */}
        <div
          style={{
            position: "absolute",
            top: "50%",
            left: "50%",
            transform: "translate(-50%, -50%)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <svg
            width="48"
            height="48"
            viewBox="0 0 24 24"
            fill="none"
            style={{
              animation: "loading-pulse 2s ease-in-out infinite",
            }}
          >
            <path
              d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
              fill={isDark ? "rgba(255,255,255,0.08)" : "rgba(255,255,255,0.88)"}
              stroke={accentColor}
              strokeWidth="1.5"
            />
            <path
              d="M14 2V8H20"
              fill="none"
              stroke={accentColor}
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 13H16M8 17H12"
              stroke={accentColor}
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        </div>
      </div>

      {/* 应用名称 */}
      <h1
        style={{
          fontSize: "32px",
          fontWeight: 600,
          color: textColor,
          marginBottom: "16px",
          fontFamily: "var(--font-display, 'Quicksand', sans-serif)",
          letterSpacing: "-0.02em",
        }}
      >
        NoteMark
      </h1>

      {/* 加载提示文本 */}
      <p
        style={{
          fontSize: "14px",
          color: mutedTextColor,
          marginBottom: "32px",
          minHeight: "20px",
        }}
      >
        {message}
        <span style={{ display: "inline-block", width: "24px" }}>{dots}</span>
      </p>

      {/* 进度条 */}
      <div
        style={{
          width: "200px",
          height: "4px",
          backgroundColor: trackColor,
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: accentColor,
            borderRadius: "2px",
            transition: "width 0.3s ease",
          }}
        />
      </div>

      {/* 版本信息 */}
      <p
        style={{
          position: "absolute",
          bottom: "24px",
          fontSize: "12px",
          color: mutedTextColor,
          opacity: 0.6,
        }}
      >
        v1.0.0
      </p>

      {/* 动画样式 */}
      <style>{`
        @keyframes loading-spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }

        @keyframes loading-dash {
          0% {
            stroke-dashoffset: 339.292;
          }
          50% {
            stroke-dashoffset: 84.823;
          }
          100% {
            stroke-dashoffset: 339.292;
          }
        }

        @keyframes loading-pulse {
          0%, 100% {
            opacity: 1;
            transform: scale(1);
          }
          50% {
            opacity: 0.7;
            transform: scale(0.95);
          }
        }
      `}</style>
    </div>
  );
}
