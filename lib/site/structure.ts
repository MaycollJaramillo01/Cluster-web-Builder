import type { NormalizedSection } from "@/lib/site/normalize-site-blueprint";

/**
 * Multipage structure engine.
 *
 * The LLM can't be trusted to honor "landing vs multipage", so we generate a
 * rich set of sections and then DISTRIBUTE them across real pages in code,
 * according to the chosen structureType. Returns the ordered sections (each
 * tagged with a pageSlug) plus the nav pages for the menu.
 *
 * Footer is NOT page-bound — the shell renders it on every page.
 */

export type NavPage = { slug: string; name: string };

/** Safely parses the Site.navPages JSON column into a typed array. */
export function parseNavPages(json: unknown): NavPage[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter(
      (p): p is NavPage =>
        !!p &&
        typeof p === "object" &&
        typeof (p as NavPage).slug === "string" &&
        typeof (p as NavPage).name === "string"
    )
    .map((p) => ({ slug: p.slug, name: p.name }));
}

type PageDef = { slug: string; name: string; types: string[] };

const RECIPES: Record<string, PageDef[]> = {
  // Everything on a single page (still gets a 1-item menu / smooth scroll).
  one_page: [
    {
      slug: "home",
      name: "Inicio",
      types: [
        "hero",
        "services",
        "benefits",
        "about",
        "gallery",
        "testimonials",
        "faq",
        "location",
        "cta",
        "contact",
      ],
    },
  ],
  // 3 pages
  pages_3: [
    { slug: "home", name: "Inicio", types: ["hero", "benefits", "testimonials", "cta"] },
    { slug: "servicios", name: "Servicios", types: ["services", "faq", "cta"] },
    { slug: "contacto", name: "Contacto", types: ["contact", "location"] },
  ],
  // 4 pages
  pages_4: [
    { slug: "home", name: "Inicio", types: ["hero", "benefits", "testimonials", "cta"] },
    { slug: "servicios", name: "Servicios", types: ["services", "faq", "cta"] },
    { slug: "nosotros", name: "Nosotros", types: ["about", "gallery", "testimonials"] },
    { slug: "contacto", name: "Contacto", types: ["contact", "location"] },
  ],
  // Full site (with a Projects/Gallery page)
  pages_full: [
    { slug: "home", name: "Inicio", types: ["hero", "benefits", "testimonials", "cta"] },
    { slug: "servicios", name: "Servicios", types: ["services", "faq", "cta"] },
    { slug: "proyectos", name: "Proyectos", types: ["gallery", "cta"] },
    { slug: "nosotros", name: "Nosotros", types: ["about", "testimonials"] },
    { slug: "contacto", name: "Contacto", types: ["contact", "location"] },
  ],
};

export type StructuredSite = {
  sections: NormalizedSection[];
  navPages: NavPage[];
};

export function applyPageStructure(
  aiSections: NormalizedSection[],
  structureType: string | null | undefined,
  ctx: { businessName: string }
): StructuredSite {
  // Index AI sections by type (first occurrence wins).
  const byType = new Map<string, NormalizedSection>();
  for (const s of aiSections) {
    if (!byType.has(s.type)) byType.set(s.type, s);
  }

  const pages =
    (structureType && RECIPES[structureType]) || RECIPES.pages_4;

  const sections: NormalizedSection[] = [];
  const navPages: NavPage[] = [];
  let order = 0;

  for (const page of pages) {
    navPages.push({ slug: page.slug, name: page.name });
    for (const type of page.types) {
      const source = byType.get(type) ?? synthesizeSection(type, ctx);
      sections.push({
        ...source,
        type,
        pageSlug: page.slug,
        order: order++,
        isVisible: true,
      });
    }
  }

  // Footer always exists (shell renders it on every page).
  const footer = byType.get("footer") ?? synthesizeSection("footer", ctx);
  sections.push({ ...footer, type: "footer", pageSlug: "home", order: order++, isVisible: true });

  return { sections, navPages };
}

/** Minimal fallback content when the model didn't produce a section. */
function synthesizeSection(
  type: string,
  ctx: { businessName: string }
): NormalizedSection {
  const base: NormalizedSection = {
    type,
    pageSlug: "home",
    title: "",
    order: 0,
    isVisible: true,
    content: { subtitle: "", body: "", ctaText: "", ctaLink: "", imagePrompt: "" },
    settings: {},
  };

  switch (type) {
    case "hero":
      return {
        ...base,
        title: ctx.businessName,
        content: { ...base.content, subtitle: "Calidad y servicio que puedes confiar", ctaText: "Contáctanos", ctaLink: "#contact" },
      };
    case "about":
      return {
        ...base,
        title: "Sobre nosotros",
        content: { ...base.content, body: `En ${ctx.businessName} ofrecemos un servicio profesional, cercano y de la más alta calidad.` },
      };
    case "benefits":
      return {
        ...base,
        title: "¿Por qué elegirnos?",
        settings: {
          items: [
            { title: "Experiencia comprobada", description: "Años atendiendo clientes satisfechos." },
            { title: "Atención personalizada", description: "Soluciones a la medida." },
            { title: "Calidad garantizada", description: "Resultados que superan expectativas." },
          ],
        },
      };
    case "testimonials":
      return {
        ...base,
        title: "Lo que dicen nuestros clientes",
        settings: {
          items: [
            { name: "Cliente satisfecho", role: "Cliente", quote: "Excelente servicio, totalmente recomendado." },
            { name: "Cliente frecuente", role: "Cliente", quote: "Profesionales, puntuales y de confianza." },
          ],
        },
      };
    case "faq":
      return {
        ...base,
        title: "Preguntas frecuentes",
        settings: {
          items: [
            { question: "¿Cómo solicito una cotización?", answer: "Escríbenos o llámanos y te respondemos a la brevedad." },
            { question: "¿Cuál es su zona de servicio?", answer: "Atendemos la ciudad y zonas aledañas." },
          ],
        },
      };
    case "gallery":
      return { ...base, title: "Galería", content: { ...base.content, subtitle: "Algunos de nuestros trabajos" } };
    case "location":
      return { ...base, title: "Dónde estamos", content: { ...base.content, body: "Visítanos o solicita servicio a domicilio." } };
    case "cta":
      return {
        ...base,
        title: "¿Listo para empezar?",
        content: { ...base.content, subtitle: "Contáctanos hoy y recibe atención personalizada.", ctaText: "Contáctanos", ctaLink: "#contact" },
      };
    case "contact":
      return {
        ...base,
        title: "Contáctanos",
        content: { ...base.content, body: "Déjanos tus datos y nos pondremos en contacto contigo.", ctaText: "Enviar" },
      };
    case "footer":
      return { ...base, title: ctx.businessName };
    case "services":
      return {
        ...base,
        title: "Nuestros servicios",
        settings: {
          items: [
            { name: "Servicio principal", description: "Atención profesional y de calidad." },
            { name: "Servicio complementario", description: "Soluciones adicionales para ti." },
          ],
        },
      };
    default:
      return base;
  }
}
