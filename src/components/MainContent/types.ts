import { ReactCodeMirrorRef } from "@uiw/react-codemirror";

export interface MainContentProps {
  toolbarRef?: React.RefObject<ReactCodeMirrorRef>;
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
