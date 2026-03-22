import { ReactCodeMirrorRef } from "@uiw/react-codemirror";

export interface MainContentProps {
  toolbarRef?: React.RefObject<ReactCodeMirrorRef>;
  markdown: string;
  setMarkdown: React.Dispatch<React.SetStateAction<string>>;
  viewMode: "split" | "editor" | "preview";
  editorTheme: string;
  setEditorTheme: React.Dispatch<React.SetStateAction<string>>;
  previewTheme: string;
  setPreviewTheme: React.Dispatch<React.SetStateAction<string>>;
  fontChoice: string;
  setFontChoice: React.Dispatch<React.SetStateAction<string>>;
  editorFont: string;
  activeFileName: string;
}

export interface Heading {
  text: string;
  level: number;
  id: string;
}

export interface CheckStates {
  [key: number]: boolean;
}
