import type { SectionType } from "@/lib/site/blueprint";
import type { DesignLanguageId } from "@/lib/site/design-language-types";
import {
  resolveBusinessTypeLabel,
  type OnboardingInput,
} from "@/lib/validators/site-onboarding";

export const SITE_RECIPE_IDS = ["storm-response", "before-after", "contractor-pro", "local-leads", "appointments", "catalog", "portfolio"] as const;

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
  // Orden dictado por la emergencia: quién responde y con qué respaldo, antes
  // del catálogo. La prueba de trabajo y el seguro llegan cuando el visitante
  // ya sabe que la llamada será atendida.
  "storm-response": {
    id: "storm-response",
    name: "Respuesta ante emergencias",
    description: "Abre con la emergencia, presenta al equipo y su disponibilidad, y explica el reclamo de seguro antes de pedir el contacto.",
    sections: ["hero", "about_us", "benefits", "services", "cta", "gallery", "testimonials", "faq", "contact", "footer"],
    languageAffinity: { storm: 10, industrial: 2 },
  },
  // La transformación es el argumento, así que va inmediatamente después de la
  // portada: el visitante ve el resultado antes de leer el catálogo.
  "before-after": {
    id: "before-after",
    name: "Antes y después",
    description: "Abre con la transformación comparada, explica el trabajo y lleva a un presupuesto sin fricción.",
    sections: ["hero", "gallery", "services", "benefits", "about_us", "testimonials", "faq", "contact", "cta", "footer"],
    languageAffinity: { makeover: 10 },
  },
  "contractor-pro": {
    id: "contractor-pro",
    name: "Contratista profesional",
    description: "Presenta alcance, prueba de trabajo y un camino corto hacia llamada o cotización.",
    sections: ["hero", "about_us", "services", "gallery", "benefits", "testimonials", "faq", "contact", "footer"],
    languageAffinity: { industrial: 9, swiss: 1 },
  },
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
    "storm-response": 0,
    "before-after": 0,
    "contractor-pro": 0,
    "local-leads": 1,
    appointments: 0,
    catalog: 0,
    portfolio: 0,
  };
  const reasons: Record<SiteRecipeId, string[]> = {
    "storm-response": [],
    "before-after": [],
    "contractor-pro": [],
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
      add("contractor-pro", 5, "el objetivo admite una ruta corta hacia llamada o cotización");
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
  // Los oficios de obra alimentan por igual a las dos recetas de contratista:
  // comparten base y es la urgencia declarada la que decide entre catálogo
  // de trabajo y respuesta ante emergencia.
  if (["roofing", "landscaping"].includes(input.businessType)) {
    add("contractor-pro", 30, "la actividad depende de alcance, evidencia de obra y respuesta local");
    add("storm-response", 30, "la actividad depende de alcance, evidencia de obra y respuesta local");
  }
  // Pintura y limpieza no se contratan por el alcance sino por cómo queda:
  // su prueba es la comparación, no el expediente de obra.
  if (["painting", "cleaning"].includes(input.businessType)) {
    add("before-after", 34, "la decisión se toma viendo el resultado sobre la superficie");
  }

  const business = resolveBusinessTypeLabel(input).toLocaleLowerCase("es");
  if (/(arquitect|fotograf|diseñ|disen|creativ|portafolio|estudio|arte|artista)/.test(business)) {
    add("portfolio", 24, "la actividad depende de mostrar trabajo y criterio visual");
  }
  if (/(roof|techo|siding|gutter|canaleta|contractor|contratista|construction|construc|remodel|restoration|concrete|masonry|hvac|plumb|electric|solar)/.test(business)) {
    add("contractor-pro", 32, "el servicio es propio de un contratista de obra o mantenimiento técnico");
    add("storm-response", 32, "el servicio es propio de un contratista de obra o mantenimiento técnico");
  }
  if (/(pintura|pintor|paint|limpieza|clean|aseo|piso|suelo|floor|azulejo|tile|alfombra|carpet|lavado|hidrolav|presi[oó]n|pressure|wash|pulido|encerado|sellado|fachada)/.test(business)) {
    add("before-after", 34, "el servicio se juzga por la diferencia visible entre el antes y el después");
  }

  // La urgencia no cabe en el selector de actividad: la declara el propio
  // listado de servicios, que es donde el contratista escribe "24/7",
  // "daño por agua" o "trabajamos con tu seguro".
  const urgency = `${business} ${input.services}`.toLocaleLowerCase("es");
  if (/(tormenta|storm|granizo|hail|hurac|inunda|flood|emergencia|emergency|24\/7|filtracion|filtración|gotera|leak|restauracion|restauración|restoration|mitigacion|mitigación|mitigation|moho|mold|plomer|fontaner|plumb|hvac|climatizacion|climatización|aire acondicionado|tuberia|tubería|burst|seguro|aseguradora|insurance)/.test(urgency)) {
    add("storm-response", 40, "el servicio se contrata durante una emergencia con ventana de respuesta y respaldo de seguro");
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
