import assert from "node:assert/strict";
import test from "node:test";

import { getTemplateCandidates } from "@/lib/site/template-selection";
import { orderSectionsForTemplate } from "@/lib/site/template-layout";

test("la selección ofrece seis composiciones de familias diferentes", () => {
  const candidates = getTemplateCandidates("Editorial");
  assert.equal(candidates.length, 6);
  assert.equal(new Set(candidates.map((candidate) => candidate.style)).size, 6);
  assert.equal(new Set(candidates.map((candidate) => candidate.family)).size, 6);
});

test("dos sitios con el mismo estilo ven propuestas diferentes", () => {
  const siteIds = ["site-a", "site-b", "site-c", "site-d"];
  const sets = new Set(
    siteIds.map((siteId) =>
      getTemplateCandidates("Editorial", { siteId }).map((candidate) => candidate.style).join(","),
    ),
  );
  assert.ok(sets.size > 1, "todos los sitios recibieron el mismo set de propuestas");
});

test("las propuestas son estables para el mismo sitio", () => {
  const first = getTemplateCandidates("Catalog", { siteId: "site-a", businessType: "Restaurante" });
  const second = getTemplateCandidates("Catalog", { siteId: "site-a", businessType: "Restaurante" });
  assert.deepEqual(first, second);
});

test("las familias afines a la industria encabezan las propuestas", () => {
  const candidates = getTemplateCandidates("Minimal", { siteId: "site-a", businessType: "Restaurante" });
  assert.equal(candidates[0].style, "Minimal");
  assert.deepEqual(
    candidates.slice(1, 4).map((candidate) => candidate.family),
    ["catalog", "local", "immersive"],
  );
});

test("un estilo legado del onboarding no cae al set fijo", () => {
  const candidates = getTemplateCandidates("premium_elegant", { siteId: "site-a" });
  assert.equal(candidates[0].style, "Editorial");
  assert.equal(candidates.length, 6);
  assert.equal(new Set(candidates.map((candidate) => candidate.family)).size, 6);
});

test("sin estilo previo igual se generan seis propuestas variadas por sitio", () => {
  const first = getTemplateCandidates(null, { siteId: "site-a", businessType: "restaurant" });
  assert.equal(first.length, 6);
  assert.equal(new Set(first.map((candidate) => candidate.family)).size, 6);
  assert.equal(first[0].family, "catalog");
  const second = getTemplateCandidates(null, { siteId: "site-z", businessType: "restaurant" });
  assert.notDeepEqual(
    first.map((candidate) => candidate.style),
    second.map((candidate) => candidate.style),
  );
});

test("la plantilla reordena secciones y mantiene el footer al final", () => {
  const sections = [
    { id: "footer", type: "footer", order: 0 },
    { id: "contact", type: "contact", order: 1 },
    { id: "services", type: "services", order: 2 },
    { id: "hero", type: "hero", order: 3 },
  ];
  const ordered = orderSectionsForTemplate(sections, "Catalog");
  assert.deepEqual(ordered.map((section) => section.type), ["hero", "services", "contact", "footer"]);
});

test("ensureReadable garantiza contraste AA conservando colores ya validos", async () => {
  const { ensureReadable, getContrastRatio } = await import("@/lib/site/theme-surface");
  assert.equal(ensureReadable("#111827", "#ffffff"), "#111827");
  const fixed = ensureReadable("#facc15", "#ffffff");
  assert.ok(getContrastRatio(fixed, "#ffffff") >= 4.5, "no alcanzo 4.5:1 sobre blanco");
  const lightened = ensureReadable("#0f172a", "#0b1120");
  assert.ok(getContrastRatio(lightened, "#0b1120") >= 4.5, "no alcanzo 4.5:1 sobre fondo oscuro");
  assert.ok(getContrastRatio(ensureReadable("#22d3ee", "#f0f9ff", 3), "#f0f9ff") >= 3, "no alcanzo 3:1 grafico");
});
