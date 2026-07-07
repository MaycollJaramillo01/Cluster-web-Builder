import assert from "node:assert/strict";
import test from "node:test";

import { renderSiteV2 } from "../lib/site/v2-render";
import { dnsRecordsForDomain } from "../lib/site/domain-dns";
import { publishedSiteMetadata, publishedSiteStructuredData } from "../lib/site/metadata";
import { parseV2Clipboard } from "../lib/site/v2-clipboard";
import { getAllTemplatesV2, instantiateTemplateV2, LEGACY_TEMPLATE_MIGRATION, SECTION_LIBRARY_V2 } from "../lib/site/v2-templates";
import { normalizeCanvasSectionsV2, normalizeSiteContentV2, normalizeWidgetV2, V2_TEMPLATE_IDS, V2_WIDGET_TYPES } from "../lib/site/v2-schema";

const content = normalizeSiteContentV2({
  business: { name: "Taller Norte", type: "Arquitectura", location: "Managua", phone: "+505 8000 0000", email: "hola@example.com" },
  hero: { title: "Espacios pensados para vivir mejor", subtitle: "Arquitectura local", body: "Diseñamos hogares y comercios que responden al clima, al lugar y a la vida diaria.", ctaText: "Ver proyectos", ctaLink: "#contact", media: "https://images.example.com/hero.webp" },
  about: { title: "Un estudio cercano", subtitle: "Sobre nosotros", body: "Trabajamos cada proyecto con atención directa.", media: "", highlights: [] },
  services: [{ title: "Diseño residencial", description: "Anteproyecto y planos", meta: "", image: "" }],
  contact: { title: "Hablemos", body: "Cuéntanos qué quieres construir.", ctaText: "Enviar" },
  seo: { title: "Taller Norte Arquitectura en Managua", description: "Diseño arquitectónico residencial y comercial en Managua.", keyword: "arquitectura" },
});

test("las plantillas V2 tienen fingerprints estructurales distintos", () => {
  const templates = getAllTemplatesV2();
  assert.deepEqual(templates.map((template) => template.id), [...V2_TEMPLATE_IDS]);
  const fingerprints = templates.map((template) => template.sections.map((section) => section.rows.map((row) => row.columns.map((column) => `${column.span.desktop}:${column.widgets.map((widget) => widget.type).join(",")}`).join("|"))).join("/"));
  assert.equal(new Set(fingerprints).size, V2_TEMPLATE_IDS.length);
});

test("la plantilla Esencial conserva el lenguaje minimal y un recorrido comercial completo", () => {
  const template = getAllTemplatesV2().find((item) => item.id === "essential");
  assert.ok(template);
  assert.equal(template.theme.radius, "none");
  assert.equal(template.theme.accent, "#2457ff");
  assert.deepEqual(template.sections.map((section) => section.key), ["global-header", "hero", "principles", "services", "about", "reviews", "faq", "contact", "global-footer"]);
  const reviewWidget = template.sections.find((section) => section.key === "reviews")?.rows[0]?.columns[1]?.widgets[0];
  assert.equal(reviewWidget?.type, "testimonials");
  assert.equal(reviewWidget?.variant, "quotes");
  const document = instantiateTemplateV2("essential", content);
  const rendered = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads" });
  assert.match(rendered.body, /data-cluster-form/);
  assert.doesNotMatch(rendered.body, /linear-gradient/);
});

