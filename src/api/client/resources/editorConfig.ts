import type {
  ApiResponse,
  SaveResponse,
  StorageEditorConfig,
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

export async function getEditorConfig(): Promise<StorageEditorConfig> {
  try {
    if (!hasTauriRuntime()) {
      return httpGet<StorageEditorConfig>("/editor-config");
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
      return httpSend<SaveResponse>("/editor-config", {
        method: "PUT",
        body: JSON.stringify({ editorConfig }),
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
