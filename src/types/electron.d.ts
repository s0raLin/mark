export {};

declare global {
  interface Window {
    require?: (module: string) => {
      ipcRenderer?: {
        send: (channel: string, ...args: unknown[]) => void;
        on: (channel: string, callback: (...args: unknown[]) => void) => void;
        removeListener: (channel: string, callback: (...args: unknown[]) => void) => void;
      };
    };
  }
}
