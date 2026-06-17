import { z } from "zod";

/**
 * Validation schema for the 5-question onboarding wizard.
 * Mirrors the options shown in the UI. Kept permissive enough for an MVP
 * (free-text fallbacks) but strict on the required fields.
 */

export const BUSINESS_TYPES = [
  "roofing",
  "painting",
  "landscaping",
  "cleaning",
  "restaurant",
  "law_firm",
  "real_estate",
  "medical",
  "beauty",
  "fitness",
  "other",
] as const;

export const GOALS = [
  "calls",
  "quote_forms",
  "show_services",
  "sell_products",
  "book_appointments",
  "professional_presence",
] as const;

export const VISUAL_STYLES = [
  "modern_clean",
  "premium_elegant",
  "local_trustworthy",
  "corporate",
  "creative",
  "minimalist",
  "bold",
] as const;

export const STRUCTURE_TYPES = [
  "one_page",
  "pages_3",
  "pages_4",
  "pages_full",
  "ai_decide",
] as const;

export const LANGUAGES = ["es", "en", "bilingual"] as const;

export const onboardingSchema = z.object({
  // Q1
  businessName: z
    .string()
    .trim()
    .min(2, "El nombre del negocio es obligatorio.")
    .max(120),
  businessType: z.enum(BUSINESS_TYPES),
  customBusinessType: z.string().trim().max(80).optional().or(z.literal("")),

  // Q2
  goal: z.enum(GOALS),

  // Q3
  visualStyle: z.enum(VISUAL_STYLES),

  // Q4
  structureType: z.enum(STRUCTURE_TYPES),

  // Q5
  location: z.string().trim().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional().or(z.literal("")),
  email: z
    .string()
    .trim()
    .email("Email inválido.")
    .max(160)
    .optional()
    .or(z.literal("")),
  domain: z.string().trim().max(160).optional().or(z.literal("")),
  language: z.enum(LANGUAGES),
});

export type OnboardingInput = z.infer<typeof onboardingSchema>;

// Human-readable labels used to build the AI prompt.
export const BUSINESS_TYPE_LABELS: Record<string, string> = {
  roofing: "Roofing / Techos",
  painting: "Painting / Pintura",
  landscaping: "Landscaping / Jardinería",
  cleaning: "Cleaning / Limpieza",
  restaurant: "Restaurant / Restaurante",
  law_firm: "Law Firm / Abogados",
  real_estate: "Real Estate / Bienes raíces",
  medical: "Medical / Clínica",
  beauty: "Beauty / Belleza",
  fitness: "Fitness / Gimnasio",
  other: "Otro",
};

export const GOAL_LABELS: Record<string, string> = {
  calls: "Conseguir llamadas",
  quote_forms: "Conseguir formularios de cotización",
  show_services: "Mostrar servicios",
  sell_products: "Vender productos",
  book_appointments: "Agendar citas",
  professional_presence: "Mejorar presencia profesional",
};

export const VISUAL_STYLE_LABELS: Record<string, string> = {
  modern_clean: "Moderno y limpio",
  premium_elegant: "Premium / elegante",
  local_trustworthy: "Local y confiable",
  corporate: "Corporativo",
  creative: "Creativo",
  minimalist: "Minimalista",
  bold: "Fuerte y llamativo",
};

export const STRUCTURE_TYPE_LABELS: Record<string, string> = {
  one_page: "Una sola página (todo en Inicio)",
  pages_3: "3 páginas (Inicio, Servicios, Contacto)",
  pages_4: "4 páginas (Inicio, Servicios, Nosotros, Contacto)",
  pages_full: "Sitio completo (Inicio, Servicios, Proyectos, Nosotros, Contacto)",
  ai_decide: "No sé, que la IA decida",
};

export const LANGUAGE_LABELS: Record<string, string> = {
  es: "Español",
  en: "Inglés",
  bilingual: "Bilingüe",
};

/** Resolves the effective business type label (respecting "other"). */
export function resolveBusinessTypeLabel(input: OnboardingInput): string {
  if (input.businessType === "other" && input.customBusinessType) {
    return input.customBusinessType;
  }
  return BUSINESS_TYPE_LABELS[input.businessType] ?? input.businessType;
}
