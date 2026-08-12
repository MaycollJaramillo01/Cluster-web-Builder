import {
  DESIGN_LANGUAGE_IDS,
  type DesignLanguageId,
} from "@/lib/site/design-language-types";
import type { ThemeTokensV2 } from "@/lib/site/v2-schema";

export const COMPOSITION_STAGES = [
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
] as const;

export type CompositionStage = (typeof COMPOSITION_STAGES)[number];

type LanguageThemeDefaults = Pick<
  ThemeTokensV2,
  "headingFont" | "bodyFont" | "headingCase" | "radius" | "motion"
>;

export type DesignLanguagePack = {
  id: DesignLanguageId;
  name: string;
  description: string;
  principles: readonly [string, string, string];
  dials: {
    designVariance: number;
    motionIntensity: number;
    visualDensity: number;
  };
  themeDefaults: LanguageThemeDefaults;
  grammar: {
    contentWidth: string;
    ruleWidth: string;
    headingTracking: string;
    headingLineHeight: string;
    bodyLineHeight: string;
    navTracking: string;
  };
  composition: Record<CompositionStage, readonly string[]>;
};

export const DESIGN_LANGUAGE_PACKS: Record<DesignLanguageId, DesignLanguagePack> = {
  bauhaus: {
    id: "bauhaus",
    name: "Bauhaus UI",
    description: "Geometría directa, contraste fuerte y jerarquías de cartel.",
    principles: ["Forma funcional", "Contraste estructural", "Ritmo geométrico"],
    dials: { designVariance: 8, motionIntensity: 5, visualDensity: 5 },
    themeDefaults: {
      headingFont: "Space Grotesk, Arial, sans-serif",
      bodyFont: "Karla, Arial, sans-serif",
      headingCase: "uppercase",
      radius: "none",
      motion: "stagger",
    },
    grammar: {
      contentWidth: "1200px",
      ruleWidth: "3px",
      headingTracking: "-0.055em",
      headingLineHeight: ".92",
      bodyLineHeight: "1.55",
      navTracking: ".1em",
    },
    composition: {
      hero: ["library-hero-split-image-v2", "library-hero-background-image-v2", "library-poster-hero"],
      about: ["library-about-stats", "library-about-overlap", "library-about-split-v2"],
      services: ["library-services-bento", "library-services-cards-v2"],
      gallery: ["library-gallery-mosaic-v2", "library-gallery-filmstrip"],
      benefits: ["library-benefits-numbered-v2", "library-benefits-metrics-v2"],
      cta: ["library-cta-band", "library-cta-split-v2"],
      reviews: ["library-reviews-wall-v2", "library-reviews-cards-v2"],
      faq: ["library-faq-cards-v2", "library-faq-minimal-v2"],
      contact: ["library-contact-split-v2", "library-contact-card", "library-contact-map-v2"],
      footer: ["library-footer-columns-v2", "library-footer-minimal-v2"],
    },
  },
  swiss: {
    id: "swiss",
    name: "Swiss Design",
    description: "Retícula rigurosa, tipografía neutral y máxima claridad.",
    principles: ["Retícula visible", "Orden tipográfico", "Información primero"],
    dials: { designVariance: 6, motionIntensity: 3, visualDensity: 4 },
    themeDefaults: {
      headingFont: "Arial, Helvetica, sans-serif",
      bodyFont: "Arial, Helvetica, sans-serif",
      headingCase: "none",
      radius: "sm",
      motion: "subtle",
    },
    grammar: {
      contentWidth: "1120px",
      ruleWidth: "1px",
      headingTracking: "-0.045em",
      headingLineHeight: ".98",
      bodyLineHeight: "1.6",
      navTracking: ".075em",
    },
    composition: {
      hero: ["library-hero-split-image-v2", "library-hero-centered-v2"],
      about: ["library-about-minimal-v2", "library-about-split-v2"],
      services: ["library-services-editorial-v2", "library-services-cards-v2"],
      gallery: ["library-gallery-grid-v2", "library-gallery-filmstrip"],
      benefits: ["library-benefits-metrics-v2", "library-benefits-numbered-v2"],
      cta: ["library-cta-split-v2", "library-cta-band"],
      reviews: ["library-reviews-quotes", "library-reviews-cards-v2"],
      faq: ["library-faq-minimal-v2"],
      contact: ["library-contact-map-v2", "library-contact-split-v2"],
      footer: ["library-footer-minimal-v2", "library-footer-columns-v2"],
    },
  },
  editorial: {
    id: "editorial",
    name: "Editorial UI",
    description: "Tipografía expresiva, ritmo amplio y narrativa visual.",
    principles: ["Lectura protagonista", "Ritmo asimétrico", "Imagen con intención"],
    dials: { designVariance: 7, motionIntensity: 4, visualDensity: 3 },
    themeDefaults: {
      headingFont: "Cormorant Garamond, Georgia, serif",
      bodyFont: "Karla, Arial, sans-serif",
      headingCase: "none",
      radius: "none",
      motion: "subtle",
    },
    grammar: {
      contentWidth: "1060px",
      ruleWidth: "1px",
      headingTracking: "-0.015em",
      headingLineHeight: ".98",
      bodyLineHeight: "1.75",
      navTracking: ".025em",
    },
    composition: {
      hero: ["library-hero-split-image-v2", "library-hero-background-image-v2", "library-hero-centered-v2"],
      about: ["library-about-overlap", "library-about-split-v2", "library-about-minimal-v2"],
      services: ["library-services-editorial-v2", "library-services-catalog-v2"],
      gallery: ["library-gallery-filmstrip", "library-gallery-mosaic-v2", "library-gallery-grid-v2"],
      benefits: ["library-benefits-numbered-v2", "library-benefits-pills-v2"],
      cta: ["library-cta-card-v2", "library-cta-split-v2"],
      reviews: ["library-reviews-quotes", "library-reviews-wall-v2"],
      faq: ["library-faq-minimal-v2"],
      contact: ["library-contact-card", "library-contact-split-v2", "library-contact-map-v2"],
      footer: ["library-footer-minimal-v2", "library-footer-columns-v2"],
    },
  },
  industrial: {
    id: "industrial",
    name: "Industrial Utility",
    description: "Jerarquía de obra, contraste operativo y conversión directa para contratistas.",
    principles: ["Prueba antes que promesa", "Acción visible", "Estructura de trabajo"],
    dials: { designVariance: 6, motionIntensity: 2, visualDensity: 6 },
    themeDefaults: {
      headingFont: "Barlow Condensed, Arial Narrow, Arial, sans-serif",
      bodyFont: "Inter, Arial, sans-serif",
      headingCase: "uppercase",
      radius: "sm",
      motion: "subtle",
    },
    grammar: {
      contentWidth: "1240px",
      ruleWidth: "2px",
      headingTracking: "-.02em",
      headingLineHeight: ".9",
      bodyLineHeight: "1.55",
      navTracking: ".07em",
    },
    composition: {
      hero: ["library-hero-split-image-v2", "library-hero-background-image-v2"],
      about: ["library-about-stats", "library-about-split-v2"],
      services: ["library-services-cards-v2", "library-services-bento"],
      gallery: ["library-gallery-projects-v2", "library-gallery-mosaic-v2", "library-gallery-grid-v2"],
      benefits: ["library-benefits-metrics-v2", "library-benefits-numbered-v2"],
      cta: ["library-cta-band", "library-cta-split-v2"],
      reviews: ["library-reviews-trust-v2", "library-reviews-cards-v2", "library-reviews-wall-v2"],
      faq: ["library-faq-minimal-v2", "library-faq-cards-v2"],
      contact: ["library-contact-split-v2", "library-contact-map-v2", "library-contact-card"],
      footer: ["library-footer-columns-v2", "library-footer-minimal-v2"],
    },
  },
  storm: {
    id: "storm",
    name: "Storm Response",
    description: "Lectura de despacho: emergencia visible, disponibilidad declarada y reclamo de seguro explicado.",
    principles: ["Emergencia primero", "Disponibilidad declarada", "Reclamo documentado"],
    dials: { designVariance: 5, motionIntensity: 2, visualDensity: 7 },
    themeDefaults: {
      headingFont: "Archivo, Arial, Helvetica, sans-serif",
      bodyFont: "Inter, Arial, sans-serif",
      headingCase: "uppercase",
      radius: "none",
      motion: "subtle",
    },
    grammar: {
      contentWidth: "1280px",
      ruleWidth: "2px",
      headingTracking: "-.032em",
      headingLineHeight: ".88",
      bodyLineHeight: "1.6",
      navTracking: ".09em",
    },
    composition: {
      hero: ["library-hero-emergency-v2", "library-hero-background-image-v2", "library-hero-centered-v2"],
      about: ["library-about-showcase-v2", "library-about-stats", "library-about-split-v2"],
      services: ["library-services-cards-v2", "library-services-bento"],
      gallery: ["library-gallery-projects-v2", "library-gallery-grid-v2"],
      benefits: ["library-availability-grid-v2", "library-benefits-metrics-v2", "library-benefits-numbered-v2"],
      cta: ["library-emergency-band-v2", "library-cta-band"],
      reviews: ["library-reviews-trust-v2", "library-reviews-cards-v2"],
      faq: ["library-insurance-faq-v2", "library-faq-minimal-v2"],
      contact: ["library-contact-split-v2", "library-contact-map-v2"],
      footer: ["library-footer-columns-v2", "library-footer-minimal-v2"],
    },
  },
};

