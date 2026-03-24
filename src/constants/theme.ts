export const EDITOR_THEMES = [
  {
    value: "githubLight",
    label: "GitHub Light",
    colors: ["#ffffff", "#24292e", "#0366d6"] as [string, string, string],
  },
  {
    value: "oneDark",
    label: "One Dark",
    colors: ["#282c34", "#abb2bf", "#61afef"] as [string, string, string],
    isDark: true,
  },
  {
    value: "githubDark",
    label: "GitHub Dark",
    colors: ["#0d1117", "#c9d1d9", "#58a6ff"] as [string, string, string],
    isDark: true,
  },
  {
    value: "vscodeDark",
    label: "VS Code Dark",
    colors: ["#1e1e1e", "#d4d4d4", "#569cd6"] as [string, string, string],
    isDark: true,
  },
  {
    value: "dracula",
    label: "Dracula",
    colors: ["#282a36", "#f8f8f2", "#bd93f9"] as [string, string, string],
    isDark: true,
  },
  {
    value: "nord",
    label: "Nord",
    colors: ["#2e3440", "#d8dee9", "#88c0d0"] as [string, string, string],
    isDark: true,
  },
];

export const PREVIEW_THEMES = [
  {
    value: "theme-heart-classic",
    title: "Classic Heart",
    subtitle: "Cream & Rose",
    colors: ["#fffafb", "#ff4d6d", "#ffb3c1"],
    isDark: false,
  },
  {
    value: "theme-heart-midnight",
    title: "Night Surface",
    subtitle: "Material Dark",
    colors: ["#17171c", "#6750a4", "#d0bcff"],
    isDark: true,
  },
  {
    value: "theme-heart-golden",
    title: "Golden Love",
    subtitle: "Terracotta & Gold",
    colors: ["#fdf6e3", "#b58900", "#cb4b16"],
    isDark: false,
  },
  {
    value: "theme-heart-organic",
    title: "Organic Pulse",
    subtitle: "Sage & Violet",
    colors: ["#f0f4f0", "#6c5ce7", "#00b894"],
    isDark: false,
  },
];

export const ACCENT_COLORS = [
  "#ff9a9e", // Rose
  "#6750a4", // Purple
  "#006874", // Teal
  "#386a20", // Green
  "#c76b00", // Amber
  "#1565c0", // Blue
];
