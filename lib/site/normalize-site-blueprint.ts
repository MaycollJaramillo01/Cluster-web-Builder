import {
  blueprintSchema,
  type Blueprint,
  type SiteTheme,
} from "@/lib/site/blueprint";

/**
 * A flattened section ready to render or persist.
 * The blueprint groups sections under pages; for the MVP we flatten them
 * (in page+section order) into a single ordered list of SiteSection rows.
 */
export type NormalizedSection = {
  type: string;
  pageSlug: string;
  title: string;
  order: number;
  isVisible: boolean;
  // Stored in SiteSection.content (Json)
  content: {
    subtitle: string;
    body: string;
    ctaText: string;
    ctaLink: string;
    imagePrompt: string;
  };
  // Stored in SiteSection.settingsJson (Json)
  settings: Record<string, unknown>;
};

export type NormalizedSite = {
  blueprint: Blueprint;
  theme: SiteTheme;
  sections: NormalizedSection[];
};

const DEFAULT_THEME: SiteTheme = {
  primary: "#1d4ed8",
  secondary: "#0f172a",
  accent: "#f59e0b",
  background: "#ffffff",
  text: "#0f172a",
};

/**
 * Validates the raw model JSON and normalizes it into a renderable/persistable
 * shape. Throws (via Zod) if the structure is fundamentally invalid.
 */
export function normalizeSiteBlueprint(raw: unknown): NormalizedSite {
  const parsed = blueprintSchema.parse(raw);
  const blueprint: Blueprint = "site" in parsed ? parsed : { site: parsed };
  const site = blueprint.site;

  if (!site.pages || site.pages.length === 0) {
    throw new Error("El sitio generado no contiene páginas.");
  }

  const colors = site.visualStyle?.colors ?? {};
  const theme: SiteTheme = {
    primary: normalizeHex(colors.primary, DEFAULT_THEME.primary),
    secondary: normalizeHex(colors.secondary, DEFAULT_THEME.secondary),
    accent: normalizeHex(colors.accent, DEFAULT_THEME.accent),
    background: normalizeHex(colors.background, DEFAULT_THEME.background),
    text: normalizeHex(colors.text, DEFAULT_THEME.text),
  };

  const sections: NormalizedSection[] = [];
  let order = 0;
  for (const page of site.pages) {
    for (const section of page.sections) {
      sections.push({
        type: section.type,
        pageSlug: "home",
        title: section.title ?? "",
        order: order++,
        isVisible: true,
        content: {
          subtitle: section.subtitle ?? "",
          body: section.body ?? "",
          ctaText: section.ctaText ?? "",
          ctaLink: section.ctaLink ?? "",
          imagePrompt: section.imagePrompt ?? "",
        },
        settings: section.settings ?? {},
      });
    }
  }

  if (sections.length === 0) {
    throw new Error("El sitio generado no contiene secciones.");
  }

  return { blueprint, theme, sections };
}

/** Accepts "#rrggbb", "rrggbb", or returns fallback when invalid. */
function normalizeHex(value: string | undefined, fallback: string): string {
  if (!value) return fallback;
  const trimmed = value.trim();
  const withHash = trimmed.startsWith("#") ? trimmed : `#${trimmed}`;
  return /^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/.test(withHash)
    ? withHash
    : fallback;
}
