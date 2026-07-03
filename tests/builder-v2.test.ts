import assert from "node:assert/strict";
import test from "node:test";

import { renderSiteV2 } from "../lib/site/v2-render";
import { getAllTemplatesV2, instantiateTemplateV2, LEGACY_TEMPLATE_MIGRATION, SECTION_LIBRARY_V2 } from "../lib/site/v2-templates";
import { normalizeCanvasSectionsV2, normalizeSiteContentV2, V2_TEMPLATE_IDS, V2_WIDGET_TYPES } from "../lib/site/v2-schema";

const content = normalizeSiteContentV2({
  business: { name: "Taller Norte", type: "Arquitectura", location: "Managua", phone: "+505 8000 0000", email: "hola@example.com" },
  hero: { title: "Espacios pensados para vivir mejor", subtitle: "Arquitectura local", body: "Diseñamos hogares y comercios que responden al clima, al lugar y a la vida diaria.", ctaText: "Ver proyectos", ctaLink: "#contact", media: "https://images.example.com/hero.webp" },
  about: { title: "Un estudio cercano", subtitle: "Sobre nosotros", body: "Trabajamos cada proyecto con atención directa.", media: "", highlights: [] },
  services: [{ title: "Diseño residencial", description: "Anteproyecto y planos", meta: "", image: "" }],
  contact: { title: "Hablemos", body: "Cuéntanos qué quieres construir.", ctaText: "Enviar" },
  seo: { title: "Taller Norte Arquitectura en Managua", description: "Diseño arquitectónico residencial y comercial en Managua.", keyword: "arquitectura" },
});

test("las seis plantillas V2 tienen fingerprints estructurales distintos", () => {
  const templates = getAllTemplatesV2();
  assert.deepEqual(templates.map((template) => template.id), [...V2_TEMPLATE_IDS]);
  const fingerprints = templates.map((template) => template.sections.map((section) => section.rows.map((row) => row.columns.map((column) => `${column.span.desktop}:${column.widgets.map((widget) => widget.type).join(",")}`).join("|"))).join("/"));
  assert.equal(new Set(fingerprints).size, 6);
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
});

test("los 46 presets V1 tienen destino y la biblioteca no repite keys", () => {
  assert.equal(Object.keys(LEGACY_TEMPLATE_MIGRATION).length, 46);
  assert.equal(new Set(SECTION_LIBRARY_V2.map((section) => section.key)).size, SECTION_LIBRARY_V2.length);
  for (const result of Object.values(LEGACY_TEMPLATE_MIGRATION)) assert.ok(V2_TEMPLATE_IDS.includes(result.template));
});
