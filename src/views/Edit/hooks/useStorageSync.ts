import { useState, useEffect, useCallback, useRef } from "react";
import { getUserData, saveUserData } from "../../../api/client";
import type { StorageFileSystem, StorageEditorConfig, StorageUserSettings } from "../../../api/types";
import { errorBus } from "../../../contexts/errorBus";
import i18n from "../../../i18n";

/**
 * useStorageSync Hook - 负责数据加载和保存
 * 
 * 职责：
 * 1. 应用启动时从后端加载用户数据
 * 2. 数据变化时自动保存（防抖）
 * 3. 提供同步保存方法
 */
export function useStorageSync() {
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
  const saveData = useCallback(async (data: { fileSystem: StorageFileSystem; editorConfig: StorageEditorConfig }) => {
    clearSaveTimer();
    saveTimerRef.current = setTimeout(async () => {
      try {
        await saveUserData(data);
      } catch (err) {
        console.error("保存数据失败:", err);
        errorBus.emit(500, i18n.t("toast.saveFailed"));
      }
    }, 1000);
  }, [clearSaveTimer]);

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

  return {
    isLoading,
    isInitialized,
    error,
    userData,
    saveData,
    syncSave,
  };
}
