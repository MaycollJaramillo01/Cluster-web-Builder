import type {
  CanvasColumnV2, CanvasRowV2, CanvasSectionV2, TemplateDefinitionV2,
  ThemeTokensV2, V2ContentSlot, V2TemplateId, V2WidgetType, WidgetV2,
} from "@/lib/site/v2-schema";
import { normalizeSiteContentV2, V2_TEMPLATE_IDS } from "@/lib/site/v2-schema";

type SectionSeed = Omit<CanvasSectionV2, "id">;
let seedIndex = 0;
const seedId = (kind: string) => `template-${kind}-${++seedIndex}`;
const widget = (type: V2WidgetType, slot?: V2ContentSlot, variant?: string, data?: Record<string, unknown>, style?: WidgetV2["style"]): WidgetV2 => ({ id: seedId("widget"), type, ...(slot ? { slot } : {}), ...(variant ? { variant } : {}), ...(data ? { data } : {}), ...(style ? { style } : {}) });
const column = (desktop: CanvasColumnV2["span"]["desktop"], widgets: WidgetV2[], tablet: CanvasColumnV2["span"]["tablet"] = desktop > 6 ? 12 : desktop as CanvasColumnV2["span"]["tablet"]): CanvasColumnV2 => ({ id: seedId("column"), span: { desktop, tablet, mobile: 12 }, widgets });
const row = (...columns: CanvasColumnV2[]): CanvasRowV2 => ({ id: seedId("row"), columns });
const section = (key: string, name: string, region: CanvasSectionV2["region"], rows: CanvasRowV2[], style?: CanvasSectionV2["style"]): SectionSeed => ({ schemaVersion: 2, key, name, region, rows, ...(style ? { style } : {}) });

const heading = (slot: V2ContentSlot, level: "h1" | "h2" | "h3" = "h2", style?: WidgetV2["style"]) => widget("heading", slot, level, undefined, style);
const text = (slot: V2ContentSlot, style?: WidgetV2["style"]) => widget("text", slot, undefined, undefined, style);
const button = (label: V2ContentSlot = "hero.ctaText", link: V2ContentSlot = "hero.ctaLink") => widget("button", label, "solid", { linkSlot: link });
const image = (slot: V2ContentSlot, variant = "cover") => widget("image", slot, variant);
const nav = () => widget("nav", undefined, "horizontal", { items: [{ label: "Servicios", href: "#services" }, { label: "Nosotros", href: "#about" }, { label: "Contacto", href: "#contact" }] });
const header = (variant = "bar") => section("global-header", "Header global", "header", [row(column(3, [widget("brand", "business.name", variant)]), column(9, [nav()]))], { desktop: { padding: "sm", width: "full" } });
const footer = (variant = "columns") => section("global-footer", "Footer global", "footer", [row(column(5, [widget("brand", "business.name", variant), text("business.type")]), column(4, [widget("business_info", undefined, "compact")]), column(3, [widget("social", "social", "icons")]))], { desktop: { padding: "lg", width: "full" } });