test("las cuatro plantillas aleatorias tienen recorridos, paletas y formas independientes", () => {
  const ids = ["assurance", "nordic", "metro", "deco"] as const;
  const templates = ids.map((id) => getAllTemplatesV2().find((template) => template.id === id));
  assert.ok(templates.every(Boolean));
  assert.equal(new Set(templates.map((template) => template?.theme.accent)).size, ids.length);
  assert.equal(new Set(templates.map((template) => template?.theme.radius)).size, 3);
  assert.equal(new Set(templates.map((template) => template?.sections.map((section) => section.key).join(">"))).size, ids.length);
  const heroMediaTypes = templates.map((template) => {
    const widgets = template?.sections.find((section) => section.key === "hero")?.rows[0]?.columns[0]?.widgets || [];
    assert.equal(widgets[0]?.variant, "background", `${template?.id} no usa medio de fondo`);
    assert.ok(widgets.some((widget) => widget.type === "heading" && widget.variant === "h1"), `${template?.id} no tiene título principal`);
    assert.ok(widgets.some((widget) => widget.type === "text"), `${template?.id} no tiene texto de apoyo`);
    assert.ok(widgets.some((widget) => widget.type === "button"), `${template?.id} no tiene CTA`);
    return widgets[0]?.type;
  });
  assert.deepEqual(heroMediaTypes, ["image", "image", "video", "video"]);
  for (const id of ids) {
    const document = instantiateTemplateV2(id, content);
    const rendered = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads" });
    assert.match(rendered.body, /data-cluster-form/, `${id} no incluye un formulario funcional`);
    assert.ok(document.sections[0].region === "header" && document.sections.at(-1)?.region === "footer", `${id} no forma una página completa`);
  }
  const imageFallback = instantiateTemplateV2("metro", content);
  const fallbackRender = renderSiteV2({ content: imageFallback.content, design: imageFallback.template.theme, sections: imageFallback.sections, leadEndpoint: "/api/leads" });
  assert.match(fallbackRender.body, /v2-media-background/);
  const videoContent = { ...content, hero: { ...content.hero, media: "https://cdn.example.com/hero.mp4" } };
  const videoDocument = instantiateTemplateV2("metro", videoContent);
  const videoRender = renderSiteV2({ content: videoDocument.content, design: videoDocument.template.theme, sections: videoDocument.sections, leadEndpoint: "/api/leads" });
  assert.match(videoRender.body, /<video[^>]+autoplay muted loop playsinline/);
  assert.doesNotMatch(videoRender.body, /<video[^>]+controls/);
});

test("Servicio premium replica el recorrido completo de un negocio local", () => {
  const template = getAllTemplatesV2().find((item) => item.id === "hvac-premium");
  assert.ok(template);
  assert.equal(template.theme.accent, "#3b82f6");
  assert.deepEqual(template.sections.map((section) => section.key), [
    "global-header", "hero", "hvac-stats", "services", "about", "reviews",
    "hvac-financing", "hvac-service-areas", "gallery", "hvac-process", "faq", "contact", "global-footer",
  ]);
  const document = instantiateTemplateV2("hvac-premium", {
    ...content,
    benefits: [
      { title: "Atención el mismo día", description: "Respuesta rápida." },
      { title: "Licencia y seguro", description: "Trabajo responsable." },
      { title: "Financiamiento", description: "Opciones flexibles." },
    ],
    about: { ...content.about, highlights: [
      { title: "5000+", description: "Proyectos completados" },
      { title: "15+", description: "Años de experiencia" },
      { title: "4.9", description: "Calificación" },
      { title: "24/7", description: "Disponibilidad" },
    ] },
    reviews: [
      { name: "Michael R", role: "Homeowner", quote: "Fast response, fair pricing, and excellent workmanship.", rating: 5, source: "Google" },
      { name: "David M", role: "Homeowner", quote: "The whole service process was smooth and professional.", rating: 5, source: "Google" },
      { name: "Jason T", role: "Homeowner", quote: "They explained every step and completed the work on time.", rating: 5, source: "Google" },
    ],
  });
  const rendered = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads" });
  assert.match(rendered.body, /v2-brand-hvac/);
  assert.match(rendered.body, /v2-list-hvac-services/);
  assert.match(rendered.body, /v2-testimonials-hvac-wall/);
  assert.match(rendered.css, /HVAC Premium: faithful service-business composition/);
  assert.match(rendered.css, /\.v2-key-hvac-service-areas/);
  assert.doesNotMatch(rendered.body, /Made in Framer/);
});

test("cambiar plantilla conserva contenido y secciones personalizadas", () => {
  const custom = instantiateTemplateV2("minimal", content).sections[1];
  custom.id = "custom-section";
  custom.rows[0].columns[0].widgets = [{ id: "custom-widget", type: "text", data: { text: "Contenido local" } }];
  const next = instantiateTemplateV2("catalog", content, [custom]);
  assert.equal(next.content.hero.title, content.hero.title);
  assert.ok(next.sections.some((section) => section.rows.some((row) => row.columns.some((column) => column.widgets.some((widget) => widget.id === "custom-widget")))));
});

test("normalización rechaza widgets libres y IDs duplicados", () => {
  const valid = instantiateTemplateV2("conversion", content).sections;
  assert.equal(normalizeCanvasSectionsV2(valid).length, valid.length);
  const invalid = structuredClone(valid) as unknown as Array<Record<string, unknown>>;
  const rows = invalid[0].rows as Array<{ columns: Array<{ widgets: Array<Record<string, unknown>> }> }>;
  rows[0].columns[0].widgets[0].type = "html";
  assert.equal(normalizeCanvasSectionsV2(invalid).length, valid.length - 1);
  assert.ok(!V2_WIDGET_TYPES.includes("html" as never));
});

