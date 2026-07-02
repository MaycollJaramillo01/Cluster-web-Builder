import { z } from "zod";

export const BUSINESS_TYPES = [
  "roofing", "painting", "landscaping", "cleaning", "restaurant",
  "law_firm", "real_estate", "medical", "beauty", "fitness", "other",
] as const;

export const GOALS = [
  "calls", "quote_forms", "show_services", "sell_products",
  "book_appointments", "professional_presence",
] as const;

export const VISUAL_STYLES = [
  "modern_clean", "premium_elegant", "local_trustworthy", "corporate",
  "creative", "minimalist", "bold",
] as const;

export const LANGUAGES = ["es", "en", "bilingual"] as const;

const paletteColor = z.string().regex(/^#[0-9a-fA-F]{6}$/, "Color de paleta inválido.");
const socialHandle = z.string().trim().max(200).optional().or(z.literal(""));
const imageDataUrl = z.string().max(1_800_000).regex(/^data:image\/(?:png|jpe?g|webp);base64,/i);

export const onboardingSchema = z
  .object({
    businessName: z.string().trim().min(2, "Escribe el nombre del negocio.").max(120),
    businessType: z.enum(BUSINESS_TYPES),
    customBusinessType: z.string().trim().max(80).optional().or(z.literal("")),
    location: z.string().trim().min(2, "Escribe la ciudad o zona donde trabajas.").max(160),
    services: z.string().trim().min(3, "Escribe al menos un servicio o producto real.").max(1200),
    targetCustomer: z.string().trim().min(3, "Describe brevemente a quien atiendes.").max(240),
    proofPoints: z.string().trim().max(800).optional().or(z.literal("")),
    yearsExperience: z.string().trim().max(40).optional().or(z.literal("")),
    reviews: z.string().trim().max(1600).optional().or(z.literal("")),
    goal: z.enum(GOALS),
    phone: z.string().trim().max(40).optional().or(z.literal("")),
    email: z.string().trim().email("Escribe un email valido.").max(160).optional().or(z.literal("")),
    domain: z.string().trim().max(160).optional().or(z.literal("")),
    language: z.enum(LANGUAGES),
    visualStyle: z.enum(VISUAL_STYLES),
    palette: z
      .object({
        primary: paletteColor,
        secondary: paletteColor,
        accent: paletteColor,
        background: paletteColor,
        text: paletteColor,
      })
      .optional(),
    socialLinks: z.object({
      instagram: socialHandle,
      facebook: socialHandle,
      tiktok: socialHandle,
      linkedin: socialHandle,
      youtube: socialHandle,
    }).optional(),
    assets: z.object({
      logoDataUrl: imageDataUrl.optional(),
      coverDataUrl: imageDataUrl.optional(),
    }).optional(),
  })
  .superRefine((input, ctx) => {
    if (input.businessType === "other" && !input.customBusinessType) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["customBusinessType"],
        message: "Describe que tipo de negocio es.",
      });
    }

    if (input.goal === "calls" && !input.phone) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Agrega el telefono que recibira las llamadas.",
      });
    } else if (!input.phone && !input.email) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["phone"],
        message: "Agrega un telefono o un email de contacto.",
      });
    }
  });

export type OnboardingInput = z.infer<typeof onboardingSchema>;

export const sitePromptSchema = z.object({
  prompt: z
    .string()
    .trim()
    .min(10, "Describe un poco mas el sitio que quieres crear.")
    .max(2000, "El prompt no puede superar 2000 caracteres."),
});

export type SitePromptInput = z.infer<typeof sitePromptSchema>;

export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  roofing: "Techos",
  painting: "Pintura",
  landscaping: "Jardineria",
  cleaning: "Limpieza",
  restaurant: "Restaurante",
  law_firm: "Servicios legales",
  real_estate: "Bienes raices",
  medical: "Clinica",
  beauty: "Belleza",
  fitness: "Gimnasio",
  other: "Otro",
};

export const GOAL_LABELS: Record<string, string> = {
  calls: "Recibir llamadas",
  quote_forms: "Recibir solicitudes de cotizacion",
  show_services: "Explicar servicios",
  sell_products: "Mostrar productos para vender",
  book_appointments: "Recibir solicitudes de cita",
  professional_presence: "Presentar el negocio profesionalmente",
};

export const LANGUAGE_LABELS: Record<string, string> = {
  es: "Espanol",
  en: "Ingles",
  bilingual: "Bilingue",
};

