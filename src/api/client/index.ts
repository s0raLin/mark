/**
 * API 模块导出
 * 统一管理所有前端 API 调用
 */

export * from "./types";
export { IPC_COMMANDS } from "./commands";
export { default as apiClient } from "./utils";

export { getUserSettings, updateUserSettings } from "./resources/users";
export { getEditorConfig, updateEditorConfig } from "./resources/editorConfig";
export { getFileSystemTree, updateFileSystemTree } from "./resources/fileSystem";
export {
  getFileContent,
  updateFileContent,
  createFileResource,
  createFolderResource,
  moveFileNode,
  renameFileNode,
  deleteFileNode,
} from "./resources/files";
export { queryFiles } from "./resources/search";
export { listSystemFonts } from "./desktop";

export {
  deleteUploadedImage,
  listUploadedImages,
  uploadImage,
  uploadFont,
} from "./upload";
