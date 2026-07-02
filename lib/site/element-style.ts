import type { CSSProperties } from "react";

/**
 * Per-element style overrides, layered on top of the design-preset system.
 * Every value is a closed union or a validated hex color — never free-form
 * CSS — so a bad value falls back to the preset default instead of breaking
 * the page (same contract as `normalizeSectionLayout`).
 */
export type StyleRole = "section" | "title" | "subtitle" | "body" | "ctaText";

export type ElementStyle = {
  color?: string;
  background?: string;
  fontSize?: "sm" | "md" | "lg" | "xl" | "2xl";
  fontWeight?: "normal" | "medium" | "semibold" | "bold" | "black";
  align?: "left" | "center" | "right";
  spacing?: "tight" | "normal" | "loose";
  borderRadius?: "none" | "sm" | "md" | "lg" | "full";
  borderWidth?: "none" | "thin" | "thick";
  borderColor?: string;
  shadow?: "none" | "sm" | "md" | "lg";
};

const HEX = /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/;

const FONT_SIZE_VALUES = ["sm", "md", "lg", "xl", "2xl"] as const;
const FONT_WEIGHT_VALUES = ["normal", "medium", "semibold", "bold", "black"] as const;
const ALIGN_VALUES = ["left", "center", "right"] as const;
const SPACING_VALUES = ["tight", "normal", "loose"] as const;
const RADIUS_VALUES = ["none", "sm", "md", "lg", "full"] as const;
const BORDER_WIDTH_VALUES = ["none", "thin", "thick"] as const;
const SHADOW_VALUES = ["none", "sm", "md", "lg"] as const;

function hexOrUndefined(value: unknown): string | undefined {
  return typeof value === "string" && HEX.test(value) ? value : undefined;
}

function enumOrUndefined<T extends string>(value: unknown, allowed: readonly T[]): T | undefined {
  return typeof value === "string" && (allowed as readonly string[]).includes(value) ? (value as T) : undefined;
}

/** Validates a single element's style overrides; invalid keys are dropped, never throw. */
export function normalizeElementStyle(value: unknown): ElementStyle {
  const raw = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  const style: ElementStyle = {
    color: hexOrUndefined(raw.color),
    background: hexOrUndefined(raw.background),
    fontSize: enumOrUndefined(raw.fontSize, FONT_SIZE_VALUES),
    fontWeight: enumOrUndefined(raw.fontWeight, FONT_WEIGHT_VALUES),
    align: enumOrUndefined(raw.align, ALIGN_VALUES),
    spacing: enumOrUndefined(raw.spacing, SPACING_VALUES),
    borderRadius: enumOrUndefined(raw.borderRadius, RADIUS_VALUES),
    borderWidth: enumOrUndefined(raw.borderWidth, BORDER_WIDTH_VALUES),
    borderColor: hexOrUndefined(raw.borderColor),
    shadow: enumOrUndefined(raw.shadow, SHADOW_VALUES),
  };
  return Object.fromEntries(Object.entries(style).filter(([, v]) => v !== undefined)) as ElementStyle;
}

const STYLE_ROLES: StyleRole[] = ["section", "title", "subtitle", "body", "ctaText"];

/**
 * Section types wired end-to-end (live preview + static export) for per-role
 * text styling (title/subtitle/body/ctaText). Everything else only gets the
 * universal "section" role — editor UI and export must agree on this set so
 * a user never configures a control that silently doesn't apply anywhere.
 */
export const TEXT_STYLE_COVERED_TYPES = new Set([
  "hero", "services", "benefits", "testimonials", "faq", "process",
  "contact", "cta", "gallery", "location", "pricing", "text",
  "about", "about_us", "footer", "trust_badges", "image", "video",
]);

/** Validates the full per-section style-overrides map (one ElementStyle per role). */
export function normalizeStyleOverrides(value: unknown): Partial<Record<StyleRole, ElementStyle>> {
  const raw = typeof value === "object" && value ? (value as Record<string, unknown>) : {};
  const result: Partial<Record<StyleRole, ElementStyle>> = {};
  for (const role of STYLE_ROLES) {
    if (!(role in raw)) continue;
    const normalized = normalizeElementStyle(raw[role]);
    if (Object.keys(normalized).length) result[role] = normalized;
  }
  return result;
}

