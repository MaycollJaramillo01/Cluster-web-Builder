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
  primary: "#2563eb",
  secondary: "#111827",
  accent: "#f59e0b",
  background: "#ffffff",
  text: "#111827",
  muted: "#64748b",
  headingFont: "Inter, system-ui, sans-serif",
  bodyFont: "Inter, system-ui, sans-serif",
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

const pick = (seed: string, keys: string[]) => keys[Math.abs(hash(seed)) % keys.length];

export function composeSiteSectionsV2({
  content: value,
  businessType,
  visualStyle,
  theme,
  customSections = [],
}: {
  content: unknown;
  businessType?: string | null;
  visualStyle?: string | null;
  theme?: Partial<ThemeTokensV2> | null;
  customSections?: CanvasSectionV2[];
}) {
  const content = normalizeSiteContentV2(value);
  const seed = `${content.business.name}:${businessType ?? content.business.type}:${visualStyle ?? ""}`;
  const type = `${businessType ?? content.business.type}`.toLowerCase();
  const hasMap = Boolean(content.business.location);
  const hasMedia = content.media.length > 1;
  const hasVideo = /\.(mp4|webm)(\?|#|$)/i.test(content.hero.media);

  const keys = [
    hasVideo ? "library-hero-video-background-v2" : pick(seed, heroKeys(type)),
    pick(`${seed}:about`, ["library-about-split-v2", "library-about-minimal-v2", "library-about-overlap", "library-about-stats"]),
    pick(`${seed}:services`, serviceKeys(type)),
    ...(hasMedia ? [pick(`${seed}:gallery`, ["library-gallery-grid-v2", "library-gallery-mosaic-v2", "library-gallery-filmstrip"])] : []),
    ...(content.benefits.length ? [pick(`${seed}:benefits`, ["library-benefits-metrics-v2", "library-benefits-pills-v2", "library-benefits-numbered-v2"])] : []),
    pick(`${seed}:cta`, ["library-cta-card-v2", "library-cta-split-v2", "library-cta-band"]),
    ...(content.reviews.length ? [pick(`${seed}:reviews`, ["library-reviews-cards-v2", "library-reviews-wall-v2", "library-reviews-quotes"])] : []),
    ...(content.faqs.length ? [pick(`${seed}:faq`, ["library-faq-minimal-v2", "library-faq-cards-v2"])] : []),
    hasMap ? "library-contact-map-v2" : "library-contact-split-v2",
    pick(`${seed}:footer`, ["library-footer-columns-v2", "library-footer-minimal-v2"]),
  ];

  const sections = [
    cloneSection(HEADER_SEED),
    ...keys.map((key) => sectionByKey.get(key)).filter((section): section is SectionSeed => Boolean(section)).map(cloneSection),
    ...customSections.filter((section) => section.region === "main" && section.rows.some((row) => row.columns.some((column) => column.widgets.some((widget) => !widget.slot)))),
  ].map((section, order) => ({ ...section, order }));

  return {
    content,
    design: normalizeThemeV2({ ...DEFAULT_THEME, ...theme }),
    sections: normalizeCanvasSectionsV2(sections).map((section, order) => ({ ...section, order })),
  };
}

function heroKeys(type: string) {
  if (/restaurant|comida|caf|bar|hotel|turismo|fitness|gym|yoga|spa|belleza|pintura|painting|hvac|reparaci|construc/.test(type)) {
    return ["library-hero-split-image-v2", "library-hero-background-image-v2"];
  }
  return ["library-hero-split-image-v2", "library-hero-centered-v2", "library-poster-hero"];
}

function serviceKeys(type: string) {
  if (/tienda|producto|catalog|menu|restaurant|comida/.test(type)) return ["library-services-catalog-v2", "library-services-bento"];
  if (/legal|abogad|consult|conta|software|tecnolog/.test(type)) return ["library-services-editorial-v2", "library-services-cards-v2"];
  return ["library-services-cards-v2", "library-services-bento", "library-services-editorial-v2"];
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

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}
