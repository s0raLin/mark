// 编辑器相关的共享类型。

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
  // 主题
  editorTheme: EditorTheme;
  previewTheme: PreviewTheme;

  // 排版
  fontChoice: FontChoice;
  fontSize: number;         // px，范围 12–24

  // 外观
  accentColor: string;      // CSS hex，如 "#ff9a9e"
  blurAmount: number;       // px，范围 0–24，控制编辑区磨砂强度
  bgImage: string;          // 背景图 URL，空字符串表示无背景

  // 特效
  particlesOn: boolean;

  // 自定义字体列表
  customFonts: CustomFont[];
}

/** 加载配置时使用，所有字段可选，缺失项回退到默认值 */
export type PartialEditorConfig = Partial<EditorConfig>;

/** 默认配置，作为 fallback */
export const DEFAULT_EDITOR_CONFIG: EditorConfig = {
  editorTheme:  "oneDark",
  previewTheme: "theme-heart-classic",
  fontChoice:   "Quicksand",
  fontSize:     16,
  accentColor:  "#ff9a9e",
  blurAmount:   0,
  bgImage:      "",
  particlesOn:  false,
  customFonts:  [],
};

