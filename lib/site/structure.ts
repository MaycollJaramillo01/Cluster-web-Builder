import type { NormalizedSection } from "@/lib/site/normalize-site-blueprint";

const ALLOWED_TYPES = new Set([
  "hero", "services", "about", "about_us", "benefits", "gallery", "faq", "contact",
  "cta", "trust_badges", "process", "pricing", "location", "footer",
]);

export function applyPageStructure(
  aiSections: NormalizedSection[],
  ctx: { businessName: string }
): NormalizedSection[] {
  const content = aiSections
    .filter((section) => ALLOWED_TYPES.has(section.type) && section.type !== "footer")
    .filter((section, index, list) => list.findIndex((item) => item.type === section.type) === index);
  const hero = content.find((section) => section.type === "hero") ?? synthesizeSection("hero", ctx);
  const footer = aiSections.find((section) => section.type === "footer") ?? synthesizeSection("footer", ctx);
  return [hero, ...content.filter((section) => section.type !== "hero"), footer]
    .map((section, order) => ({ ...section, order, isVisible: true }));
}

function synthesizeSection(type: string, ctx: { businessName: string }): NormalizedSection {
  return {
    type,
    title: type === "hero" || type === "footer" ? ctx.businessName : "",
    order: 0,
    isVisible: true,
    content: {
      subtitle: "",
      body: "",
      ctaText: type === "hero" ? "Contactar" : "",
      ctaLink: type === "hero" ? "#contact" : "",
      imagePrompt: "",
    },
    settings: {},
  };
}
