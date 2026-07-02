import assert from "node:assert/strict";
import test from "node:test";

import { normalizeFreeformLayout, MAX_ROWS, MAX_COLUMNS_PER_ROW, MAX_WIDGETS_PER_SECTION } from "../lib/site/freeform";
import { normalizeSectionSettings } from "../lib/site/section-layout";
import { freeformSectionHtml } from "../lib/site/export-freeform-html";
import type { RenderSection } from "../lib/site/section";

test("normalizeFreeformLayout descarta entradas invalidas sin lanzar", () => {
  assert.deepEqual(normalizeFreeformLayout(undefined), { rows: [] });
  assert.deepEqual(normalizeFreeformLayout(null), { rows: [] });
  assert.deepEqual(normalizeFreeformLayout("not-an-object"), { rows: [] });
  assert.deepEqual(normalizeFreeformLayout({ rows: "not-an-array" }), { rows: [] });
  // fila sin id, fila sin columnas, columna sin id -> se descartan
  assert.deepEqual(normalizeFreeformLayout({ rows: [{ columns: [] }, { id: "r1", columns: [] }, { id: "r2" }] }), { rows: [] });
});

test("normalizeFreeformLayout normaliza un layout valido y descarta widgets con tipo desconocido", () => {
  const layout = normalizeFreeformLayout({
    rows: [{
      id: "r1",
      columns: [{
        id: "c1",
        width: 2,
        widgets: [
          { id: "w1", type: "heading", content: { text: "Hola" } },
          { id: "w2", type: "not-a-real-type", content: { text: "descartado" } },
          { id: "w3", type: "button", content: { text: "Ir", link: "javascript:alert(1)" } },
        ],
      }],
    }],
  });
  assert.equal(layout.rows.length, 1);
  assert.equal(layout.rows[0].columns[0].width, 2);
  assert.equal(layout.rows[0].columns[0].widgets.length, 2);
  assert.equal(layout.rows[0].columns[0].widgets[0].content.text, "Hola");
  // el link javascript: se sanitiza a cadena vacia, igual que sanitizeLink en el resto del editor
  assert.equal(layout.rows[0].columns[0].widgets[1].content.link, "");
});

test("normalizeFreeformLayout topa filas, columnas y widgets a los limites declarados", () => {
  const manyRows = Array.from({ length: MAX_ROWS + 5 }, (_, i) => ({ id: `r${i}`, columns: [{ id: `c${i}`, width: 1, widgets: [] }] }));
  assert.equal(normalizeFreeformLayout({ rows: manyRows }).rows.length, MAX_ROWS);

  const manyColumns = [{ id: "r1", columns: Array.from({ length: MAX_COLUMNS_PER_ROW + 3 }, (_, i) => ({ id: `c${i}`, width: 1, widgets: [] })) }];
  assert.equal(normalizeFreeformLayout({ rows: manyColumns }).rows[0].columns.length, MAX_COLUMNS_PER_ROW);

  const manyWidgets = [{
    id: "r1",
    columns: [{
      id: "c1",
      width: 1,
      widgets: Array.from({ length: MAX_WIDGETS_PER_SECTION + 10 }, (_, i) => ({ id: `w${i}`, type: "text", content: { text: `${i}` } })),
    }],
  }];
  assert.equal(normalizeFreeformLayout({ rows: manyWidgets }).rows[0].columns[0].widgets.length, MAX_WIDGETS_PER_SECTION);
});

test("normalizeSectionSettings sigue siendo aditivo: una seccion sin freeform obtiene layout/styleOverrides igual que antes mas un freeform vacio", () => {
  const result = normalizeSectionSettings({ layout: { width: "wide" }, styleOverrides: { title: { color: "#123456" } } });
  assert.deepEqual(result.layout, { width: "wide", align: "left", background: "plain", spacing: "normal" });
  assert.deepEqual(result.styleOverrides, { title: { color: "#123456" } });
  assert.deepEqual(result.freeform, { rows: [] });
});

function section(partial: Partial<RenderSection>): RenderSection {
  return {
    id: "s1", type: "freeform", title: "", subtitle: "", body: "", ctaText: "", ctaLink: "",
    imagePrompt: "", mediaUrl: "", altText: "", order: 0, isVisible: true, settings: {},
    ...partial,
  };
}

const exportSite = {
  businessName: "Negocio Prueba", businessType: "Servicios", phone: null, email: null,
  location: "Bogota", publicSlug: "negocio-prueba", showBranding: false, visualStyle: "Service",
  theme: { primary: "#2563eb", secondary: "#0f172a", accent: "#0ea5e9", background: "#ffffff", text: "#0f172a" },
  sections: [],
};

test("freeformSectionHtml refleja la misma estructura normalizada: filas, columnas (grid-template-columns) y texto de cada widget", () => {
  const freeform = {
    rows: [{
      id: "r1",
      columns: [
        { id: "c1", width: 1, widgets: [{ id: "w1", type: "heading", content: { text: "Titulo widget" } }] },
        { id: "c2", width: 2, widgets: [{ id: "w2", type: "text", content: { text: "Cuerpo widget" } }] },
      ],
    }],
  };
  const html = freeformSectionHtml(section({ settings: { freeform } }), exportSite, "freeform-1");
  assert.ok(html.includes("Titulo widget"), "el texto del widget heading debe aparecer");
  assert.ok(html.includes("Cuerpo widget"), "el texto del widget text debe aparecer");
  assert.ok(html.includes("grid-template-columns:1fr 2fr"), "las columnas deben reflejar el ancho normalizado (1fr/2fr)");
  assert.ok(html.includes('id="freeform-1"'), "la seccion exportada usa el id unico recibido");
});

test("freeformSectionHtml aplica el color del widget vía resolveElementStyleString, igual que el renderer en vivo", () => {
  const freeform = { rows: [{ id: "r1", columns: [{ id: "c1", width: 1, widgets: [{ id: "w1", type: "heading", content: { text: "Coloreado" }, style: { color: "#ff00aa" } }] }] }] };
  const html = freeformSectionHtml(section({ settings: { freeform } }), exportSite, "freeform-2");
  assert.ok(html.includes("color:#ff00aa"), "el color del widget debe aparecer inline en el HTML exportado");
});

test("freeformSectionHtml no renderiza nada para una seccion freeform sin filas", () => {
  const html = freeformSectionHtml(section({ settings: { freeform: { rows: [] } } }), exportSite, "freeform-3");
  assert.equal(html, "");
});

test("freeformSectionHtml sanea el link de un boton igual que el resto del export", () => {
  const freeform = { rows: [{ id: "r1", columns: [{ id: "c1", width: 1, widgets: [{ id: "w1", type: "button", content: { text: "Click", link: "javascript:alert(1)" } }] }] }] };
  const html = freeformSectionHtml(section({ settings: { freeform } }), exportSite, "freeform-4");
  assert.ok(!html.includes("javascript:"), "el enlace javascript: no debe llegar al HTML exportado");
  assert.ok(html.includes('href="#contact"'), "el boton debe caer al ancla segura cuando el link es invalido");
});
