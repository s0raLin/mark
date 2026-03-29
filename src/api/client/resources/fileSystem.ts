import type {
  ApiResponse,
  SaveResponse,
  StorageFileSystem,
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

export async function getFileSystemTree(): Promise<StorageFileSystem> {
  try {
    if (!hasTauriRuntime()) {
      return httpGet<StorageFileSystem>("/file-system");
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
      return httpSend<SaveResponse>("/file-system", {
        method: "PUT",
        body: JSON.stringify({ fileSystem }),
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
