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
  studio: { primary: "#1c1917", secondary: "#0c0a09", accent: "#e11d48", background: "#ffffff", text: "#1c1917", muted: "#78716c", headingFont: "Sora, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "lg", motion: "stagger" },
  saas: { primary: "#064e3b", secondary: "#022c22", accent: "#059669", background: "#ffffff", text: "#0f172a", muted: "#64748b", headingFont: "Outfit, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "lg", motion: "stagger" },
  gastro: { primary: "#b91c1c", secondary: "#0c0a09", accent: "#f59e0b", background: "#1c1917", text: "#f5f5f4", muted: "#a8a29e", headingFont: "Playfair Display, Georgia, serif", bodyFont: "Inter, system-ui, sans-serif", radius: "sm", motion: "subtle" },
  wellness: { primary: "#4d7c5f", secondary: "#1f2937", accent: "#c2410c", background: "#f5f7f2", text: "#1f2937", muted: "#6b7280", headingFont: "Nunito, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "lg", motion: "subtle" },
  essential: { primary: "#111111", secondary: "#111111", accent: "#2457ff", background: "#f7f7f5", text: "#111111", muted: "#62625f", headingFont: "Helvetica Neue, Arial, sans-serif", bodyFont: "Helvetica Neue, Arial, sans-serif", radius: "none", motion: "subtle" },
  assurance: { primary: "#153e75", secondary: "#0b1f3a", accent: "#0b7a75", background: "#f7f9fc", text: "#10243e", muted: "#5d6b7c", headingFont: "Arial, Helvetica, sans-serif", bodyFont: "Arial, Helvetica, sans-serif", radius: "sm", motion: "subtle" },
  nordic: { primary: "#1f5d46", secondary: "#17372d", accent: "#dd5f3f", background: "#f2f6f3", text: "#17372d", muted: "#627068", headingFont: "Avenir Next, Arial, sans-serif", bodyFont: "Avenir Next, Arial, sans-serif", radius: "lg", motion: "subtle" },
  metro: { primary: "#191919", secondary: "#101010", accent: "#e63946", background: "#f3f3f1", text: "#191919", muted: "#666662", headingFont: "Arial Black, Arial, sans-serif", bodyFont: "Arial, Helvetica, sans-serif", radius: "none", motion: "stagger" },
  deco: { primary: "#0d3152", secondary: "#071421", accent: "#d3a33f", background: "#f5f0e6", text: "#10263a", muted: "#6c655a", headingFont: "Copperplate, Georgia, serif", bodyFont: "Arial, Helvetica, sans-serif", radius: "none", motion: "subtle" },
  impact: { primary: "#14432e", secondary: "#123829", accent: "#f2ca3b", background: "#f0efe8", text: "#173a2a", muted: "#5f6d61", headingFont: "Anton, 'Arial Narrow', sans-serif", bodyFont: "Poppins, 'Segoe UI', sans-serif", headingCase: "uppercase", radius: "lg", motion: "stagger" },
  "hvac-premium": { primary: "#3b82f6", secondary: "#111827", accent: "#3b82f6", background: "#ffffff", text: "#111111", muted: "#666666", headingFont: "Arial, Helvetica, sans-serif", bodyFont: "Arial, Helvetica, sans-serif", radius: "sm", motion: "subtle" },
  // Brandkit "Dark Developer/Builder": precision de constructor, un solo acento cian.
  terminal: { primary: "#22d3ee", secondary: "#0d1319", accent: "#22d3ee", background: "#0b1117", text: "#e2e8f0", muted: "#8a99a8", headingFont: "'Space Grotesk', 'Segoe UI', sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "sm", motion: "stagger" },
  // Brandkit "Dark Nature/Calm System": bosque profundo, lima como señal, calma cinematica.
  horizonte: { primary: "#b7e264", secondary: "#0c1912", accent: "#b7e264", background: "#101f16", text: "#e7efe6", muted: "#93a898", headingFont: "Sora, 'Segoe UI', sans-serif", bodyFont: "Nunito, 'Segoe UI', sans-serif", radius: "lg", motion: "cinematic" },
  // Brandkit "Luxury/Beauty" en clave fria: porcelana, tinta y un burdeos de sello.
  astre: { primary: "#7c2743", secondary: "#1c1a1d", accent: "#7c2743", background: "#f4f3f1", text: "#211f22", muted: "#6f6a70", headingFont: "'Cormorant Garamond', Georgia, serif", bodyFont: "Karla, 'Segoe UI', sans-serif", radius: "none", motion: "subtle" },
  realty: { primary: "#334155", secondary: "#0f172a", accent: "#b4893a", background: "#f7f6f3", text: "#181b1e", muted: "#5f6b76", headingFont: "Outfit, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "sm", motion: "subtle" },
  clinic: { primary: "#0f6e6a", secondary: "#0b2a33", accent: "#2aa9a1", background: "#f5f9f9", text: "#10262a", muted: "#5b7379", headingFont: "Karla, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "lg", motion: "subtle" },
  counsel: { primary: "#14301f", secondary: "#0b1410", accent: "#2f6b45", background: "#f4f5f2", text: "#141815", muted: "#5c655e", headingFont: "Georgia, 'Times New Roman', serif", bodyFont: "Inter, system-ui, sans-serif", radius: "none", motion: "subtle" },
  academy: { primary: "#1e40af", secondary: "#0b1220", accent: "#2563eb", background: "#f8fafc", text: "#0f172a", muted: "#64748b", headingFont: "Outfit, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "md", motion: "stagger" },
  venue: { primary: "#7c3f52", secondary: "#0c0a0d", accent: "#b76a83", background: "#f4f1f0", text: "#171314", muted: "#6b6265", headingFont: "'Cormorant Garamond', Georgia, serif", bodyFont: "Karla, 'Segoe UI', sans-serif", radius: "none", motion: "cinematic" },
  // Energia de gimnasio: mayusculas condensadas, un solo verde lima desaturado.
  vigor: { primary: "#101010", secondary: "#0a0a0a", accent: "#9ae62b", background: "#f2f2f0", text: "#131313", muted: "#6b6b68", headingFont: "Anton, 'Arial Narrow', sans-serif", bodyFont: "Poppins, 'Segoe UI', sans-serif", headingCase: "uppercase", radius: "sm", motion: "stagger" },
  drive: { primary: "#23272b", secondary: "#121416", accent: "#d9622b", background: "#f1f1ee", text: "#16181a", muted: "#63676b", headingFont: "'Space Grotesk', 'Segoe UI', sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "none", motion: "subtle" },
  cause: { primary: "#7a3b2e", secondary: "#241c18", accent: "#c9633f", background: "#f7f2ec", text: "#241c18", muted: "#7a6f68", headingFont: "Nunito, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "lg", motion: "subtle" },
  frame: { primary: "#18181b", secondary: "#0a0a0b", accent: "#e5e5e0", background: "#fafafa", text: "#18181b", muted: "#71717a", headingFont: "Karla, system-ui, sans-serif", bodyFont: "Karla, system-ui, sans-serif", radius: "none", motion: "cinematic" },
  craft: { primary: "#1f3a5f", secondary: "#101820", accent: "#c62828", background: "#f5f5f3", text: "#16181a", muted: "#5c6570", headingFont: "Poppins, system-ui, sans-serif", bodyFont: "Inter, system-ui, sans-serif", radius: "sm", motion: "subtle" },
};

const TEMPLATES: Record<V2TemplateId, TemplateDefinitionV2> = {
  conversion: {
    version: 2, id: "conversion", name: "Conversión", description: "Oferta directa, evidencia y formulario en un recorrido comercial.", thumbnail: "/templates/v2/conversion.svg", theme: THEMES.conversion,
    sections: [header("bar"),
      section("hero", "Portada", "main", [row(column(7, [heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black" } }), text("hero.subtitle", { desktop: { fontSize: "lg" } }), text("hero.body"), button()]), column(5, [image("hero.media", "framed")]))], { desktop: { padding: "xl", width: "wide" } }),
      section("services", "Servicios", "main", [row(column(4, [heading("business.type"), text("about.subtitle")]), column(8, [widget("list", "services", "cards")]))], { desktop: { padding: "lg", background: "#f5f3ff" } }),
      section("proof", "Beneficios", "main", [row(column(12, [heading("about.title"), widget("list", "benefits", "numbered")]))]),
      section("reviews", "Reseñas", "main", [row(column(12, [widget("testimonials", "reviews", "cards")]))], { desktop: { background: "secondary", padding: "lg" } }),
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
      section("hero", "Hero cinematográfico", "main", [row(column(12, [widget("video", "hero.media", "background"), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black", align: "center" } }), text("hero.body", { desktop: { fontSize: "lg", align: "center" } }), button()]))], { desktop: { background: "secondary", padding: "xl", width: "full" } }),
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
  studio: {
    version: 2, id: "studio", name: "Estudio creativo", description: "Portafolio con el trabajo al centro: galería protagonista y proyectos en retícula.", thumbnail: "/templates/v2/studio.svg", theme: THEMES.studio,
    sections: [header("minimal"),
      section("hero", "Portada", "main", [row(column(6, [heading("hero.title", "h1", { desktop: { fontWeight: "black" } }), text("hero.subtitle", { desktop: { fontSize: "lg" } }), button()]), column(6, [image("hero.media", "wide")]))], { desktop: { padding: "xl", width: "wide" } }),
      section("work", "Trabajo", "main", [row(column(12, [widget("gallery", "media", "mosaic")]))], { desktop: { background: "#fafaf9", padding: "lg" } }),
      section("projects", "Proyectos", "main", [row(column(12, [heading("about.title"), widget("list", "services", "bento")]))]),
      section("studio", "El estudio", "main", [row(column(5, [heading("about.subtitle"), text("about.body", { desktop: { fontSize: "lg" } })]), column(7, [widget("list", "about.highlights", "metrics")]))], { desktop: { padding: "lg" } }),
      section("reviews", "Clientes", "main", [row(column(12, [widget("testimonials", "reviews", "wall")]))], { desktop: { background: "primary", padding: "lg" } }),
      section("contact", "Trabajemos juntos", "main", [row(column(6, [heading("contact.title"), text("contact.body"), widget("business_info", undefined, "stacked")]), column(6, [widget("form", undefined, "card", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("columns")],
  },
  saas: {
    version: 2, id: "saas", name: "Producto digital", description: "Landing de app o software: funciones en bento, resultados y preguntas frecuentes.", thumbnail: "/templates/v2/saas.svg", theme: THEMES.saas,
    sections: [header("floating"),
      section("hero", "Lanzamiento", "main", [row(column(6, [heading("hero.title", "h1", { desktop: { fontWeight: "black" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]), column(6, [image("hero.media", "framed")]))], { desktop: { padding: "xl", width: "wide" } }),
      section("features", "Funciones", "main", [row(column(12, [heading("about.title"), widget("list", "services", "bento")]))], { desktop: { background: "#ecfdf5", padding: "lg" } }),
      section("benefits", "Resultados", "main", [row(column(5, [heading("about.subtitle"), text("about.body")]), column(7, [widget("list", "benefits", "metrics")]))]),
      section("how", "Cómo funciona", "main", [row(column(12, [widget("list", "about.highlights", "numbered")]))]),
      section("reviews", "Quien ya lo usa", "main", [row(column(12, [widget("testimonials", "reviews", "featured")]))], { desktop: { background: "primary", padding: "lg" } }),
      section("faq", "Preguntas frecuentes", "main", [row(column(12, [widget("accordion", "faqs", "cards")]))]),
      section("contact", "Empieza gratis", "main", [row(column(5, [heading("contact.title"), widget("business_info", undefined, "compact")]), column(7, [widget("form", undefined, "card", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("columns")],
  },
  gastro: {
    version: 2, id: "gastro", name: "Restaurante", description: "Carta como eje, galería de platos y reserva. Atmósfera cálida y apetecible.", thumbnail: "/templates/v2/gastro.svg", theme: THEMES.gastro,
    sections: [header("overlay"),
      section("hero", "Bienvenida", "main", [row(column(6, [heading("hero.title", "h1", { desktop: { fontWeight: "bold" } }), text("hero.subtitle", { desktop: { fontSize: "lg" } }), button()]), column(6, [image("hero.media", "wide")]))], { desktop: { background: "background", padding: "xl", width: "wide" } }),
      section("menu", "Carta", "main", [row(column(12, [heading("business.type"), widget("list", "services", "catalog")]))], { desktop: { background: "#292524", color: "#f5f5f4", padding: "lg" } }),
      section("gallery", "Platos", "main", [row(column(12, [widget("gallery", "media", "filmstrip")]))]),
      section("about", "Nuestra cocina", "main", [row(column(6, [image("about.media", "portrait")]), column(6, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } })]))], { desktop: { padding: "lg" } }),
      section("reviews", "Reseñas", "main", [row(column(12, [widget("testimonials", "reviews", "cards")]))]),
      section("location", "Visítanos", "main", [row(column(5, [widget("business_info", undefined, "stacked"), widget("social", "social", "buttons")]), column(7, [widget("map", "business.location", "card")]))]),
      section("contact", "Reserva tu mesa", "main", [row(column(12, [widget("form", undefined, "split", { titleSlot: "contact.title", bodySlot: "contact.body", buttonSlot: "contact.ctaText" })]))]), footer("dark")],
  },
  wellness: {
    version: 2, id: "wellness", name: "Bienestar", description: "Estética serena y aireada para salud, spa o coaching. Cuidados y agenda de cita.", thumbnail: "/templates/v2/wellness.svg", theme: THEMES.wellness,
    sections: [header("bar"),
      section("hero", "Portada", "main", [row(column(6, [heading("hero.title", "h1", { desktop: { fontWeight: "semibold" } }), text("hero.subtitle", { desktop: { fontSize: "lg" } }), button()]), column(6, [image("hero.media", "rounded")]))], { desktop: { padding: "xl" } }),
      section("services", "Cuidados", "main", [row(column(12, [widget("list", "services", "cards")]))]),
      section("benefits", "Beneficios", "main", [row(column(5, [heading("about.subtitle"), text("about.body")]), column(7, [widget("list", "benefits", "badges")]))], { desktop: { background: "#eef2ea", padding: "lg" } }),
      section("about", "Filosofía", "main", [row(column(7, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } })]), column(5, [image("about.media", "portrait")]))]),
      section("faq", "Dudas frecuentes", "main", [row(column(12, [widget("accordion", "faqs", "minimal")]))]),
      section("reviews", "Testimonios", "main", [row(column(12, [widget("testimonials", "reviews", "quotes")]))]),
      section("location", "Dónde estamos", "main", [row(column(7, [widget("map", "business.location", "card")]), column(5, [widget("business_info", undefined, "stacked"), widget("social", "social", "buttons")]))], { desktop: { background: "#eef2ea", padding: "lg" } }),
      section("contact", "Agenda tu cita", "main", [row(column(6, [heading("contact.title"), text("contact.body"), widget("business_info", undefined, "stacked")]), column(6, [widget("form", undefined, "minimal", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("minimal")],
  },
  essential: {
    version: 2, id: "essential", name: "Esencial", description: "Minimalismo expresivo: una narrativa continua, fotografía precisa y un único acento de color.", thumbnail: "/templates/v2/essential.svg", theme: THEMES.essential,
    sections: [header("minimal"),
      section("hero", "Primera impresión", "main", [row(column(8, [text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "medium", width: "content" } }), text("hero.body", { desktop: { fontSize: "lg", width: "content" } }), button()]), column(4, [image("hero.media", "monochrome")]))], { desktop: { padding: "xl", width: "wide" } }),
      section("principles", "Por qué elegirnos", "main", [row(column(4, [heading("about.subtitle"), text("about.body")]), column(8, [widget("list", "benefits", "numbered")]))], { desktop: { background: "#eeeeea", padding: "lg" } }),
      section("services", "Lo que hacemos", "main", [row(column(4, [heading("business.type")]), column(8, [widget("list", "services", "editorial")]))], { desktop: { padding: "xl" } }),
      section("about", "Una forma de trabajar", "main", [row(column(7, [image("about.media", "wide")]), column(5, [text("about.subtitle", { desktop: { fontSize: "sm" } }), heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } }), widget("list", "about.highlights", "minimal")]))], { desktop: { padding: "lg", width: "wide" } }),
      section("reviews", "Confianza", "main", [row(column(4, [heading("contact.title")]), column(8, [widget("testimonials", "reviews", "quotes")]))], { desktop: { background: "secondary", padding: "xl" } }),
      section("faq", "Antes de empezar", "main", [row(column(4, [heading("about.subtitle")]), column(8, [widget("accordion", "faqs", "minimal")]))]),
      section("contact", "Siguiente paso", "main", [row(column(5, [heading("contact.title"), text("contact.body"), widget("business_info", undefined, "stacked")]), column(7, [widget("form", undefined, "minimal", { buttonSlot: "contact.ctaText" })]))], { desktop: { background: "#eeeeea", padding: "xl" } }), footer("minimal")],
  },
  assurance: {
    version: 2, id: "assurance", name: "Confianza", description: "Presencia corporativa clara, evidencia temprana y decisiones sin ambigüedad.", thumbnail: "/templates/v2/assurance.svg", theme: THEMES.assurance,
    sections: [header("bordered"),
      section("hero", "Propuesta ejecutiva", "main", [row(column(12, [image("hero.media", "background"), text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "2xl", fontWeight: "bold" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]))], { desktop: { padding: "none", width: "full" } }),
      section("proof", "Resultados verificables", "main", [row(column(8, [widget("list", "benefits", "metrics")]), column(4, [widget("business_info", undefined, "stacked")]))], { desktop: { background: "#e8eef6", padding: "lg" } }),
      section("services", "Capacidades", "main", [row(column(5, [heading("business.type")]), column(7, [widget("list", "services", "minimal")]))], { desktop: { padding: "xl" } }),
      section("about", "Cómo trabajamos", "main", [row(column(4, [image("about.media", "portrait")]), column(8, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } }), widget("list", "about.highlights", "numbered")]))]),
      section("reviews", "Referencias", "main", [row(column(12, [widget("testimonials", "reviews", "list")]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("faq", "Información clave", "main", [row(column(12, [widget("accordion", "faqs", "cards")]))]),
      section("contact", "Contacto directo", "main", [row(column(4, [widget("business_info", undefined, "stacked")]), column(8, [widget("form", undefined, "card", { titleSlot: "contact.title", buttonSlot: "contact.ctaText" })]))], { desktop: { background: "#e8eef6", padding: "xl" } }), footer("columns")],
  },
  nordic: {
    version: 2, id: "nordic", name: "Nórdica", description: "Calma escandinava, materiales naturales y una experiencia humana sin artificios.", thumbnail: "/templates/v2/nordic.svg", theme: THEMES.nordic,
    sections: [header("bar"),
      section("hero", "Bienvenida serena", "main", [row(column(12, [image("hero.media", "background"), text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "2xl", fontWeight: "semibold" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]))], { desktop: { padding: "none", width: "full" } }),
      section("services", "Servicios", "main", [row(column(12, [widget("list", "services", "cards")]))], { desktop: { background: "#e5eee8", padding: "lg" } }),
      section("about", "Nuestra filosofía", "main", [row(column(7, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } }), widget("list", "about.highlights", "badges")]), column(5, [image("about.media", "portrait")]))], { desktop: { padding: "xl" } }),
      section("gallery", "Vida cotidiana", "main", [row(column(12, [widget("gallery", "media", "filmstrip")]))]),
      section("benefits", "Lo que permanece", "main", [row(column(4, [heading("business.type")]), column(8, [widget("list", "benefits", "minimal")]))], { desktop: { background: "#e5eee8", padding: "lg" } }),
      section("reviews", "Historias cercanas", "main", [row(column(12, [widget("testimonials", "reviews", "quotes")]))]),
      section("contact", "Empecemos con calma", "main", [row(column(6, [heading("contact.title"), text("contact.body"), widget("business_info", undefined, "stacked")]), column(6, [widget("form", undefined, "minimal", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("minimal")],
  },
  metro: {
    version: 2, id: "metro", name: "Metropolitana", description: "Ritmo urbano, retícula contundente y contenido que avanza como una ciudad.", thumbnail: "/templates/v2/metro.svg", theme: THEMES.metro,
    sections: [header("minimal"),
      section("hero", "Apertura urbana", "main", [row(column(12, [widget("video", "hero.media", "background"), text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]))], { desktop: { padding: "none", width: "full" } }),
      section("gallery", "Escenas", "main", [row(column(12, [widget("gallery", "media", "mosaic")]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("services", "Oferta en movimiento", "main", [row(column(12, [widget("list", "services", "bento")]))]),
      section("proof", "Impacto", "main", [row(column(5, [heading("business.type")]), column(7, [widget("list", "benefits", "metrics")]))], { desktop: { background: "accent", padding: "lg" } }),
      section("about", "La firma", "main", [row(column(5, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } })]), column(7, [image("about.media", "offset")]))], { desktop: { padding: "xl" } }),
      section("reviews", "Voces de la ciudad", "main", [row(column(12, [widget("testimonials", "reviews", "wall")]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("contact", "Conecta", "main", [row(column(12, [widget("form", undefined, "inline", { titleSlot: "contact.title", bodySlot: "contact.body", buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("dark")],
  },
  deco: {
    version: 2, id: "deco", name: "Art déco", description: "Simetría ceremonial, lujo gráfico y una narrativa de servicio con carácter atemporal.", thumbnail: "/templates/v2/deco.svg", theme: THEMES.deco,
    sections: [header("overlay"),
      section("hero", "Gran salón", "main", [row(column(12, [widget("video", "hero.media", "background"), text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "bold" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]))], { desktop: { padding: "none", width: "full" } }),
      section("services", "Colección de servicios", "main", [row(column(12, [heading("business.type", "h2", { desktop: { align: "center" } }), widget("list", "services", "catalog")]))], { desktop: { padding: "xl" } }),
      section("about", "Historia y oficio", "main", [row(column(6, [image("about.media", "portrait")]), column(6, [text("about.subtitle", { desktop: { fontSize: "sm" } }), heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } })]))], { desktop: { background: "#e9dfcb", padding: "lg" } }),
      section("benefits", "Distinciones", "main", [row(column(12, [widget("list", "benefits", "metrics")]))], { desktop: { background: "primary", padding: "lg" } }),
      section("gallery", "Galería", "main", [row(column(12, [widget("gallery", "media", "editorial")]))]),
      section("reviews", "Testimonios", "main", [row(column(12, [widget("testimonials", "reviews", "featured")]))]),
      section("faq", "Detalles", "main", [row(column(12, [widget("accordion", "faqs", "cards")]))], { desktop: { background: "#e9dfcb", padding: "lg" } }),
      section("contact", "Solicitud privada", "main", [row(column(5, [heading("contact.title"), text("contact.body"), widget("business_info", undefined, "stacked")]), column(7, [widget("form", undefined, "dark", { buttonSlot: "contact.ctaText" })]))], { desktop: { background: "secondary", padding: "xl" } }), footer("dark")],
  },
  impact: {
    version: 2, id: "impact", name: "Impacto", description: "Agencia creativa audaz: bandas de color a lo ancho, titulares condensados en mayúsculas y un amarillo que dirige la acción.", thumbnail: "/templates/v2/impact.svg", theme: THEMES.impact,
    sections: [
      section("global-header", "Header global", "header", [row(column(12, [widget("brand", "business.name", "pill"), widget("nav", undefined, "pill", { items: [{ label: "Nosotros", href: "#about" }, { label: "Obras", href: "#gallery" }, { label: "Contacto", href: "#contact" }] })]))], { desktop: { padding: "sm", width: "full" } }),
      section("hero", "Portada", "main", [row(column(6, [text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]), column(6, [image("hero.media", "tilt")]))], { desktop: { padding: "xl" } }),
      section("about", "Sobre nosotros", "main", [row(column(5, [text("about.subtitle", { desktop: { fontSize: "sm", color: "#f2ca3b", fontWeight: "bold" } }), heading("about.title"), text("about.body")]), column(7, [image("about.media", "tilt")]))], { desktop: { background: "secondary", padding: "xl" } }),
      section("services", "Servicios", "main", [row(column(12, [heading("business.type", "h2"), widget("list", "services", "cards")]))], { desktop: { background: "#ffffff", padding: "xl" } }),
      section("gallery", "Obras", "main", [row(column(12, [widget("gallery", "media", "mosaic")]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("proof", "Resultados", "main", [row(column(12, [widget("list", "benefits", "metrics")]))], { desktop: { padding: "lg" } }),
      section("reviews", "Testimonios", "main", [row(column(12, [widget("testimonials", "reviews", "featured")]))], { desktop: { background: "#ffffff", padding: "xl" } }),
      section("faq", "Preguntas", "main", [row(column(12, [widget("accordion", "faqs", "cards")]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("contact", "Contacto", "main", [row(column(5, [heading("contact.title"), text("contact.body"), widget("business_info", undefined, "stacked")]), column(7, [widget("form", undefined, "card", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("columns")],
  },
  "hvac-premium": {
    version: 2, id: "hvac-premium", name: "Servicio premium", description: "Landing de servicios locales con hero fotográfico, métricas, áreas de cobertura, proyectos y conversión directa.", thumbnail: "/templates/v2/hvac-premium.svg", theme: THEMES["hvac-premium"],
    sections: [
      section("global-header", "Header global", "header", [row(
        column(3, [widget("brand", "business.name", "hvac")]),
        column(6, [widget("nav", undefined, "hvac", { items: [{ label: "About us", href: "#about" }, { label: "Services", href: "#services" }, { label: "Contact", href: "#contact" }, { label: "Blog", href: "#faq" }] })]),
        column(3, [widget("button", undefined, "solid", { value: "Schedule Service", link: "#contact" })]),
      )], { desktop: { padding: "sm", width: "full" } }),
      section("hero", "Portada de servicio", "main", [row(column(12, [
        image("hero.media", "background"),
        text("hero.subtitle", { desktop: { fontSize: "sm" } }),
        heading("hero.title", "h1", { desktop: { fontSize: "2xl", fontWeight: "normal" } }),
        text("hero.body", { desktop: { fontSize: "lg" } }),
        button(),
      ]))], { desktop: { padding: "none", width: "full" } }),
      section("hvac-stats", "Confianza y métricas", "main", [
        row(column(7, [widget("text", undefined, undefined, { value: "WHY HOMEOWNERS CHOOSE US" }), heading("about.title", "h2", { desktop: { fontWeight: "normal" } })]), column(5, [text("about.body", { desktop: { fontSize: "lg" } })])),
        row(column(12, [widget("list", "about.highlights", "metrics")])),
        row(column(5, [widget("list", "benefits", "badges")]), column(7, [widget("business_info", undefined, "stacked"), widget("testimonials", "reviews", "list")])),
      ], { desktop: { padding: "xl" } }),
      section("services", "Servicios residenciales", "main", [row(column(12, [
        widget("text", undefined, undefined, { value: "OUR SERVICES" }),
        widget("heading", undefined, "h2", { value: "Complete Residential Heating & Cooling Solutions" }, { desktop: { fontWeight: "normal" } }),
        text("hero.body", { desktop: { fontSize: "lg" } }),
        widget("list", "services", "cards"),
        widget("button", undefined, "solid", { value: "See All Services", link: "#services" }),
      ]))], { desktop: { background: "#fafafa", padding: "xl" } }),
      section("about", "Por qué elegirnos", "main", [
        row(column(4, [widget("text", undefined, undefined, { value: "WHY CHOOSE US" })]), column(8, [widget("heading", undefined, "h2", { value: "Everything You Need for a Comfortable, Worry-Free Service Experience" }, { desktop: { fontWeight: "normal" } })])),
        row(column(12, [widget("list", "benefits", "cards")]))
      ], { desktop: { padding: "xl" } }),
      section("reviews", "Reseñas", "main", [row(column(12, [
        widget("text", undefined, undefined, { value: "REVIEWS" }),
        widget("heading", undefined, "h2", { value: "What Our Customers Say" }, { desktop: { align: "center", fontWeight: "normal" } }),
        widget("testimonials", "reviews", "wall"),
        widget("button", undefined, "solid", { value: "See All Google Reviews", link: "#reviews" }),
      ]))], { desktop: { padding: "xl" } }),
      section("hvac-financing", "Financiamiento", "main", [row(column(12, [
        widget("text", undefined, undefined, { value: "FLEXIBLE FINANCING" }),
        widget("heading", undefined, "h2", { value: "Upgrade Your Comfort Without the Upfront Cost of a New System" }, { desktop: { align: "center", fontWeight: "normal" } }),
        widget("button", undefined, "solid", { value: "Explore Financing Options", link: "#contact" }),
      ]))], { desktop: { background: "#fafafa", padding: "xl" } }),
      section("hvac-service-areas", "Áreas de servicio", "main", [
        row(column(7, [widget("text", undefined, undefined, { value: "SERVICE AREAS" }), widget("heading", undefined, "h2", { value: "Proudly Serving Your City and Nearby Communities" }, { desktop: { fontWeight: "normal" } })]), column(5, [text("contact.body", { desktop: { fontSize: "lg" } })])),
        row(column(5, [widget("business_info", undefined, "stacked"), button("contact.ctaText", "hero.ctaLink")]), column(7, [widget("map", "business.location", "hvac")]))
      ], { desktop: { padding: "xl" } }),
      section("gallery", "Proyectos recientes", "main", [row(column(7, [widget("text", undefined, undefined, { value: "RECENT WORKS" }), widget("heading", undefined, "h2", { value: "Real Projects. Real Comfort." }, { desktop: { fontWeight: "normal" } })]), column(5, [text("about.subtitle", { desktop: { fontSize: "lg" } })])), row(column(12, [widget("gallery", "media", "mosaic")]))], { desktop: { background: "#fafafa", padding: "xl" } }),
      section("hvac-process", "Proceso", "main", [
        row(column(7, [widget("text", undefined, undefined, { value: "PROCESS" }), widget("heading", undefined, "h2", { value: "Simple Steps to Restore Your Home Comfort" }, { desktop: { fontWeight: "normal" } }), button()]), column(5, [text("about.body", { desktop: { fontSize: "lg" } })])),
        row(column(12, [widget("list", undefined, "numbered", { value: [
          { title: "Request a Free Estimate", description: "Contact our team and tell us about your service needs." },
          { title: "System Evaluation", description: "We assess the situation and recommend the best solution." },
          { title: "Professional Service", description: "We complete the work with attention to quality and safety." },
          { title: "Enjoy Lasting Comfort", description: "Relax knowing your system is operating efficiently and reliably." },
        ] })]))
      ], { desktop: { padding: "xl" } }),
      section("faq", "Preguntas frecuentes", "main", [row(column(4, [widget("text", undefined, undefined, { value: "FAQ" }), widget("heading", undefined, "h2", { value: "Frequently Asked Customer Questions" }, { desktop: { fontWeight: "normal" } }), text("contact.body")]), column(8, [widget("accordion", "faqs", "hvac")]))], { desktop: { padding: "xl" } }),
      section("contact", "Llamada final", "main", [row(column(12, [heading("contact.title", "h2", { desktop: { align: "center", fontWeight: "normal" } }), text("contact.body", { desktop: { align: "center" } }), button("contact.ctaText", "hero.ctaLink"), widget("business_info", undefined, "hvac-phone")]))], { desktop: { background: "#30343b", color: "#ffffff", padding: "xl", radius: "sm" } }),
      section("global-footer", "Footer global", "footer", [
        row(column(5, [widget("business_info", undefined, "stacked"), widget("social", "social", "icons")]), column(3, [widget("nav", undefined, "footer", { items: [{ label: "Home", href: "#top" }, { label: "About", href: "#about" }, { label: "Services", href: "#services" }, { label: "Contact", href: "#contact" }] })]), column(4, [widget("list", "services", "minimal")])),
        row(column(12, [widget("brand", "business.name", "hvac-footer")]))
      ], { desktop: { background: "#ffffff", color: "#111111", padding: "xl", width: "full" } }),
    ],
  },
  terminal: {
    version: 2, id: "terminal", name: "Terminal", description: "Identidad de constructor para estudios de software y servicios tech: fondo casi negro, precisión de retícula y un solo acento cian.", thumbnail: "/templates/v2/terminal.svg", theme: THEMES.terminal,
    sections: [header("bordered"),
      section("hero", "Portada", "main", [row(column(8, [text("hero.subtitle", { desktop: { fontSize: "sm", color: "#22d3ee", fontWeight: "bold" } }), heading("hero.title", "h1"), text("hero.body", { desktop: { fontSize: "lg" } }), button()]), column(4, [widget("list", "about.highlights", "minimal")]))], { desktop: { padding: "xl" } }),
      section("proof", "Números", "main", [row(column(12, [widget("list", "benefits", "metrics")]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("services", "Capacidades", "main", [row(column(12, [heading("business.type", "h2"), widget("list", "services", "bento")]))], { desktop: { padding: "xl" } }),
      section("about", "El equipo", "main", [row(column(5, [image("about.media", "monochrome")]), column(7, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } })]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("reviews", "Referencias", "main", [row(column(4, [heading("business.name")]), column(8, [widget("testimonials", "reviews", "quotes")]))]),
      section("faq", "Preguntas", "main", [row(column(12, [widget("accordion", "faqs", "lines")]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("contact", "Contacto", "main", [row(column(5, [heading("contact.title"), text("contact.body"), widget("business_info", undefined, "stacked")]), column(7, [widget("form", undefined, "minimal", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("minimal")],
  },
  horizonte: {
    version: 2, id: "horizonte", name: "Horizonte", description: "Calma de bosque para turismo, aventura y marcas eco: paisaje a pantalla completa, lima como señal y ritmo cinematográfico.", thumbnail: "/templates/v2/horizonte.svg", theme: THEMES.horizonte,
    sections: [header("bar"),
      section("hero", "Paisaje", "main", [row(column(12, [image("hero.media", "background"), text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "semibold" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]))], { desktop: { padding: "none", width: "full" } }),
      section("about", "Manifiesto", "main", [row(column(12, [heading("about.title", "h2", { desktop: { align: "center" } }), text("about.body", { desktop: { align: "center", fontSize: "lg", width: "content" } })]))], { desktop: { padding: "xl" } }),
      section("services", "Experiencias", "main", [row(column(12, [widget("list", "services", "cards")]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("gallery", "Bitácora", "main", [row(column(12, [widget("gallery", "media", "bento")]))]),
      section("reviews", "Viajeros", "main", [row(column(12, [widget("testimonials", "reviews", "featured")]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("location", "Punto de partida", "main", [row(column(5, [widget("map")]), column(7, [heading("about.subtitle"), widget("business_info", undefined, "stacked")]))]),
      section("contact", "Reserva", "main", [row(column(6, [heading("contact.title"), text("contact.body")]), column(6, [widget("form", undefined, "minimal", { buttonSlot: "contact.ctaText" })]))], { desktop: { background: "secondary", padding: "xl" } }), footer("minimal")],
  },
  astre: {
    version: 2, id: "astre", name: "Astre", description: "Lujo frío para belleza, joyería y servicios premium: porcelana, serif de alta costura y un burdeos que actúa como sello.", thumbnail: "/templates/v2/astre.svg", theme: THEMES.astre,
    sections: [header("minimal"),
      section("hero", "Vitrina", "main", [row(column(6, [image("hero.media", "portrait")]), column(6, [text("hero.subtitle", { desktop: { fontSize: "sm", color: "#7c2743", fontWeight: "bold" } }), heading("hero.title", "h1"), text("hero.body", { desktop: { fontSize: "lg" } }), button()]))], { desktop: { padding: "xl", width: "wide" } }),
      section("services", "La carta", "main", [row(column(5, [heading("business.type", "h2")]), column(7, [widget("list", "services", "minimal")]))], { desktop: { padding: "xl" } }),
      section("about", "La casa", "main", [row(column(12, [text("about.subtitle", { desktop: { fontSize: "sm", align: "center", color: "#7c2743", fontWeight: "bold" } }), heading("about.title", "h2", { desktop: { align: "center" } }), text("about.body", { desktop: { align: "center", width: "content", fontSize: "lg" } })]))], { desktop: { background: "#ebe7e4", padding: "xl" } }),
      section("gallery", "Piezas", "main", [row(column(12, [widget("gallery", "media", "editorial")]))]),
      section("reviews", "Clientas", "main", [row(column(12, [widget("testimonials", "reviews", "featured")]))], { desktop: { background: "#ebe7e4", padding: "lg" } }),
      section("contact", "Cita privada", "main", [row(column(5, [heading("contact.title"), text("contact.body"), widget("business_info", undefined, "stacked")]), column(7, [widget("form", undefined, "card", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("columns")],
  },
  realty: {
    version: 2, id: "realty", name: "Inmobiliaria", description: "Listado de propiedades con precio y ficha técnica, agenda de visitas y contacto directo con el agente.", thumbnail: "/templates/v2/realty.svg", theme: THEMES.realty,
    sections: [header("bar"),
      section("hero", "Propiedad destacada", "main", [row(column(7, [text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "2xl", fontWeight: "bold" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]), column(5, [image("hero.media", "framed")]))], { desktop: { padding: "xl" } }),
      section("listings", "Propiedades disponibles", "main", [row(column(12, [heading("business.type"), widget("list", "services", "catalog")]))], { desktop: { background: "#eef1f5", padding: "lg" } }),
      section("about", "La agencia", "main", [row(column(5, [image("about.media", "portrait")]), column(7, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } }), widget("list", "about.highlights", "badges")]))], { desktop: { padding: "lg" } }),
      section("proof", "Resultados", "main", [row(column(12, [widget("list", "benefits", "metrics")]))]),
      section("gallery", "Recorrido visual", "main", [row(column(12, [widget("gallery", "media", "mosaic")]))]),
      section("reviews", "Compradores y propietarios", "main", [row(column(12, [widget("testimonials", "reviews", "featured")]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("contact", "Agenda una visita", "main", [row(column(5, [widget("map", "business.location", "card")]), column(7, [widget("form", undefined, "split", { titleSlot: "contact.title", bodySlot: "contact.body", buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("columns")],
  },
  clinic: {
    version: 2, id: "clinic", name: "Clínica y consultorio", description: "Reserva de cita como recorrido central, especialidades y credenciales del equipo, con una confianza clínica serena.", thumbnail: "/templates/v2/clinic.svg", theme: THEMES.clinic,
    sections: [header("bar"),
      section("hero", "Bienvenida", "main", [row(column(7, [heading("hero.title", "h1", { desktop: { fontWeight: "bold" } }), text("hero.subtitle", { desktop: { fontSize: "lg" } }), button()]), column(5, [image("hero.media", "rounded")]))], { desktop: { background: "#eaf4f3", padding: "xl" } }),
      section("services", "Especialidades", "main", [row(column(12, [widget("list", "services", "cards")]))]),
      section("about", "Nuestro equipo", "main", [row(column(5, [image("about.media", "portrait")]), column(7, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } }), widget("list", "about.highlights", "badges")]))]),
      section("benefits", "Por qué elegirnos", "main", [row(column(12, [widget("list", "benefits", "numbered")]))], { desktop: { background: "#eaf4f3", padding: "lg" } }),
      section("faq", "Antes de tu cita", "main", [row(column(4, [heading("contact.title")]), column(8, [widget("accordion", "faqs", "cards")]))]),
      section("reviews", "Pacientes", "main", [row(column(12, [widget("testimonials", "reviews", "list")]))]),
      section("contact", "Reserva tu cita", "main", [row(column(6, [heading("contact.title"), text("contact.body"), widget("business_info", undefined, "stacked")]), column(6, [widget("form", undefined, "card", { buttonSlot: "contact.ctaText" })]))], { desktop: { background: "#eaf4f3", padding: "xl" } }), footer("minimal")],
  },
  counsel: {
    version: 2, id: "counsel", name: "Despacho legal", description: "Áreas de práctica, resultados verificables y perfiles de abogados en un recorrido de confianza corporativa.", thumbnail: "/templates/v2/counsel.svg", theme: THEMES.counsel,
    sections: [header("bordered"),
      section("hero", "Propuesta", "main", [row(column(12, [text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "2xl", fontWeight: "bold" } }), text("hero.body", { desktop: { fontSize: "lg", width: "content" } }), button()]))], { desktop: { padding: "xl", width: "wide" } }),
      section("practice", "Áreas de práctica", "main", [row(column(4, [heading("business.type")]), column(8, [widget("list", "services", "minimal")]))], { desktop: { padding: "xl" } }),
      section("proof", "Resultados verificables", "main", [row(column(12, [widget("list", "benefits", "metrics")]))], { desktop: { background: "secondary", color: "#ffffff", padding: "lg" } }),
      section("about", "El equipo", "main", [row(column(5, [image("about.media", "portrait")]), column(7, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } }), widget("list", "about.highlights", "numbered")]))]),
      section("reviews", "Clientes representados", "main", [row(column(12, [widget("testimonials", "reviews", "quotes")]))]),
      section("faq", "Preguntas frecuentes", "main", [row(column(12, [widget("accordion", "faqs", "cards")]))], { desktop: { background: "#e7ece8", padding: "lg" } }),
      section("contact", "Consulta confidencial", "main", [row(column(5, [widget("business_info", undefined, "stacked")]), column(7, [widget("form", undefined, "card", { titleSlot: "contact.title", buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("columns")],
  },
  academy: {
    version: 2, id: "academy", name: "Curso e infoproducto", description: "Currículo por módulos, perfil del instructor y resultados de alumnos para vender un curso o escuela online.", thumbnail: "/templates/v2/academy.svg", theme: THEMES.academy,
    sections: [header("floating"),
      section("hero", "Lanzamiento del curso", "main", [row(column(6, [heading("hero.title", "h1", { desktop: { fontWeight: "black" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]), column(6, [image("hero.media", "framed")]))], { desktop: { padding: "xl", width: "wide" } }),
      section("curriculum", "Qué vas a aprender", "main", [row(column(12, [heading("about.title"), widget("list", "services", "numbered")]))], { desktop: { padding: "xl" } }),
      section("instructor", "Tu instructor", "main", [row(column(5, [image("about.media", "portrait")]), column(7, [heading("about.subtitle"), text("about.body", { desktop: { fontSize: "lg" } }), widget("list", "about.highlights", "badges")]))], { desktop: { background: "#eef2ff", padding: "lg" } }),
      section("outcomes", "Resultados de los alumnos", "main", [row(column(12, [widget("list", "benefits", "metrics")]))]),
      section("reviews", "Lo que dicen los alumnos", "main", [row(column(12, [widget("testimonials", "reviews", "wall")]))], { desktop: { background: "primary", padding: "lg" } }),
      section("faq", "Preguntas frecuentes", "main", [row(column(12, [widget("accordion", "faqs", "cards")]))]),
      section("contact", "Empieza hoy", "main", [row(column(12, [heading("contact.title", "h2", { desktop: { align: "center" } }), text("contact.body", { desktop: { align: "center" } }), widget("form", undefined, "inline", { buttonSlot: "contact.ctaText" })]))], { desktop: { background: "#eef2ff", padding: "xl" } }), footer("columns")],
  },
  venue: {
    version: 2, id: "venue", name: "Salón de eventos", description: "El espacio como protagonista, capacidad y paquetes por tipo de evento, con reserva directa de fecha.", thumbnail: "/templates/v2/venue.svg", theme: THEMES.venue,
    sections: [header("overlay"),
      section("hero", "El espacio", "main", [row(column(12, [image("hero.media", "background"), text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "semibold" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]))], { desktop: { padding: "none", width: "full" } }),
      section("gallery", "Recorrido por el salón", "main", [row(column(12, [widget("gallery", "media", "editorial")]))]),
      section("packages", "Paquetes por evento", "main", [row(column(12, [heading("about.title"), widget("list", "services", "catalog")]))], { desktop: { padding: "xl" } }),
      section("about", "Capacidad y detalles", "main", [row(column(6, [heading("about.subtitle"), text("about.body", { desktop: { fontSize: "lg" } })]), column(6, [widget("list", "about.highlights", "metrics")]))], { desktop: { background: "secondary", padding: "lg" } }),
      section("reviews", "Parejas y organizadores", "main", [row(column(12, [widget("testimonials", "reviews", "quotes")]))]),
      section("contact", "Reserva tu fecha", "main", [row(column(6, [heading("contact.title"), text("contact.body"), widget("business_info", undefined, "stacked")]), column(6, [widget("form", undefined, "dark", { buttonSlot: "contact.ctaText" })]))], { desktop: { background: "secondary", padding: "xl" } }), footer("dark")],
  },
  vigor: {
    version: 2, id: "vigor", name: "Gimnasio y entrenamiento", description: "Horario de clases, entrenadores y planes de membresía con energía de alta intensidad.", thumbnail: "/templates/v2/vigor.svg", theme: THEMES.vigor,
    sections: [header("minimal"),
      section("hero", "Portada", "main", [row(column(12, [widget("video", "hero.media", "background"), text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]))], { desktop: { padding: "none", width: "full" } }),
      section("schedule", "Clases", "main", [row(column(12, [heading("business.type"), widget("list", "services", "catalog")]))], { desktop: { padding: "xl" } }),
      section("proof", "Resultados", "main", [row(column(12, [widget("list", "benefits", "metrics")]))], { desktop: { background: "secondary", color: "#ffffff", padding: "lg" } }),
      section("about", "Entrenadores", "main", [row(column(5, [image("about.media", "monochrome")]), column(7, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } }), widget("list", "about.highlights", "badges")]))]),
      section("gallery", "La comunidad", "main", [row(column(12, [widget("gallery", "media", "bento")]))]),
      section("reviews", "Miembros", "main", [row(column(12, [widget("testimonials", "reviews", "wall")]))], { desktop: { background: "secondary", color: "#ffffff", padding: "lg" } }),
      section("contact", "Únete hoy", "main", [row(column(12, [heading("contact.title", "h2", { desktop: { align: "center" } }), text("contact.body", { desktop: { align: "center" } }), widget("form", undefined, "inline", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("dark")],
  },
  drive: {
    version: 2, id: "drive", name: "Taller y concesionario", description: "Ficha técnica de servicios, galería de trabajos y cotización rápida para un taller o concesionario automotriz.", thumbnail: "/templates/v2/drive.svg", theme: THEMES.drive,
    sections: [header("bar"),
      section("hero", "Portada", "main", [row(column(7, [heading("hero.title", "h1", { desktop: { fontWeight: "bold" } }), text("hero.subtitle", { desktop: { fontSize: "lg" } }), button()]), column(5, [image("hero.media", "offset")]))], { desktop: { padding: "xl" } }),
      section("services", "Servicios y ficha técnica", "main", [row(column(12, [widget("list", "services", "catalog")]))], { desktop: { background: "#e9e9e5", padding: "lg" } }),
      section("gallery", "Trabajos recientes", "main", [row(column(12, [widget("gallery", "media", "grid")]))]),
      section("about", "El taller", "main", [row(column(6, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } })]), column(6, [widget("list", "about.highlights", "numbered")]))]),
      section("benefits", "Garantías", "main", [row(column(12, [widget("list", "benefits", "pills")]))], { desktop: { background: "#e9e9e5", padding: "lg" } }),
      section("reviews", "Clientes", "main", [row(column(12, [widget("testimonials", "reviews", "cards")]))]),
      section("contact", "Cotiza tu servicio", "main", [row(column(5, [widget("business_info", undefined, "stacked")]), column(7, [widget("form", undefined, "card", { titleSlot: "contact.title", buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("columns")],
  },
  cause: {
    version: 2, id: "cause", name: "ONG y causa social", description: "Métricas de impacto al frente, programas activos y una única acción de donar o sumarse como voluntario.", thumbnail: "/templates/v2/cause.svg", theme: THEMES.cause,
    sections: [header("bar"),
      section("hero", "La causa", "main", [row(column(7, [heading("hero.title", "h1", { desktop: { fontWeight: "bold" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]), column(5, [image("hero.media", "rounded")]))], { desktop: { padding: "xl" } }),
      section("impact", "Nuestro impacto", "main", [row(column(12, [widget("list", "benefits", "metrics")]))], { desktop: { background: "primary", color: "#ffffff", padding: "lg" } }),
      section("programs", "Programas activos", "main", [row(column(12, [heading("about.title"), widget("list", "services", "cards")]))], { desktop: { padding: "xl" } }),
      section("about", "Cómo trabajamos", "main", [row(column(5, [image("about.media", "portrait")]), column(7, [text("about.subtitle"), text("about.body", { desktop: { fontSize: "lg" } })]))]),
      section("gallery", "En el terreno", "main", [row(column(12, [widget("gallery", "media", "mosaic")]))]),
      section("reviews", "Voces de la comunidad", "main", [row(column(12, [widget("testimonials", "reviews", "quotes")]))], { desktop: { background: "#efe4db", padding: "lg" } }),
      section("contact", "Súmate", "main", [row(column(12, [heading("contact.title", "h2", { desktop: { align: "center" } }), text("contact.body", { desktop: { align: "center" } }), widget("form", undefined, "inline", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("minimal")],
  },
  frame: {
    version: 2, id: "frame", name: "Fotografía y videografía", description: "Casos de estudio a pantalla completa y paquetes por tipo de sesión, con la imagen siempre protagonista.", thumbnail: "/templates/v2/frame.svg", theme: THEMES.frame,
    sections: [header("minimal"),
      section("hero", "Portada", "main", [row(column(12, [image("hero.media", "background"), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "medium", align: "center" } }), text("hero.subtitle", { desktop: { align: "center" } }), button()]))], { desktop: { padding: "none", width: "full" } }),
      section("work", "Trabajo seleccionado", "main", [row(column(12, [widget("gallery", "media", "editorial")]))], { desktop: { padding: "xl" } }),
      section("about", "Detrás de cámara", "main", [row(column(5, [image("about.media", "monochrome")]), column(7, [heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } })]))]),
      section("packages", "Paquetes de sesión", "main", [row(column(12, [widget("list", "services", "minimal")]))], { desktop: { padding: "xl" } }),
      section("gallery", "Más trabajo", "main", [row(column(12, [widget("gallery", "media", "filmstrip")]))]),
      section("reviews", "Clientes", "main", [row(column(12, [widget("testimonials", "reviews", "quotes")]))]),
      section("contact", "Reserva tu sesión", "main", [row(column(6, [heading("contact.title"), text("contact.body")]), column(6, [widget("form", undefined, "minimal", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }), footer("minimal")],
  },
  craft: {
    version: 2, id: "craft", name: "Contratista y remodelación", description: "Antes y después de proyectos reales, área de servicio y cotización gratuita para oficios y remodelación.", thumbnail: "/templates/v2/craft.svg", theme: THEMES.craft,
    sections: [header("bar"),
      section("hero", "Portada", "main", [row(column(7, [text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "2xl", fontWeight: "bold" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]), column(5, [image("hero.media", "rounded")]))], { desktop: { background: "#e8edf3", padding: "xl" } }),
      section("services", "Servicios", "main", [row(column(12, [widget("list", "services", "cards")]))]),
      section("gallery", "Antes y después", "main", [row(column(12, [widget("gallery", "media", "mosaic")]))]),
      section("proof", "Por qué confiar en nosotros", "main", [row(column(12, [widget("list", "benefits", "numbered")]))], { desktop: { background: "#e8edf3", padding: "lg" } }),
      section("location", "Área de servicio", "main", [row(column(7, [widget("map", "business.location", "card")]), column(5, [widget("business_info", undefined, "stacked"), widget("social", "social", "buttons")]))]),
      section("reviews", "Clientes satisfechos", "main", [row(column(12, [widget("testimonials", "reviews", "list")]))]),
      section("contact", "Cotización gratuita", "main", [row(column(12, [widget("form", undefined, "split", { titleSlot: "contact.title", bodySlot: "contact.body", buttonSlot: "contact.ctaText" })]))], { desktop: { background: "#e8edf3", padding: "xl" } }), footer("local")],
  },
};

export const SECTION_LIBRARY_V2: SectionSeed[] = [
  section("library-hero-split-image-v2", "Hero normal: texto + imagen", "main", [row(column(6, [text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "bold" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]), column(6, [image("hero.media", "wide")]))], { desktop: { padding: "xl", width: "wide" } }),
  section("library-hero-background-image-v2", "Hero normal: imagen de fondo", "main", [row(column(12, [image("hero.media", "background"), text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "bold" } }), text("hero.body", { desktop: { fontSize: "lg", width: "content" } }), button()]))], { desktop: { padding: "xl", width: "full", background: "secondary" } }),
  section("library-hero-video-background-v2", "Hero normal: video de fondo", "main", [row(column(12, [widget("video", "hero.media", "background"), text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black" } }), text("hero.body", { desktop: { fontSize: "lg", width: "content" } }), button()]))], { desktop: { padding: "xl", width: "full", background: "secondary" } }),
  section("library-hero-centered-v2", "Hero normal: centrado", "main", [row(column(12, [text("hero.subtitle", { desktop: { align: "center", fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { align: "center", fontSize: "display", fontWeight: "bold" } }), text("hero.body", { desktop: { align: "center", fontSize: "lg", width: "content" } }), button()]))], { desktop: { padding: "xl", width: "wide" } }),

  section("library-about-split-v2", "Nosotros: imagen + historia", "main", [row(column(5, [image("about.media", "portrait")]), column(7, [text("about.subtitle", { desktop: { fontSize: "sm" } }), heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } }), widget("list", "about.highlights", "badges")]))], { desktop: { padding: "xl" } }),
  section("library-about-minimal-v2", "Nosotros: texto amplio", "main", [row(column(4, [text("about.subtitle", { desktop: { fontSize: "sm" } })]), column(8, [heading("about.title", "h2", { desktop: { fontSize: "2xl" } }), text("about.body", { desktop: { fontSize: "lg" } })]))], { desktop: { padding: "xl" } }),

  section("library-services-cards-v2", "Servicios: tarjetas", "main", [row(column(4, [heading("business.type"), text("about.subtitle")]), column(8, [widget("list", "services", "cards")]))], { desktop: { padding: "lg" } }),
  section("library-services-editorial-v2", "Servicios: editorial", "main", [row(column(12, [widget("list", "services", "editorial")]))], { desktop: { padding: "xl" } }),
  section("library-services-catalog-v2", "Servicios: catalogo visual", "main", [row(column(12, [widget("list", "services", "catalog")]))], { desktop: { background: "#f8fafc", padding: "xl" } }),

  section("library-benefits-metrics-v2", "Beneficios: metricas", "main", [row(column(5, [heading("about.subtitle"), text("about.body")]), column(7, [widget("list", "benefits", "metrics")]))], { desktop: { padding: "lg" } }),
  section("library-benefits-pills-v2", "Beneficios: pildoras", "main", [row(column(12, [heading("about.title"), widget("list", "benefits", "pills")]))], { desktop: { padding: "lg" } }),
  section("library-benefits-numbered-v2", "Beneficios: numerados", "main", [row(column(12, [widget("list", "benefits", "numbered")]))], { desktop: { padding: "lg" } }),

  section("library-gallery-grid-v2", "Galeria: grilla", "main", [row(column(12, [widget("gallery", "media", "grid")]))], { desktop: { padding: "xl" } }),
  section("library-gallery-mosaic-v2", "Galeria: mosaico", "main", [row(column(12, [widget("gallery", "media", "mosaic")]))], { desktop: { padding: "xl" } }),

  section("library-cta-card-v2", "CTA: tarjeta centrada", "main", [row(column(12, [heading("contact.title", "h2", { desktop: { align: "center" } }), text("contact.body", { desktop: { align: "center" } }), button("contact.ctaText", "hero.ctaLink")]))], { desktop: { background: "#f4f4f5", padding: "xl", radius: "lg" } }),
  section("library-cta-split-v2", "CTA: texto + contacto", "main", [row(column(7, [heading("contact.title"), text("contact.body")]), column(5, [widget("business_info", undefined, "stacked"), button("contact.ctaText", "hero.ctaLink")]))], { desktop: { padding: "xl" } }),

  section("library-reviews-cards-v2", "Resenas: tarjetas", "main", [row(column(12, [widget("testimonials", "reviews", "cards")]))], { desktop: { padding: "lg" } }),
  section("library-reviews-wall-v2", "Resenas: muro", "main", [row(column(12, [widget("testimonials", "reviews", "wall")]))], { desktop: { background: "secondary", padding: "xl" } }),

  section("library-faq-minimal-v2", "FAQ: minimal", "main", [row(column(4, [heading("contact.title"), text("contact.body")]), column(8, [widget("accordion", "faqs", "minimal")]))], { desktop: { padding: "xl" } }),
  section("library-faq-cards-v2", "FAQ: tarjetas", "main", [row(column(12, [widget("accordion", "faqs", "cards")]))], { desktop: { padding: "lg" } }),

  section("library-contact-split-v2", "Contacto: formulario dividido", "main", [row(column(6, [heading("contact.title"), text("contact.body"), widget("social", "social", "buttons")]), column(6, [widget("form", undefined, "split", { titleSlot: "contact.title", bodySlot: "contact.body", buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }),
  section("library-contact-map-v2", "Contacto: mapa + formulario", "main", [row(column(6, [widget("map", "business.location", "card"), widget("business_info", undefined, "compact")]), column(6, [widget("form", undefined, "card", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }),

  section("library-footer-columns-v2", "Footer: columnas", "footer", [row(column(5, [widget("brand", "business.name", "columns"), text("business.type")]), column(4, [widget("business_info", undefined, "compact")]), column(3, [widget("social", "social", "icons")]))], { desktop: { padding: "lg", width: "full" } }),
  section("library-footer-minimal-v2", "Footer: minimal", "footer", [row(column(6, [widget("brand", "business.name", "minimal")]), column(6, [widget("social", "social", "icons")]))], { desktop: { padding: "lg", width: "full" } }),
  section("library-split-hero", "Hero dividido", "main", [row(column(6, [heading("hero.title", "h1"), text("hero.body"), button()]), column(6, [image("hero.media", "offset")]))]),
  section("library-pixel-hero", "Portada animada", "main", [row(column(12, [widget("hero_pixel")]))], { desktop: { padding: "none", width: "full" } }),
  section("library-poster-hero", "Hero poster", "main", [row(column(12, [heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black", align: "center" } }), text("hero.subtitle", { desktop: { align: "center" } }), button()]))], { desktop: { background: "secondary", padding: "xl" } }),
  section("library-about-overlap", "About superpuesto", "main", [row(column(7, [image("about.media", "wide")]), column(5, [heading("about.title"), text("about.body")]))]),
  section("library-about-stats", "About con métricas", "main", [row(column(6, [heading("about.title"), text("about.body")]), column(6, [widget("list", "about.highlights", "metrics")]))]),
  section("library-services-bento", "Servicios bento", "main", [row(column(12, [widget("list", "services", "bento")]))]),
  section("library-gallery-filmstrip", "Galería horizontal", "main", [row(column(12, [widget("gallery", "media", "filmstrip")]))]),
  section("library-cta-band", "CTA en banda", "main", [row(column(8, [heading("contact.title")]), column(4, [button("contact.ctaText", "hero.ctaLink")]))], { desktop: { background: "secondary", padding: "lg" } }),
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
