import {
  EditorTheme,
  FontChoice,
  PreviewTheme,
  StorageEditorConfig,
} from "@/api/client";
import { syncPreviewThemeWithMode } from "./constants/editorTheme";
import React, {
  createContext,
  ReactNode,
  useCallback,
  useContext,
  useState,
} from "react";
import { useEditorThemeEffects } from "./hooks/useEditorThemeEffects";

export interface EditorConfigContextProps {
  editorTheme: EditorTheme;
  previewTheme: PreviewTheme;
  fontChoice: FontChoice;
  editorFont: string;
  fontSize: number;
  editorFontSize: number;
  previewFontSize: number;
  accentColor: string;
  blurAmount: number;
  bgImage: string;
  particlesOn: boolean;
  darkMode: boolean;
  lang: string;
  customFonts: Array<{ name: string; url: string }>;
  autoSave: boolean;
  autoSaveInterval: number;
  setEditorTheme: React.Dispatch<React.SetStateAction<EditorTheme>>;
  setPreviewTheme: React.Dispatch<React.SetStateAction<PreviewTheme>>;
  setFontChoice: React.Dispatch<React.SetStateAction<FontChoice>>;
  setEditorFont: React.Dispatch<React.SetStateAction<string>>;
  setFontSize: React.Dispatch<React.SetStateAction<number>>;
  setEditorFontSize: React.Dispatch<React.SetStateAction<number>>;
  setPreviewFontSize: React.Dispatch<React.SetStateAction<number>>;
  setAccentColor: React.Dispatch<React.SetStateAction<string>>;
  setBlurAmount: React.Dispatch<React.SetStateAction<number>>;
  setBgImage: React.Dispatch<React.SetStateAction<string>>;
  setParticlesOn: React.Dispatch<React.SetStateAction<boolean>>;
  setDarkMode: React.Dispatch<React.SetStateAction<boolean>>;
  setLang: React.Dispatch<React.SetStateAction<string>>;
  setAutoSave: React.Dispatch<React.SetStateAction<boolean>>;
  setAutoSaveInterval: React.Dispatch<React.SetStateAction<number>>;
  addCustomFont: (font: { name: string; url: string }) => void;
  removeCustomFont: (name: string) => void;
}

const defaultConfig: StorageEditorConfig = {
  editorTheme: "oneDark",
  previewTheme: "theme-heart-classic",
  fontChoice: "Quicksand",
  editorFont: "JetBrains Mono",
  fontSize: 16,
  editorFontSize: 14,
  previewFontSize: 16,
  accentColor: "#ff9a9e",
  blurAmount: 0,
  bgImage: "",
  particlesOn: false,
  lang: "en",
  customFonts: [],
  darkMode: false,
  autoSave: true,
  autoSaveInterval: 500,
};

