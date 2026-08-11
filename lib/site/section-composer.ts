import {
  getDesignLanguagePack,
  optimizeCompositionPath,
  selectDesignLanguage,
  type CompositionStage,
} from "@/lib/site/design-languages";
import {
  isDesignLanguageId,
  type DesignLanguageId,
} from "@/lib/site/design-language-types";
import type { SectionType } from "@/lib/site/blueprint";
import {
  filterCompatibleSectionKeysV2,
  getSectionDataSignalsV2,
  SECTION_REGISTRY_V2,
} from "@/lib/site/v2-section-registry";
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

const sectionByKey = new Map(SECTION_REGISTRY_V2.map((entry) => [entry.key, entry.section]));
const NAV_LABELS: Partial<Record<CompositionStage, string>> = {
  about: "Nosotros",
  services: "Servicios",
  gallery: "Proyectos",
  faq: "Preguntas",
  contact: "Contacto",
};

const DEFAULT_STAGE_ORDER: readonly CompositionStage[] = [
  "hero",
  "about",
  "services",
  "gallery",
  "benefits",
  "cta",
  "reviews",
  "faq",
  "contact",
  "footer",
];

const BLUEPRINT_STAGE: Partial<Record<SectionType, CompositionStage>> = {
  hero: "hero",
  about: "about",
  about_us: "about",
  services: "services",
  gallery: "gallery",
  benefits: "benefits",
  trust_badges: "benefits",
  process: "benefits",
  cta: "cta",
  testimonials: "reviews",
  faq: "faq",
  contact: "contact",
  location: "contact",
  footer: "footer",
};

export function composeSiteSectionsV2({
  content: value,
  businessType,
  visualStyle,
  designLanguage,
  theme,
  customSections = [],
  blueprint,
}: {
  content: unknown;
  businessType?: string | null;
  visualStyle?: string | null;
  designLanguage?: DesignLanguageId | null;
  theme?: Partial<ThemeTokensV2> | null;
  customSections?: CanvasSectionV2[];
  blueprint?: readonly SectionType[];
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
  const signals = getSectionDataSignalsV2(content);
  const planned = blueprint ? new Set(blueprint) : null;
  const wants = (...types: SectionType[]) => !planned || types.some((type) => planned.has(type));
  const candidates = (keys: readonly string[]) => filterCompatibleSectionKeysV2(keys, signals);
  const contactCandidates = candidates(languagePack.composition.contact);
  const serviceCandidates = candidates(languagePack.composition.services);
  const candidatesByStage: Partial<Record<CompositionStage, readonly string[]>> = {
    hero: signals["hero-video"] ? ["library-hero-video-background-v2"] : candidates(languagePack.composition.hero),
    ...(wants("about", "about_us") ? { about: candidates(languagePack.composition.about) } : {}),
    ...(wants("services") ? { services: serviceCandidates } : {}),
    ...(wants("gallery") ? { gallery: candidates(languagePack.composition.gallery) } : {}),
    ...(wants("benefits", "trust_badges", "process") ? { benefits: candidates(languagePack.composition.benefits) } : {}),
    ...(wants("cta") ? { cta: candidates(languagePack.composition.cta) } : {}),
    ...(wants("testimonials") ? { reviews: candidates(languagePack.composition.reviews) } : {}),
    ...(wants("faq") ? { faq: candidates(languagePack.composition.faq) } : {}),
    ...(wants("contact", "location") ? {
      contact: signals.location && contactCandidates.includes("library-contact-map-v2")
        ? ["library-contact-map-v2"]
        : contactCandidates,
    } : {}),
    ...(wants("footer") ? { footer: candidates(languagePack.composition.footer) } : {}),
  };
  const requestedStageOrder = blueprint
    ? blueprint.flatMap((sectionType) => BLUEPRINT_STAGE[sectionType] ?? [])
    : DEFAULT_STAGE_ORDER;
  const stageOrder = [...new Set(requestedStageOrder)];
  const stages = stageOrder.flatMap((stage) => {
    const candidates = candidatesByStage[stage];
    return candidates?.length ? [{ stage, candidates }] : [];
  });
  const keys = optimizeCompositionPath(seed, stages).keys;
  const selected = keys.map((key, index) => ({ key, stage: stages[index].stage }));
  const header = cloneSection(HEADER_SEED);
  setHeaderNavigation(header, selected);

  const sections = [
    header,
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

function setHeaderNavigation(header: CanvasSectionV2, selected: { key: string; stage: CompositionStage }[]) {
  const nav = header.rows.flatMap((row) => row.columns).flatMap((column) => column.widgets).find((item) => item.type === "nav");
  if (!nav) return;
  nav.data = {
    ...nav.data,
    items: selected.flatMap(({ key, stage }) => NAV_LABELS[stage] ? [{ label: NAV_LABELS[stage], href: `#${key}` }] : []),
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
