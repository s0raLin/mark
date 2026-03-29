/**
 * API 统一响应格式
 * 所有后端 API 响应都遵循此格式
 */
export interface ApiResponse<T = unknown> {
  /** 响应状态码，0 表示成功 */
  code: number;
  /** 响应消息，成功时通常为空字符串 */
  message: string;
  /** 响应数据 */
  data: T;
}

/**
 * API 错误响应
 */
export interface ApiError {
  code: number;
  message: string;
  details?: string;
}

// ===== 编辑器相关类型 =====

/** CodeMirror 编辑器主题标识 */
export type EditorTheme =
  | "oneDark"
  | "githubLight"
  | "githubDark"
  | "vscodeDark"
  | "dracula"
  | "nord"
  | "sublime";

/** 预览区主题标识 */
export type PreviewTheme =
  | "theme-heart-classic"
  | "theme-heart-midnight"
  | "theme-heart-golden"
  | "theme-heart-organic";

/** 字体选项（内置 + 自定义） */
export type FontChoice =
  | "Quicksand"
  | "Bubblegum Sans"
  | "Patrick Hand"
  | "Comfortaa"
  | "Playfair Display"
  | (string & {}); // 允许自定义字体名

/** 用户上传的自定义字体 */
export interface CustomFont {
  name: string;
  url: string;
}

/**
 * 编辑器全局配置，可序列化为 JSON 文件保存/加载。
 * 所有字段均有默认值，加载时可做 partial merge。
 */
export interface EditorConfig {
  editorTheme: EditorTheme;
  previewTheme: PreviewTheme;
  fontChoice: FontChoice;
  fontSize: number;           // 保留兼容旧数据
  editorFontSize: number;     // px，范围 12–24
  previewFontSize: number;    // px，范围 12–24
  accentColor: string;
  blurAmount: number;
  bgImage: string;
  particlesOn: boolean;
  customFonts: CustomFont[];
}

/** 加载配置时使用，所有字段可选，缺失项回退到默认值 */
export type PartialEditorConfig = Partial<EditorConfig>;

export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  editorTheme:     "oneDark",
  previewTheme:    "theme-heart-classic",
  fontChoice:      "Quicksand",
  fontSize:        16,
  editorFontSize:  14,
  previewFontSize: 16,
  accentColor:     "#ff9a9e",
  blurAmount:      0,
  bgImage:         "",
  particlesOn:     false,
  customFonts:     [],
};

// ===== 文件系统相关类型 =====

/**
 * 文件节点（用于持久化）
 */
export interface StorageFileNode {
  id: string;
  name: string;
  type: "file" | "folder";
  parentId: string | null;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}

/**
 * 文件系统完整数据（用于持久化，文件内容存储在 .md 文件的 frontmatter 中）
 */
export interface StorageFileSystem {
  /** 所有文件/文件夹节点 */
  nodes: StorageFileNode[];
  /** 已置顶的文件/文件夹ID列表 */
  pinnedIds: string[];
  /** 根目录中节点的显示顺序 */
  explorerOrder: string[];
  /** 每个文件夹内节点的显示顺序 */
  folderOrder: Record<string, string[]>;
  /** 最后更新时间 */
  updatedAt: string; // ISO 8601
}

/**
 * 编辑器配置（用于持久化）
 */
export interface StorageEditorConfig {
  editorTheme: EditorTheme;
  previewTheme: PreviewTheme;
  fontChoice: FontChoice;
  editorFont: string;
  fontSize: number;        // 保留兼容旧数据
  editorFontSize: number;
  previewFontSize: number;
  accentColor: string;
  blurAmount: number;
  bgImage: string;
  particlesOn: boolean;
  lang: string;
  customFonts: CustomFont[];
  darkMode: boolean;
  autoSave: boolean;
  autoSaveInterval: number;
}

/**
 * 用户设置（用于持久化）
 */
export interface StorageUserSettings {
  /** 用户ID */
  userId: string;
  /** 用户名 */
  username: string;
  /** 用户邮箱 */
  email: string;
  /** 文件系统数据 */
  fileSystem: StorageFileSystem;
  /** 编辑器配置 */
  editorConfig: StorageEditorConfig;
  /** 最后更新时间 */
  updatedAt: string; // ISO 8601
}

// ===== API 请求/响应类型 =====

/**
 * 获取用户数据请求
 */
export type GetUserDataRequest = void;

/**
 * 获取用户数据响应
 */
export type GetUserDataResponse = StorageUserSettings;

/**
 * 保存用户数据请求
 */
export interface SaveUserDataRequest {
  fileSystem: StorageFileSystem;
  editorConfig: StorageEditorConfig;
}

/**
 * 保存用户数据响应
 */
export interface SaveUserDataResponse {
  success: boolean;
  updatedAt: string; // ISO 8601
}

export interface SaveResponse {
  success: boolean;
  updatedAt: string;
}

/**
 * 获取文件内容请求
 */
export interface GetFileContentRequest {
  /** 文件ID */
  id: string;
}

/**
 * 获取文件内容响应
 */
export interface GetFileContentResponse {
  id: string;
  content: string;
}

/**
 * 保存文件内容请求
 */
export interface SaveFileContentRequest {
  /** 文件ID */
  id: string;
  /** 文件内容 */
  content: string;
}

/**
 * 保存文件内容响应
 */
export interface SaveFileContentResponse {
  success: boolean;
  updatedAt: string;
}

export interface CreateNodeResponse {
  id: string;
  name: string;
  fileSystem: StorageFileSystem;
}

export interface MutateNodeResponse {
  id: string;
  fileSystem: StorageFileSystem;
}

export interface SearchFileResult {
  id: string;
  name: string;
  snippet: string;
  matchType: "name" | "content";
}

export interface WindowPosition {
  x: number;
  y: number;
}

export interface StoredUploadResponse {
  fileName: string;
  filePath: string;
  fontFamily?: string;
}

export interface UploadedImageAsset {
  name: string;
  url: string;
}
