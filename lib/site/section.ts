import type { SiteTheme } from "@/lib/site/blueprint";

/**
 * Flat, serializable representation of a site section used by the renderer,
 * the editor, and the API. Decouples UI from the Prisma row shape.
 */
export type RenderSection = {
  id: string;
  type: string;
  title: string;
  subtitle: string;
  body: string;
  ctaText: string;
  ctaLink: string;
  imagePrompt: string;
  mediaUrl?: string;
  altText?: string;
  order: number;
  isVisible: boolean;
  settings: Record<string, unknown>;
};

type DbSectionRow = {
  id: string;
  type: string;
  title: string | null;
  content: unknown;
  order: number;
  isVisible: boolean;
  settingsJson: unknown;
};

/** Maps a Prisma SiteSection row to the flat RenderSection used by the UI. */
export function toRenderSection(row: DbSectionRow): RenderSection {
  const content = (row.content ?? {}) as Record<string, unknown>;
  const settings = (row.settingsJson ?? {}) as Record<string, unknown>;
  return {
    id: row.id,
    type: row.type,
    title: row.title ?? "",
    subtitle: asString(content.subtitle),
    body: asString(content.body),
    ctaText: asString(content.ctaText),
    ctaLink: asString(content.ctaLink),
    imagePrompt: asString(content.imagePrompt),
    mediaUrl: asString(content.mediaUrl),
    altText: asString(content.altText),
    order: row.order,
    isVisible: row.isVisible,
    settings,
  };
}

/** Site-level data needed to render a preview/editor. */
export type RenderSite = {
  id: string;
  businessName: string;
  businessType: string;
  phone: string | null;
  email: string | null;
  location: string | null;
  domain: string | null;
  language: string | null;
  status: string;
  theme: SiteTheme;
  sections: RenderSection[];
};

function asString(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/** Reads a string[] list of items from a section's settings (various keys). */
export function getItems(section: RenderSection): Record<string, unknown>[] {
  const items = section.settings?.items;
  if (Array.isArray(items)) {
    return items.map((it) =>
      typeof it === "object" && it !== null
        ? (it as Record<string, unknown>)
        : { value: it }
    );
  }
  return [];
}
