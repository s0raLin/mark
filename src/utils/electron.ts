import { IPC_COMMANDS } from "@/api/client/commands";
import type { WindowPosition } from "@/api/client/types";

interface ElectronIpcRenderer {
  send: (channel: string, ...args: unknown[]) => void;
  invoke: <T = unknown>(channel: string, ...args: unknown[]) => Promise<T>;
}

function requireElectron() {
  try {
    return (
      window as Window & {
        require?: (module: string) => { ipcRenderer?: ElectronIpcRenderer };
      }
    ).require?.("electron");
  } catch {
    return null;
  }
}

export function getElectronIpc() {
  return requireElectron()?.ipcRenderer ?? null;
}

function getTauriCore() {
  return (window as Window & {
    __TAURI__?: {
      core?: {
        invoke?: <T = unknown>(cmd: string, args?: Record<string, unknown>) => Promise<T>;
      };
    };
  }).__TAURI__?.core;
}

export function isElectronRuntime() {
  return !!getElectronIpc();
}

export function isTauriRuntime() {
  return typeof getTauriCore()?.invoke === "function";
}

export function sendElectronEvent(channel: string, ...args: unknown[]) {
  getElectronIpc()?.send(channel, ...args);
}

export async function invokeElectron<T = unknown>(
  channel: string,
  ...args: unknown[]
) {
  return getElectronIpc()?.invoke<T>(channel, ...args);
}

async function invokeTauriCommand<T = unknown>(channel: string, args?: Record<string, unknown>) {
  return getTauriCore()?.invoke?.<T>(channel, args);
}

export async function openExternalUrl(url: string) {
  if (isElectronRuntime()) {
    sendElectronEvent("open-external", url);
    return;
  }

  if (isTauriRuntime()) {
    await invokeTauriCommand(IPC_COMMANDS.desktop.openExternal, { url });
  }
}

export async function closeElectronWindow() {
  if (isElectronRuntime()) {
    sendElectronEvent("window-close");
    return;
  }

  if (isTauriRuntime()) {
    await invokeTauriCommand(IPC_COMMANDS.desktop.closeWindow);
  }
}

export async function getElectronWindowPosition() {
  if (isElectronRuntime()) {
    const position = await invokeElectron<[number, number]>("get-window-pos");
    return position ?? [0, 0];
  }

  if (isTauriRuntime()) {
    const position = await invokeTauriCommand<WindowPosition>(
      IPC_COMMANDS.desktop.getWindowPosition,
    );
    return position ? [position.x, position.y] as [number, number] : [0, 0];
  }

  return [0, 0] as [number, number];
}

export async function moveElectronWindow(position: { x: number; y: number }) {
  if (isElectronRuntime()) {
    sendElectronEvent("window-move", position);
    return;
  }

  if (isTauriRuntime()) {
    await invokeTauriCommand(IPC_COMMANDS.desktop.setWindowPosition, position);
  }
}
