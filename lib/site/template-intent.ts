import type { DesignStyleId, TemplateFamily } from "@/lib/site/design";

export type TemplateIntent = DesignStyleId;

const FAMILY_TEMPLATES: Record<TemplateFamily, DesignStyleId[]> = {
  service: ["Service", "StudioSplit", "Reverse", "Metrics", "Timeline", "Numbered"],
  editorial: ["Editorial", "Overlap", "Collage", "Portrait", "Masthead"],
  immersive: ["Immersive", "Manifesto", "Panorama", "BigType"],
  catalog: ["Catalog", "Gridline", "Columns", "Accent", "SplitStats"],
  local: ["Local", "Framed", "Badges"],
  minimal: ["Minimal", "Statement", "Quote"],
};

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
  if (input.businessType === "restaurant") return pick("catalog", text);
  if (["beauty", "fitness"].includes(input.businessType)) return pick("immersive", text);
  if (input.businessType === "real_estate") return pick("editorial", text);
  if (["landscaping", "cleaning"].includes(input.businessType)) return pick("local", text);
  return pick("service", text);
}

function pick(family: TemplateFamily, seed: string): DesignStyleId {
  const options = FAMILY_TEMPLATES[family];
  let hash = 0;
  for (let index = 0; index < seed.length; index++) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return options[hash % options.length];
}
