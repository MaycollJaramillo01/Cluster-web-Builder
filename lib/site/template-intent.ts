export type TemplateIntent = "Service" | "Editorial" | "Immersive" | "Catalog" | "Local" | "Minimal";

/** Selects a real page composition from business intent, never at random. */
export function selectLandingTemplate(
  input: { businessType: string; customBusinessType?: string; goal: string; location: string },
  request: string,
): TemplateIntent {
  const text = `${request} ${input.customBusinessType ?? ""}`.toLocaleLowerCase("es");
  if (/\b(minimal|simple|sobri[oa]|limpi[oa])\b/.test(text)) return "Minimal";
  if (/\b(editorial|revista|autor|fotograf|portafolio|arquitect|lujo|premium)\b/.test(text)) return "Editorial";
  if (/\b(inmersiv|cinemat|aventura|pesca|turismo|viaje|deporte|naturaleza|evento)\b/.test(text)) return "Immersive";
  if (input.goal === "sell_products" || /\b(tienda|cat[aá]logo|producto|men[uú]|colecci[oó]n)\b/.test(text)) return "Catalog";
  if (/\b(local|barrio|cercan|familia|comunidad)\b/.test(text)) return "Local";
  if (input.businessType === "restaurant") return "Catalog";
  if (["beauty", "fitness"].includes(input.businessType)) return "Immersive";
  if (input.businessType === "real_estate") return "Editorial";
  if (["landscaping", "cleaning"].includes(input.businessType)) return "Local";
  return "Service";
}