export type CompositionGraphStage = {
  stage: CompositionStage;
  candidates: readonly string[];
};

export type CompositionPath = {
  keys: string[];
  score: number;
};

export type CompositionProfile = {
  density: 1 | 2 | 3;
  layout: "focus" | "split" | "grid";
  contrast: boolean;
};

type CompositionProfileResolver = (key: string) => CompositionProfile | null | undefined;

const NEUTRAL_COMPOSITION_PROFILE: CompositionProfile = {
  density: 2,
  layout: "grid",
  contrast: false,
};

export function optimizeCompositionPath(
  seed: string,
  stages: readonly CompositionGraphStage[],
  resolveProfile: CompositionProfileResolver = () => NEUTRAL_COMPOSITION_PROFILE,
): CompositionPath {
  const graph = stages.filter((stage) => stage.candidates.length > 0);
  if (!graph.length) return { keys: [], score: 0 };

  type CandidatePath = CompositionPath & { last: string };
  let paths: CandidatePath[] = graph[0].candidates.map((key, index) => ({
    keys: [key],
    last: key,
    score: nodeScore(seed, graph[0].stage, key, index, graph[0].candidates.length),
  }));

  // ponytail: exact O(stages*candidates²); with 10 stages and at most 3 candidates,
  // beam search would add code without improving measurable runtime.
  for (const stage of graph.slice(1)) {
    paths = stage.candidates.map((key, index) => {
      let best: CandidatePath | null = null;
      for (const previous of paths) {
        const candidate: CandidatePath = {
          keys: [...previous.keys, key],
          last: key,
          score: previous.score
            + nodeScore(seed, stage.stage, key, index, stage.candidates.length)
            + edgeScore(previous.last, key, resolveProfile),
        };
        if (!best || candidate.score > best.score || (candidate.score === best.score && candidate.keys.join(">") < best.keys.join(">"))) {
          best = candidate;
        }
      }
      return best!;
    });
  }

  const best = paths.reduce((winner, candidate) =>
    candidate.score > winner.score || (candidate.score === winner.score && candidate.keys.join(">") < winner.keys.join(">"))
      ? candidate
      : winner,
  );
  return { keys: best.keys, score: best.score };
}