test("renderer único incluye responsive, formulario y sanitiza javascript", () => {
  const document = instantiateTemplateV2("local", { ...content, hero: { ...content.hero, ctaLink: "javascript:alert(1)" } });
  const rendered = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads" });
  assert.match(rendered.html, /@media\(max-width:1024px\)/);
  assert.match(rendered.html, /data-cluster-form/);
  assert.match(rendered.html, /\/api\/leads/);
  assert.doesNotMatch(rendered.html, /javascript:alert/);
  assert.match(rendered.body, /v2-nav-toggle/);
  assert.match(rendered.script, /v2-nav-open/);
});

test("los 46 presets V1 tienen destino y la biblioteca no repite keys", () => {
  assert.equal(Object.keys(LEGACY_TEMPLATE_MIGRATION).length, 46);
  assert.equal(new Set(SECTION_LIBRARY_V2.map((section) => section.key)).size, SECTION_LIBRARY_V2.length);
  for (const result of Object.values(LEGACY_TEMPLATE_MIGRATION)) assert.ok(V2_TEMPLATE_IDS.includes(result.template));
});

test("el portapapeles V2 valida el widget antes de pegar", () => {
  const widget = { id: "copied", type: "button", variant: "outline", data: { text: "Cotizar" }, style: { desktop: { align: "center", padding: "md" } } };
  assert.deepEqual(parseV2Clipboard({ mode: "widget", widget })?.widget, widget);
  assert.equal(parseV2Clipboard({ mode: "widget", widget: { ...widget, type: "script" } }), null);
  assert.equal(parseV2Clipboard({ mode: "unknown", widget }), null);
  assert.equal(normalizeWidgetV2({ ...widget, id: "" }), null);
});

test("el modo editable solo se inyecta en el preview del editor", () => {
  const document = instantiateTemplateV2("conversion", content);
  const publicRender = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads" });
  const editorRender = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads", editable: true });
  assert.doesNotMatch(publicRender.html, /data-editable-text|cluster-canvas|contenteditable/);
  assert.match(editorRender.html, /data-editable-text="1"/);
  assert.match(editorRender.script, /kind:'edit-text'/);
  assert.match(editorRender.script, /innerText/);
});

