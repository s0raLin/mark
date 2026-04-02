import IndexRouter from "./router/IndexRouter";
import { ErrorProvider } from "./contexts/ErrorContext";
import ErrorToast from "./components/ErrorToast";
import {
  ThemeProvider,
  Toaster,
  ToasterComponent,
  ToasterProvider,
} from "@gravity-ui/uikit";

import {
  StorageSyncProvider,
  useStorageSyncContext,
} from "./contexts/StorageContext";
import { useMemo } from "react";
import { FileSystemProvider } from "./contexts/FileSystemContext";
import Loading from "./components/Loading";
import { EditorStateProvider } from "./contexts/EditorStateContext";
import { MarkdownSyncProvider } from "./contexts/MarkdownSyncContext";
import {
  EditorThemeProvider,
  useEditorConfigContext,
} from "./contexts/EditorConfig/EditorThemeProvider";

function GravityThemeBridge({ children }: { children: React.ReactNode }) {
  const { darkMode } = useEditorConfigContext();
  const toaster = useMemo(() => new Toaster(), []);

  return (
    <ThemeProvider theme={darkMode ? "dark" : "light"}>
      <ToasterProvider toaster={toaster}>
        {children}
        <ToasterComponent />
      </ToasterProvider>
    </ThemeProvider>
  );
}

function AppContent() {
  const storageSync = useStorageSyncContext();

  const initialConfig = useMemo(
    () =>
      storageSync.isInitialized && storageSync.userData
        ? storageSync.userData.editorConfig
        : null,
    [storageSync.isInitialized, storageSync.userData],
  );

  return (
    <FileSystemProvider>
      <EditorThemeProvider initialConfig={initialConfig}>
        <GravityThemeBridge>
          <MarkdownSyncProvider>
            <EditorStateProvider>
              <ErrorProvider>
                <div className="h-screen flex flex-col overflow-hidden">
                  <div className="flex-1 overflow-hidden">
                    <IndexRouter />
                  </div>
                </div>
                <Loading message="正在加载数据..." show={storageSync.isLoading} />
                <ErrorToast />
              </ErrorProvider>
            </EditorStateProvider>
          </MarkdownSyncProvider>
        </GravityThemeBridge>
      </EditorThemeProvider>
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
