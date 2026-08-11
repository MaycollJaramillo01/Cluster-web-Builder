import assert from "node:assert/strict";
import test from "node:test";

import {
  COMPOSITION_STAGES,
  DESIGN_LANGUAGE_PACKS,
} from "../lib/site/design-languages";
import { DESIGN_LANGUAGE_IDS } from "../lib/site/design-language-types";
import { SECTION_LIBRARY_V2 } from "../lib/site/v2-section-library";
import {
  auditSiteDocumentWithRegistryV2,
  filterCompatibleSectionKeysV2,
  getSectionCompatibilityV2,
  getSectionDataSignalsV2,
  getSectionRegistryEntryV2,
  SECTION_REGISTRY_V2,
} from "../lib/site/v2-section-registry";
import { normalizeSiteContentV2, normalizeThemeV2 } from "../lib/site/v2-schema";

const baseContent = {
  business: { name: "Estudio Norte", type: "Arquitectura", location: "", phone: "", email: "hola@example.com" },
  hero: { title: "Espacios que responden al lugar", subtitle: "Arquitectura local", body: "Diseñamos viviendas y comercios.", ctaText: "Hablemos", ctaLink: "#contact", media: "" },
  about: { title: "Sobre el estudio", subtitle: "", body: "Trabajamos cada proyecto de forma directa.", media: "", highlights: [] },
  services: [{ title: "Diseño residencial", description: "Anteproyecto y planos.", image: "" }],
  benefits: [{ title: "Proceso claro", description: "Decisiones documentadas." }],
  reviews: [],
  faqs: [],
  contact: { title: "Hablemos", body: "Cuéntanos qué quieres construir.", ctaText: "Enviar" },
  media: [],
  social: {},
  seo: { title: "Estudio Norte", description: "Arquitectura local", keyword: "arquitectura" },
};

test("el registro cubre toda la biblioteca con metadatos universales", () => {
  assert.equal(SECTION_REGISTRY_V2.length, SECTION_LIBRARY_V2.length);
  assert.equal(new Set(SECTION_REGISTRY_V2.map((entry) => entry.key)).size, SECTION_REGISTRY_V2.length);
  for (const entry of SECTION_REGISTRY_V2) {
    assert.equal(entry.section.key, entry.key);
    assert.equal(entry.section.name, entry.name);
    assert.deepEqual(entry.supportedLanguages, DESIGN_LANGUAGE_IDS);
    assert.deepEqual(entry.responsive, ["mobile", "tablet", "desktop"]);
    assert.ok(COMPOSITION_STAGES.includes(entry.role));
  }
});

test("cada candidato visual existe y declara el lenguaje que lo prefiere", () => {
  for (const language of DESIGN_LANGUAGE_IDS) {
    for (const stage of COMPOSITION_STAGES) {
      for (const key of DESIGN_LANGUAGE_PACKS[language].composition[stage]) {
        const entry = getSectionRegistryEntryV2(key);
        assert.ok(entry, `${key} no existe en el registro`);
        assert.equal(entry.role, stage);
        assert.ok(entry.preferredLanguages.includes(language));
      }
    }
  }
});

test("la compatibilidad responde a los datos disponibles", () => {
  const emptySignals = getSectionDataSignalsV2(baseContent);
  assert.equal(getSectionCompatibilityV2(getSectionRegistryEntryV2("library-poster-hero")!, emptySignals).compatible, true);
  assert.deepEqual(
    getSectionCompatibilityV2(getSectionRegistryEntryV2("library-hero-split-image-v2")!, emptySignals).missing,
    ["hero-media"],
  );
  assert.deepEqual(
    getSectionCompatibilityV2(getSectionRegistryEntryV2("library-services-bento")!, emptySignals).missing,
    ["service-images"],
  );
  assert.deepEqual(
    getSectionCompatibilityV2(getSectionRegistryEntryV2("library-contact-map-v2")!, emptySignals).missing,
    ["location"],
  );

  const readySignals = getSectionDataSignalsV2({
    ...baseContent,
    business: { ...baseContent.business, location: "Managua" },
    hero: { ...baseContent.hero, media: "https://cdn.example.com/portada.webp" },
    services: [
      { ...baseContent.services[0], image: "https://cdn.example.com/uno.webp" },
      { title: "Diseño comercial", description: "Locales y oficinas.", image: "https://cdn.example.com/dos.webp" },
    ],
  });
  assert.equal(getSectionCompatibilityV2(getSectionRegistryEntryV2("library-hero-split-image-v2")!, readySignals).compatible, true);
  assert.equal(getSectionCompatibilityV2(getSectionRegistryEntryV2("library-services-bento")!, readySignals).compatible, true);
  assert.equal(getSectionCompatibilityV2(getSectionRegistryEntryV2("library-contact-map-v2")!, readySignals).compatible, true);
});

test("el filtro evita bloques vacíos sin impedir alternativas válidas", () => {
  const signals = getSectionDataSignalsV2(baseContent);
  assert.deepEqual(filterCompatibleSectionKeysV2([
    "library-hero-split-image-v2",
    "library-poster-hero",
    "bloque-inexistente",
  ], signals), ["library-poster-hero"]);
});

test("el control de calidad reporta bloques con datos faltantes", () => {
  const map = getSectionRegistryEntryV2("library-contact-map-v2")!;
  const report = auditSiteDocumentWithRegistryV2({
    content: normalizeSiteContentV2(baseContent),
    design: normalizeThemeV2({}),
    sections: [{ ...structuredClone(map.section), id: "map-test" }],
  });
  assert.ok(report.issues.some((issue) =>
    issue.code === "SECTION_DATA:library-contact-map-v2" && issue.message.includes("ubicación"),
  ));
});
