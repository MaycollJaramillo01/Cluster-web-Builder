import assert from "node:assert/strict";
import test from "node:test";

import { sanitizeLink } from "@/lib/site/links";
import { exportSiteHtml } from "@/lib/site/export-html";
import type { RenderSection } from "@/lib/site/section";

test("sanitizeLink solo permite destinos seguros", () => {
  assert.equal(sanitizeLink("https://cluster.marketing/planes"), "https://cluster.marketing/planes");
  assert.equal(sanitizeLink("#contact"), "#contact");
  assert.equal(sanitizeLink("/precios"), "/precios");
  assert.equal(sanitizeLink("mailto:hola@negocio.com"), "mailto:hola@negocio.com");
  assert.equal(sanitizeLink("tel:+57 300 123 4567"), "tel:+57 300 123 4567");
  assert.equal(sanitizeLink("javascript:alert(1)"), "");
  assert.equal(sanitizeLink("JaVaScRiPt:alert(1)"), "");
  assert.equal(sanitizeLink("data:text/html,<script>alert(1)</script>"), "");
  assert.equal(sanitizeLink("http://inseguro.com"), "");
  assert.equal(sanitizeLink("//evil.com"), "");
  assert.equal(sanitizeLink(""), "");
});

function section(partial: Partial<RenderSection>): RenderSection {
  return {
    id: "s1", type: "text", title: "", subtitle: "", body: "", ctaText: "", ctaLink: "",
    imagePrompt: "", mediaUrl: "", altText: "", order: 0, isVisible: true, settings: {},
    ...partial,
  };
}

const exportSite = (sections: RenderSection[]) => exportSiteHtml({
  businessName: "Negocio Prueba", businessType: "Servicios", phone: null, email: null,
  location: "Bogota", publicSlug: "negocio-prueba", showBranding: false, visualStyle: "Service",
  theme: { primary: "#2563eb", secondary: "#0f172a", accent: "#0ea5e9", background: "#ffffff", text: "#0f172a" },
  sections,
}, "https://example.com/leads");

test("el export no duplica el hero y respeta el contenido editado", () => {
  const html = exportSite([
    section({ id: "h", type: "hero", title: "Titular editado", subtitle: "Tagline editado", ctaText: "Reservar", ctaLink: "#contact", order: 0 }),
    section({ id: "f", type: "footer", title: "Negocio Prueba", order: 1 }),
  ]);
  assert.equal(html.match(/class="hero"/g)?.length, 1, "debe existir exactamente un hero");
  assert.ok(html.includes("Titular editado"), "el hero debe usar el contenido editado");
  assert.ok(html.includes("Reservar"), "el hero debe usar el CTA editado");
});

test("el export genera un hero de respaldo solo cuando no hay hero", () => {
  const html = exportSite([section({ id: "f", type: "footer", order: 0 })]);
  assert.equal(html.match(/class="hero"/g)?.length, 1);
  assert.ok(html.includes("Negocio Prueba"));
});

test("el export asigna ids unicos a secciones repetidas", () => {
  const html = exportSite([
    section({ id: "a", type: "image", title: "Foto 1", mediaUrl: "https://example.com/a.jpg", order: 0 }),
    section({ id: "b", type: "image", title: "Foto 2", mediaUrl: "https://example.com/b.jpg", order: 1 }),
    section({ id: "c", type: "text", title: "Uno", order: 2 }),
    section({ id: "d", type: "text", title: "Dos", order: 3 }),
  ]);
  assert.equal(html.match(/id="image"/g)?.length, 1);
  assert.equal(html.match(/id="image-2"/g)?.length, 1);
  assert.equal(html.match(/id="text"/g)?.length, 1);
  assert.equal(html.match(/id="text-2"/g)?.length, 1);
});

test("el export neutraliza enlaces peligrosos en los CTA", () => {
  const html = exportSite([
    section({ id: "t", type: "text", title: "Bloque", ctaText: "Click", ctaLink: "javascript:alert(1)", order: 0 }),
  ]);
  assert.ok(!html.includes("javascript:"), "el enlace javascript: no debe llegar al HTML");
  assert.ok(html.includes('href="#contact"'), "el CTA debe caer al ancla segura");
});
