export type DesktopRuntime = "web" | "electron" | "tauri";

export interface ElectronIpcRenderer {
  send: (channel: string, ...args: unknown[]) => void;
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;
}

export function getElectronIpc() {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.require?.("electron")?.ipcRenderer ?? null;
  } catch {
    return null;
  }
}

export function hasElectronRuntime() {
  return Boolean(getElectronIpc());
}

export function hasTauriRuntime() {
  if (typeof window === "undefined") {
    return false;
  }

  const userAgent = typeof navigator !== "undefined" ? navigator.userAgent : "";
  return Boolean(
    window.__TAURI__?.core?.invoke
      || window.__TAURI_INTERNALS__
      || userAgent.includes("Tauri"),
  );
}

export function getDesktopRuntime(): DesktopRuntime {
  if (hasTauriRuntime()) {
    return "tauri";
  }

  if (hasElectronRuntime()) {
    return "electron";
  }

  return "web";
}

export function supportsDesktopShell() {
  return getDesktopRuntime() !== "web";
}
