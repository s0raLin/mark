import { errorBus } from "@/contexts/errorBus";
import type { ApiResponse } from "@/api/client/types";

type InvokeArgs = Record<string, unknown> | undefined;

// 运行时适配层：
// - Tauri 模式：优先通过 `invoke` 调后端 command
// - Electron 模式：回退到本地 `/api` 服务
//
// 业务层不应该关心自己当前跑在哪个桌面壳中，只应该调用资源客户端。
export function hasTauriRuntime() {
  return typeof window !== "undefined" && !!window.__TAURI__?.core?.invoke;
}

export function hasElectronRuntime() {
  if (typeof window === "undefined") return false;
  try {
    return typeof (window as Window & { require?: (module: string) => unknown }).require === "function";
  } catch {
    return false;
  }
}

function getTauriInvoke() {
  const invoke = window.__TAURI__?.core?.invoke;
  if (!invoke) {
    throw new Error("Tauri IPC is unavailable in the current runtime");
  }
  return invoke;
}

function getApiBaseUrl() {
  // Electron 模式下，主进程会起一个本地服务并把 `/api` 代理到 Go 后端。
  return "/api";
}

export async function invokeCommand<T>(
  cmd: string,
  args?: InvokeArgs,
): Promise<T> {
  try {
    return await getTauriInvoke()<T>(cmd, args);
  } catch (error) {
    const friendlyError = getFriendlyInvokeError(error);
    errorBus.error(friendlyError.title, friendlyError);
    throw error;
  }
}

export async function httpGet<T>(path: string): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`);
  return parseHttpResponse<T>(response);
}

export async function httpSend<T>(
  path: string,
  init?: RequestInit,
): Promise<T> {
  // 这里默认按 JSON 发送。
  // 上传类接口仍然应单独处理，不应复用这个 helper。
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(init?.headers ?? {}),
    },
    ...init,
  });
  return parseHttpResponse<T>(response);
}

async function parseHttpResponse<T>(response: Response): Promise<T> {
  let payload: ApiResponse<T> | null = null;

  try {
    payload = (await response.json()) as ApiResponse<T>;
  } catch {
    payload = null;
  }

  if (!response.ok || !payload) {
    const message = payload?.message || `HTTP ${response.status}`;
    errorBus.error("操作没有完成", {
      message: "本地服务暂时不可用，请稍后重试。",
      debugMessage: message,
      status: response.status,
      dedupeKey: `http:${response.status}:${message}`,
    });
    throw new Error(message);
  }

  return extractData(payload);
}

function getFriendlyInvokeError(error: unknown) {
  const debugMessage =
    error instanceof Error ? error.message : "IPC request failed";

  if (debugMessage.includes("Tauri IPC is unavailable")) {
    // 这个提示本身不是致命错误。
    // 对 Electron 兼容链路来说，它只是在说明“当前没走 Tauri，而会继续走 HTTP 回退”。
    return {
      title: "当前运行在 Electron 模式",
      message: "桌面 IPC 不可用时会自动切换到本地服务接口。",
      debugMessage,
      dedupeKey: "ipc-unavailable",
      severity: "warning" as const,
      durationMs: 2600,
    };
  }

  return {
    title: "操作没有完成",
    message: "和本地后端通信时发生了问题，请稍后重试。",
    debugMessage,
    dedupeKey: "ipc-command-failed",
  };
}

export function extractData<T>(response: ApiResponse<T>): T {
  if (response.code !== 0) {
    throw new Error(response.message || "Unknown backend error");
  }
  return response.data;
}

export function handleApiError(error: unknown): never {
  if (error instanceof Error) {
    throw error;
  }
  throw new Error("Unknown IPC error");
}

const apiClient = {
  invoke: invokeCommand,
};

export default apiClient;
