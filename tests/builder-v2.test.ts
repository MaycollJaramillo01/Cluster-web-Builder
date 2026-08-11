import assert from "node:assert/strict";
import test from "node:test";

import { dnsRecordsForDomain } from "../lib/site/domain-dns";
import { publishedSiteMetadata, publishedSiteStructuredData } from "../lib/site/metadata";
import { composeSiteSectionsV2 } from "../lib/site/section-composer";
import { parseV2Clipboard } from "../lib/site/v2-clipboard";
import { renderSiteV2 } from "../lib/site/v2-render";
import { SECTION_LIBRARY_V2 } from "../lib/site/v2-section-library";
import { auditSiteDocumentV2, normalizeCanvasSectionsV2, normalizeSiteContentV2, normalizeWidgetV2, V2_WIDGET_TYPES } from "../lib/site/v2-schema";

const content = normalizeSiteContentV2({
  business: { name: "Taller Norte", type: "Arquitectura", location: "Managua", phone: "+505 8000 0000", email: "hola@example.com" },
  hero: { title: "Espacios pensados para vivir mejor", subtitle: "Arquitectura local", body: "Diseñamos hogares y comercios que responden al clima, al lugar y a la vida diaria.", ctaText: "Ver proyectos", ctaLink: "#contact", media: "https://images.example.com/hero.webp" },
  about: { title: "Un estudio cercano", subtitle: "Sobre nosotros", body: "Trabajamos cada proyecto con atención directa.", media: "", highlights: [] },
  services: [{ title: "Diseño residencial", description: "Anteproyecto y planos", meta: "", image: "" }],
  benefits: [{ title: "Diseño responsable", description: "Soluciones adecuadas al clima." }],
  reviews: [{ name: "Ana", role: "Cliente", quote: "El proceso fue claro.", rating: 5 }],
  faqs: [{ question: "¿Trabajan fuera de Managua?", answer: "Sí, según el alcance del proyecto." }],
  contact: { title: "Hablemos", body: "Cuéntanos qué quieres construir.", ctaText: "Enviar" },
  media: [{ url: "https://images.example.com/hero.webp", alt: "Proyecto" }, { url: "https://images.example.com/gallery.webp", alt: "Interior" }],
  seo: { title: "Taller Norte Arquitectura en Managua", description: "Diseño arquitectónico residencial y comercial en Managua.", keyword: "arquitectura" },
});

function buildDocument(value = content) {
  return composeSiteSectionsV2({
    content: value,
    businessType: value.business.type,
    visualStyle: "modern_clean",
    theme: { primary: "#2457ff", secondary: "#111827", accent: "#f59e0b" },
  });
}

test("la biblioteca contiene bloques independientes con claves únicas", () => {
  assert.ok(SECTION_LIBRARY_V2.length > 0);
  assert.equal(new Set(SECTION_LIBRARY_V2.map((section) => section.key)).size, SECTION_LIBRARY_V2.length);
  assert.ok(SECTION_LIBRARY_V2.every((section) => section.region !== "header"));
});

test("el compositor crea un documento editable completo sin catálogo de plantillas", () => {
  const document = buildDocument();
  assert.equal(document.sections[0].region, "header");
  assert.equal(document.sections.at(-1)?.region, "footer");
  assert.ok(document.sections.some((section) => section.key.includes("contact")));
  const rendered = renderSiteV2({ ...document, leadEndpoint: "/api/leads" });
  assert.match(rendered.body, /data-cluster-form/);
  assert.match(rendered.body, /Taller Norte/);
});

test("la normalización rechaza widgets libres e IDs duplicados", () => {
  const valid = buildDocument().sections;
  assert.equal(normalizeCanvasSectionsV2(valid).length, valid.length);
  const invalid = structuredClone(valid) as unknown as Array<Record<string, unknown>>;
  const rows = invalid[0].rows as Array<{ columns: Array<{ widgets: Array<Record<string, unknown>> }> }>;
  rows[0].columns[0].widgets[0].type = "html";
  assert.equal(normalizeCanvasSectionsV2(invalid).length, valid.length - 1);
  assert.ok(!V2_WIDGET_TYPES.includes("html" as never));
});

test("el renderer incluye responsive, formulario y sanitiza javascript", () => {
  const unsafeContent = normalizeSiteContentV2({ ...content, hero: { ...content.hero, ctaLink: "javascript:alert(1)" } });
  const document = buildDocument(unsafeContent);
  const rendered = renderSiteV2({ ...document, leadEndpoint: "/api/leads" });
  assert.match(rendered.html, /@media \(min-width:1024px\)/);
  assert.match(rendered.html, /data-cluster-form/);
  assert.doesNotMatch(rendered.html, /javascript:alert/);
  assert.match(rendered.body, /v2-nav-toggle/);
  assert.match(rendered.css, /overflow-wrap:anywhere/);
  assert.match(rendered.css, /prefers-reduced-motion:reduce/);
});