export function resolveBusinessTypeLabel(input: OnboardingInput): string {
  if (input.businessType === "other" && input.customBusinessType) {
    return input.customBusinessType;
  }
  return BUSINESS_TYPE_LABELS[input.businessType] ?? input.businessType;
}

export type ServiceFact = { name: string; description: string };

export function parseServiceFacts(value: string): ServiceFact[] {
  return splitFactLines(value)
    .map((line) => {
      const separator = line.indexOf(":");
      if (separator < 0) return { name: line, description: "" };
      return {
        name: line.slice(0, separator).trim(),
        description: line.slice(separator + 1).trim(),
      };
    })
    .filter((item) => item.name.length > 0);
}

export function splitFactLines(value?: string): string[] {
  return (value ?? "")
    .split(/\r?\n|;/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export function promptToOnboardingInput(prompt: string): OnboardingInput {
  const value = prompt.trim();
  const lower = value.toLocaleLowerCase("es");
  const businessType = detectBusinessType(lower);
  const customBusinessType = businessType === "other" ? detectCustomBusinessType(lower) : "";
  const businessLabel = customBusinessType || BUSINESS_TYPE_LABELS[businessType] || "Negocio";
  const email = value.match(/[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}/)?.[0] ?? "";
  const phone = value.match(/\+?\d[\d\s()-]{7,}\d/)?.[0]?.trim() ?? "";
  const explicitName =
    value.match(/[“”]([^””]{2,80})[“”]/)?.[1]?.trim() ??
    value.match(/(?:se llama|llamad[oa])\s+(.+?)(?=\s+en\s+[^,.;\n]+|[,.;\n]|$)/i)?.[1]?.trim() ??
    extractLeadingName(value);
  const location =
    value
      .match(
        /(?:ubicad[oa]\s+en|atiende\s+en|trabaja\s+en|negocio\s+en)\s+([^,.;\n]+?)(?=\s+con\s+|[,.;\n]|$)/i
      )?.[1]
      ?.trim() ??
    Array.from(value.matchAll(/\ben\s+([A-ZÁÉÍÓÚÑ][\p{L}\s-]{1,60}?)(?=[,.;\n]|$)/gu)).at(-1)?.[1]?.trim() ??
    "Zona por definir";

  return {
    businessName: explicitName || `Sitio de ${businessLabel}`,
    businessType,
    customBusinessType,
    location,
    services: extractServices(value, businessLabel),
    targetCustomer: businessLabel === "Negocio"
      ? "Clientes potenciales"
      : `Personas que buscan ${businessLabel.toLocaleLowerCase("es")}`,
    proofPoints: "",
    yearsExperience: detectYearsExperience(lower),
    reviews: "",
    goal: detectGoal(lower),
    phone,
    email,
    domain: "",
    language: detectLanguage(lower),
    visualStyle: detectVisualStyle(lower),
    socialLinks: extractSocialLinks(value),
  };
}

function extractSocialLinks(value: string) {
  const find = (domain: string) => value.match(new RegExp(`(?:https?:\\/\\/)?(?:www\\.)?${domain}\\.com\\/[^\\s,;]+`, "i"))?.[0] ?? "";
  return {
    instagram: find("instagram"),
    facebook: find("facebook"),
    tiktok: find("tiktok"),
    linkedin: find("linkedin"),
    youtube: find("youtube"),
  };
}

function extractServices(value: string, fallback: string): string {
  const list = value.match(
    /(?:ofrece|ofrecemos|servicios?(?:\s+(?:son|incluyen))?|productos?(?:\s+(?:son|incluyen))?)\s*:?\s*([^.;\n]+)/i
  )?.[1];
  if (!list) return fallback;
  return list
    .split(/\s*,\s*|\s+y\s+/i)
    .map((item) => item.trim())
    .filter(Boolean)
    .join("\n") || fallback;
}

function detectCustomBusinessType(value: string): string {
  if (/\bpesca(?:dor|dores)?\b|\bfishing\b/.test(value)) return "Pesca";
  if (/arquitect/.test(value)) return "Estudio de arquitectura";
  if (/agencia/.test(value)) return "Agencia";
  if (/consultor/.test(value)) return "Consultoría";
  if (/portafolio|diseñador|diseñadora|fotograf/.test(value)) return "Portafolio profesional";
  if (/tienda/.test(value)) return "Tienda";
  const requestedSubject = value
    .match(/(?:sitio(?:\s+web)?|p[aá]gina(?:\s+web)?|web)\s+(?:de|para|sobre)\s+([^,.;\n]{2,60})/)?.[1]
    ?.split(/\s+(?:con|que|ubicad[oa]|en)\s+/)[0]
    ?.trim();
  if (requestedSubject && !/^(?:un\s+)?(?:sitio|p[aá]gina|web|negocio)$/.test(requestedSubject)) {
    return requestedSubject.charAt(0).toLocaleUpperCase("es") + requestedSubject.slice(1);
  }
  return "Negocio";
}

// Detecta "NombreEmpresa, descripción..." — nombre propio antes de la primera coma.
// No aplica cuando el prompt empieza con una frase de acción (quiero, crea, necesito, etc.).
function extractLeadingName(value: string): string | undefined {
  const beforeComma = value.split(",")[0]?.trim();
  if (!beforeComma || beforeComma.length < 3 || beforeComma.length > 80) return undefined;
  if (/^(quiero|necesito|crea|dame|haz|por\s+favor|generar|hacer|tengo un|mi |el |la |los |las )/i.test(beforeComma)) return undefined;
  if (!/^[A-ZÁÉÍÓÚÑ]/u.test(beforeComma)) return undefined;
  return beforeComma;
}

function detectBusinessType(value: string): OnboardingInput["businessType"] {
  const matches: Array<[OnboardingInput["businessType"], string[]]> = [
    ["restaurant", ["restaurante", "comida", "cafeteria", "café", "menu", "menú"]],
    ["roofing", ["techo", "tejado", "roofing"]],
    ["painting", ["pintura", "pintor"]],
    ["landscaping", ["jardiner", "landscaping", "paisajismo"]],
    ["cleaning", ["limpieza", "cleaning"]],
    ["law_firm", ["abogado", "legal", "bufete"]],
    ["real_estate", ["inmobiliaria", "bienes raices", "bienes raíces"]],
    ["medical", ["clinica", "clínica", "medico", "médico", "salud"]],
    ["beauty", ["belleza", "salon", "salón", "spa"]],
    ["fitness", ["gimnasio", "fitness", "entrenamiento"]],
  ];
  return matches.find(([, words]) => words.some((word) => value.includes(word)))?.[0] ?? "other";
}

// Detecta "15 años de experiencia", "más de 10 años en el mercado", "desde 2008", etc.
function detectYearsExperience(value: string): string {
  const years = value.match(/(\d{1,3})\s*a[ñn]os(?:\s+de)?\s+(?:experiencia|trayectoria|servicio|oficio|en el (?:mercado|rubro|sector|oficio))/)?.[1];
  if (years) return years;
  const since = value.match(/(?:desde|fundad[oa] en|operando desde|abiert[oa] desde)\s+(19\d{2}|20\d{2})\b/)?.[1];
  if (since) {
    const elapsed = new Date().getFullYear() - Number(since);
    if (elapsed > 0 && elapsed < 120) return String(elapsed);
  }
  return "";
}

function detectGoal(value: string): OnboardingInput["goal"] {
  if (/(reserv|agend|cita)/.test(value)) return "book_appointments";
  if (/(cotiz|presupuesto)/.test(value)) return "quote_forms";
  if (/(tienda|producto|vender|venta)/.test(value)) return "sell_products";
  if (/(llamad|telefono|teléfono)/.test(value)) return "calls";
  if (/(servicio|menú|menu|portafolio|proyecto)/.test(value)) return "show_services";
  return "professional_presence";
}

function detectVisualStyle(value: string): OnboardingInput["visualStyle"] {
  if (/(premium|elegante|lujo)/.test(value)) return "premium_elegant";
  if (/(creativ|colorid|artist)/.test(value)) return "creative";
  if (/(minimal|simple)/.test(value)) return "minimalist";
  if (/(audaz|fuerte|llamativ)/.test(value)) return "bold";
  if (/(corporativ|empresa|empresarial)/.test(value)) return "corporate";
  if (/(local|cercan|confiable)/.test(value)) return "local_trustworthy";
  return "modern_clean";
}

function detectLanguage(value: string): OnboardingInput["language"] {
  if (/(biling|español e inglés|espanol e ingles)/.test(value)) return "bilingual";
  if (/(in english|english website|sitio en ingles|sitio en inglés)/.test(value)) return "en";
  return "es";
}
