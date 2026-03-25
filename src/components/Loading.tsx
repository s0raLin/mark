import { useEffect, useState } from "react";

interface LoadingProps {
  /** 加载提示文本 */
  message?: string;
  /** 是否显示加载动画 */
  show?: boolean;
}

/**
 * 加载页面组件
 * 始终使用浅色模式
 */
export default function Loading({ message = "加载中...", show = true }: LoadingProps) {
  const [progress, setProgress] = useState(0);
  const [dots, setDots] = useState("");

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
        backgroundColor: "#ffffff",
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
            stroke="var(--color-border-soft, var(--md-sys-color-outline-variant, #e0e0e0))"
            strokeWidth="4"
          />
          <circle
            cx="60"
            cy="60"
            r="54"
            fill="none"
            stroke="var(--md-sys-color-primary, var(--color-primary, #6750a4))"
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
              fill="var(--md-sys-color-primary-container, var(--color-accent, #e8def8))"
              stroke="var(--md-sys-color-primary, var(--color-primary, #6750a4))"
              strokeWidth="1.5"
            />
            <path
              d="M14 2V8H20"
              fill="none"
              stroke="var(--md-sys-color-primary, var(--color-primary, #6750a4))"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M8 13H16M8 17H12"
              stroke="var(--md-sys-color-primary, var(--color-primary, #6750a4))"
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
          color: "var(--color-primary-text, var(--md-sys-color-on-surface, #1c1b1f))",
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
          color: "var(--md-sys-color-on-surface-variant, #49454f)",
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
          backgroundColor: "var(--color-border-soft, var(--md-sys-color-outline-variant, #e0e0e0))",
          borderRadius: "2px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            width: `${progress}%`,
            height: "100%",
            backgroundColor: "var(--md-sys-color-primary, var(--color-primary, #6750a4))",
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
          color: "var(--md-sys-color-on-surface-variant, #49454f)",
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
