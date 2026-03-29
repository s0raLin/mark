import {
  getUserSettings,
  StorageUserSettings,
  StorageFileSystem,
  StorageEditorConfig,
  updateUserSettings,
} from "@/api/client";
import i18n from "@/i18n";
import {
  useState,
  useRef,
  useCallback,
  useEffect,
  ReactNode,
  useContext,
  useMemo,
} from "react";
import { errorBus } from "./errorBus";
import { createContext } from "react";

const StorageSyncContext = createContext<StorageSyncContextProps | undefined>(
  undefined,
);

interface StorageSyncContextProps {
  isLoading: boolean;
  isInitialized: boolean;
  error: Error | null;
  userData: StorageUserSettings | null;
  saveData: (data: {
    fileSystem: StorageFileSystem;
    editorConfig: StorageEditorConfig;
  }) => Promise<void>;
  syncSave: () => Promise<void>;
}

interface StorageSyncProps {
  children: ReactNode;
}

export function StorageSyncProvider({ children }: StorageSyncProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [isInitialized, setIsInitialized] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [userData, setUserData] = useState<StorageUserSettings | null>(null);

  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        // 应用启动时优先获取完整用户设置，再由各领域 context 自行拆分消费。
        const data = await getUserSettings();
        setUserData(data);
        setIsInitialized(true);
      } catch (err) {
        console.error("加载用户数据失败:", err);
        const nextError = err instanceof Error ? err : new Error("加载失败");
        setError(nextError);
        errorBus.fromException("初始化数据加载失败", err, {
          message: "应用已使用默认状态继续启动，你可以稍后再试一次。",
          dedupeKey: "load-user-data",
          durationMs: 5200,
        });
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  useEffect(() => {
    return () => clearSaveTimer();
  }, [clearSaveTimer]);

  const saveData = useCallback(
    async (data: {
      fileSystem: StorageFileSystem;
      editorConfig: StorageEditorConfig;
    }): Promise<void> => {
      clearSaveTimer();
      saveTimerRef.current = setTimeout(async () => {
        try {
          // 这里保存的是“整体用户设置”。
          // 文件内容本身由 MarkdownSyncContext 单独写入真实文件。
          await updateUserSettings(data);
        } catch (err) {
          console.error("保存数据失败:", err);
          errorBus.fromException(i18n.t("toast.saveFailed"), err, {
            message: "设置和文件结构暂时没有同步到本地，请稍后重试。",
            dedupeKey: "save-user-data",
          });
        }
      }, 1000);
    },
    [clearSaveTimer],
  );

  const syncSave = useCallback(async () => {
    if (!userData) return;
    clearSaveTimer();
    try {
      await updateUserSettings({
        fileSystem: userData.fileSystem,
        editorConfig: userData.editorConfig,
      });
    } catch (err) {
      console.error("保存数据失败:", err);
      errorBus.fromException(i18n.t("toast.saveFailed"), err, {
        message: "设置和文件结构暂时没有同步到本地，请稍后重试。",
        dedupeKey: "save-user-data",
      });
    }
  }, [userData, clearSaveTimer]);

  const context = useMemo(() => {
    return {
      isLoading,
      isInitialized,
      error,
      userData,
      saveData,
      syncSave,
    };
  }, [error, isInitialized, isLoading, saveData, syncSave, userData]);
  return (
    <StorageSyncContext.Provider value={context}>
      {children}
    </StorageSyncContext.Provider>
  );
}

export function useStorageSyncContext() {
  const context = useContext(StorageSyncContext);
  if (!context) {
    throw new Error("useStorageContext must be used within StorageProvider");
  }

  return context;
}