function nodeScore(seed: string, stage: CompositionStage, key: string, index: number, count: number): number {
  // El orden del pack expresa criterio de diseño. La semilla aporta variedad,
  // pero no debe convertir una dirección editorial en una selección aleatoria.
  return (count - index) * 12 + stableHash(`${seed}:${stage}:${key}`) % 3;
}

function edgeScore(previousKey: string, nextKey: string, resolveProfile: CompositionProfileResolver): number {
  const previous = resolveProfile(previousKey) ?? NEUTRAL_COMPOSITION_PROFILE;
  const next = resolveProfile(nextKey) ?? NEUTRAL_COMPOSITION_PROFILE;
  return (previous.layout === next.layout ? -3 : 1)
    + (previous.density === next.density ? -2 : 1)
    + (previous.contrast && next.contrast ? -4 : previous.contrast !== next.contrast ? 1 : 0);
}

function stableHash(value: string): number {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) {
    result ^= value.charCodeAt(index);
    result = Math.imul(result, 16777619);
  }
  return result >>> 0;
}

export type DesignLanguageRanking = {
  id: DesignLanguageId;
  score: number;
  reasons: string[];
};

export type DesignLanguageSignals = {
  visualStyle?: string | null;
  businessType?: string | null;
  goal?: string | null;
  aboutLength?: number;
  mediaCount?: number;
  languageAffinity?: Partial<Record<DesignLanguageId, number>>;
};

const STYLE_AFFINITIES: Record<string, Partial<Record<DesignLanguageId, number>>> = {
  bold: { bauhaus: 9 },
  creative: { bauhaus: 9 },
  modern_clean: { swiss: 9 },
  corporate: { swiss: 9 },
  local_trustworthy: { swiss: 6, industrial: 4, storm: 5 },
  premium_elegant: { editorial: 9 },
  minimalist: { editorial: 6, swiss: 4 },
};

