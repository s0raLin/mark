/**
 * API 模块导出
 * 统一管理所有前端 API 调用
 */

// 类型导出
export * from "./types";

// API 客户端和函数导出
export { default as apiClient } from "./utils";

// 用户数据相关 API
export {
  getUserData,
  saveUserData,
  getFileSystem,
  saveFileSystem,
  getEditorConfig,
  saveEditorConfig,
} from "./user";

// 文件操作相关 API
export {
  getFileContent,
  saveFileContent,
  createFileOnServer,
  createFolderOnServer,
  moveNodeOnServer,
  renameNodeOnServer,
  deleteNodeOnServer,
  searchFiles,
} from "./file";

// 上传相关 API
export {
  uploadImage,
  uploadFont,
} from "./upload";

