import type { SiteTheme } from "@/lib/site/blueprint";

const DEFAULTS: SiteTheme = {
  primary: "#1d4ed8",
  secondary: "#0f172a",
  accent: "#f59e0b",
  background: "#ffffff",
  text: "#0f172a",
};

type SiteLike = {
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  blueprintJson: unknown;
};

/**
 * Resolves a render theme from the stored Site. Primary/secondary/accent come
 * from the editable columns; background/text are pulled from the blueprint
 * (the model's chosen palette) when available.
 */
export function themeFromSite(site: SiteLike): SiteTheme {
  let background = DEFAULTS.background;
  let text = DEFAULTS.text;

  const blueprint = site.blueprintJson as
    | { site?: { visualStyle?: { colors?: Record<string, string> } } }
    | null;
  const colors = blueprint?.site?.visualStyle?.colors;
  if (colors) {
    if (typeof colors.background === "string") background = colors.background;
    if (typeof colors.text === "string") text = colors.text;
  }

  return {
    primary: site.primaryColor ?? DEFAULTS.primary,
    secondary: site.secondaryColor ?? DEFAULTS.secondary,
    accent: site.accentColor ?? DEFAULTS.accent,
    background,
    text,
  };
}
