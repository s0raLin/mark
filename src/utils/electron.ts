import {
  closeDesktopWindow,
  getDesktopWindowPosition,
  openExternalUrl,
  setDesktopWindowPosition,
} from "@/api/client/desktop";
import {
  getElectronIpc,
  hasElectronRuntime,
  hasTauriRuntime,
} from "@/api/client/runtime";

export { getElectronIpc, openExternalUrl };

export function isElectronRuntime() {
  return hasElectronRuntime();
}

export function isTauriRuntime() {
  return hasTauriRuntime();
}

export async function closeElectronWindow() {
  await closeDesktopWindow();
}

export async function getElectronWindowPosition() {
  return getDesktopWindowPosition();
}

export async function moveElectronWindow(position: { x: number; y: number }) {
  await setDesktopWindowPosition(position);
}