const BUSINESS_AFFINITIES: Array<{
  language: DesignLanguageId;
  pattern: RegExp;
  score: number;
  reason: string;
}> = [
  { language: "bauhaus", pattern: /creative|fitness|gym|sport|beauty|belleza/, score: 4, reason: "actividad visual y expresiva" },
  { language: "swiss", pattern: /software|tech|legal|law|medical|clinic|consult|account|service|servicio/, score: 4, reason: "actividad orientada a claridad y confianza" },
  { language: "editorial", pattern: /architect|arquitect|fashion|moda|hotel|restaurant|restaurante|real_estate|inmobil|studio|estudio|art|arte/, score: 4, reason: "actividad con narrativa e imagen de marca" },
  { language: "industrial", pattern: /roof|roofing|techo|siding|gutter|canaleta|construction|construc|contractor|contratista|remodel|restoration|concrete|masonry|hvac|plumb|electric|solar|painting|pintura/, score: 12, reason: "actividad de obra que convierte mediante confianza, alcance y respuesta rápida" },
  // Gana sobre Industrial cuando la actividad se activa por un evento: la
  // urgencia, la disponibilidad y el reclamo de seguro mandan sobre el catálogo.
  { language: "storm", pattern: /storm|tormenta|hail|granizo|hurac|flood|inunda|water_damage|dano_por_agua|leak|filtracion|gotera|mitigation|mitigacion|restoration|restauracion|emergency|emergencia|24_7|plumb|plomeria|fontaner|hvac|climatizacion|aire_acondicionado|mold|moho|burst|tuberia/, score: 18, reason: "actividad de emergencia que se decide por disponibilidad y respaldo del seguro" },
];

export function getDesignLanguagePack(id: DesignLanguageId): DesignLanguagePack {
  return DESIGN_LANGUAGE_PACKS[id];
}

export function applyDesignLanguage(
  theme: ThemeTokensV2,
  language: DesignLanguageId,
): ThemeTokensV2 {
  return {
    ...theme,
    ...DESIGN_LANGUAGE_PACKS[language].themeDefaults,
    language,
  };
}

export function rankDesignLanguages(signals: DesignLanguageSignals): DesignLanguageRanking[] {
  const scores: Record<DesignLanguageId, number> = { bauhaus: 0, swiss: 1, editorial: 0, industrial: 0, storm: 0 };
  const reasons: Record<DesignLanguageId, string[]> = { bauhaus: [], swiss: [], editorial: [], industrial: [], storm: [] };
  const visualStyle = normalizeSignal(signals.visualStyle);
  const businessType = normalizeSignal(signals.businessType);
  const goal = normalizeSignal(signals.goal);

  for (const id of DESIGN_LANGUAGE_IDS) {
    const affinity = signals.languageAffinity?.[id] ?? 0;
    if (!affinity) continue;
    scores[id] += affinity;
    reasons[id].push("afinidad con la receta funcional");
  }

  const styleAffinity = STYLE_AFFINITIES[visualStyle];
  if (styleAffinity) {
    for (const id of DESIGN_LANGUAGE_IDS) {
      const score = styleAffinity[id];
      if (!score) continue;
      scores[id] += score;
      reasons[id].push(`afinidad con el estilo ${visualStyle}`);
    }
  }

  for (const affinity of BUSINESS_AFFINITIES) {
    if (!affinity.pattern.test(businessType)) continue;
    scores[affinity.language] += affinity.score;
    reasons[affinity.language].push(affinity.reason);
  }

  if (/portfolio|showcase|catalog|producto/.test(goal)) {
    scores.editorial += 2;
    reasons.editorial.push("objetivo centrado en mostrar una colección");
  }
  if (/call|quote|lead|appointment|contact/.test(goal)) {
    scores.swiss += 2;
    reasons.swiss.push("objetivo centrado en conversión directa");
    scores.industrial += 3;
    reasons.industrial.push("objetivo centrado en llamada o cotización inmediata");
    scores.storm += 4;
    reasons.storm.push("objetivo que depende de responder la llamada en el momento");
  }
  if ((signals.aboutLength ?? 0) >= 500) {
    scores.editorial += 2;
    reasons.editorial.push("contenido narrativo extenso");
  }
  if ((signals.mediaCount ?? 0) >= 4) {
    scores.editorial += 2;
    reasons.editorial.push("colección visual disponible");
  }

  return DESIGN_LANGUAGE_IDS
    .map((id) => ({ id, score: scores[id], reasons: reasons[id] }))
    .sort((left, right) => right.score - left.score || DESIGN_LANGUAGE_IDS.indexOf(left.id) - DESIGN_LANGUAGE_IDS.indexOf(right.id));
}

export function selectDesignLanguage(signals: DesignLanguageSignals): DesignLanguageRanking {
  return rankDesignLanguages(signals)[0];
}

function normalizeSignal(value: string | null | undefined): string {
  return (value ?? "")
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_|_$/g, "");
}
