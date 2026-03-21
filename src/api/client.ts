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
 */
export async function getFileContent(
  fileId: string,
): Promise<GetFileContentResponse> {
  try {
    const response = await apiClient.get<ApiResponse<GetFileContentResponse>>(
      `/files/${fileId}/content`,
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
      `/files/${fileId}/content`,
      { content },
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
 * 上传背景图片
 */
export async function uploadImage(file: File): Promise<{ url: string }> {
  const formData = new FormData();
  formData.append("image", file);
  try {
    const response = await apiClient.post<ApiResponse<{ url: string }>>(
      "/upload",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

/**
 * 上传自定义字体
 */
export async function uploadFont(file: File): Promise<{ url: string; fontFamily: string }> {
  const formData = new FormData();
  formData.append("font", file);
  try {
    const response = await apiClient.post<ApiResponse<{ url: string; fontFamily: string }>>(
      "/upload-font",
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return extractData(response);
  } catch (error) {
    handleApiError(error);
  }
}

// ===== 导出 =====
export default apiClient;
