import { z } from "zod";

import { sanitizeLink } from "@/lib/site/links";

export const BUILDER_V2 = 2;

export const V2_TEMPLATE_IDS = ["conversion", "editorial", "catalog", "local", "immersive", "minimal", "studio", "saas", "gastro", "wellness", "essential", "assurance", "nordic", "metro", "deco"] as const;
export type V2TemplateId = (typeof V2_TEMPLATE_IDS)[number];

export const V2_WIDGET_TYPES = [
  "brand", "nav", "heading", "text", "image", "video", "button",
  "business_info", "list", "gallery", "testimonials", "accordion",
  "form", "social", "map", "divider", "spacer", "embed", "hero_pixel",
] as const;
export type V2WidgetType = (typeof V2_WIDGET_TYPES)[number];

export const V2_CONTENT_SLOTS = [
  "business.name", "business.type", "business.logo", "business.location", "business.phone", "business.email",
  "hero.title", "hero.subtitle", "hero.body", "hero.ctaText", "hero.ctaLink", "hero.media",
  "about.title", "about.subtitle", "about.body", "about.media", "about.highlights",
  "services", "benefits", "reviews", "faqs", "contact.title", "contact.body", "contact.ctaText",
  "media", "social",
] as const;
export type V2ContentSlot = (typeof V2_CONTENT_SLOTS)[number];

export type V2Item = { title: string; description: string; meta?: string; image?: string };
export type V2Review = { name: string; role: string; quote: string; rating: number; source: string };
export type V2Faq = { question: string; answer: string };
export type V2Media = { url: string; alt: string };

export type SiteContentV2 = {
  business: { name: string; type: string; location: string; phone: string; email: string; logo: string };
  hero: { title: string; subtitle: string; body: string; ctaText: string; ctaLink: string; media: string };
  about: { title: string; subtitle: string; body: string; media: string; highlights: V2Item[] };
  services: V2Item[];
  benefits: V2Item[];
  reviews: V2Review[];
  faqs: V2Faq[];
  contact: { title: string; body: string; ctaText: string };
  media: V2Media[];
  social: Record<string, string>;
  seo: { title: string; description: string; keyword: string };
};

export type ThemeTokensV2 = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
  muted: string;
  headingFont: string;
  bodyFont: string;
  radius: "none" | "sm" | "md" | "lg" | "pill";
  motion: "none" | "subtle" | "stagger" | "cinematic";
};

export type StyleTokensV2 = {
  color?: string;
  background?: string;
  backgroundImage?: string;
  align?: "left" | "center" | "right";
  fontSize?: "xs" | "sm" | "md" | "lg" | "xl" | "2xl" | "display";
  fontWeight?: "normal" | "medium" | "semibold" | "bold" | "black";
  padding?: "none" | "sm" | "md" | "lg" | "xl";
  gap?: "none" | "sm" | "md" | "lg" | "xl";
  radius?: "none" | "sm" | "md" | "lg" | "pill";
  shadow?: "none" | "sm" | "md" | "lg";
  width?: "content" | "wide" | "full";
};
export type ResponsiveStyleV2 = { desktop?: StyleTokensV2; tablet?: StyleTokensV2; mobile?: StyleTokensV2 };

export type WidgetV2 = {
  id: string;
  type: V2WidgetType;
  slot?: V2ContentSlot;
  data?: Record<string, unknown>;
  variant?: string;
  style?: ResponsiveStyleV2;
};

export type CanvasColumnV2 = {
  id: string;
  span: { desktop: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8 | 9 | 12; tablet: 1 | 2 | 3 | 4 | 5 | 6 | 7 | 12; mobile: 12 };
  widgets: WidgetV2[];
  style?: ResponsiveStyleV2;
};
export type CanvasRowV2 = { id: string; columns: CanvasColumnV2[]; style?: ResponsiveStyleV2 };
export type CanvasSectionV2 = {
  schemaVersion: 2;
  id: string;
  key: string;
  name: string;
  region: "header" | "main" | "footer";
  rows: CanvasRowV2[];
  style?: ResponsiveStyleV2;
};

