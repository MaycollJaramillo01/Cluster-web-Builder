import type {
  CanvasColumnV2, CanvasRowV2, CanvasSectionV2, V2ContentSlot, V2WidgetType, WidgetV2,
} from "@/lib/site/v2-schema";

export type SectionSeedV2 = Omit<CanvasSectionV2, "id">;
let seedIndex = 0;
const seedId = (kind: string) => `section-${kind}-${++seedIndex}`;
const widget = (type: V2WidgetType, slot?: V2ContentSlot, variant?: string, data?: Record<string, unknown>, style?: WidgetV2["style"]): WidgetV2 => ({ id: seedId("widget"), type, ...(slot ? { slot } : {}), ...(variant ? { variant } : {}), ...(data ? { data } : {}), ...(style ? { style } : {}) });
const column = (desktop: CanvasColumnV2["span"]["desktop"], widgets: WidgetV2[], tablet: CanvasColumnV2["span"]["tablet"] = desktop > 6 ? 12 : desktop as CanvasColumnV2["span"]["tablet"]): CanvasColumnV2 => ({ id: seedId("column"), span: { desktop, tablet, mobile: 12 }, widgets });
const row = (...columns: CanvasColumnV2[]): CanvasRowV2 => ({ id: seedId("row"), columns });
const section = (key: string, name: string, region: CanvasSectionV2["region"], rows: CanvasRowV2[], style?: CanvasSectionV2["style"]): SectionSeedV2 => ({ schemaVersion: 2, key, name, region, rows, ...(style ? { style } : {}) });

const heading = (slot: V2ContentSlot, level: "h1" | "h2" | "h3" = "h2", style?: WidgetV2["style"]) => widget("heading", slot, level, undefined, style);
const text = (slot: V2ContentSlot, style?: WidgetV2["style"]) => widget("text", slot, undefined, undefined, style);
const labelHeading = (value: string, level: "h1" | "h2" | "h3" = "h2") => widget("heading", undefined, level, { text: value });
const labelText = (value: string) => widget("text", undefined, undefined, { text: value });
const button = (label: V2ContentSlot = "hero.ctaText", link: V2ContentSlot = "hero.ctaLink") => widget("button", label, "solid", { linkSlot: link });
const image = (slot: V2ContentSlot, variant = "cover") => widget("image", slot, variant);

