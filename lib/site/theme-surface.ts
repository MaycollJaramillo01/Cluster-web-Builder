import type { SiteTheme } from "@/lib/site/blueprint";

export function getThemeSurface(theme: SiteTheme) {
  const dark = relativeLuminance(theme.background) < 0.25;
  return dark
    ? {
        section: "#0f172a",
        panel: "#111827",
        muted: "#cbd5e1",
        accentText: ensureReadable(theme.accent, theme.background),
        primaryText: ensureReadable(theme.primary, theme.background),
      }
    : {
        section: "#f8fafc",
        panel: "#ffffff",
        muted: "#475569",
        accentText: ensureReadable(theme.accent, theme.background),
        primaryText: ensureReadable(theme.primary, theme.background),
      };
}

export function getContrastText(background: string): string {
  const dark = "#0f172a";
  const light = "#ffffff";
  return contrastRatio(background, dark) >= contrastRatio(background, light)
    ? dark
    : light;
}

/**
 * Devuelve `color` si ya cumple el ratio WCAG contra `background`; si no,
 * ajusta su luminosidad (conservando el matiz de marca) hasta cumplirlo.
 * Umbral 4.5:1 = texto normal AA; usa 3 para texto grande o gráficos.
 */
export function ensureReadable(color: string, background: string, minRatio = 4.5): string {
  if (contrastRatio(color, background) >= minRatio) return color;
  const darkBackground = relativeLuminance(background) < 0.35;
  const [h, s, l] = hexToHsl(color);
  for (let step = 1; step <= 45; step++) {
    const lightness = darkBackground ? Math.min(0.98, l + step * 0.02) : Math.max(0.02, l - step * 0.02);
    const candidate = hslToHex(h, s, lightness);
    if (contrastRatio(candidate, background) >= minRatio) return candidate;
  }
  return getContrastText(background);
}

export function getContrastRatio(first: string, second: string): number {
  return contrastRatio(first, second);
}

function hexToHsl(hex: string): [number, number, number] {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return [0, 0, 0];
  const [r, g, b] = [0, 2, 4].map((i) => parseInt(value.slice(i, i + 2), 16) / 255);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  const l = (max + min) / 2;
  if (max === min) return [0, 0, l];
  const d = max - min;
  const s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
  const h =
    max === r ? ((g - b) / d + (g < b ? 6 : 0)) / 6 :
    max === g ? ((b - r) / d + 2) / 6 :
    ((r - g) / d + 4) / 6;
  return [h, s, l];
}

function hslToHex(h: number, s: number, l: number): string {
  const hueToChannel = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1 / 6) return p + (q - p) * 6 * t;
    if (t < 1 / 2) return q;
    if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
    return p;
  };
  let r = l, g = l, b = l;
  if (s !== 0) {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hueToChannel(p, q, h + 1 / 3);
    g = hueToChannel(p, q, h);
    b = hueToChannel(p, q, h - 1 / 3);
  }
  return `#${[r, g, b].map((c) => Math.round(c * 255).toString(16).padStart(2, "0")).join("")}`;
}

function contrastRatio(first: string, second: string): number {
  const firstLuminance = relativeLuminance(first);
  const secondLuminance = relativeLuminance(second);
  return (
    (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05)
  );
}

function relativeLuminance(hex: string): number {
  const value = hex.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(value)) return 1;
  const channels = [0, 2, 4].map((index) => parseInt(value.slice(index, index + 2), 16) / 255);
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
