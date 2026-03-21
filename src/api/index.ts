/**
 * API 模块导出
 * 统一管理所有前端 API 调用
 */

// 类型导出
export * from "./types";

// API 客户端和函数导出
export { default as apiClient } from "./client";
export {
  getUserData,
  saveUserData,
  getFileContent,
  saveFileContent,
  getFileSystem,
  saveFileSystem,
  getEditorConfig,
  saveEditorConfig,
  uploadImage,
  uploadFont,
} from "./client";