export type TemplateDefinitionV2 = {
  version: 2;
  id: V2TemplateId;
  name: string;
  description: string;
  thumbnail: string;
  theme: ThemeTokensV2;
  sections: Omit<CanvasSectionV2, "id">[];
};

const hex = z.string().regex(/^#[0-9a-fA-F]{6}$/);
const styleSchema = z.object({
  color: hex.optional(), background: hex.optional(),
  backgroundImage: z.string().max(2000).transform((value) => sanitizeLink(value)).optional(),
  align: z.enum(["left", "center", "right"]).optional(),
  fontSize: z.enum(["xs", "sm", "md", "lg", "xl", "2xl", "display"]).optional(),
  fontWeight: z.enum(["normal", "medium", "semibold", "bold", "black"]).optional(),
  padding: z.enum(["none", "sm", "md", "lg", "xl"]).optional(), gap: z.enum(["none", "sm", "md", "lg", "xl"]).optional(),
  radius: z.enum(["none", "sm", "md", "lg", "pill"]).optional(), shadow: z.enum(["none", "sm", "md", "lg"]).optional(),
  width: z.enum(["content", "wide", "full"]).optional(),
}).strip();
const responsiveStyleSchema = z.object({ desktop: styleSchema.optional(), tablet: styleSchema.optional(), mobile: styleSchema.optional() }).strip();
export const widgetV2Schema = z.object({
  id: z.string().min(1).max(80), type: z.enum(V2_WIDGET_TYPES), slot: z.enum(V2_CONTENT_SLOTS).optional(),
  data: z.record(z.unknown()).optional(), variant: z.string().max(40).optional(), style: responsiveStyleSchema.optional(),
}).strip();
const spanSchema = z.object({
  desktop: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(8), z.literal(9), z.literal(12)]),
  tablet: z.union([z.literal(1), z.literal(2), z.literal(3), z.literal(4), z.literal(5), z.literal(6), z.literal(7), z.literal(12)]), mobile: z.literal(12),
});
const columnSchema = z.object({ id: z.string().min(1).max(80), span: spanSchema, widgets: z.array(widgetV2Schema).max(30), style: responsiveStyleSchema.optional() }).strip();
const rowSchema = z.object({ id: z.string().min(1).max(80), columns: z.array(columnSchema).min(1).max(4), style: responsiveStyleSchema.optional() }).strip();
export const canvasSectionSchema = z.object({
  schemaVersion: z.literal(2), id: z.string().min(1).max(80), key: z.string().min(1).max(80), name: z.string().min(1).max(120),
  region: z.enum(["header", "main", "footer"]), rows: z.array(rowSchema).min(1).max(12), style: responsiveStyleSchema.optional(),
}).strip();

function text(value: unknown, max = 2000) { return typeof value === "string" ? value.slice(0, max) : ""; }
function records(value: unknown): Record<string, unknown>[] { return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : []; }