test("el control de calidad bloquea documentos rotos y reporta advertencias", () => {
  const document = buildDocument();
  const healthy = auditSiteDocumentV2(document);
  assert.equal(healthy.passed, true);
  assert.equal(healthy.issues.some((issue) => issue.level === "error"), false);

  const broken = structuredClone(document);
  broken.sections = broken.sections.filter((section) => section.region !== "footer");
  const report = auditSiteDocumentV2(broken);
  assert.equal(report.passed, false);
  assert.ok(report.issues.some((issue) => issue.code === "FOOTER_COUNT"));
});

test("el portapapeles V2 valida el widget antes de pegar", () => {
  const widget = { id: "copied", type: "button", variant: "outline", data: { text: "Cotizar" }, style: { desktop: { align: "center", padding: "md" } } };
  assert.deepEqual(parseV2Clipboard({ mode: "widget", widget })?.widget, widget);
  assert.equal(parseV2Clipboard({ mode: "widget", widget: { ...widget, type: "script" } }), null);
  assert.equal(parseV2Clipboard({ mode: "unknown", widget }), null);
  assert.equal(normalizeWidgetV2({ ...widget, id: "" }), null);
});

test("el modo editable solo se inyecta en el preview del editor", () => {
  const document = buildDocument();
  const publicRender = renderSiteV2({ ...document, leadEndpoint: "/api/leads" });
  const editorRender = renderSiteV2({ ...document, leadEndpoint: "/api/leads", editable: true });
  assert.doesNotMatch(publicRender.html, /data-editable-text|cluster-canvas|contenteditable/);
  assert.match(editorRender.html, /data-editable-text="1"/);
  assert.match(editorRender.script, /delete-element/);
  assert.doesNotMatch(publicRender.script, /delete-element/);
});

test("los fondos por token y las imágenes de fondo generan CSS seguro", () => {
  const document = buildDocument();
  const target = document.sections.find((section) => section.region === "main");
  assert.ok(target);
  target.style = { desktop: { background: "secondary", backgroundImage: "https://images.example.com/fondo.webp", padding: "xl", width: "wide" } };
  const normalized = normalizeCanvasSectionsV2(document.sections);
  const rendered = renderSiteV2({ content: document.content, design: { ...document.design, secondary: "#332244" }, sections: normalized, leadEndpoint: "/api/leads" });
  assert.match(rendered.css, /--secondary:#332244/);
  assert.match(rendered.css, /background:var\(--secondary\)/);
  assert.match(rendered.css, /background-image:url\("https:\/\/images\.example\.com\/fondo\.webp"\)/);

  target.style = { desktop: { backgroundImage: "javascript:alert(1)" } };
  const unsafe = normalizeCanvasSectionsV2(document.sections);
  assert.doesNotMatch(renderSiteV2({ content: document.content, design: document.design, sections: unsafe, leadEndpoint: "/api/leads" }).css, /javascript:/);
});

test("la portada animada se activa únicamente al agregar su bloque", () => {
  const document = buildDocument();
  const plain = renderSiteV2({ ...document, leadEndpoint: "/api/leads" });
  assert.doesNotMatch(plain.script, /data-pixel-hero/);
  document.sections.push({
    schemaVersion: 2, id: "pxh-section", key: "hero-animado", name: "Portada animada", region: "main", order: document.sections.length,
    rows: [{ id: "pxh-row", columns: [{ id: "pxh-col", span: { desktop: 12, tablet: 12, mobile: 12 }, widgets: [{ id: "pxh-widget", type: "hero_pixel", data: { secondaryText: "Ver más", secondaryLink: "javascript:alert(1)", marqueeItems: ["Acme", "Norte & Co"] } }] }] }],
  });
  const rendered = renderSiteV2({ content: document.content, design: document.design, sections: normalizeCanvasSectionsV2(document.sections), leadEndpoint: "/api/leads" });
  assert.match(rendered.body, /data-pixel-hero/);
  assert.doesNotMatch(rendered.body, /javascript:alert/);
  assert.match(rendered.script, /requestAnimationFrame/);
});

test("el sitio publicado emite SEO social, canonical y JSON-LD", () => {
  const publishedContent = normalizeSiteContentV2({ ...content, business: { ...content.business, logo: "https://cdn.example.com/logo.webp" }, hero: { ...content.hero, media: "https://cdn.example.com/cover.webp" } });
  const document = buildDocument(publishedContent);
  const rendered = renderSiteV2({ ...document, leadEndpoint: "/api/leads", publicUrl: "https://tallernorte.com", indexable: true });
  assert.match(rendered.head, /name="robots" content="index,follow"/);
  assert.match(rendered.head, /rel="canonical" href="https:\/\/tallernorte\.com\/"/);
  assert.match(rendered.body, /"@type":"LocalBusiness"/);
});

test("la metadata y las instrucciones DNS conservan el contrato público", () => {
  const source = { builderVersion: 2, businessName: "Taller Norte", businessType: "Arquitectura", location: "Managua", phone: "+505 8000 0000", contentJson: content };
  const metadata = publishedSiteMetadata(source, "https://tallernorte.com");
  assert.equal(metadata.alternates?.canonical, "https://tallernorte.com");
  assert.equal(publishedSiteStructuredData(source, "https://tallernorte.com")["@type"], "LocalBusiness");
  assert.deepEqual(dnsRecordsForDomain("www.negocio.com", []), [{ type: "CNAME", name: "www", value: "cname.vercel-dns-0.com" }]);
});