test("los fondos de sección por token siguen la paleta del cliente", () => {
  const document = instantiateTemplateV2("impact", content);
  const withToken = document.sections.find((section) => section.style?.desktop?.background === "secondary");
  assert.ok(withToken, "impact debería usar el token secondary en alguna banda");
  const normalized = normalizeCanvasSectionsV2(document.sections);
  assert.ok(normalized.some((section) => section.style?.desktop?.background === "secondary"));
  const rendered = renderSiteV2({ content: document.content, design: { ...document.template.theme, secondary: "#332244" }, sections: normalized, leadEndpoint: "/api/leads" });
  assert.match(rendered.css, /--secondary:#332244/);
  assert.match(rendered.css, /background:var\(--secondary\)/);
  assert.match(rendered.css, /color:var\(--on-secondary\)/);
  assert.doesNotMatch(rendered.css, /background:secondary/);
});

test("el fondo de imagen se valida y genera CSS seguro", () => {
  const document = instantiateTemplateV2("minimal", content);
  document.sections[1].style = { desktop: { background: "#112233", backgroundImage: "https://images.example.com/fondo.webp", padding: "xl", width: "wide" } };
  const normalized = normalizeCanvasSectionsV2(document.sections);
  assert.equal(normalized[1].style?.desktop?.backgroundImage, "https://images.example.com/fondo.webp");
  const rendered = renderSiteV2({ content: document.content, design: document.template.theme, sections: normalized, leadEndpoint: "/api/leads" });
  assert.match(rendered.css, /background-image:url\("https:\/\/images\.example\.com\/fondo\.webp"\)/);

  document.sections[1].style = { desktop: { backgroundImage: "javascript:alert(1)" } };
  const unsafe = normalizeCanvasSectionsV2(document.sections);
  assert.equal(unsafe[1].style?.desktop?.backgroundImage, "");
  assert.doesNotMatch(renderSiteV2({ content: document.content, design: document.template.theme, sections: unsafe, leadEndpoint: "/api/leads" }).css, /javascript:/);
});

test("la portada animada renderiza canvas, sanitiza enlaces y solo inyecta su script cuando existe", () => {
  const document = instantiateTemplateV2("conversion", content);
  const plain = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads" });
  assert.doesNotMatch(plain.script, /data-pixel-hero/);
  document.sections.push({
    schemaVersion: 2, id: "pxh-section", key: "hero-animado", name: "Portada animada", region: "main", order: document.sections.length,
    rows: [{ id: "pxh-row", columns: [{ id: "pxh-col", span: { desktop: 12, tablet: 12, mobile: 12 }, widgets: [{
      id: "pxh-widget", type: "hero_pixel",
      data: { secondaryText: "Ver más", secondaryLink: "javascript:alert(1)", marqueeItems: ["Acme", "Norte & Co", "  ", ""] },
    }] }] }],
  });
  const sections = normalizeCanvasSectionsV2(document.sections);
  assert.equal(sections.length, document.sections.length);
  const rendered = renderSiteV2({ content: document.content, design: document.template.theme, sections, leadEndpoint: "/api/leads" });
  assert.match(rendered.body, /data-pixel-hero/);
  assert.match(rendered.body, /<em>Espacios<\/em>/);
  assert.match(rendered.body, /Norte &amp; Co/);
  assert.doesNotMatch(rendered.body, /javascript:alert/);
  assert.match(rendered.script, /requestAnimationFrame/);
  assert.match(rendered.css, /v2-pxh-marquee/);
});

test("el sitio publicado emite SEO social, canonical, favicon y JSON-LD", () => {
  const document = instantiateTemplateV2("local", {
    ...content,
    business: { ...content.business, logo: "https://cdn.example.com/logo.webp" },
    hero: { ...content.hero, media: "https://cdn.example.com/cover.webp" },
  });
  const rendered = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads", publicUrl: "https://tallernorte.com", indexable: true });
  assert.match(rendered.head, /name="robots" content="index,follow"/);
  assert.match(rendered.head, /rel="canonical" href="https:\/\/tallernorte\.com\/"/);
  assert.match(rendered.head, /property="og:image" content="https:\/\/cdn\.example\.com\/cover\.webp"/);
  assert.match(rendered.head, /name="twitter:card" content="summary_large_image"/);
  assert.match(rendered.head, /rel="icon" href="https:\/\/cdn\.example\.com\/logo\.webp"/);
  assert.match(rendered.body, /"@type":"LocalBusiness"/);
  assert.match(rendered.body, /"streetAddress":"Managua"/);
});

test("el preview no se indexa y las secciones vacías colapsan fuera del editor", () => {
  const empty = normalizeSiteContentV2({ ...content, services: [], benefits: [], reviews: [], faqs: [], media: [] });
  const document = instantiateTemplateV2("catalog", empty);
  const published = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads" });
  const editor = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads", editable: true });
  assert.match(published.head, /noindex,nofollow/);
  assert.doesNotMatch(published.body, /id="catalog"/);
  assert.match(editor.body, /id="catalog"/);
  assert.match(editor.body, /Agrega elementos a esta lista/);
});

test("el renderer elige texto oscuro para CTA con acento claro", () => {
  const document = instantiateTemplateV2("local", content);
  const rendered = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads" });
  assert.match(rendered.css, /--button-text:#111827/);
  assert.match(rendered.css, /min-height:100dvh/);
  assert.match(rendered.css, /margin-top:auto/);
});

test("la metadata publicada usa la misma fuente SEO y estructura LocalBusiness", () => {
  const source = { builderVersion: 2, businessName: "Taller Norte", businessType: "Arquitectura", location: "Managua", phone: "+505 8000 0000", contentJson: content };
  const metadata = publishedSiteMetadata(source, "https://tallernorte.com");
  assert.equal(metadata.alternates?.canonical, "https://tallernorte.com");
  assert.equal(metadata.robots && typeof metadata.robots === "object" && "index" in metadata.robots ? metadata.robots.index : false, true);
  assert.equal(publishedSiteStructuredData(source, "https://tallernorte.com")["@type"], "LocalBusiness");
});

test("las instrucciones DNS conservan retos de Vercel y agregan el registro de enrutamiento", () => {
  const apex = dnsRecordsForDomain("negocio.com", [{ type: "TXT", domain: "_vercel", value: "vc-domain-verify=abc" }]);
  assert.deepEqual(apex.map((record) => record.type), ["TXT", "A"]);
  assert.equal(apex[1].value, "76.76.21.21");
  const www = dnsRecordsForDomain("www.negocio.com", []);
  assert.deepEqual(www, [{ type: "CNAME", name: "www", value: "cname.vercel-dns-0.com" }]);
});