export function normalizeSiteContentV2(value: unknown): SiteContentV2 {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const business = raw.business && typeof raw.business === "object" ? raw.business as Record<string, unknown> : {};
  const hero = raw.hero && typeof raw.hero === "object" ? raw.hero as Record<string, unknown> : {};
  const about = raw.about && typeof raw.about === "object" ? raw.about as Record<string, unknown> : {};
  const contact = raw.contact && typeof raw.contact === "object" ? raw.contact as Record<string, unknown> : {};
  const seo = raw.seo && typeof raw.seo === "object" ? raw.seo as Record<string, unknown> : {};
  const item = (entry: Record<string, unknown>): V2Item => ({ title: text(entry.title ?? entry.name, 200), description: text(entry.description ?? entry.body ?? entry.text, 1200), meta: text(entry.meta ?? entry.price ?? entry.value, 120), image: text(entry.image ?? entry.url, 2000) });
  return {
    business: { name: text(business.name, 120), type: text(business.type, 120), location: text(business.location, 200), phone: text(business.phone, 50), email: text(business.email, 180), logo: text(business.logo, 2000) },
    hero: { title: text(hero.title, 200), subtitle: text(hero.subtitle, 300), body: text(hero.body), ctaText: text(hero.ctaText, 100), ctaLink: sanitizeLink(text(hero.ctaLink, 2000)), media: text(hero.media, 2000) },
    about: { title: text(about.title, 200), subtitle: text(about.subtitle, 300), body: text(about.body, 4000), media: text(about.media, 2000), highlights: records(about.highlights).slice(0, 12).map(item) },
    services: records(raw.services).slice(0, 24).map(item), benefits: records(raw.benefits).slice(0, 24).map(item),
    reviews: records(raw.reviews).slice(0, 20).map((entry) => ({ name: text(entry.name, 120), role: text(entry.role, 120), quote: text(entry.quote ?? entry.text, 1200), rating: Math.max(1, Math.min(5, Math.round(Number(entry.rating) || 5))), source: text(entry.source, 120) })),
    faqs: records(raw.faqs).slice(0, 24).map((entry) => ({ question: text(entry.question ?? entry.title, 300), answer: text(entry.answer ?? entry.description, 2000) })),
    contact: { title: text(contact.title, 200), body: text(contact.body, 2000), ctaText: text(contact.ctaText, 100) },
    media: records(raw.media).slice(0, 36).map((entry) => ({ url: text(entry.url, 2000), alt: text(entry.alt, 300) })),
    social: Object.fromEntries(Object.entries(raw.social && typeof raw.social === "object" ? raw.social as Record<string, unknown> : {}).map(([key, val]) => [key, sanitizeLink(text(val, 2000))]).filter(([, val]) => val)),
    seo: { title: text(seo.title, 200), description: text(seo.description, 400), keyword: text(seo.keyword, 160) },
  };
}

export function normalizeCanvasSectionsV2(value: unknown): CanvasSectionV2[] {
  if (!Array.isArray(value)) return [];
  const parsed = value.slice(0, 40).map((section) => canvasSectionSchema.safeParse(section)).filter((result) => result.success).map((result) => result.data);
  const ids = new Set<string>();
  return parsed.filter((section) => {
    const allIds = [section.id, ...section.rows.flatMap((row) => [row.id, ...row.columns.flatMap((column) => [column.id, ...column.widgets.map((widget) => widget.id)])])];
    if (allIds.some((id) => ids.has(id))) return false;
    allIds.forEach((id) => ids.add(id));
    return true;
  });
}

export function normalizeWidgetV2(value: unknown): WidgetV2 | null {
  const parsed = widgetV2Schema.safeParse(value);
  return parsed.success ? parsed.data : null;
}

export function normalizeThemeV2(value: unknown): ThemeTokensV2 {
  const raw = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const color = (key: string, fallback: string) => typeof raw[key] === "string" && /^#[0-9a-fA-F]{6}$/.test(raw[key] as string) ? raw[key] as string : fallback;
  return {
    primary: color("primary", "#6d28d9"), secondary: color("secondary", "#111827"), accent: color("accent", "#f59e0b"),
    background: color("background", "#ffffff"), text: color("text", "#111827"), muted: color("muted", "#64748b"),
    headingFont: text(raw.headingFont, 160) || "Inter, system-ui, sans-serif", bodyFont: text(raw.bodyFont, 160) || "Inter, system-ui, sans-serif",
    radius: ["none", "sm", "md", "lg", "pill"].includes(String(raw.radius)) ? raw.radius as ThemeTokensV2["radius"] : "md",
    motion: ["none", "subtle", "stagger", "cinematic"].includes(String(raw.motion)) ? raw.motion as ThemeTokensV2["motion"] : "subtle",
  };
}

export function resolveContentSlot(content: SiteContentV2, slot?: V2ContentSlot): unknown {
  if (!slot) return undefined;
  return slot.split(".").reduce<unknown>((current, key) => current && typeof current === "object" ? (current as Record<string, unknown>)[key] : undefined, content);
}

export function setContentSlot(content: SiteContentV2, slot: V2ContentSlot, value: unknown): SiteContentV2 {
  const next = structuredClone(content) as unknown as Record<string, unknown>;
  const path = slot.split(".");
  let target = next;
  for (const key of path.slice(0, -1)) target = target[key] as Record<string, unknown>;
  target[path.at(-1)!] = value;
  return normalizeSiteContentV2(next);
}
