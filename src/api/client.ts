import axios, { AxiosInstance, AxiosError } from "axios";
import type {
  ApiResponse,
  ApiError,
  StorageUserSettings,
  StorageFileSystem,
  StorageEditorConfig,
  GetFileContentResponse,
  SaveFileContentResponse,
} from "./types";

// ===== 配置 =====
const API_BASE_URL = "/api";
const REQUEST_TIMEOUT = 10000; // 10秒超时

// ===== 创建 axios 实例 =====
const createAxiosInstance = (): AxiosInstance => {
  const instance = axios.create({
    baseURL: API_BASE_URL,
    timeout: REQUEST_TIMEOUT,
    headers: {
      "Content-Type": "application/json",
    },
  });

  // 请求拦截器
  instance.interceptors.request.use(
    (config) => {
      // 可以在这里添加认证 token
      return config;
    },
    (error) => {
      return Promise.reject(error);
    },
  );

  // 响应拦截器
  instance.interceptors.response.use(
    (response) => {
      return response;
    },
    (error: AxiosError<ApiError>) => {
      // 处理 HTTP 错误
      if (error.response) {
        const { status, data } = error.response;
        console.error(`API Error: ${status}`, data);
      } else if (error.request) {
        console.error("Network Error: No response received");
      } else {
        console.error("Request Error:", error.message);
      }
      return Promise.reject(error);
    },
  );

  return instance;
};

const apiClient = createAxiosInstance();

// ===== 工具函数 =====

/**
 * 提取响应数据，处理统一响应格式
 */
const extractData = <T>(response: { data: ApiResponse<T> }): T => {
  const { code, message, data } = response.data;
  if (code !== 0) {
    throw new Error(message || "Unknown error");
  }
  return data;
};

/**
 * 处理 API 错误
 */
const handleApiError = (error: unknown): never => {
  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      const apiError = error.response.data as ApiError;
      throw new Error(apiError.message || `HTTP ${error.response.status}`);
    }
    throw new Error(error.message || "Network error");
  }
  throw error;
};

// ===== API 方法 =====

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
 * 上传背景图片
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);
  const res = await fetch("/api/upload", { method: "POST", body: formData });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  const json: ApiResponse<{ url: string }> = await res.json();
  if (json.code !== 0) throw new Error(json.message || "Upload failed");
  return json.data;
}

/**
 * 上传自定义字体
 */
export async function uploadFont(file: File): Promise<{ url: string; fontFamily: string }> {
  const formData = new FormData();
  formData.append("font", file);
  const res = await fetch("/api/upload-font", { method: "POST", body: formData });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(`Upload failed: ${res.status} ${text}`);
  }
  const json: ApiResponse<{ url: string; fontFamily: string }> = await res.json();
  if (json.code !== 0) throw new Error(json.message || "Upload failed");
  return json.data;
}

// ===== 导出 =====
export default apiClient;
