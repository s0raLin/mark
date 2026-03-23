import { createContext, useContext, useState, useCallback, useRef, useEffect } from "react";
import { errorBus } from "./errorBus";

export interface AppError {
  id: string;
  status?: number;
  message: string;
  detail?: string;
}

interface ErrorContextValue {
  errors: AppError[];
  pushError: (err: Omit<AppError, "id">) => void;
  dismissError: (id: string) => void;
}

const ErrorContext = createContext<ErrorContextValue | null>(null);

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [errors, setErrors] = useState<AppError[]>([]);
  const counterRef = useRef(0);

  const pushError = useCallback((err: Omit<AppError, "id">) => {
    const id = `err-${++counterRef.current}`;
    setErrors((prev) => [...prev, { ...err, id }]);
    // 5 秒后自动消失
    setTimeout(() => {
      setErrors((prev) => prev.filter((e) => e.id !== id));
    }, 5000);
  }, []);

  // 注册到 errorBus，让 apiClient 拦截器能触发
  useEffect(() => {
    errorBus.setHandler((status, message, detail) => {
      pushError({ status, message, detail });
    });
  }, [pushError]);

  const dismissError = useCallback((id: string) => {
    setErrors((prev) => prev.filter((e) => e.id !== id));
  }, []);

  return (
    <ErrorContext.Provider value={{ errors, pushError, dismissError }}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const ctx = useContext(ErrorContext);
  if (!ctx) throw new Error("useError must be used within ErrorProvider");
  return ctx;
}
