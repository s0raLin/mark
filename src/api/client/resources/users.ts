import type {
  ApiResponse,
  SaveResponse,
  StorageEditorConfig,
  StorageFileSystem,
  StorageUserSettings,
} from "../types";
import { IPC_COMMANDS } from "../commands";
import {
  extractData,
  handleApiError,
  hasTauriRuntime,
  httpGet,
  httpSend,
  invokeCommand,
} from "../utils";

export async function getUserSettings(): Promise<StorageUserSettings> {
  try {
    if (!hasTauriRuntime()) {
      return httpGet<StorageUserSettings>("/users/me/settings");
    }

    const response = await invokeCommand<ApiResponse<StorageUserSettings>>(
      IPC_COMMANDS.users.getSettings,
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateUserSettings(data: {
  fileSystem: StorageFileSystem;
  editorConfig: StorageEditorConfig;
}): Promise<SaveResponse> {
  try {
    if (!hasTauriRuntime()) {
      return httpSend<SaveResponse>("/users/me/settings", {
        method: "PUT",
        body: JSON.stringify(data),
      });
    }

    const response = await invokeCommand<ApiResponse<SaveResponse>>(
      IPC_COMMANDS.users.updateSettings,
      {
        fileSystem: data.fileSystem,
        editorConfig: data.editorConfig,
      },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}