const FONT_SIZE_SCALE: Record<Exclude<StyleRole, "section">, Record<NonNullable<ElementStyle["fontSize"]>, string>> = {
  title: { sm: "1.5rem", md: "2.25rem", lg: "3rem", xl: "3.75rem", "2xl": "4.5rem" },
  subtitle: { sm: "0.8rem", md: "1rem", lg: "1.25rem", xl: "1.5rem", "2xl": "1.875rem" },
  body: { sm: "0.875rem", md: "1rem", lg: "1.125rem", xl: "1.25rem", "2xl": "1.5rem" },
  ctaText: { sm: "0.8rem", md: "0.95rem", lg: "1.05rem", xl: "1.2rem", "2xl": "1.35rem" },
};

const FONT_WEIGHT_SCALE: Record<NonNullable<ElementStyle["fontWeight"]>, number> = {
  normal: 400,
  medium: 500,
  semibold: 600,
  bold: 700,
  black: 900,
};

const TEXT_SPACING_SCALE: Record<NonNullable<ElementStyle["spacing"]>, string> = {
  tight: "0.5rem",
  normal: "1rem",
  loose: "2rem",
};

const SECTION_SPACING_SCALE: Record<NonNullable<ElementStyle["spacing"]>, string> = {
  tight: "1.5rem",
  normal: "3rem",
  loose: "5rem",
};

const RADIUS_SCALE: Record<NonNullable<ElementStyle["borderRadius"]>, string> = {
  none: "0",
  sm: "0.25rem",
  md: "0.5rem",
  lg: "1rem",
  full: "9999px",
};

const BORDER_WIDTH_SCALE: Record<NonNullable<ElementStyle["borderWidth"]>, string> = {
  none: "0px",
  thin: "1px",
  thick: "3px",
};

const SHADOW_SCALE: Record<NonNullable<ElementStyle["shadow"]>, string> = {
  none: "none",
  sm: "0 1px 2px rgba(0,0,0,.06)",
  md: "0 8px 24px rgba(0,0,0,.12)",
  lg: "0 24px 60px rgba(0,0,0,.18)",
};

/** Reads and validates a single role's override straight from a section's raw `settings` blob. */
export function getStyleOverride(settings: Record<string, unknown> | undefined, role: StyleRole): ElementStyle | undefined {
  return normalizeStyleOverrides(settings?.styleOverrides)[role];
}

/**
 * Converts bounded style tokens to concrete CSS values for a given role.
 * Only returns keys the user actually overrode, so callers can spread the
 * result at the end of their existing `style={{...}}` object without
 * clobbering preset-driven defaults for anything left untouched.
 */
export function resolveElementStyle(role: StyleRole, override: ElementStyle | undefined): CSSProperties {
  if (!override) return {};
  const style: CSSProperties = {};
  if (override.color) style.color = override.color;
  if (override.background) style.backgroundColor = override.background;
  if (override.fontSize && role !== "section") style.fontSize = FONT_SIZE_SCALE[role][override.fontSize];
  if (override.fontWeight) style.fontWeight = FONT_WEIGHT_SCALE[override.fontWeight];
  if (override.align) style.textAlign = override.align;
  if (override.spacing) {
    if (role === "section") style.paddingBlock = SECTION_SPACING_SCALE[override.spacing];
    else style.marginTop = TEXT_SPACING_SCALE[override.spacing];
  }
  if (override.borderRadius) style.borderRadius = RADIUS_SCALE[override.borderRadius];
  if (override.borderWidth) {
    style.borderWidth = BORDER_WIDTH_SCALE[override.borderWidth];
    style.borderStyle = override.borderWidth === "none" ? "none" : "solid";
    style.borderColor = override.borderColor ?? "currentColor";
  }
  if (override.shadow) style.boxShadow = SHADOW_SCALE[override.shadow];
  return style;
}

/** Same as `resolveElementStyle` but returns a CSS declaration string, for the static HTML exporter. */
export function resolveElementStyleString(role: StyleRole, override: ElementStyle | undefined): string {
  const style = resolveElementStyle(role, override);
  const CSS_KEY: Record<string, string> = {
    color: "color", backgroundColor: "background-color", fontSize: "font-size", fontWeight: "font-weight",
    textAlign: "text-align", paddingBlock: "padding-block", marginTop: "margin-top", borderRadius: "border-radius",
    borderWidth: "border-width", borderStyle: "border-style", borderColor: "border-color", boxShadow: "box-shadow",
  };
  return Object.entries(style)
    .map(([key, value]) => `${CSS_KEY[key] ?? key}:${value}`)
    .join(";");
}
