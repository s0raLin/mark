export type ErrorSeverity = "error" | "warning" | "info";

export interface ErrorEvent {
  severity?: ErrorSeverity;
  title: string;
  message?: string;
  debugMessage?: string;
  status?: number;
  durationMs?: number;
  dedupeKey?: string;
}

type ErrorListener = (event: ErrorEvent) => void;

const listeners = new Set<ErrorListener>();
const queue: ErrorEvent[] = [];

function publish(event: ErrorEvent) {
  if (listeners.size === 0) {
    queue.push(event);
    return;
  }

  for (const listener of listeners) {
    listener(event);
  }
}

function formatDebugMessage(error: unknown) {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === "string") {
    return error;
  }
  return undefined;
}

export const errorBus = {
  subscribe(listener: ErrorListener) {
    listeners.add(listener);

    while (queue.length > 0) {
      const event = queue.shift();
      if (event) {
        listener(event);
      }
    }

    return () => {
      listeners.delete(listener);
    };
  },

  emit(event: ErrorEvent) {
    publish(event);
  },

  error(
    title: string,
    options?: Omit<ErrorEvent, "severity" | "title">,
  ) {
    publish({
      severity: "error",
      title,
      ...options,
    });
  },

  warning(
    title: string,
    options?: Omit<ErrorEvent, "severity" | "title">,
  ) {
    publish({
      severity: "warning",
      title,
      ...options,
    });
  },

  info(
    title: string,
    options?: Omit<ErrorEvent, "severity" | "title">,
  ) {
    publish({
      severity: "info",
      title,
      ...options,
    });
  },

  fromException(
    title: string,
    error: unknown,
    options?: Omit<ErrorEvent, "severity" | "title" | "debugMessage">,
  ) {
    publish({
      severity: "error",
      title,
      debugMessage: formatDebugMessage(error),
      ...options,
    });
  },
};