const THEMES: Record<V2TemplateId, ThemeTokensV2> = {
  conversion: { primary: "#5b21b6", secondary: "#17111f", accent: "#f59e0b", background: "#ffffff", text: "#17111f", muted: "#6b6472", headingFont: "Inter, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "md", motion: "stagger" },
  editorial: { primary: "#8b5e3c", secondary: "#201a17", accent: "#c69c6d", background: "#fbf8f3", text: "#201a17", muted: "#746a63", headingFont: "Georgia, serif", bodyFont: "Inter, system-ui, sans-serif", radius: "none", motion: "subtle" },
  catalog: { primary: "#0f766e", secondary: "#102a2a", accent: "#f97316", background: "#f8fafc", text: "#102a2a", muted: "#5b6d6d", headingFont: "Poppins, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "lg", motion: "stagger" },
  local: { primary: "#1d4ed8", secondary: "#172554", accent: "#fbbf24", background: "#ffffff", text: "#172554", muted: "#64748b", headingFont: "Poppins, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "lg", motion: "subtle" },
  immersive: { primary: "#7c3aed", secondary: "#09090b", accent: "#22d3ee", background: "#09090b", text: "#fafafa", muted: "#a1a1aa", headingFont: "Space Grotesk, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "sm", motion: "cinematic" },
  minimal: { primary: "#111111", secondary: "#111111", accent: "#111111", background: "#ffffff", text: "#111111", muted: "#737373", headingFont: "Helvetica Neue, Arial, sans-serif", bodyFont: "Helvetica Neue, Arial, sans-serif", radius: "none", motion: "none" },
};

const TEMPLATES: Record<V2TemplateId, TemplateDefinitionV2> = {
  conversion: {
    version: 2, id: "conversion", name: "Conversión", description: "Oferta directa, evidencia y formulario en un recorrido comercial.", thumbnail: "/templates/v2/conversion.svg", theme: THEMES.conversion,
    sections: [header("bar"),
      section("hero", "Portada", "main", [row(column(7, [heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black" } }), text("hero.subtitle", { desktop: { fontSize: "lg" } }), text("hero.body"), button()]), column(5, [image("hero.media", "framed")]))], { desktop: { padding: "xl", width: "wide" } }),
      section("services", "Servicios", "main", [row(column(4, [heading("business.type"), text("about.subtitle")]), column(8, [widget("list", "services", "cards")]))], { desktop: { padding: "lg", background: "#f5f3ff" } }),
      section("proof", "Beneficios", "main", [row(column(12, [heading("about.title"), widget("list", "benefits", "numbered")]))]),
      section("reviews", "Reseñas", "main", [row(column(12, [widget("testimonials", "reviews", "cards")]))], { desktop: { background: "#17111f", color: "#ffffff", padding: "lg" } }),
      section("contact", "Contacto", "main", [row(column(5, [heading("contact.title"), text("contact.body"), widget("business_info", undefined, "stacked")]), column(7, [widget("form", undefined, "card", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("columns")],
  },
  editorial: {
    version: 2, id: "editorial", name: "Editorial", description: "Lectura narrativa, serif protagonista e imágenes amplias.", thumbnail: "/templates/v2/editorial.svg", theme: THEMES.editorial,
    sections: [header("minimal"),
      section("hero", "Masthead", "main", [row(column(12, [text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "bold", width: "content" } }), text("hero.body", { desktop: { fontSize: "lg", width: "content" } })])), row(column(12, [image("hero.media", "wide")]))], { desktop: { padding: "xl", width: "wide" } }),
      section("about", "Historia", "main", [row(column(5, [heading("about.title"), text("about.subtitle")]), column(7, [text("about.body", { desktop: { fontSize: "lg" } })]))], { desktop: { padding: "xl" } }),
      section("gallery", "Galería", "main", [row(column(12, [widget("gallery", "media", "editorial")]))]),
      section("services", "Oferta", "main", [row(column(12, [widget("list", "services", "editorial")]))]),
      section("reviews", "Voces", "main", [row(column(12, [widget("testimonials", "reviews", "quotes")]))]),
      section("contact", "Contacto", "main", [row(column(6, [heading("contact.title"), text("contact.body")]), column(6, [widget("form", undefined, "minimal", { buttonSlot: "contact.ctaText" })]))]), footer("editorial")],
  },
  catalog: {
    version: 2, id: "catalog", name: "Catálogo", description: "Colecciones, oferta visual y comparación rápida.", thumbnail: "/templates/v2/catalog.svg", theme: THEMES.catalog,
    sections: [header("floating"),
      section("hero", "Vitrina", "main", [row(column(5, [heading("hero.title", "h1", { desktop: { fontSize: "2xl", fontWeight: "black" } }), text("hero.body"), button()]), column(7, [image("hero.media", "product")]))]),
      section("catalog", "Catálogo", "main", [row(column(12, [widget("list", "services", "catalog")]))], { desktop: { background: "#ecfdf5", padding: "lg" } }),
      section("gallery", "Colección", "main", [row(column(12, [widget("gallery", "media", "grid")]))]),
      section("benefits", "Ventajas", "main", [row(column(12, [widget("list", "benefits", "pills")]))]),
      section("reviews", "Reseñas", "main", [row(column(12, [widget("testimonials", "reviews", "featured")]))]),
      section("contact", "Comprar o consultar", "main", [row(column(4, [heading("contact.title"), widget("business_info", undefined, "compact")]), column(8, [widget("form", undefined, "inline", { buttonSlot: "contact.ctaText" })]))]), footer("columns")],
  },
  local: {
    version: 2, id: "local", name: "Negocio local", description: "Confianza, ubicación y contacto inmediato.", thumbnail: "/templates/v2/local.svg", theme: THEMES.local,
    sections: [header("bar"),
      section("hero", "Portada local", "main", [row(column(7, [heading("hero.title", "h1", { desktop: { fontSize: "2xl", fontWeight: "bold" } }), text("hero.subtitle", { desktop: { fontSize: "lg" } }), button()]), column(5, [image("hero.media", "rounded")]))], { desktop: { background: "#eff6ff", padding: "xl" } }),
      section("services", "Servicios", "main", [row(column(12, [widget("list", "services", "cards")]))]),
      section("about", "Quiénes somos", "main", [row(column(5, [image("about.media", "portrait")]), column(7, [heading("about.title"), text("about.body"), widget("list", "about.highlights", "badges")]))]),
      section("reviews", "Confianza", "main", [row(column(12, [widget("testimonials", "reviews", "list")]))]),
      section("location", "Ubicación", "main", [row(column(7, [widget("map", "business.location", "card")]), column(5, [widget("business_info", undefined, "stacked"), widget("social", "social", "buttons")]))]),
      section("contact", "Contacto", "main", [row(column(12, [widget("form", undefined, "split", { titleSlot: "contact.title", bodySlot: "contact.body", buttonSlot: "contact.ctaText" })]))]), footer("local")],
  },
  immersive: {
    version: 2, id: "immersive", name: "Inmersivo", description: "Medios a pantalla completa y bloques de alto contraste.", thumbnail: "/templates/v2/immersive.svg", theme: THEMES.immersive,
    sections: [header("overlay"),
      section("hero", "Hero cinematográfico", "main", [row(column(12, [widget("video", "hero.media", "background"), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black", align: "center" } }), text("hero.body", { desktop: { fontSize: "lg", align: "center" } }), button()]))], { desktop: { background: "#09090b", color: "#ffffff", padding: "xl", width: "full" } }),
      section("proof", "Resultados", "main", [row(column(12, [widget("list", "benefits", "metrics")]))], { desktop: { background: "#18181b", color: "#ffffff", padding: "lg" } }),
      section("gallery", "Experiencia visual", "main", [row(column(12, [widget("gallery", "media", "mosaic")]))]),
      section("services", "Oferta", "main", [row(column(5, [heading("about.title"), text("about.body")]), column(7, [widget("list", "services", "bento")]))]),
      section("reviews", "Historias", "main", [row(column(12, [widget("testimonials", "reviews", "wall")]))]),
      section("contact", "Conversión", "main", [row(column(12, [widget("form", undefined, "dark", { titleSlot: "contact.title", bodySlot: "contact.body", buttonSlot: "contact.ctaText" })]))]), footer("dark")],
  },
  minimal: {
    version: 2, id: "minimal", name: "Minimal", description: "Jerarquía tipográfica, mucho espacio y una sola acción.", thumbnail: "/templates/v2/minimal.svg", theme: THEMES.minimal,
    sections: [header("minimal"),
      section("hero", "Declaración", "main", [row(column(12, [heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "medium", width: "content" } }), text("hero.body", { desktop: { fontSize: "lg", width: "content" } }), button()]))], { desktop: { padding: "xl", width: "wide" } }),
      section("services", "Oferta esencial", "main", [row(column(4, [heading("business.type")]), column(8, [widget("list", "services", "minimal")]))]),
      section("about", "Sobre el negocio", "main", [row(column(8, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } })]), column(4, [image("about.media", "monochrome")]))]),
      section("faq", "Preguntas", "main", [row(column(12, [widget("accordion", "faqs", "minimal")]))]),
      section("contact", "Única acción", "main", [row(column(5, [heading("contact.title"), text("contact.body")]), column(7, [widget("form", undefined, "minimal", { buttonSlot: "contact.ctaText" })]))]), footer("minimal")],
  },
};

export const SECTION_LIBRARY_V2: SectionSeed[] = [
  section("library-split-hero", "Hero dividido", "main", [row(column(6, [heading("hero.title", "h1"), text("hero.body"), button()]), column(6, [image("hero.media", "offset")]))]),
  section("library-poster-hero", "Hero poster", "main", [row(column(12, [heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black", align: "center" } }), text("hero.subtitle", { desktop: { align: "center" } }), button()]))], { desktop: { background: "#111827", color: "#ffffff", padding: "xl" } }),
  section("library-about-overlap", "About superpuesto", "main", [row(column(7, [image("about.media", "wide")]), column(5, [heading("about.title"), text("about.body")]))]),
  section("library-about-stats", "About con métricas", "main", [row(column(6, [heading("about.title"), text("about.body")]), column(6, [widget("list", "about.highlights", "metrics")]))]),
  section("library-services-bento", "Servicios bento", "main", [row(column(12, [widget("list", "services", "bento")]))]),
  section("library-gallery-filmstrip", "Galería horizontal", "main", [row(column(12, [widget("gallery", "media", "filmstrip")]))]),
  section("library-cta-band", "CTA en banda", "main", [row(column(8, [heading("contact.title")]), column(4, [button("contact.ctaText", "hero.ctaLink")]))], { desktop: { background: "#111827", color: "#ffffff", padding: "lg" } }),
  section("library-reviews-quotes", "Testimonios editoriales", "main", [row(column(12, [widget("testimonials", "reviews", "quotes")]))]),
  section("library-contact-card", "Contacto en tarjeta", "main", [row(column(5, [widget("business_info", undefined, "stacked")]), column(7, [widget("form", undefined, "card", { buttonSlot: "contact.ctaText" })]))]),
];

export function getTemplateV2(id: string | null | undefined): TemplateDefinitionV2 {
  return TEMPLATES[(V2_TEMPLATE_IDS as readonly string[]).includes(String(id)) ? id as V2TemplateId : "conversion"];
}

export function getAllTemplatesV2(): TemplateDefinitionV2[] { return V2_TEMPLATE_IDS.map((id) => TEMPLATES[id]); }

export function instantiateTemplateV2(id: string, contentValue: unknown, customSections: CanvasSectionV2[] = []) {
  const template = getTemplateV2(id);
  const content = normalizeSiteContentV2(contentValue);
  const cloneWidget = (value: WidgetV2): WidgetV2 => ({ ...structuredClone(value), id: crypto.randomUUID() });
  const sections = template.sections.map((value, order): CanvasSectionV2 & { order: number } => ({
    ...structuredClone(value), id: crypto.randomUUID(), order,
    rows: value.rows.map((r) => ({ ...structuredClone(r), id: crypto.randomUUID(), columns: r.columns.map((c) => ({ ...structuredClone(c), id: crypto.randomUUID(), widgets: c.widgets.map(cloneWidget) })) })),
  }));
  const mainEnd = Math.max(0, sections.findIndex((item) => item.region === "footer"));
  const preserved = customSections.filter((item) => item.region === "main" && item.rows.some((r) => r.columns.some((c) => c.widgets.some((w) => !w.slot))));
  sections.splice(mainEnd, 0, ...preserved.map((item, index) => ({ ...structuredClone(item), order: mainEnd + index })));
  return { template, content, sections: sections.map((item, order) => ({ ...item, order })) };
}

export const LEGACY_TEMPLATE_MIGRATION: Record<string, { template: V2TemplateId; sections: string[] }> = {
  Service: { template: "conversion", sections: ["library-split-hero", "library-contact-card"] }, StudioSplit: { template: "conversion", sections: ["library-split-hero"] }, Reverse: { template: "conversion", sections: ["library-services-bento"] }, Metrics: { template: "conversion", sections: ["library-about-stats"] }, Timeline: { template: "conversion", sections: [] }, SplitStats: { template: "conversion", sections: ["library-about-stats"] }, Blueprint: { template: "conversion", sections: [] },
  Editorial: { template: "editorial", sections: ["library-reviews-quotes"] }, Overlap: { template: "editorial", sections: ["library-about-overlap"] }, Collage: { template: "editorial", sections: ["library-gallery-filmstrip"] }, Portrait: { template: "editorial", sections: [] }, Masthead: { template: "editorial", sections: [] }, Folio: { template: "editorial", sections: ["library-gallery-filmstrip"] }, Journal: { template: "editorial", sections: [] }, Atelier: { template: "editorial", sections: [] },
  Catalog: { template: "catalog", sections: ["library-services-bento"] }, Gridline: { template: "catalog", sections: [] }, Columns: { template: "catalog", sections: [] }, Accent: { template: "catalog", sections: ["library-poster-hero"] }, Market: { template: "catalog", sections: [] }, Showcase: { template: "catalog", sections: ["library-services-bento"] }, Boutique: { template: "catalog", sections: [] }, Stack: { template: "catalog", sections: [] },
  Local: { template: "local", sections: [] }, Framed: { template: "local", sections: ["library-contact-card"] }, Badges: { template: "local", sections: [] }, Corner: { template: "local", sections: [] }, Neighbor: { template: "local", sections: [] }, Homestead: { template: "local", sections: [] }, Storefront: { template: "local", sections: [] },
  Immersive: { template: "immersive", sections: ["library-poster-hero"] }, Manifesto: { template: "immersive", sections: ["library-poster-hero"] }, Panorama: { template: "immersive", sections: ["library-gallery-filmstrip"] }, Noir: { template: "immersive", sections: [] }, Velocity: { template: "immersive", sections: [] }, Pulse: { template: "immersive", sections: ["library-services-bento"] }, Horizon: { template: "immersive", sections: [] }, BigType: { template: "immersive", sections: ["library-poster-hero"] },
  Minimal: { template: "minimal", sections: [] }, Statement: { template: "minimal", sections: [] }, Quote: { template: "minimal", sections: ["library-reviews-quotes"] }, Numbered: { template: "minimal", sections: [] }, Ledger: { template: "minimal", sections: [] }, Blank: { template: "minimal", sections: [] }, Serif: { template: "minimal", sections: [] }, Mono: { template: "minimal", sections: [] },
};
