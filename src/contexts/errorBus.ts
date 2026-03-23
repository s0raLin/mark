// 全局事件总线，让 apiClient 拦截器能触发 ErrorContext
// 支持队列：handler 注册前的错误会在注册后立即回放
type ErrorHandler = (status: number, message: string, detail?: string) => void;

type QueuedError = { status: number; message: string; detail?: string };

let handler: ErrorHandler | null = null;
const queue: QueuedError[] = [];

export const errorBus = {
  setHandler(fn: ErrorHandler) {
    handler = fn;
    while (queue.length > 0) {
      const err = queue.shift()!;
      fn(err.status, err.message, err.detail);
    }
  },
  emit(status: number, message: string, detail?: string) {
    if (handler) {
      handler(status, message, detail);
    } else {
      queue.push({ status, message, detail });
    }
  },
};
