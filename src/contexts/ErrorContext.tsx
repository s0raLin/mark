import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import { errorBus, type ErrorEvent, type ErrorSeverity } from "./errorBus";

export interface AppNotification {
  id: string;
  severity: ErrorSeverity;
  title: string;
  message?: string;
  debugMessage?: string;
  status?: number;
  durationMs: number;
  dedupeKey?: string;
}

interface ErrorContextValue {
  notifications: AppNotification[];
  notify: (event: ErrorEvent) => void;
  dismissNotification: (id: string) => void;
}

const DEFAULT_DURATION_MS = 4200;
const ErrorContext = createContext<ErrorContextValue | null>(null);

function normalizeEvent(
  id: string,
  event: ErrorEvent,
): AppNotification {
  return {
    id,
    severity: event.severity ?? "error",
    title: event.title,
    message: event.message,
    debugMessage: event.debugMessage,
    status: event.status,
    durationMs: event.durationMs ?? DEFAULT_DURATION_MS,
    dedupeKey: event.dedupeKey,
  };
}

export function ErrorProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);
  const counterRef = useRef(0);
  const timersRef = useRef<Map<string, ReturnType<typeof setTimeout>>>(new Map());
  const notificationsRef = useRef<AppNotification[]>([]);

  const dismissNotification = useCallback((id: string) => {
    const timer = timersRef.current.get(id);
    if (timer) {
      clearTimeout(timer);
      timersRef.current.delete(id);
    }
    setNotifications((prev) => prev.filter((item) => item.id !== id));
  }, []);

  useEffect(() => {
    notificationsRef.current = notifications;
  }, [notifications]);

  const scheduleDismiss = useCallback(
    (id: string, durationMs: number) => {
      const existingTimer = timersRef.current.get(id);
      if (existingTimer) {
        clearTimeout(existingTimer);
      }
      const timer = setTimeout(() => {
        dismissNotification(id);
      }, durationMs);
      timersRef.current.set(id, timer);
    },
    [dismissNotification],
  );

  const notify = useCallback(
    (event: ErrorEvent) => {
      const existingId = event.dedupeKey
        ? notificationsRef.current.find((item) => item.dedupeKey === event.dedupeKey)?.id
        : undefined;
      const id = existingId ?? `notice-${++counterRef.current}`;
      const nextNotification = normalizeEvent(id, event);

      setNotifications((prev) => {
        const hasExisting = prev.some((item) => item.id === id);
        if (hasExisting) {
          return prev.map((item) => (item.id === id ? nextNotification : item));
        }
        return [...prev, nextNotification];
      });

      scheduleDismiss(id, nextNotification.durationMs);
    },
    [scheduleDismiss],
  );

  useEffect(() => {
    return errorBus.subscribe(notify);
  }, [notify]);

  useEffect(() => {
    return () => {
      for (const timer of timersRef.current.values()) {
        clearTimeout(timer);
      }
      timersRef.current.clear();
    };
  }, []);

  const contextValue = useMemo(
    () => ({
      notifications,
      notify,
      dismissNotification,
    }),
    [dismissNotification, notifications, notify],
  );

  return (
    <ErrorContext.Provider value={contextValue}>
      {children}
    </ErrorContext.Provider>
  );
}

export function useError() {
  const context = useContext(ErrorContext);
  if (!context) {
    throw new Error("useError must be used within ErrorProvider");
  }
  return context;
}
