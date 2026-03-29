import type {
  ApiResponse,
  CreateNodeResponse,
  GetFileContentResponse,
  MutateNodeResponse,
  SaveFileContentResponse,
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
import { getFileSystemTree } from "./fileSystem";

export async function getFileContent(
  id: string,
): Promise<GetFileContentResponse> {
  try {
    if (!hasTauriRuntime()) {
      return httpGet<GetFileContentResponse>(`/file/${id}/content`);
    }

    const response = await invokeCommand<ApiResponse<GetFileContentResponse>>(
      IPC_COMMANDS.files.getContent,
      { id },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function updateFileContent(
  id: string,
  content: string,
): Promise<SaveFileContentResponse> {
  try {
    if (!hasTauriRuntime()) {
      return httpSend<SaveFileContentResponse>(`/file/${id}/content`, {
        method: "PUT",
        body: JSON.stringify({ content }),
      });
    }

    const response = await invokeCommand<ApiResponse<SaveFileContentResponse>>(
      IPC_COMMANDS.files.updateContent,
      { id, content },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function createFileResource(
  parentId: string,
  name: string,
  content: string,
): Promise<CreateNodeResponse> {
  try {
    if (!hasTauriRuntime()) {
      const data = await httpSend<{ id: string; name: string }>("/files/create", {
        method: "POST",
        body: JSON.stringify({ parentId, name, content }),
      });
      return {
        ...data,
        fileSystem: await getFileSystemTree(),
      };
    }

    const response = await invokeCommand<ApiResponse<CreateNodeResponse>>(
      IPC_COMMANDS.files.create,
      { parentId, name, content },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function createFolderResource(
  parentId: string,
  name: string,
): Promise<CreateNodeResponse> {
  try {
    if (!hasTauriRuntime()) {
      const data = await httpSend<{ id: string; name: string }>("/files/mkdir", {
        method: "POST",
        body: JSON.stringify({ parentId, name }),
      });
      return {
        ...data,
        fileSystem: await getFileSystemTree(),
      };
    }

    const response = await invokeCommand<ApiResponse<CreateNodeResponse>>(
      IPC_COMMANDS.folders.create,
      { parentId, name },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function moveFileNode(
  id: string,
  newParentId: string,
): Promise<MutateNodeResponse> {
  try {
    if (!hasTauriRuntime()) {
      const data = await httpSend<{ id: string }>("/files/move", {
        method: "POST",
        body: JSON.stringify({ id, newParentId }),
      });
      return {
        ...data,
        fileSystem: await getFileSystemTree(),
      };
    }

    const response = await invokeCommand<ApiResponse<MutateNodeResponse>>(
      IPC_COMMANDS.fileNodes.move,
      { id, newParentId },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function renameFileNode(
  id: string,
  newName: string,
): Promise<MutateNodeResponse> {
  try {
    if (!hasTauriRuntime()) {
      const data = await httpSend<{ id: string }>("/files/rename", {
        method: "POST",
        body: JSON.stringify({ id, newName }),
      });
      return {
        ...data,
        fileSystem: await getFileSystemTree(),
      };
    }

    const response = await invokeCommand<ApiResponse<MutateNodeResponse>>(
      IPC_COMMANDS.fileNodes.rename,
      { id, newName },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

export async function deleteFileNode(id: string): Promise<StorageFileSystem> {
  try {
    if (!hasTauriRuntime()) {
      await httpSend<{ success: boolean }>(`/file/${id}`, {
        method: "DELETE",
      });
      return getFileSystemTree();
    }

    const response = await invokeCommand<ApiResponse<StorageFileSystem>>(
      IPC_COMMANDS.fileNodes.delete,
      { id },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}
