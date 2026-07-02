import { normalizeStyleOverrides } from "./element-style";
import { normalizeFreeformLayout } from "./freeform";

export type SectionLayout = {
  width: "narrow" | "standard" | "wide";
  align: "left" | "center";
  background: "plain" | "tonal";
  spacing: "compact" | "normal" | "spacious";
};

export const DEFAULT_SECTION_LAYOUT: SectionLayout = {
  width: "standard",
  align: "left",
  background: "plain",
  spacing: "normal",
};

export function normalizeSectionLayout(value: unknown): SectionLayout {
  const layout = typeof value === "object" && value ? value as Record<string, unknown> : {};
  return {
    width: ["narrow", "standard", "wide"].includes(String(layout.width)) ? layout.width as SectionLayout["width"] : "standard",
    align: ["left", "center"].includes(String(layout.align)) ? layout.align as SectionLayout["align"] : "left",
    background: ["plain", "tonal"].includes(String(layout.background)) ? layout.background as SectionLayout["background"] : "plain",
    spacing: ["compact", "normal", "spacious"].includes(String(layout.spacing)) ? layout.spacing as SectionLayout["spacing"] : "normal",
  };
}

export function normalizeSectionSettings(settings: Record<string, unknown>) {
  return {
    ...settings,
    layout: normalizeSectionLayout(settings.layout),
    styleOverrides: normalizeStyleOverrides(settings.styleOverrides),
    freeform: normalizeFreeformLayout(settings.freeform),
  };
}
