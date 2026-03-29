import { IPC_COMMANDS } from "./commands";
import type { ApiResponse } from "./types";
import { extractData, hasTauriRuntime, invokeCommand } from "./utils";
import { getElectronIpc, getDesktopRuntime } from "./runtime";

export interface DesktopWindowPosition extends Record<string, unknown> {
  x: number;
  y: number;
}

async function invokeDesktopCommand<T>(
  command: string,
  args?: Record<string, unknown>,
) {
  if (!hasTauriRuntime()) {
    return null;
  }

  return invokeCommand<T>(command, args);
}

export async function listSystemFonts(): Promise<string[]> {
  if (hasTauriRuntime()) {
    const response = await invokeCommand<ApiResponse<string[]>>(
      IPC_COMMANDS.desktop.listSystemFonts,
    );
    return extractData(response);
  }

  const fonts = await getElectronIpc()?.invoke<string[]>("list-system-fonts");
  return Array.isArray(fonts) ? fonts : [];
}

export async function openExternalUrl(url: string) {
  if (getDesktopRuntime() === "electron") {
    getElectronIpc()?.send("open-external", url);
    return;
  }

  await invokeDesktopCommand<void>(IPC_COMMANDS.desktop.openExternal, { url });
}

export async function closeDesktopWindow() {
  if (getDesktopRuntime() === "electron") {
    getElectronIpc()?.send("window-close");
    return;
  }

  await invokeDesktopCommand<void>(IPC_COMMANDS.desktop.closeWindow);
}

export async function getDesktopWindowPosition(): Promise<[number, number]> {
  if (getDesktopRuntime() === "electron") {
    const position = await getElectronIpc()?.invoke<[number, number]>("get-window-pos");
    return position ?? [0, 0];
  }

  const position = await invokeDesktopCommand<DesktopWindowPosition>(
    IPC_COMMANDS.desktop.getWindowPosition,
  );

  return position ? [position.x, position.y] : [0, 0];
}

export async function setDesktopWindowPosition(position: DesktopWindowPosition) {
  if (getDesktopRuntime() === "electron") {
    getElectronIpc()?.send("window-move", position);
    return;
  }

  await invokeDesktopCommand<void>(IPC_COMMANDS.desktop.setWindowPosition, position);
}

export async function saveDesktopTextFile(
  fileName: string,
  content: string,
  filters?: Array<{ name: string; extensions: string[] }>,
) {
  if (getDesktopRuntime() !== "tauri") {
    return false;
  }

  return (await invokeDesktopCommand<boolean>(
    IPC_COMMANDS.desktop.saveTextFile,
    { fileName, content, filters },
  )) ?? false;
}
