import type { SiteTheme } from "@/lib/site/blueprint";

export function getThemeSurface(theme: SiteTheme) {
  const dark = relativeLuminance(theme.background) < 0.25;
  return dark
    ? { section: "#0f172a", panel: "#111827", muted: "#cbd5e1" }
    : { section: "#f8fafc", panel: "#ffffff", muted: "#475569" };
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
