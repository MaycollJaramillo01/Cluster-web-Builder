import type { NormalizedSection } from "@/lib/site/normalize-site-blueprint";

export type NavPage = { slug: string; name: string };

export function parseNavPages(json: unknown): NavPage[] {
  if (!Array.isArray(json)) return [];
  return json
    .filter(
      (page): page is NavPage =>
        !!page &&
        typeof page === "object" &&
        typeof (page as NavPage).slug === "string" &&
        typeof (page as NavPage).name === "string"
    )
    .map((page) => ({ slug: page.slug, name: page.name }));
}

type PageDef = { slug: string; name: string; types: string[] };

const RECIPES: Record<string, PageDef[]> = {
  one_page: [{
    slug: "home",
    name: "Inicio",
    types: ["hero", "services", "about_us", "faq", "location", "cta", "contact"],
  }],
  pages_3: [
    { slug: "home", name: "Inicio", types: ["hero", "about_us", "cta"] },
    { slug: "servicios", name: "Servicios", types: ["services", "cta"] },
    { slug: "contacto", name: "Contacto", types: ["contact", "location"] },
  ],
  pages_4: [
    { slug: "home", name: "Inicio", types: ["hero", "cta"] },
    { slug: "servicios", name: "Servicios", types: ["services", "cta"] },
    { slug: "nosotros", name: "Nosotros", types: ["about_us"] },
    { slug: "contacto", name: "Contacto", types: ["contact", "location"] },
  ],
  pages_full: [
    { slug: "home", name: "Inicio", types: ["hero", "cta"] },
    { slug: "servicios", name: "Servicios", types: ["services", "cta"] },
    { slug: "nosotros", name: "Nosotros", types: ["about_us"] },
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
  const allowedTypes = new Set([
    "hero", "services", "about", "about_us", "benefits", "gallery", "faq", "contact",
    "cta", "trust_badges", "process", "pricing", "location", "footer",
  ]);
  const byType = new Map<string, NormalizedSection>();

  for (const section of aiSections) {
    if (allowedTypes.has(section.type) && !byType.has(section.type)) {
      byType.set(section.type, section);
    }
  }

  if (!structureType || structureType === "one_page" || structureType === "ai_decide") {
    const content = aiSections
      .filter((section) => allowedTypes.has(section.type) && section.type !== "footer")
      .filter((section, index, list) => list.findIndex((item) => item.type === section.type) === index);
    const hero = content.find((section) => section.type === "hero") ?? synthesizeSection("hero", ctx);
    const ordered = [hero, ...content.filter((section) => section.type !== "hero")];
    const footer = byType.get("footer") ?? synthesizeSection("footer", ctx);
    return {
      navPages: [{ slug: "home", name: "Inicio" }],
      sections: [...ordered, footer].map((section, order) => ({
        ...section,
        pageSlug: "home",
        order,
        isVisible: true,
      })),
    };
  }

  const pages = (structureType && RECIPES[structureType]) || RECIPES.one_page;
  const sections: NormalizedSection[] = [];
  const navPages: NavPage[] = [];
  let order = 0;

  for (const page of pages) {
    navPages.push({ slug: page.slug, name: page.name });
    for (const type of page.types) {
      const source = byType.get(type);
      const resolved = source ?? synthesizeSection(type, ctx);
      sections.push({
        ...resolved,
        type,
        pageSlug: page.slug,
        order: order++,
        isVisible: true,
      });
    }
  }

  const footer = byType.get("footer") ?? synthesizeSection("footer", ctx);
  sections.push({
    ...footer,
    type: "footer",
    pageSlug: "home",
    order: order++,
    isVisible: true,
  });

  return { sections, navPages };
}

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
    content: {
      subtitle: "",
      body: "",
      ctaText: "",
      ctaLink: "",
      imagePrompt: "",
    },
    settings: {},
  };

  switch (type) {
    case "hero":
      return {
        ...base,
        title: ctx.businessName,
        content: { ...base.content, ctaText: "Contactar", ctaLink: "#contact" },
      };
    case "services":
      return { ...base, title: "Servicios y productos" };
    case "about":
    case "about_us":
      return { ...base, title: `Sobre ${ctx.businessName}` };
    case "location":
      return { ...base, title: "Zona de servicio" };
    case "cta":
      return {
        ...base,
        title: "Contacto",
        content: { ...base.content, ctaText: "Contactar", ctaLink: "#contact" },
      };
    case "contact":
      return {
        ...base,
        title: "Contacto",
        content: { ...base.content, ctaText: "Enviar solicitud" },
      };
    case "footer":
      return { ...base, title: ctx.businessName };
    default:
      return base;
  }
}
