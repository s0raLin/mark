import type {
  ApiResponse,
  SaveResponse,
  StorageFileSystem,
} from "../types";
import { IPC_COMMANDS } from "../commands";
import { extractData, handleApiError, hasTauriRuntime, invokeCommand } from "../utils";
import { getUserSettings, updateUserSettings } from "./users";

export async function getFileSystemTree(): Promise<StorageFileSystem> {
  try {
    if (!hasTauriRuntime()) {
      const settings = await getUserSettings();
      return settings.fileSystem;
    }

    const response = await invokeCommand<ApiResponse<StorageFileSystem>>(
      IPC_COMMANDS.fileSystem.getTree,
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateFileSystemTree(
  fileSystem: StorageFileSystem,
): Promise<SaveResponse> {
  try {
    if (!hasTauriRuntime()) {
      const settings = await getUserSettings();
      return updateUserSettings({
        fileSystem,
        editorConfig: settings.editorConfig,
      });
    }

    const response = await invokeCommand<ApiResponse<SaveResponse>>(
      IPC_COMMANDS.fileSystem.updateTree,
      { fileSystem },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}
