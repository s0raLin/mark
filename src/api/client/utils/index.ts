import axios, { AxiosInstance, AxiosError } from "axios";
import { errorBus } from "@/contexts/errorBus";
import type {
  ApiResponse,
  ApiError,
} from "@/api/client/types";

// ===== 配置 =====
// 开发环境使用相对路径（通过vite代理），生产环境使用完整URL
const API_BASE_URL = import.meta.env.DEV ? "/api" : "http://localhost:8080/api";
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
      if (error.response) {
        const { status, data } = error.response;
        if (status >= 400) {
          const message = (data as ApiError)?.message || `请求失败 (${status})`;
          const detail = status >= 500 ? "服务器内部错误，请稍后重试" : undefined;
          errorBus.emit(status, message, detail);
        }
        console.error(`API Error: ${status}`, data);
      } else if (error.request) {
        errorBus.emit(0, "网络错误", "无法连接到服务器，请检查网络");
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
export function extractData<T>(response: { data: ApiResponse<T> }): T {
  const { code, message, data } = response.data;
  if (code !== 0) {
    throw new Error(message || "Unknown error");
  }
  return data;
};

/**
 * 处理 API 错误
 */
export function handleApiError(error: unknown): never {
  if (axios.isAxiosError(error)) {
    if (error.response?.data) {
      const apiError = error.response.data as ApiError;
      throw new Error(apiError.message || `HTTP ${error.response.status}`);
    }
    throw new Error(error.message || "Network error");
  }
  throw error;
};



// ===== 导出 =====
export default apiClient;