export const SECTION_LIBRARY_V2: SectionSeedV2[] = [
  section("library-hero-split-image-v2", "Hero normal: texto + imagen", "main", [row(column(6, [text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "bold" } }), text("hero.body", { desktop: { fontSize: "lg" } }), button()]), column(6, [image("hero.media", "wide")]))], { desktop: { padding: "xl", width: "wide" } }),
  section("library-hero-background-image-v2", "Hero normal: imagen de fondo", "main", [row(column(12, [image("hero.media", "background"), text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "bold" } }), text("hero.body", { desktop: { fontSize: "lg", width: "content" } }), button()]))], { desktop: { padding: "xl", width: "full", background: "secondary" } }),
  section("library-hero-video-background-v2", "Hero normal: video de fondo", "main", [row(column(12, [widget("video", "hero.media", "background"), text("hero.subtitle", { desktop: { fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black" } }), text("hero.body", { desktop: { fontSize: "lg", width: "content" } }), button()]))], { desktop: { padding: "xl", width: "full", background: "secondary" } }),
  section("library-hero-centered-v2", "Hero normal: centrado", "main", [row(column(12, [text("hero.subtitle", { desktop: { align: "center", fontSize: "sm" } }), heading("hero.title", "h1", { desktop: { align: "center", fontSize: "display", fontWeight: "bold" } }), text("hero.body", { desktop: { align: "center", fontSize: "lg", width: "content" } }), button()]))], { desktop: { padding: "xl", width: "wide" } }),
  // Portada a sangre completa sobre la galería del negocio: cada imagen es una
  // diapositiva y el teléfono viaja dentro del hero, porque en una emergencia
  // el visitante no debe buscar el canal de contacto en otra sección. Todos los
  // elementos son widgets sueltos: el editor los selecciona uno por uno.
  section("library-hero-emergency-v2", "Portada: respuesta de emergencia", "main", [row(column(12, [
    widget("gallery", "media", "hero-backdrop"),
    text("hero.subtitle", { desktop: { fontSize: "sm" } }),
    heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black" } }),
    text("hero.body", { desktop: { fontSize: "lg" } }),
    text("business.type", { desktop: { fontSize: "sm" } }),
    button(),
    widget("button", undefined, "outline", { text: "Ver trabajos", link: "#gallery" }),
    widget("divider"),
    widget("business_info", undefined, "hotline"),
  ]))], { desktop: { padding: "none", width: "full", background: "secondary" } }),

  // Titular monumental sobre foto a sangre completa, con el mapa de la zona
  // real del negocio a la derecha. El mapa no es un adorno: consulta en vivo
  // la ubicación que escribió el cliente, así que cambia con cada sitio.
  section("library-hero-atlas-v2", "Portada: titular monumental con mapa en vivo", "main", [row(column(12, [
    image("hero.media", "background"),
    text("hero.subtitle", { desktop: { fontSize: "sm" } }),
    heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black" } }),
    widget("map", "business.location", "atlas"),
    text("hero.body"),
    widget("business_info", undefined, "hotline"),
    button(),
  ]))], { desktop: { padding: "none", background: "secondary" } }),

  // La portada no enseña la transformación: la portada ES la transformación.
  // El comparador ocupa la pantalla completa y el texto va encima.
  section("library-hero-transform-v2", "Portada: transformación a pantalla completa", "main", [row(column(12, [
    widget("gallery", "media", "before-after-hero"),
    text("hero.subtitle", { desktop: { fontSize: "sm" } }),
    heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "bold" } }),
    text("hero.body", { desktop: { fontSize: "lg" } }),
    button(),
    widget("business_info", undefined, "hotline"),
  ]))], { desktop: { padding: "none", background: "secondary" } }),

  section("library-about-split-v2", "Nosotros: imagen + historia", "main", [row(column(5, [image("about.media", "portrait")]), column(7, [text("about.subtitle", { desktop: { fontSize: "sm" } }), heading("about.title"), text("about.body", { desktop: { fontSize: "lg" } }), widget("list", "about.highlights", "badges")]))], { desktop: { padding: "xl" } }),
  // Nosotros con evidencia: par de fotos superpuestas a la izquierda y, a la
  // derecha, el relato, los compromisos verificables y la vía de contacto.
  section("library-about-showcase-v2", "Nosotros: fotos y compromisos", "main", [row(
    column(6, [widget("gallery", "media", "about-stack")]),
    column(6, [
      text("about.subtitle", { desktop: { fontSize: "sm" } }),
      heading("about.title"),
      text("about.body"),
      widget("list", "about.highlights", "checks"),
      button("contact.ctaText", "hero.ctaLink"),
      widget("business_info", undefined, "inline"),
    ]),
  )], { desktop: { padding: "xl" } }),
  section("library-about-minimal-v2", "Nosotros: texto amplio", "main", [row(column(4, [text("about.subtitle", { desktop: { fontSize: "sm" } })]), column(8, [heading("about.title", "h2", { desktop: { fontSize: "2xl" } }), text("about.body", { desktop: { fontSize: "lg" } })]))], { desktop: { padding: "xl" } }),

  section("library-services-cards-v2", "Servicios: tarjetas", "main", [row(column(4, [heading("business.type"), text("about.subtitle")]), column(8, [widget("list", "services", "cards")]))], { desktop: { padding: "lg" } }),
  section("library-services-editorial-v2", "Servicios: editorial", "main", [row(column(12, [widget("list", "services", "editorial")]))], { desktop: { padding: "xl" } }),
  section("library-services-catalog-v2", "Servicios: catalogo visual", "main", [row(column(12, [widget("list", "services", "catalog")]))], { desktop: { background: "#f8fafc", padding: "xl" } }),

  section("library-benefits-metrics-v2", "Beneficios: metricas", "main", [row(column(4, [labelHeading("Cómo trabajamos"), labelText("Un proceso claro, medible y explicado desde el inicio.")]), column(8, [widget("list", "benefits", "metrics")]))], { desktop: { padding: "lg" } }),
  section("library-benefits-pills-v2", "Beneficios: pildoras", "main", [row(column(12, [heading("about.title"), widget("list", "benefits", "pills")]))], { desktop: { padding: "lg" } }),
  section("library-benefits-numbered-v2", "Beneficios: numerados", "main", [row(column(12, [widget("list", "benefits", "numbered")]))], { desktop: { padding: "lg" } }),
  // Los pasos sueltos no dicen nada: necesitan quien los presente.
  section("library-process-steps-v2", "Proceso: pasos con encabezado", "main", [row(
    column(4, [labelHeading("Cómo trabajamos"), labelText("Cuatro pasos, en el mismo orden, en cada trabajo.")]),
    column(8, [widget("list", "benefits", "numbered")]),
  )], { desktop: { padding: "xl" } }),
  section("library-availability-grid-v2", "Disponibilidad: cobertura y tiempos de respuesta", "main", [row(column(4, [labelHeading("Disponibilidad y respuesta"), labelText("Cobertura, tiempo de llegada y quién responde cuando llamas.")]), column(8, [widget("list", "benefits", "metrics")]))], { desktop: { padding: "lg" } }),

  section("library-gallery-grid-v2", "Galeria: grilla", "main", [row(column(12, [widget("gallery", "media", "grid")]))], { desktop: { padding: "xl" } }),
  section("library-gallery-mosaic-v2", "Galeria: mosaico", "main", [row(column(12, [widget("gallery", "media", "mosaic")]))], { desktop: { padding: "xl" } }),
  // La prueba es la transformación: el visitante arrastra y ve el mismo lugar
  // antes y después, en vez de creer en una foto suelta.
  section("library-gallery-before-after-v2", "Galería: antes y después", "main", [row(
    column(4, [labelHeading("Transformaciones reales"), labelText("Arrastra para ver el mismo lugar antes y después del trabajo.")]),
    column(8, [widget("gallery", "media", "before-after")]),
  )], { desktop: { padding: "xl" } }),
  section("library-gallery-projects-v2", "Galería: proyectos documentados", "main", [row(column(4, [labelHeading("Trabajo reciente"), labelText("Proyectos reales para evaluar terminación, orden y alcance.")]), column(8, [widget("gallery", "media", "mosaic")]))], { desktop: { padding: "xl" } }),

  section("library-cta-card-v2", "CTA: tarjeta centrada", "main", [row(column(12, [heading("contact.title", "h2", { desktop: { align: "center" } }), text("contact.body", { desktop: { align: "center" } }), button("contact.ctaText", "hero.ctaLink")]))], { desktop: { background: "#f4f4f5", padding: "xl", radius: "lg" } }),
  section("library-cta-split-v2", "CTA: texto + contacto", "main", [row(column(7, [heading("contact.title"), text("contact.body")]), column(5, [widget("business_info", undefined, "stacked"), button("contact.ctaText", "hero.ctaLink")]))], { desktop: { padding: "xl" } }),
  // Cierre con mapa en lugar de repetir el titular del formulario: el visitante
  // comprueba que trabajas en su zona antes de escribir.
  section("library-service-area-v2", "Cobertura: zona de trabajo con mapa", "main", [row(
    column(5, [labelHeading("Dónde trabajamos"), labelText("Atendemos esta zona y sus alrededores. Si tu dirección queda cerca del límite, pregúntanos."), widget("business_info", undefined, "stacked"), button("hero.ctaText", "hero.ctaLink")]),
    column(7, [widget("map", "business.location", "card")]),
  )], { desktop: { padding: "xl" } }),
  // Fondo "accent" en vez de un color fijo: la banda de alerta sigue la paleta
  // del cliente y el renderer resuelve el color de texto legible por contraste.
  section("library-emergency-band-v2", "Emergencia: banda de respuesta inmediata", "main", [row(column(7, [labelText("Emergencia activa"), heading("contact.title"), text("contact.body")]), column(5, [widget("business_info", undefined, "hotline"), button("contact.ctaText", "hero.ctaLink")]))], { desktop: { background: "accent", padding: "lg", width: "wide" } }),

  section("library-reviews-cards-v2", "Resenas: tarjetas", "main", [row(column(12, [widget("testimonials", "reviews", "cards")]))], { desktop: { padding: "lg" } }),
  section("library-reviews-wall-v2", "Resenas: muro", "main", [row(column(12, [widget("testimonials", "reviews", "wall")]))], { desktop: { background: "secondary", padding: "xl" } }),
  section("library-reviews-trust-v2", "Reseñas: prueba de confianza", "main", [row(column(4, [labelHeading("Clientes que ya dieron el paso"), labelText("Experiencias concretas sobre comunicación, orden y resultado final.")]), column(8, [widget("testimonials", "reviews", "cards")]))], { desktop: { padding: "xl" } }),

  section("library-faq-minimal-v2", "FAQ: minimal", "main", [row(column(4, [labelHeading("Preguntas frecuentes"), labelText("Lo esencial antes de dar el siguiente paso.")]), column(8, [widget("accordion", "faqs", "minimal")]))], { desktop: { padding: "xl" } }),
  section("library-faq-cards-v2", "FAQ: tarjetas", "main", [row(column(12, [widget("accordion", "faqs", "cards")]))], { desktop: { padding: "lg" } }),
  section("library-insurance-faq-v2", "Seguros: preguntas del reclamo", "main", [row(column(4, [labelHeading("Seguros y reclamos"), labelText("Cómo documentamos el daño y qué esperar de tu aseguradora.")]), column(8, [widget("accordion", "faqs", "minimal")]))], { desktop: { padding: "xl" } }),

  section("library-contact-split-v2", "Contacto: formulario dividido", "main", [row(column(6, [heading("contact.title"), text("contact.body"), widget("social", "social", "buttons")]), column(6, [widget("form", undefined, "split", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }),
  section("library-contact-map-v2", "Contacto: mapa + formulario", "main", [row(column(6, [widget("map", "business.location", "card"), widget("business_info", undefined, "compact")]), column(6, [widget("form", undefined, "card", { buttonSlot: "contact.ctaText" })]))], { desktop: { padding: "xl" } }),

  section("library-footer-columns-v2", "Footer: columnas", "footer", [row(column(5, [widget("brand", "business.name", "columns"), text("business.type")]), column(4, [widget("business_info", undefined, "compact")]), column(3, [widget("social", "social", "icons")]))], { desktop: { padding: "lg", width: "full" } }),
  section("library-footer-minimal-v2", "Footer: minimal", "footer", [row(column(6, [widget("brand", "business.name", "minimal")]), column(6, [widget("social", "social", "icons")]))], { desktop: { padding: "lg", width: "full" } }),
  section("library-split-hero", "Hero dividido", "main", [row(column(6, [heading("hero.title", "h1"), text("hero.body"), button()]), column(6, [image("hero.media", "offset")]))]),
  section("library-pixel-hero", "Portada animada", "main", [row(column(12, [widget("hero_pixel")]))], { desktop: { padding: "none", width: "full" } }),
  section("library-poster-hero", "Hero poster", "main", [row(column(12, [heading("hero.title", "h1", { desktop: { fontSize: "display", fontWeight: "black", align: "center" } }), text("hero.subtitle", { desktop: { align: "center" } }), button()]))], { desktop: { background: "secondary", padding: "xl" } }),
  section("library-about-overlap", "About superpuesto", "main", [row(column(7, [image("about.media", "wide")]), column(5, [heading("about.title"), text("about.body")]))]),
  section("library-about-stats", "About con mÃ©tricas", "main", [row(column(6, [heading("about.title"), text("about.body")]), column(6, [widget("list", "about.highlights", "metrics")]))]),
  section("library-services-bento", "Servicios bento", "main", [row(column(12, [widget("list", "services", "bento")]))]),
  section("library-gallery-filmstrip", "GalerÃ­a horizontal", "main", [row(column(12, [widget("gallery", "media", "filmstrip")]))]),
  section("library-cta-band", "CTA en banda", "main", [row(column(8, [heading("contact.title")]), column(4, [button("contact.ctaText", "hero.ctaLink")]))], { desktop: { background: "secondary", padding: "lg" } }),
  section("library-reviews-quotes", "Testimonios editoriales", "main", [row(column(12, [widget("testimonials", "reviews", "quotes")]))]),
  section("library-contact-card", "Contacto en tarjeta", "main", [row(column(5, [widget("business_info", undefined, "stacked")]), column(7, [widget("form", undefined, "card", { buttonSlot: "contact.ctaText" })]))]),
];
