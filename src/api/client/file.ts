
import { ApiResponse, GetFileContentResponse, SaveFileContentResponse } from "./types";
import apiClient, { extractData, handleApiError } from "./utils";

/**
 * 获取单个文件的内容
 * fileId 是相对路径，如 "note.md" 或 "h1/note.md"
 */
export async function getFileContent(
  fileId: string,
): Promise<GetFileContentResponse> {
  try {
    const response = await apiClient.get<ApiResponse<GetFileContentResponse>>(
      `/file/${fileId}/content`,
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}


/**
 * 搜索文件（文件名 + 内容）
 */
export async function searchFiles(query: string): Promise<Array<{ id: string; name: string; snippet: string; matchType: "name" | "content" }>> {
  try {
    const response = await apiClient.get<ApiResponse<Array<{ id: string; name: string; snippet: string; matchType: "name" | "content" }>>>(
      "/files/search",
      { params: { q: query } },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}


/**
 * 保存单个文件的内容
 */
export async function saveFileContent(
  fileId: string,
  content: string,
): Promise<SaveFileContentResponse> {
  try {
    const response = await apiClient.put<ApiResponse<SaveFileContentResponse>>(
      `/file/${fileId}/content`,
      { content },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * 在服务端创建文件，返回真实 ID（相对路径）
 */
export async function createFileOnServer(
  parentId: string,
  name: string,
  content: string,
): Promise<{ id: string; name: string }> {
  try {
    const response = await apiClient.post<ApiResponse<{ id: string; name: string }>>(
      "/files/create",
      { parentId, name, content },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * 在服务端创建文件夹，返回真实 ID（相对路径）
 */
export async function createFolderOnServer(
  parentId: string,
  name: string,
): Promise<{ id: string; name: string }> {
  try {
    const response = await apiClient.post<ApiResponse<{ id: string; name: string }>>(
      "/files/mkdir",
      { parentId, name },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * 移动节点到新父目录，返回新 ID
 */
export async function moveNodeOnServer(
  id: string,
  newParentId: string,
): Promise<{ id: string }> {
  try {
    const response = await apiClient.post<ApiResponse<{ id: string }>>(
      "/files/move",
      { id, newParentId },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * 重命名节点，返回新 ID
 */
export async function renameNodeOnServer(
  id: string,
  newName: string,
): Promise<{ id: string }> {
  try {
    const response = await apiClient.post<ApiResponse<{ id: string }>>(
      "/files/rename",
      { id, newName },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * 删除节点（文件或目录）
 */
export async function deleteNodeOnServer(id: string): Promise<void> {
  try {
    await apiClient.delete(`/file/${id}`);
  } catch (error) {
    handleApiError(error);
  }
}
