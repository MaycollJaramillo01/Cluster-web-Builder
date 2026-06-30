import type { Blueprint, BlueprintSection } from "./blueprint";
import { parseServiceFacts, resolveBusinessTypeLabel, type OnboardingInput } from "../validators/site-onboarding";

export const COPY_METRICS = {
  seoTitle: { min: 25, max: 65 },
  metaDescription: { min: 80, max: 165 },
  heroTitle: { min: 8, max: 72 },
  heroSubtitle: { min: 12, max: 110 },
  heroBody: { min: 45, max: 240 },
  sectionTitle: { min: 4, max: 80 },
  sectionBody: { min: 35, max: 360 },
  itemDescription: { min: 25, max: 200 },
} as const;

export type CopyQualityReport = {
  passed: boolean;
  score: number;
  issues: string[];
};

const EMPTY_TITLES: Record<string, string> = {
  services: "Servicios y productos",
  benefits: "Por qué elegir esta propuesta",
  process: "Cómo empezar",
  about_us: "Sobre el negocio",
  gallery: "Galería",
  faq: "Preguntas frecuentes",
  location: "Zona de servicio",
  contact: "Contacto",
  cta: "Da el siguiente paso",
  footer: "Información",
};

const GENERIC_PHRASES = [
  "lleva tu negocio al siguiente nivel",
  "soluciones innovadoras",
  "transformamos tus ideas",
  "experiencia premium",
  "somos líderes",
  "calidad garantizada",
];

export function auditBlueprintCopy(blueprint: Blueprint): CopyQualityReport {
  const issues: string[] = [];
  const site = blueprint.site;
  checkLength(issues, "seo.title", site.seo.title, COPY_METRICS.seoTitle);
  checkLength(issues, "seo.metaDescription", site.seo.metaDescription, COPY_METRICS.metaDescription);

  const repeated = new Map<string, number>();
  for (const page of site.pages) {
    for (const section of page.sections) {
      checkLength(issues, `${section.type}.title`, section.title, section.type === "hero" ? COPY_METRICS.heroTitle : COPY_METRICS.sectionTitle);
      if (section.type === "hero") {
        checkLength(issues, "hero.subtitle", section.subtitle, COPY_METRICS.heroSubtitle);
        checkLength(issues, "hero.body", section.body, COPY_METRICS.heroBody);
        if (wordCount(section.ctaText) < 1 || wordCount(section.ctaText) > 5) issues.push("hero.ctaText: debe tener entre 1 y 5 palabras");
      }
      if (["about_us", "contact", "cta"].includes(section.type)) {
        const value = section.type === "cta" ? section.title : section.body;
        checkLength(issues, `${section.type}.copy`, value, COPY_METRICS.sectionBody);
      }
      for (const [index, item] of readItems(section).entries()) {
        const description = stringValue(item.description ?? item.answer ?? item.body);
        if (description) checkLength(issues, `${section.type}.items[${index}]`, description, COPY_METRICS.itemDescription);
      }
      for (const text of [section.subtitle, section.body]) {
        const normalized = normalizeText(text);
        if (normalized.length > 24) repeated.set(normalized, (repeated.get(normalized) ?? 0) + 1);
        if (GENERIC_PHRASES.some((phrase) => normalized.includes(phrase))) issues.push(`${section.type}: contiene copy genérico`);
      }
    }
  }
  if ([...repeated.values()].some((count) => count > 1)) issues.push("site: repite textos completos entre secciones");
  return { passed: issues.length === 0, score: Math.max(0, 100 - issues.length * 6), issues };
}

