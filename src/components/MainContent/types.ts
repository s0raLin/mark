export interface MainContentProps {
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
