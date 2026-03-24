import { ApiResponse, StorageEditorConfig, StorageFileSystem, StorageUserSettings } from "./types";
import apiClient, { extractData, handleApiError } from "./utils";


/**
 * 获取完整的用户数据（文件系统和编辑器配置）
 */
export async function getUserData(): Promise<StorageUserSettings> {
  try {
    const response = await apiClient.get<ApiResponse<StorageUserSettings>>(
      "/user/data",
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * 获取文件系统结构（不含文件内容）
 */
export async function getFileSystem(): Promise<StorageFileSystem> {
  try {
    const response = await apiClient.get<ApiResponse<StorageFileSystem>>(
      "/user/filesystem",
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}


/**
 * 获取编辑器配置
 */
export async function getEditorConfig(): Promise<StorageEditorConfig> {
  try {
    const response = await apiClient.get<ApiResponse<StorageEditorConfig>>(
      "/user/config",
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}



/**
 * 保存完整的用户数据
 */
export async function saveUserData(data: {
  fileSystem: StorageFileSystem;
  editorConfig: StorageEditorConfig;
}): Promise<{ success: boolean; updatedAt: number }> {
  try {
    const response = await apiClient.post<ApiResponse<{ success: boolean; updatedAt: number }>>(
      "/user/data",
      data,
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}


/**
 * 保存文件系统结构
 */
export async function saveFileSystem(
  fileSystem: StorageFileSystem,
): Promise<{ success: boolean; updatedAt: number }> {
  try {
    const response = await apiClient.put<ApiResponse<{ success: boolean; updatedAt: number }>>(
      "/user/filesystem",
      fileSystem,
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * 保存编辑器配置
 */
export async function saveEditorConfig(
  config: StorageEditorConfig,
): Promise<{ success: boolean; updatedAt: number }> {
  try {
    const response = await apiClient.put<ApiResponse<{ success: boolean; updatedAt: number }>>(
      "/user/config",
      config,
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}