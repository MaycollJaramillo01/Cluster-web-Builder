import {
  COMPOSITION_STAGES,
  DESIGN_LANGUAGE_PACKS,
  type CompositionStage,
} from "@/lib/site/design-languages";
import {
  DESIGN_LANGUAGE_IDS,
  type DesignLanguageId,
} from "@/lib/site/design-language-types";
import {
  SECTION_LIBRARY_V2,
  type SectionSeedV2,
} from "@/lib/site/v2-section-library";
import {
  auditSiteDocumentV2,
  normalizeSiteContentV2,
  type SiteDocumentV2,
  type SiteQualityIssueV2,
  type SiteQualityReportV2,
} from "@/lib/site/v2-schema";

export const SECTION_DATA_REQUIREMENTS_V2 = [
  "business-name",
  "hero-copy",
  "hero-media",
  "hero-video",
  "about-copy",
  "about-media",
  "services",
  "service-images",
  "benefits",
  "gallery-media",
  "reviews",
  "faqs",
  "location",
  "contact-copy",
  "contact-channel",
] as const;

export type SectionDataRequirementV2 = (typeof SECTION_DATA_REQUIREMENTS_V2)[number];
export type SectionViewportV2 = "mobile" | "tablet" | "desktop";

export type SectionRegistryEntryV2 = {
  key: string;
  name: string;
  role: CompositionStage;
  variant: string;
  region: SectionSeedV2["region"];
  supportedLanguages: readonly DesignLanguageId[];
  preferredLanguages: readonly DesignLanguageId[];
  dataRequirements: readonly SectionDataRequirementV2[];
  responsive: readonly SectionViewportV2[];
  section: SectionSeedV2;
};

export type SectionDataSignalsV2 = Record<SectionDataRequirementV2, boolean>;

export const SECTION_ROLE_LABELS_V2: Record<CompositionStage, string> = {
  hero: "Portada",
  about: "Nosotros",
  services: "Servicios",
  gallery: "Galería",
  benefits: "Beneficios",
  cta: "Llamada a la acción",
  reviews: "Reseñas",
  faq: "Preguntas frecuentes",
  contact: "Contacto",
  footer: "Pie de página",
};

const ALL_VIEWPORTS = ["mobile", "tablet", "desktop"] as const;

const BASE_REQUIREMENTS: Record<CompositionStage, readonly SectionDataRequirementV2[]> = {
  hero: ["business-name", "hero-copy"],
  about: ["about-copy"],
  services: ["services"],
  gallery: ["gallery-media"],
  benefits: ["benefits"],
  cta: ["contact-copy"],
  reviews: ["reviews"],
  faq: ["faqs"],
  contact: ["contact-copy"],
  footer: ["business-name"],
};

const EXTRA_REQUIREMENTS: Record<string, readonly SectionDataRequirementV2[]> = {
  "library-hero-split-image-v2": ["hero-media"],
  "library-hero-background-image-v2": ["hero-media"],
  "library-hero-video-background-v2": ["hero-video"],
  "library-split-hero": ["hero-media"],
  "library-about-split-v2": ["about-media"],
  "library-about-overlap": ["about-media"],
  "library-services-bento": ["service-images"],
  "library-services-catalog-v2": ["service-images"],
  "library-contact-map-v2": ["location"],
  "library-footer-columns-v2": ["contact-channel"],
};

export const SECTION_REQUIREMENT_LABELS_V2: Record<SectionDataRequirementV2, string> = {
  "business-name": "nombre del negocio",
  "hero-copy": "título y descripción principal",
  "hero-media": "imagen de portada",
  "hero-video": "video de portada",
  "about-copy": "historia del negocio",
  "about-media": "imagen de nosotros",
  services: "servicios",
  "service-images": "dos servicios con imagen",
  benefits: "beneficios",
  "gallery-media": "dos imágenes de galería",
  reviews: "reseñas verificadas",
  faqs: "preguntas frecuentes",
  location: "ubicación",
  "contact-copy": "texto de contacto",
  "contact-channel": "teléfono o correo",
};

