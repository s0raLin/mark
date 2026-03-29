export {};

declare global {
  interface Window {
    __TAURI__?: {
      core: {
        invoke: <T = unknown>(
          cmd: string,
          args?: Record<string, unknown>,
        ) => Promise<T>;
      };
      // 可以根据需要添加其他 Tauri API
      [key: string]: unknown;
    };
    __TAURI_INTERNALS__?: unknown;
  }
}
