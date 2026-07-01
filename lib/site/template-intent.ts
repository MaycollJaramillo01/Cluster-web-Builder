import { DESIGN_STYLE_IDS, getDesignPreset, type DesignStyleId, type TemplateFamily } from "@/lib/site/design";

export type TemplateIntent = DesignStyleId;

/** Composiciones por familia, derivadas de los presets para que nunca diverjan del catálogo real. */
const FAMILY_TEMPLATES = DESIGN_STYLE_IDS.reduce<Record<TemplateFamily, DesignStyleId[]>>(
  (families, style) => {
    families[getDesignPreset(style).family].push(style);
    return families;
  },
  { service: [], editorial: [], immersive: [], catalog: [], local: [], minimal: [] },
);

/**
 * Familias afines por industria, en orden de relevancia. La primera es la que usa la
 * selección automática; el resto prioriza el orden de las propuestas del picker.
 */
const FAMILY_AFFINITY: Record<string, TemplateFamily[]> = {
  restaurant: ["catalog", "local", "immersive"],
  roofing: ["service", "local", "catalog"],
  painting: ["service", "local", "editorial"],
  landscaping: ["local", "service", "catalog"],
  cleaning: ["local", "service", "minimal"],
  law_firm: ["service", "minimal", "editorial"],
  real_estate: ["editorial", "catalog", "service"],
  medical: ["service", "local", "minimal"],
  beauty: ["immersive", "local", "editorial"],
  fitness: ["immersive", "service", "catalog"],
  other: ["service", "editorial", "catalog"],
};

/** Mapea etiquetas libres guardadas en la base ("Restaurante", "Consultoría") a una industria conocida. */
const BUSINESS_LABEL_PATTERNS: Array<[RegExp, keyof typeof FAMILY_AFFINITY]> = [
  [/restauran|comida|cafeter|caf[eé]\b|men[uú]|gastronom|panader|pizzer/, "restaurant"],
  [/techo|tejado|roofing/, "roofing"],
  [/pintur|pintor/, "painting"],
  [/jardiner|paisajismo|landscaping/, "landscaping"],
  [/limpieza|cleaning/, "cleaning"],
  [/abogad|legal|bufete|jur[ií]dic/, "law_firm"],
  [/inmobiliaria|bienes ra[ií]ces|real estate/, "real_estate"],
  [/cl[ií]nica|m[eé]dic|salud|dental|odontol/, "medical"],
  [/belleza|sal[oó]n|spa|barber|est[eé]tica/, "beauty"],
  [/gimnasio|fitness|entrenamiento|deporte/, "fitness"],
  [/arquitect|fotograf|portafolio|dise[ñn]|editorial/, "real_estate"],
];

/** Acepta tanto el enum del onboarding ("restaurant") como la etiqueta guardada en la base ("Restaurante"). */
export function getFamilyAffinity(businessType?: string | null): TemplateFamily[] {
  const value = (businessType ?? "").toLocaleLowerCase("es").trim();
  if (!value) return FAMILY_AFFINITY.other;
  if (value in FAMILY_AFFINITY) return FAMILY_AFFINITY[value];
  const match = BUSINESS_LABEL_PATTERNS.find(([pattern]) => pattern.test(value));
  return FAMILY_AFFINITY[match?.[1] ?? "other"];
}

/** Selects one of 26 full compositions from business intent, deterministically. */
export function selectLandingTemplate(
  input: { businessType: string; customBusinessType?: string; goal: string; location: string },
  request: string,
): TemplateIntent {
  const text = `${request} ${input.customBusinessType ?? ""} ${input.location}`.toLocaleLowerCase("es");

  if (/\b(brutal|manifiesto|rebelde|punk)\b/.test(text)) return "Manifesto";
  if (/\b(collage|creativ[oa]|artista|agencia)\b/.test(text)) return "Collage";
  if (/\b(retrato|biograf|autor|personal)\b/.test(text)) return "Portrait";
  if (/\b(m[eé]tricas?|resultados?|datos?|finanz|inversi)/.test(text)) return "Metrics";
  if (/\b(proceso|paso a paso|metodolog)\b/.test(text)) return "Numbered";
  if (/\b(pesca)\b/.test(text)) return "Immersive";
  if (/\b(panor[aá]mic|viaje|turismo|naturaleza|aventura)\b/.test(text)) return "Panorama";
  if (/\b(minimal|simple|sobri[oa]|limpi[oa])\b/.test(text)) return pick("minimal", text);
  if (/\b(editorial|revista|fotograf|portafolio|arquitect|lujo|premium)\b/.test(text)) return pick("editorial", text);
  if (/\b(inmersiv|cinemat|deporte|evento|m[uú]sica)\b/.test(text)) return pick("immersive", text);
  if (input.goal === "sell_products" || /\b(tienda|cat[aá]logo|producto|men[uú]|colecci[oó]n)\b/.test(text)) return pick("catalog", text);
  if (/\b(local|barrio|cercan|familia|comunidad)\b/.test(text)) return pick("local", text);
  return pick(getFamilyAffinity(input.businessType)[0], text);
}

function pick(family: TemplateFamily, seed: string): DesignStyleId {
  const options = FAMILY_TEMPLATES[family];
  let hash = 0;
  for (let index = 0; index < seed.length; index++) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return options[hash % options.length];
}
