import { IPC_COMMANDS } from "./commands";
import type { ApiResponse } from "./types";
import { extractData, hasTauriRuntime, invokeCommand } from "./utils";

function getElectronIpc() {
  try {
    return window.require?.("electron")?.ipcRenderer;
  } catch {
    return null;
  }
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
