import { argbFromHex, themeFromSourceColor, applyTheme, Hct, hexFromArgb } from "@material/material-color-utilities";



// ─── M3 Token Generator (Actify-style) ───────────────────────────────────────
// Key insight: HCT tonal palette shifts hue/chroma during tone mapping, so
// palette.tone(75) for a pink seed looks brownish. We use the seed hex directly
// as the primary fill color so "pink stays pink", and only use the tonal palette
// for text/icon roles where we need guaranteed contrast on white/dark backgrounds.

export function applyM3Theme(seed: string, isDark: boolean) {
  const argb = argbFromHex(seed);
  const theme = themeFromSourceColor(argb);

  // Write all --md-sys-color-* tokens (surface, outline, container roles etc.)
  applyTheme(theme, { target: document.documentElement, dark: isDark });

  const root = document.documentElement;
  const palette = theme.palettes.primary;
  const neutralPalette = theme.palettes.neutral;
  const neutralVariantPalette = theme.palettes.neutralVariant;
  const seedHct = Hct.fromInt(argb);
  const seedTone = seedHct.tone;

  // ── Primary fill: use seed hex directly so color is visually preserved ──
  // Dark mode: use tone-80 (light variant for dark bg), light mode: seed itself
  const fillHex = isDark ? hexFromArgb(palette.tone(80)) : seed;

  // ── on-primary: white for dark/saturated fills, dark for very light fills ──
  const onPrimaryHex =
    isDark || seedTone < 65 ? "#ffffff" : hexFromArgb(palette.tone(10));

  // ── Text/icon primary: must be readable on white (tone ≤ 50) ──
  const textTone = isDark ? 80 : Math.min(50, seedTone);
  const textHex = hexFromArgb(palette.tone(textTone));

  root.style.setProperty("--md-sys-color-primary", fillHex);
  root.style.setProperty("--md-sys-color-on-primary", onPrimaryHex);

  // Tailwind aliases
  root.style.setProperty("--color-primary", textHex);
  root.style.setProperty(
    "--color-accent",
    hexFromArgb(palette.tone(isDark ? 30 : 90)),
  );
  root.style.setProperty("--color-primary-text", textHex);

  // Palette tone refs
  root.style.setProperty("--md-primary-tone-80", hexFromArgb(palette.tone(80)));
  root.style.setProperty("--md-primary-tone-40", hexFromArgb(palette.tone(40)));
  root.style.setProperty("--md-primary-tone-90", hexFromArgb(palette.tone(90)));
  root.style.setProperty("--md-primary-tone-10", hexFromArgb(palette.tone(10)));

  // ── M3 surface container roles (used by dark mode CSS) ──
  // M3 spec: surface=N-6, surface-container=N-12, surface-container-high=N-17
  const primaryTintSurface = hexFromArgb(palette.tone(isDark ? 24 : 94));
  const primaryTintSurfaceHigh = hexFromArgb(palette.tone(isDark ? 30 : 90));
  const neutralSurfaceContainer = hexFromArgb(
    neutralPalette.tone(isDark ? 12 : 94),
  );
  const neutralSurfaceContainerHigh = hexFromArgb(
    neutralPalette.tone(isDark ? 17 : 92),
  );
  const surfaceContainerHex = mixHex(
    neutralSurfaceContainer,
    primaryTintSurface,
    isDark ? 0.16 : 0.12,
  );
  const surfaceContainerHighHex = mixHex(
    neutralSurfaceContainerHigh,
    primaryTintSurfaceHigh,
    isDark ? 0.2 : 0.16,
  );
  root.style.setProperty(
    "--md-sys-color-surface-container",
    surfaceContainerHex,
  );
  root.style.setProperty(
    "--md-sys-color-surface-container-high",
    surfaceContainerHighHex,
  );

  // ── Convenience aliases for legacy CSS vars ──
  const surfaceHex = mixHex(
    isDark
      ? hexFromArgb(neutralPalette.tone(6))
      : hexFromArgb(neutralPalette.tone(98)),
    hexFromArgb(palette.tone(isDark ? 20 : 96)),
    isDark ? 0.12 : 0.08,
  );
  const softBgHex = mixHex(
    isDark
      ? hexFromArgb(neutralPalette.tone(10))
      : hexFromArgb(neutralPalette.tone(96)),
    hexFromArgb(palette.tone(isDark ? 24 : 94)),
    isDark ? 0.16 : 0.12,
  );
  const surfaceVariantHex = mixHex(
    hexFromArgb(neutralVariantPalette.tone(isDark ? 30 : 90)),
    hexFromArgb(palette.tone(isDark ? 42 : 86)),
    isDark ? 0.18 : 0.14,
  );
  const borderSoftHex = mixHex(
    hexFromArgb(neutralVariantPalette.tone(isDark ? 26 : 88)),
    hexFromArgb(palette.tone(isDark ? 55 : 76)),
    isDark ? 0.22 : 0.18,
  );
  root.style.setProperty("--color-background-light", surfaceHex);
  root.style.setProperty("--color-soft-bg", softBgHex);
  root.style.setProperty("--color-border-soft", borderSoftHex);
  root.style.setProperty("--md-sys-color-surface-variant", surfaceVariantHex);
}


function mixHex(colorA: string, colorB: string, weightB: number) {
  const normalizedWeightB = Math.max(0, Math.min(1, weightB));
  const normalizedWeightA = 1 - normalizedWeightB;

  const parseHex = (hex: string) => {
    const safeHex = hex.replace("#", "");
    return {
      r: parseInt(safeHex.slice(0, 2), 16),
      g: parseInt(safeHex.slice(2, 4), 16),
      b: parseInt(safeHex.slice(4, 6), 16),
    };
  };

  const toHex = (value: number) => value.toString(16).padStart(2, "0");
  const a = parseHex(colorA);
  const b = parseHex(colorB);

  return `#${toHex(Math.round(a.r * normalizedWeightA + b.r * normalizedWeightB))}${toHex(
    Math.round(a.g * normalizedWeightA + b.g * normalizedWeightB),
  )}${toHex(Math.round(a.b * normalizedWeightA + b.b * normalizedWeightB))}`;
}
