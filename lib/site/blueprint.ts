import { z } from "zod";

/**
 * Schema + types for the AI-generated site blueprint.
 * Kept permissive (most fields optional) so a slightly imperfect model
 * response still validates and renders, while guaranteeing the shape.
 */

export const SECTION_TYPES = [
  "hero",
  "services",
  "about",
  "benefits",
  "testimonials",
  "gallery",
  "faq",
  "contact",
  "cta",
  "trust_badges",
  "process",
  "pricing",
  "location",
  "footer",
] as const;

export type SectionType = (typeof SECTION_TYPES)[number];

export const blueprintSectionSchema = z.object({
  type: z.string(),
  title: z.string().optional().default(""),
  subtitle: z.string().optional().default(""),
  body: z.string().optional().default(""),
  ctaText: z.string().optional().default(""),
  ctaLink: z.string().optional().default(""),
  imagePrompt: z.string().optional().default(""),
  settings: z.record(z.any()).optional().default({}),
});

export const blueprintPageSchema = z.object({
  slug: z.string().optional().default("/"),
  title: z.string().optional().default(""),
  description: z.string().optional().default(""),
  sections: z.array(blueprintSectionSchema).default([]),
});

export const blueprintColorsSchema = z.object({
  primary: z.string().optional().default("#1d4ed8"),
  secondary: z.string().optional().default("#0f172a"),
  accent: z.string().optional().default("#f59e0b"),
  background: z.string().optional().default("#ffffff"),
  text: z.string().optional().default("#0f172a"),
});

export const blueprintVisualStyleSchema = z.object({
  name: z.string().optional().default(""),
  colors: blueprintColorsSchema.optional().default({}),
  fontStyle: z.string().optional().default(""),
  designNotes: z.string().optional().default(""),
});

export const blueprintSeoSchema = z.object({
  title: z.string().optional().default(""),
  metaDescription: z.string().optional().default(""),
  mainKeyword: z.string().optional().default(""),
  secondaryKeywords: z.array(z.string()).optional().default([]),
});

export const blueprintSiteSchema = z.object({
  businessName: z.string().optional().default(""),
  businessType: z.string().optional().default(""),
  language: z.string().optional().default("es"),
  goal: z.string().optional().default(""),
  tone: z.string().optional().default(""),
  visualStyle: blueprintVisualStyleSchema.optional().default({}),
  seo: blueprintSeoSchema.optional().default({}),
  pages: z.array(blueprintPageSchema).default([]),
});

// The model may return { site: {...} } or the bare site object.
export const blueprintSchema = z
  .object({ site: blueprintSiteSchema })
  .or(blueprintSiteSchema.transform((site) => ({ site })));

export type BlueprintSection = z.infer<typeof blueprintSectionSchema>;
export type BlueprintPage = z.infer<typeof blueprintPageSchema>;
export type BlueprintColors = z.infer<typeof blueprintColorsSchema>;
export type BlueprintSite = z.infer<typeof blueprintSiteSchema>;
export type Blueprint = { site: BlueprintSite };

/** Theme used by the renderer (resolved from blueprint or DB overrides). */
export type SiteTheme = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
};
