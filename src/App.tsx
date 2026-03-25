import IndexRouter from "./router/IndexRouter";
import { ErrorProvider } from "./contexts/ErrorContext";
import ErrorToast from "./components/ErrorToast";

import {
  StorageSyncProvider,
  useStorageSyncContext,
} from "./contexts/StorageContext";
import { useMemo } from "react";
import { EditorThemeProvider } from "./contexts/EditorConfigContext";
import { FileSystemProvider } from "./contexts/FileSystemContext";
import Loading from "./components/Loading";
import { FileOperationsProvider } from "./contexts/FileOperationContext";
import { EditorStateProvider } from "./contexts/EditorStateContext";
import { MarkdownSyncProvider } from "./contexts/MarkdownSyncContext";

function AppContent() {
  const storageSync = useStorageSyncContext();

  const initialConfig = useMemo(
    () =>
      storageSync.isInitialized && storageSync.userData
        ? storageSync.userData.editorConfig
        : null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [storageSync.isInitialized],
  );

  // 加载状态显示
  if (storageSync.isLoading) {
    return <Loading message="正在加载数据..." show={true} />;
  }

  return (
    <FileSystemProvider>
      <FileOperationsProvider>
        <EditorThemeProvider initialConfig={initialConfig}>
          <EditorStateProvider>
            <MarkdownSyncProvider>
              <ErrorProvider>
                <div className="h-screen flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-hidden">
                    <IndexRouter />
                  </div>
                </div>
                <ErrorToast />
              </ErrorProvider>
            </MarkdownSyncProvider>
          </EditorStateProvider>
        </EditorThemeProvider>
      </FileOperationsProvider>
    </FileSystemProvider>
  );
}

export default function App() {
  return (
    <StorageSyncProvider>
      <AppContent />
    </StorageSyncProvider>
  );
}