/** Repairs weak copy using only verified onboarding facts; never adds claims, prices or proof. */
export function enforceBlueprintCopyQuality(blueprint: Blueprint, input: OnboardingInput): Blueprint {
  const improved = structuredClone(blueprint);
  const site = improved.site;
  const services = parseServiceFacts(input.services);
  const serviceNames = services.map((service) => service.name).filter(Boolean);
  const primaryService = serviceNames[0] || resolveBusinessTypeLabel(input);
  const serviceList = naturalList(serviceNames.length ? serviceNames : [resolveBusinessTypeLabel(input)]);
  const hasLocation = input.location && input.location !== "Zona por definir";
  const english = input.language === "en";
  const audience = input.targetCustomer;
  const ctaText = ctaForGoal(input.goal, english);

  site.seo.title = fit(
    site.seo.title,
    english
      ? `${input.businessName} | ${primaryService}${hasLocation ? ` in ${input.location}` : " services and contact"}`
      : `${input.businessName} | ${primaryService}${hasLocation ? ` en ${input.location}` : " servicios y contacto"}`,
    COPY_METRICS.seoTitle,
  );
  site.seo.metaDescription = fit(
    site.seo.metaDescription,
    english
      ? `${input.businessName} offers ${serviceList} for ${audience}${hasLocation ? ` in ${input.location}` : ""}. Review the services and contact the business directly.`
      : `${input.businessName} ofrece ${serviceList} para ${audience}${hasLocation ? ` en ${input.location}` : ""}. Conoce los servicios y contacta directamente.`,
    COPY_METRICS.metaDescription,
  );

  for (const page of site.pages) {
    for (const section of page.sections) {
      section.title = cleanGeneric(section.title);
      section.subtitle = cleanGeneric(section.subtitle);
      section.body = cleanGeneric(section.body);
      if (!section.title.trim()) section.title = section.type === "footer" ? input.businessName : EMPTY_TITLES[section.type] ?? resolveBusinessTypeLabel(input);
      if (section.type !== "hero" && section.type !== "cta") {
        section.title = fit(
          section.title,
          section.type === "footer" ? input.businessName : EMPTY_TITLES[section.type] ?? resolveBusinessTypeLabel(input),
          COPY_METRICS.sectionTitle,
        );
      }

      if (section.type === "hero") {
        section.title = fit(
          section.title,
          english ? `${input.businessName}: ${primaryService} services` : `${input.businessName}: servicios de ${primaryService}`,
          COPY_METRICS.heroTitle,
        );
        section.subtitle = fit(
          section.subtitle,
          english ? `${primaryService} services for ${audience}` : `Atención de ${primaryService} para ${audience}`,
          COPY_METRICS.heroSubtitle,
        );
        section.body = fit(
          section.body,
          english
            ? `Explore ${serviceList} for ${audience}${hasLocation ? ` in ${input.location}` : ""}. Review the available information and contact ${input.businessName} directly.`
            : `Conoce ${serviceList} para ${audience}${hasLocation ? ` en ${input.location}` : ""}. Revisa la información disponible y contacta directamente a ${input.businessName}.`,
          COPY_METRICS.heroBody,
        );
        if (wordCount(section.ctaText) < 1 || wordCount(section.ctaText) > 5) section.ctaText = ctaText;
        if (!section.ctaLink) section.ctaLink = "#contact";
      }

      if (section.type === "about_us") {
        section.body = fit(
          section.body,
          english
            ? `${input.businessName} offers ${serviceList} for ${audience}${hasLocation ? ` in ${input.location}` : ""}. This page presents the verified offer and the available ways to get in touch.`
            : `${input.businessName} ofrece ${serviceList} para ${audience}${hasLocation ? ` en ${input.location}` : ""}. Esta página presenta la oferta verificada y las formas disponibles de contacto.`,
          COPY_METRICS.sectionBody,
        );
      }

      if (section.type === "contact") {
        section.body = fit(
          section.body,
          english
            ? `Contact ${input.businessName} to ask about ${serviceList}, availability and the next step for your request.`
            : `Contacta a ${input.businessName} para consultar sobre ${serviceList}, disponibilidad y el siguiente paso para tu solicitud.`,
          COPY_METRICS.sectionBody,
        );
        if (!section.ctaText) section.ctaText = english ? "Send request" : "Enviar solicitud";
      }

      if (section.type === "cta") {
        section.title = fit(
          section.title,
          english
            ? `Talk to ${input.businessName} about the next step for ${primaryService}`
            : `Habla con ${input.businessName} y consulta el siguiente paso para ${primaryService}`,
          COPY_METRICS.sectionBody,
        );
        if (!section.ctaText) section.ctaText = ctaText;
        if (!section.ctaLink) section.ctaLink = "#contact";
      }

      const items = readItems(section);
      for (const item of items) {
        const name = stringValue(item.name ?? item.title ?? item.question) || primaryService;
        const verified = services.find((service) => normalizeText(service.name) === normalizeText(name));
        const fallback = verified?.description || (english
          ? `Ask ${input.businessName} for verified details, scope and availability for ${name}.`
          : `Consulta con ${input.businessName} los detalles, el alcance y la disponibilidad de ${name}.`);
        if ("answer" in item) item.answer = fit(stringValue(item.answer), fallback, COPY_METRICS.itemDescription);
        else item.description = fit(stringValue(item.description), fallback, COPY_METRICS.itemDescription);
      }
    }
  }
  return improved;
}

function readItems(section: BlueprintSection): Array<Record<string, unknown>> {
  const items = section.settings?.items;
  return Array.isArray(items) ? items.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
}

function checkLength(issues: string[], field: string, value: string | undefined, metric: { min: number; max: number }) {
  const length = value?.trim().length ?? 0;
  if (length < metric.min) issues.push(`${field}: ${length}/${metric.min} caracteres mínimos`);
  if (length > metric.max) issues.push(`${field}: ${length}/${metric.max} caracteres máximos`);
}

function fit(current: string | undefined, fallback: string, metric: { min: number; max: number }): string {
  const clean = cleanGeneric(current ?? "").trim();
  const selected = clean.length >= metric.min ? clean : fallback.trim();
  if (selected.length <= metric.max) return selected;
  const clipped = selected.slice(0, metric.max + 1);
  const boundary = clipped.lastIndexOf(" ");
  return `${clipped.slice(0, boundary > metric.min ? boundary : metric.max).replace(/[,:;.-]+$/, "")}.`;
}

function cleanGeneric(value: string): string {
  let result = value;
  for (const phrase of GENERIC_PHRASES) result = result.replace(new RegExp(phrase, "gi"), "conoce la oferta disponible");
  return result.replace(/\s+/g, " ").trim();
}

function stringValue(value: unknown): string {
  return typeof value === "string" ? value : "";
}

function normalizeText(value: string | undefined): string {
  return (value ?? "").normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLocaleLowerCase("es").replace(/[^a-z0-9\s]/g, "").replace(/\s+/g, " ").trim();
}

function wordCount(value: string | undefined): number {
  return value?.trim() ? value.trim().split(/\s+/).length : 0;
}

function naturalList(items: string[]): string {
  if (items.length < 2) return items[0] ?? "los servicios indicados";
  return `${items.slice(0, -1).join(", ")} y ${items.at(-1)}`;
}

function ctaForGoal(goal: OnboardingInput["goal"], english: boolean): string {
  const labels = english
    ? { calls: "Call now", quote_forms: "Request a quote", show_services: "View services", sell_products: "View products", book_appointments: "Request appointment", professional_presence: "Contact" }
    : { calls: "Llamar ahora", quote_forms: "Solicitar cotización", show_services: "Ver servicios", sell_products: "Ver productos", book_appointments: "Solicitar cita", professional_presence: "Contactar" };
  return labels[goal];
}
