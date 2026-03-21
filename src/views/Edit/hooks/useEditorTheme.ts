import { useState } from "react";
import { EditorTheme, PreviewTheme, FontChoice } from "@/src/types/editor";

/**
 * useEditorTheme Hook 返回值接口
 */
export interface UseEditorThemeReturn {
  /** 代码编辑器主题 */
  editorTheme: EditorTheme;
  /** 预览区域主题 */
  previewTheme: PreviewTheme;
  /** 字体选择 */
  fontChoice: FontChoice;
  /** 设置代码编辑器主题 */
  setEditorTheme: React.Dispatch<React.SetStateAction<EditorTheme>>;
  /** 设置预览区域主题 */
  setPreviewTheme: React.Dispatch<React.SetStateAction<PreviewTheme>>;
  /** 设置字体选择 */
  setFontChoice: React.Dispatch<React.SetStateAction<FontChoice>>;
}

/**
 * 编辑器主题Hook
 * 管理编辑器和预览的主题配置
 * 
 * @returns 主题状态和setter函数
 */
export function useEditorTheme(): UseEditorThemeReturn {
  /** 代码编辑器的主题（如oneDark, github等） */
  const [editorTheme, setEditorTheme] = useState<EditorTheme>("oneDark");

  /** 预览区域的主题（如theme-heart-classic等） */
  const [previewTheme, setPreviewTheme] = useState<PreviewTheme>(
    "theme-heart-classic",
  );

  /** 编辑器使用的字体 */
  const [fontChoice, setFontChoice] = useState<FontChoice>("Quicksand");

  return {
    editorTheme,
    previewTheme,
    fontChoice,
    setEditorTheme,
    setPreviewTheme,
    setFontChoice,
  };
}