export const SECTION_REGISTRY_V2: readonly SectionRegistryEntryV2[] = SECTION_LIBRARY_V2.map((section) => {
  const role = roleForSection(section.key);
  const preferredLanguages = DESIGN_LANGUAGE_IDS.filter((language) =>
    COMPOSITION_STAGES.some((stage) => DESIGN_LANGUAGE_PACKS[language].composition[stage].includes(section.key)),
  );
  return {
    key: section.key,
    name: section.name,
    role,
    variant: section.key.replace(/^library-/, "").replace(/-v2$/, ""),
    region: section.region,
    supportedLanguages: DESIGN_LANGUAGE_IDS,
    preferredLanguages,
    dataRequirements: [...new Set([...BASE_REQUIREMENTS[role], ...(EXTRA_REQUIREMENTS[section.key] ?? [])])],
    responsive: ALL_VIEWPORTS,
    section,
  };
});

const registryByKey = new Map(SECTION_REGISTRY_V2.map((entry) => [entry.key, entry]));

export function getSectionRegistryEntryV2(key: string): SectionRegistryEntryV2 | null {
  return registryByKey.get(key) ?? null;
}

export function getSectionDataSignalsV2(value: unknown): SectionDataSignalsV2 {
  const content = normalizeSiteContentV2(value);
  const hasText = (text: string) => text.trim().length > 0;
  const hasHeroVideo = /\.(mp4|webm)(\?|#|$)/i.test(content.hero.media);
  return {
    "business-name": hasText(content.business.name),
    "hero-copy": hasText(content.hero.title) && (hasText(content.hero.subtitle) || hasText(content.hero.body)),
    "hero-media": hasText(content.hero.media) && !hasHeroVideo,
    "hero-video": hasHeroVideo,
    "about-copy": hasText(content.about.title) && hasText(content.about.body),
    "about-media": hasText(content.about.media),
    services: content.services.length > 0,
    "service-images": content.services.filter((item) => hasText(item.image ?? "")).length >= 2,
    benefits: content.benefits.length > 0,
    "gallery-media": content.media.filter((item) => hasText(item.url)).length >= 2,
    reviews: content.reviews.length > 0,
    faqs: content.faqs.length > 0,
    location: hasText(content.business.location),
    "contact-copy": hasText(content.contact.title) && hasText(content.contact.body),
    "contact-channel": hasText(content.business.phone) || hasText(content.business.email),
  };
}

export function getSectionCompatibilityV2(
  entry: SectionRegistryEntryV2,
  signals: SectionDataSignalsV2,
) {
  const missing = entry.dataRequirements.filter((requirement) => !signals[requirement]);
  return { compatible: missing.length === 0, missing };
}

export function filterCompatibleSectionKeysV2(
  keys: readonly string[],
  signals: SectionDataSignalsV2,
): string[] {
  return keys.filter((key) => {
    const entry = registryByKey.get(key);
    return Boolean(entry && getSectionCompatibilityV2(entry, signals).compatible);
  });
}

export function auditSiteDocumentWithRegistryV2(document: SiteDocumentV2): SiteQualityReportV2 {
  const base = auditSiteDocumentV2(document);
  const signals = getSectionDataSignalsV2(document.content);
  const registryIssues = document.sections.flatMap<SiteQualityIssueV2>((section) => {
    const entry = registryByKey.get(section.key);
    if (!entry) return [];
    const { missing } = getSectionCompatibilityV2(entry, signals);
    if (!missing.length) return [];
    return [{
      level: "warning",
      code: `SECTION_DATA:${entry.key}`,
      message: `El bloque "${entry.name}" necesita ${missing.map((item) => SECTION_REQUIREMENT_LABELS_V2[item]).join(", ")}.`,
    }];
  });
  return { passed: base.passed, issues: [...base.issues, ...registryIssues] };
}

function roleForSection(key: string): CompositionStage {
  for (const stage of COMPOSITION_STAGES) {
    if (DESIGN_LANGUAGE_IDS.some((language) => DESIGN_LANGUAGE_PACKS[language].composition[stage].includes(key))) {
      return stage;
    }
  }
  if (key.includes("hero")) return "hero";
  if (key.includes("about")) return "about";
  if (key.includes("services")) return "services";
  if (key.includes("gallery")) return "gallery";
  if (key.includes("benefits")) return "benefits";
  if (key.includes("cta")) return "cta";
  if (key.includes("reviews")) return "reviews";
  if (key.includes("faq")) return "faq";
  if (key.includes("contact")) return "contact";
  return "footer";
}
