import {
  getDesignLanguagePack,
  optimizeCompositionPath,
  selectDesignLanguage,
} from "@/lib/site/design-languages";
import {
  isDesignLanguageId,
  type DesignLanguageId,
} from "@/lib/site/design-language-types";
import { SECTION_LIBRARY_V2 } from "@/lib/site/v2-section-library";
import {
  normalizeCanvasSectionsV2,
  normalizeSiteContentV2,
  normalizeThemeV2,
  type CanvasSectionV2,
  type ThemeTokensV2,
} from "@/lib/site/v2-schema";

type SectionSeed = Omit<CanvasSectionV2, "id">;

const DEFAULT_THEME: ThemeTokensV2 = {
  language: "swiss",
  primary: "#2563eb",
  secondary: "#111827",
  accent: "#f59e0b",
  background: "#ffffff",
  text: "#111827",
  muted: "#64748b",
  headingFont: "Arial, Helvetica, sans-serif",
  bodyFont: "Arial, Helvetica, sans-serif",
  headingCase: "none",
  radius: "md",
  motion: "subtle",
};

const HEADER_SEED: SectionSeed = {
  schemaVersion: 2,
  key: "global-header",
  name: "Header",
  region: "header",
  rows: [{
    id: "seed-row",
    columns: [
      { id: "seed-brand", span: { desktop: 4, tablet: 6, mobile: 12 }, widgets: [{ id: "seed-brand-widget", type: "brand", slot: "business.name", variant: "logo" }] },
      { id: "seed-nav", span: { desktop: 8, tablet: 6, mobile: 12 }, widgets: [{ id: "seed-nav-widget", type: "nav", variant: "links" }] },
    ],
  }],
  style: { desktop: { padding: "sm", width: "full" } },
};

const sectionByKey = new Map(SECTION_LIBRARY_V2.map((section) => [section.key, section]));

export function composeSiteSectionsV2({
  content: value,
  businessType,
  visualStyle,
  designLanguage,
  theme,
  customSections = [],
}: {
  content: unknown;
  businessType?: string | null;
  visualStyle?: string | null;
  designLanguage?: DesignLanguageId | null;
  theme?: Partial<ThemeTokensV2> | null;
  customSections?: CanvasSectionV2[];
}) {
  const content = normalizeSiteContentV2(value);
  const requestedLanguage = isDesignLanguageId(designLanguage)
    ? designLanguage
    : isDesignLanguageId(theme?.language)
      ? theme.language
      : null;
  const language = requestedLanguage ?? selectDesignLanguage({
    visualStyle,
    businessType: businessType ?? content.business.type,
    aboutLength: content.about.body.length,
    mediaCount: content.media.length,
  }).id;
  const languagePack = getDesignLanguagePack(language);
  const seed = `${content.business.name}:${businessType ?? content.business.type}:${visualStyle ?? ""}:${language}`;
  const hasMap = Boolean(content.business.location);
  const hasMedia = content.media.length > 1;
  const hasVideo = /\.(mp4|webm)(\?|#|$)/i.test(content.hero.media);
  const contactCandidates = languagePack.composition.contact.filter((key) => hasMap || !key.includes("map"));
  const keys = optimizeCompositionPath(seed, [
    { stage: "hero", candidates: hasVideo ? ["library-hero-video-background-v2"] : languagePack.composition.hero },
    { stage: "about", candidates: languagePack.composition.about },
    { stage: "services", candidates: languagePack.composition.services },
    ...(hasMedia ? [{ stage: "gallery" as const, candidates: languagePack.composition.gallery }] : []),
    ...(content.benefits.length ? [{ stage: "benefits" as const, candidates: languagePack.composition.benefits }] : []),
    { stage: "cta", candidates: languagePack.composition.cta },
    ...(content.reviews.length ? [{ stage: "reviews" as const, candidates: languagePack.composition.reviews }] : []),
    ...(content.faqs.length ? [{ stage: "faq" as const, candidates: languagePack.composition.faq }] : []),
    {
      stage: "contact",
      candidates: hasMap && languagePack.composition.contact.includes("library-contact-map-v2")
        ? ["library-contact-map-v2"]
        : contactCandidates,
    },
    { stage: "footer", candidates: languagePack.composition.footer },
  ]).keys;

  const sections = [
    cloneSection(HEADER_SEED),
    ...keys.map((key) => sectionByKey.get(key)).filter((section): section is SectionSeed => Boolean(section)).map(cloneSection),
    ...customSections.filter((section) => section.region === "main" && section.rows.some((row) => row.columns.some((column) => column.widgets.some((widget) => !widget.slot)))),
  ].map((section, order) => ({ ...section, order }));

  return {
    content,
    design: normalizeThemeV2({
      ...DEFAULT_THEME,
      ...languagePack.themeDefaults,
      ...theme,
      language,
    }),
    sections: normalizeCanvasSectionsV2(sections).map((section, order) => ({ ...section, order })),
  };
}

function cloneSection(seed: SectionSeed): CanvasSectionV2 {
  return {
    ...structuredClone(seed),
    id: crypto.randomUUID(),
    rows: seed.rows.map((row) => ({
      ...structuredClone(row),
      id: crypto.randomUUID(),
      columns: row.columns.map((column) => ({
        ...structuredClone(column),
        id: crypto.randomUUID(),
        widgets: column.widgets.map((widget) => ({ ...structuredClone(widget), id: crypto.randomUUID() })),
      })),
    })),
  };
}
