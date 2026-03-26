import { PreviewTheme } from "@/api/client";

export const DARK_PREVIEW_THEMES: PreviewTheme[] = ["theme-heart-midnight"];
export const LIGHT_PREVIEW_THEMES: PreviewTheme[] = [
  "theme-heart-classic",
  "theme-heart-golden",
  "theme-heart-organic",
];
export const DEFAULT_DARK_PREVIEW_THEME: PreviewTheme = "theme-heart-midnight";
export const DEFAULT_LIGHT_PREVIEW_THEME: PreviewTheme = "theme-heart-classic";

export function isDarkPreviewTheme(theme: PreviewTheme) {
  return DARK_PREVIEW_THEMES.includes(theme);
}

export function syncPreviewThemeWithMode(
  nextDarkMode: boolean,
  currentPreviewTheme: PreviewTheme,
): PreviewTheme {
  if (nextDarkMode) {
    return isDarkPreviewTheme(currentPreviewTheme)
      ? currentPreviewTheme
      : DEFAULT_DARK_PREVIEW_THEME;
  }

  return LIGHT_PREVIEW_THEMES.includes(currentPreviewTheme)
    ? currentPreviewTheme
    : DEFAULT_LIGHT_PREVIEW_THEME;
}