import type { SectionType } from "@/lib/site/blueprint";
import type { DesignLanguageId } from "@/lib/site/design-language-types";
import {
  resolveBusinessTypeLabel,
  type OnboardingInput,
} from "@/lib/validators/site-onboarding";

export const SITE_RECIPE_IDS = ["local-leads", "appointments", "catalog", "portfolio"] as const;

export type SiteRecipeId = (typeof SITE_RECIPE_IDS)[number];

export type SiteRecipe = {
  id: SiteRecipeId;
  name: string;
  description: string;
  sections: readonly SectionType[];
  languageAffinity: Partial<Record<DesignLanguageId, number>>;
};

export type SiteRecipeRanking = {
  id: SiteRecipeId;
  score: number;
  reasons: string[];
  recipe: SiteRecipe;
};

export const SITE_RECIPES: Record<SiteRecipeId, SiteRecipe> = {
  "local-leads": {
    id: "local-leads",
    name: "Captación local",
    description: "Explica la oferta, construye confianza y conduce a una consulta.",
    sections: ["hero", "services", "benefits", "about_us", "faq", "contact", "cta", "footer"],
    languageAffinity: { swiss: 3 },
  },
  appointments: {
    id: "appointments",
    name: "Reservas y citas",
    description: "Presenta servicios, resuelve objeciones y conduce a una solicitud de cita.",
    sections: ["hero", "services", "about_us", "benefits", "faq", "contact", "cta", "footer"],
    languageAffinity: { swiss: 3, editorial: 1 },
  },
  catalog: {
    id: "catalog",
    name: "Catálogo comercial",
    description: "Prioriza productos, evidencia visual y contacto para completar la compra.",
    sections: ["hero", "services", "gallery", "about_us", "benefits", "faq", "contact", "cta", "footer"],
    languageAffinity: { editorial: 3, bauhaus: 1 },
  },
  portfolio: {
    id: "portfolio",
    name: "Portafolio visual",
    description: "Abre con el trabajo, explica los servicios y termina en una consulta.",
    sections: ["hero", "gallery", "services", "about_us", "benefits", "contact", "cta", "footer"],
    languageAffinity: { editorial: 4, bauhaus: 1 },
  },
};

export function rankSiteRecipes(input: OnboardingInput): SiteRecipeRanking[] {
  const scores: Record<SiteRecipeId, number> = {
    "local-leads": 1,
    appointments: 0,
    catalog: 0,
    portfolio: 0,
  };
  const reasons: Record<SiteRecipeId, string[]> = {
    "local-leads": [],
    appointments: [],
    catalog: [],
    portfolio: [],
  };
  const add = (id: SiteRecipeId, score: number, reason: string) => {
    scores[id] += score;
    reasons[id].push(reason);
  };

  switch (input.goal) {
    case "sell_products":
      add("catalog", 30, "el objetivo principal es vender productos");
      break;
    case "book_appointments":
      add("appointments", 30, "el objetivo principal es recibir solicitudes de cita");
      break;
    case "calls":
    case "quote_forms":
      add("local-leads", 18, "el objetivo principal es generar contactos directos");
      break;
    case "show_services":
      add("local-leads", 8, "la prioridad es explicar servicios con claridad");
      add("portfolio", 4, "mostrar servicios admite una narrativa visual");
      break;
    default:
      add("local-leads", 6, "se necesita una presencia profesional equilibrada");
      add("portfolio", 2, "la presencia profesional admite evidencia visual");
  }

  if (input.businessType === "restaurant") {
    add("appointments", 12, "la actividad suele depender de reservas o disponibilidad");
  }
  if (["medical", "beauty", "fitness"].includes(input.businessType)) {
    add("appointments", 4, "la actividad puede convertir mediante citas o sesiones");
  }
  if (input.businessType === "real_estate") {
    add("portfolio", 5, "la oferta se entiende mejor como colección visual");
  }

  const business = resolveBusinessTypeLabel(input).toLocaleLowerCase("es");
  if (/(arquitect|fotograf|diseñ|disen|creativ|portafolio|estudio|arte|artista)/.test(business)) {
    add("portfolio", 24, "la actividad depende de mostrar trabajo y criterio visual");
  }

  return SITE_RECIPE_IDS
    .map((id) => ({ id, score: scores[id], reasons: reasons[id], recipe: SITE_RECIPES[id] }))
    .sort((left, right) => right.score - left.score || SITE_RECIPE_IDS.indexOf(left.id) - SITE_RECIPE_IDS.indexOf(right.id));
}

export function selectSiteRecipe(input: OnboardingInput): SiteRecipeRanking {
  return rankSiteRecipes(input)[0];
}

export function expandSiteRecipe(recipe: SiteRecipe, input: OnboardingInput): SectionType[] {
  const sections = [...recipe.sections];
  const contactIndex = sections.indexOf("contact");
  if (input.location.trim() && input.location !== "Zona por definir" && !sections.includes("location")) {
    sections.splice(Math.max(contactIndex, 1), 0, "location");
  }
  if (input.reviews?.trim() && !sections.includes("testimonials")) {
    sections.splice(Math.max(sections.indexOf("contact"), 1), 0, "testimonials");
  }
  return sections;
}

export function auditSiteRecipes(): string[] {
  return SITE_RECIPE_IDS.flatMap((id) => {
    const recipe = SITE_RECIPES[id];
    const errors: string[] = [];
    if (recipe.sections[0] !== "hero") errors.push(`${id}: debe iniciar con hero`);
    if (recipe.sections.at(-1) !== "footer") errors.push(`${id}: debe terminar con footer`);
    if (!recipe.sections.includes("contact")) errors.push(`${id}: debe incluir contact`);
    if (new Set(recipe.sections).size !== recipe.sections.length) errors.push(`${id}: contiene etapas duplicadas`);
    if (!Object.values(recipe.languageAffinity).some((score) => Number(score) > 0)) errors.push(`${id}: no declara afinidad visual`);
    return errors;
  });
}
