import {
  StorageUserSettings,
  // getUserData,
  StorageFileSystem,
  StorageEditorConfig,
  // saveUserData,
} from "@/api/client";
import {getUserData, saveUserData} from "@/services/user"
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
  error: Error;
  userData: StorageUserSettings;
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

  // 防抖定时器引用
  const saveTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // 清除防抖定时器
  const clearSaveTimer = useCallback(() => {
    if (saveTimerRef.current) {
      clearTimeout(saveTimerRef.current);
      saveTimerRef.current = null;
    }
  }, []);

  // 加载用户数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        const data = await getUserData();
        setUserData(data);
        setIsInitialized(true);
      } catch (err) {
        console.error("加载用户数据失败:", err);
        setError(err instanceof Error ? err : new Error("加载失败"));
        // 使用默认数据继续运行
        setIsInitialized(true);
      } finally {
        setIsLoading(false);
      }
    };
    loadData();
  }, []);

  // 清理定时器
  useEffect(() => {
    return () => clearSaveTimer();
  }, [clearSaveTimer]);

  // 保存数据（防抖）
  const saveData = useCallback(
    async (data: {
      fileSystem: StorageFileSystem;
      editorConfig: StorageEditorConfig;
    }) => {
      clearSaveTimer();
      saveTimerRef.current = setTimeout(async () => {
        try {
          await saveUserData(data);
        } catch (err) {
          console.error("保存数据失败:", err);
          errorBus.emit(500, i18n.t("toast.saveFailed"));
        }
      }, 1000);
    },
    [clearSaveTimer],
  );

  // 立即保存
  const syncSave = useCallback(async () => {
    if (!userData) return;
    clearSaveTimer();
    try {
      await saveUserData({
        fileSystem: userData.fileSystem,
        editorConfig: userData.editorConfig,
      });
    } catch (err) {
      console.error("保存数据失败:", err);
      errorBus.emit(500, i18n.t("toast.saveFailed"));
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
  }, [isLoading, isInitialized, error, userData, saveData, syncSave]);
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
