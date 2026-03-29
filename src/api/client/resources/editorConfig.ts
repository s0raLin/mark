import type {
  ApiResponse,
  SaveResponse,
  StorageEditorConfig,
} from "../types";
import { IPC_COMMANDS } from "../commands";
import { extractData, handleApiError, hasTauriRuntime, invokeCommand } from "../utils";
import { getUserSettings, updateUserSettings } from "./users";

export async function getEditorConfig(): Promise<StorageEditorConfig> {
  try {
    if (!hasTauriRuntime()) {
      const settings = await getUserSettings();
      return settings.editorConfig;
    }

    const response = await invokeCommand<ApiResponse<StorageEditorConfig>>(
      IPC_COMMANDS.editorConfig.get,
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateEditorConfig(
  editorConfig: StorageEditorConfig,
): Promise<SaveResponse> {
  try {
    if (!hasTauriRuntime()) {
      const settings = await getUserSettings();
      return updateUserSettings({
        fileSystem: settings.fileSystem,
        editorConfig,
      });
    }

    const response = await invokeCommand<ApiResponse<SaveResponse>>(
      IPC_COMMANDS.editorConfig.update,
      { editorConfig },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}