export function EditorThemeProvider({
  children,
  initialConfig,
}: EditorConfigProps): ReactNode {
  const [config, setConfigState] = useState<StorageEditorConfig>(() => ({
    ...defaultConfig,
    ...initialConfig,
  }));

  // 辅助函数
  const setConfig = useCallback(
    (
      update:
        | Partial<StorageEditorConfig>
        | ((prev: StorageEditorConfig) => Partial<StorageEditorConfig>),
    ) => {
      setConfigState((prev) => {
        const nextUpdate = typeof update === "function" ? update(prev) : update;
        return { ...prev, ...nextUpdate };
      });
    },
    [],
  );

  // 副作用Hook
  useEditorThemeEffects(config);

  // 自定义函数(useCallback)
  const addCustomFont = useCallback(
    (font: { name: string; url: string }) => {
      setConfig((prev) => ({ customFonts: [...prev.customFonts, font] }));
    },
    [setConfig],
  );

  const removeCustomFont = React.useCallback(
    (name: string) => {
      setConfig((prev) => ({
        customFonts: prev.customFonts.filter((f) => f.name !== name),
      }));
    },
    [setConfig],
  );

  const setDarkMode = useCallback((value: React.SetStateAction<boolean>) => {
    setConfigState((prev) => {
      const nextDarkMode =
        typeof value === "function" ? value(prev.darkMode) : value;

      const nextPreviewTheme = syncPreviewThemeWithMode(
        nextDarkMode,
        prev.previewTheme,
      );
      return {
        ...prev,
        darkMode: nextDarkMode,
        previewTheme: nextPreviewTheme,
      };
    });
  }, []);

  // 构造 Context Value
  // 将 config 展开，并手动映射所有的 setter
  const contextValue = React.useMemo<EditorConfigContextProps>(() => {
    return {
      ...config, // 包含 editorTheme, previewTheme, darkMode 等所有值
      setEditorTheme: (val) =>
        setConfig((prev) => ({
          editorTheme:
            typeof val === "function"
              ? val(prev.editorTheme)
              : (val as EditorTheme),
        })),
      setPreviewTheme: (val) =>
        setConfig((prev) => ({
          previewTheme:
            typeof val === "function"
              ? val(prev.previewTheme)
              : (val as PreviewTheme),
        })),
      setFontChoice: (val) =>
        setConfig((prev) => ({
          fontChoice:
            typeof val === "function"
              ? val(prev.fontChoice)
              : (val as FontChoice),
        })),
      setEditorFont: (val) =>
        setConfig((prev) => ({
          editorFont:
            typeof val === "function" ? val(prev.editorFont) : (val as string),
        })),
      setFontSize: (val) =>
        setConfig((prev) => ({
          fontSize:
            typeof val === "function" ? val(prev.fontSize) : (val as number),
        })),
      setEditorFontSize: (val) =>
        setConfig((prev) => ({
          editorFontSize:
            typeof val === "function"
              ? val(prev.editorFontSize)
              : (val as number),
        })),
      setPreviewFontSize: (val) =>
        setConfig((prev) => ({
          previewFontSize:
            typeof val === "function"
              ? val(prev.previewFontSize)
              : (val as number),
        })),
      setAccentColor: (val) =>
        setConfig((prev) => ({
          accentColor:
            typeof val === "function" ? val(prev.accentColor) : (val as string),
        })),
      setBlurAmount: (val) =>
        setConfig((prev) => ({
          blurAmount:
            typeof val === "function" ? val(prev.blurAmount) : (val as number),
        })),
      setBgImage: (val) =>
        setConfig((prev) => ({
          bgImage:
            typeof val === "function" ? val(prev.bgImage) : (val as string),
        })),
      setParticlesOn: (val) =>
        setConfig((prev) => ({
          particlesOn: typeof val === "function" ? val(prev.particlesOn) : val,
        })),
      setLang: (val) =>
        setConfig((prev) => ({
          lang: typeof val === "function" ? val(prev.lang) : (val as string),
        })),
      setAutoSave: (val) =>
        setConfig((prev) => ({
          autoSave:
            typeof val === "function" ? val(prev.autoSave) : (val as boolean),
        })),
      setAutoSaveInterval: (val) =>
        setConfig((prev) => ({
          autoSaveInterval:
            typeof val === "function"
              ? val(prev.autoSaveInterval)
              : (val as number),
        })),
      setDarkMode, // 使用我们特殊处理的函数
      addCustomFont,
      removeCustomFont,
    };
  }, [config, setDarkMode, addCustomFont, removeCustomFont, setConfig]);

  return (
    <EditorThemeContext.Provider value={contextValue}>
      {children}
    </EditorThemeContext.Provider>
  );
}

const EditorThemeContext = createContext<EditorConfigContextProps | undefined>(
  undefined,
);

export interface EditorConfigProps {
  children: ReactNode;
  initialConfig?: StorageEditorConfig | null;
}

export const useEditorConfigContext = () => {
  const context = useContext(EditorThemeContext);
  if (!context) {
    throw new Error(
      "useEditorThemeContext must be used within EditorThemeProvider",
    );
  }
  return context;
};
