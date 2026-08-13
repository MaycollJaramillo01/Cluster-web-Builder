import assert from "node:assert/strict";
import test from "node:test";

import {
  applyDesignLanguage,
  COMPOSITION_STAGES,
  DESIGN_LANGUAGE_PACKS,
  optimizeCompositionPath,
  rankDesignLanguages,
  selectDesignLanguage,
} from "../lib/site/design-languages";
import { DESIGN_LANGUAGE_IDS } from "../lib/site/design-language-types";
import { composeSiteSectionsV2 } from "../lib/site/section-composer";
import { SITE_RECIPES } from "../lib/site/site-recipes";
import { renderSiteV2 } from "../lib/site/v2-render";
import { SECTION_LIBRARY_V2 } from "../lib/site/v2-section-library";
import { normalizeSiteContentV2, normalizeThemeV2 } from "../lib/site/v2-schema";

const content = normalizeSiteContentV2({
  business: {
    name: "Taller Norte",
    type: "Estudio de arquitectura",
    location: "Managua",
    phone: "+505 8000 0000",
    email: "hola@example.com",
  },
  hero: {
    title: "Espacios pensados para vivir mejor",
    subtitle: "Arquitectura local",
    body: "Diseñamos hogares y comercios que responden al lugar y a la vida diaria.",
    ctaText: "Ver proyectos",
    ctaLink: "#contact",
    media: "https://images.example.com/hero.webp",
  },
  about: {
    title: "Un estudio cercano",
    subtitle: "Sobre nosotros",
    body: "Trabajamos cada proyecto con atención directa y una narrativa clara.",
    media: "https://images.example.com/about.webp",
    highlights: [],
  },
  services: [
    { title: "Diseño residencial", description: "Anteproyecto y planos ejecutivos." },
    { title: "Diseño comercial", description: "Espacios que ordenan la experiencia de marca." },
  ],
  benefits: [{ title: "Proceso claro", description: "Decisiones documentadas en cada etapa." }],
  reviews: [{ name: "Ana", quote: "El proceso fue claro.", rating: 5 }],
  faqs: [{ question: "¿Trabajan fuera de Managua?", answer: "Sí, según el alcance." }],
  contact: { title: "Hablemos", body: "Cuéntanos qué quieres construir.", ctaText: "Enviar" },
  media: [
    { url: "https://images.example.com/hero.webp", alt: "Exterior" },
    { url: "https://images.example.com/interior.webp", alt: "Interior" },
  ],
});

test("el sistema expone los seis lenguajes visuales", () => {
  assert.deepEqual(DESIGN_LANGUAGE_IDS, ["bauhaus", "swiss", "editorial", "industrial", "storm", "makeover"]);
  assert.deepEqual(Object.keys(DESIGN_LANGUAGE_PACKS), [...DESIGN_LANGUAGE_IDS]);
});

test("cada lenguaje define un grafo de composición válido y completo", () => {
  const sectionKeys = new Set(SECTION_LIBRARY_V2.map((section) => section.key));
  for (const languageId of DESIGN_LANGUAGE_IDS) {
    const pack = DESIGN_LANGUAGE_PACKS[languageId];
    assert.deepEqual(Object.keys(pack.composition), [...COMPOSITION_STAGES]);
    for (const stage of COMPOSITION_STAGES) {
      assert.ok(pack.composition[stage].length > 0, `${languageId}:${stage} no tiene candidatos`);
      for (const key of pack.composition[stage]) {
        assert.ok(sectionKeys.has(key), `${languageId}:${stage} referencia ${key}, que no existe`);
      }
    }
  }
});

test("el ranking usa señales de estilo y negocio sin aleatoriedad", () => {
  assert.equal(selectDesignLanguage({ visualStyle: "bold", businessType: "fitness" }).id, "bauhaus");
  assert.equal(selectDesignLanguage({ visualStyle: "modern_clean", businessType: "software" }).id, "swiss");
  assert.equal(selectDesignLanguage({ visualStyle: "premium_elegant", businessType: "arquitectura" }).id, "editorial");
  assert.equal(selectDesignLanguage({ visualStyle: "local_trustworthy", businessType: "roofing contractor" }).id, "industrial");
  assert.equal(selectDesignLanguage({ visualStyle: "local_trustworthy", businessType: "storm damage restoration" }).id, "storm");
  assert.equal(selectDesignLanguage({ businessType: "emergency plumbing and HVAC" }).id, "storm");
  // Oficios de superficie: la prueba es el resultado visible, no el alcance de obra.
  assert.equal(selectDesignLanguage({ businessType: "pressure washing y limpieza de fachadas" }).id, "makeover");
  assert.equal(selectDesignLanguage({ businessType: "pintura residencial" }).id, "makeover");
  assert.equal(selectDesignLanguage({ businessType: "instalación de pisos" }).id, "makeover");
  assert.equal(selectDesignLanguage({ languageAffinity: { editorial: 5 } }).id, "editorial");
  assert.deepEqual(
    rankDesignLanguages({ visualStyle: "premium_elegant", businessType: "arquitectura" }),
    rankDesignLanguages({ visualStyle: "premium_elegant", businessType: "arquitectura" }),
  );
});

test("el optimizador recorre el grafo completo de forma determinista", () => {
  const graph = [
    { stage: "hero" as const, candidates: ["library-hero-centered-v2", "library-hero-background-image-v2"] },
    { stage: "about" as const, candidates: ["library-about-minimal-v2", "library-about-split-v2"] },
    { stage: "services" as const, candidates: ["library-services-cards-v2", "library-services-editorial-v2"] },
  ];
  const first = optimizeCompositionPath("Taller Norte", graph);
  const second = optimizeCompositionPath("Taller Norte", graph);
  assert.deepEqual(first, second);
  assert.equal(first.keys.length, graph.length);
  first.keys.forEach((key, index) => assert.ok(graph[index].candidates.includes(key)));
  assert.ok(Number.isFinite(first.score));
});

test("el optimizador consume perfiles declarados en vez de inferirlos por el nombre", () => {
  const graph = [
    { stage: "hero" as const, candidates: ["bloque-a"] },
    { stage: "about" as const, candidates: ["bloque-b"] },
  ];
  const repetitive = optimizeCompositionPath("perfil", graph, () => ({ density: 3, layout: "grid", contrast: true }));
  const varied = optimizeCompositionPath("perfil", graph, (key) => key === "bloque-a"
    ? { density: 3, layout: "grid", contrast: true }
    : { density: 1, layout: "split", contrast: false });
  assert.ok(varied.score > repetitive.score);
});

test("cambiar de lenguaje conserva la paleta y aplica su gramática", () => {
  const base = normalizeThemeV2({
    primary: "#112233",
    secondary: "#223344",
    accent: "#cc3300",
    background: "#f7f6f1",
    text: "#101820",
    muted: "#667788",
  });
  const editorial = applyDesignLanguage(base, "editorial");
  assert.deepEqual(
    [editorial.primary, editorial.secondary, editorial.accent, editorial.background, editorial.text, editorial.muted],
    [base.primary, base.secondary, base.accent, base.background, base.text, base.muted],
  );
  assert.equal(editorial.language, "editorial");
  assert.equal(editorial.headingFont, DESIGN_LANGUAGE_PACKS.editorial.themeDefaults.headingFont);
  assert.notEqual(editorial.headingFont, base.headingFont);
});

test("el compositor usa los candidatos del lenguaje sin crear plantillas", () => {
  const fingerprints = new Set<string>();
  for (const languageId of DESIGN_LANGUAGE_IDS) {
    const document = composeSiteSectionsV2({
      content,
      businessType: content.business.type,
      designLanguage: languageId,
      theme: { primary: "#112233", accent: "#cc3300" },
    });
    assert.equal(document.design.language, languageId);
    assert.equal(document.design.primary, "#112233");
    assert.ok(DESIGN_LANGUAGE_PACKS[languageId].composition.hero.includes(document.sections[1].key));
    fingerprints.add(document.sections.map((section) => section.key).join(">"));
  }
  assert.equal(fingerprints.size, DESIGN_LANGUAGE_IDS.length);
});

test("el renderer identifica el lenguaje y emite sus reglas globales", () => {
  const document = composeSiteSectionsV2({ content, designLanguage: "bauhaus" });
  const rendered = renderSiteV2({ ...document, leadEndpoint: "/api/leads" });
  assert.match(rendered.body, /data-design-language="bauhaus"/);
  assert.match(rendered.body, /v2-region-footer/);
  assert.match(rendered.css, /\[data-design-language="bauhaus"\]/);
  assert.match(rendered.css, /--language-rule:3px/);
});

test("Storm Response arma los tres pilares: emergencia, disponibilidad y seguros", () => {
  const document = composeSiteSectionsV2({
    content,
    businessType: "storm damage restoration",
    designLanguage: "storm",
    blueprint: SITE_RECIPES["storm-response"].sections,
  });
  const keys = document.sections.map((section) => section.key);
  assert.ok(keys.includes("library-hero-emergency-v2"), `sin hero de emergencia: ${keys.join(">")}`);
  assert.ok(keys.includes("library-availability-grid-v2"), `sin bloque de disponibilidad: ${keys.join(">")}`);
  assert.ok(keys.includes("library-emergency-band-v2"), `sin banda de emergencia: ${keys.join(">")}`);
  assert.ok(keys.includes("library-insurance-faq-v2"), `sin bloque de seguros: ${keys.join(">")}`);
  // Nosotros va inmediatamente debajo de la portada, y la disponibilidad antes
  // que el catálogo: primero quién responde, luego qué se hace.
  assert.equal(keys[2], "library-about-showcase-v2", `nosotros no quedó bajo el hero: ${keys.join(">")}`);
  assert.ok(keys.indexOf("library-about-showcase-v2") < keys.indexOf("library-availability-grid-v2"));
  assert.ok(keys.indexOf("library-availability-grid-v2") < keys.findIndex((key) => key.includes("services")));

  const rendered = renderSiteV2({ ...document, leadEndpoint: "/api/leads" });
  assert.match(rendered.body, /data-design-language="storm"/);
  assert.match(rendered.css, /\[data-design-language="storm"\]/);
  assert.match(rendered.css, /--language-rule:2px/);
  assert.match(rendered.css, /v2-storm-pulse/);
  // El teléfono viaja en el hero y en la banda, no solo en el encabezado.
  assert.ok(rendered.body.match(/href="tel:/g)!.length >= 3);
});

test("la banda de emergencia nunca deja el botón invisible sobre el acento", () => {
  const document = composeSiteSectionsV2({
    content,
    designLanguage: "storm",
    blueprint: SITE_RECIPES["storm-response"].sections,
  });
  const rendered = renderSiteV2({ ...document, leadEndpoint: "/api/leads" });
  assert.match(
    rendered.css,
    /\[data-design-language\] \.v2-key-library-emergency-band-v2 \[data-widget-type="button"\]\{background:var\(--secondary\)/,
  );
});

test("Industrial conserva la paleta y expone conversión directa en el encabezado", () => {
  const document = composeSiteSectionsV2({ content, designLanguage: "industrial" });
  const rendered = renderSiteV2({ ...document, leadEndpoint: "/api/leads" });
  assert.equal(document.design.accent, normalizeThemeV2({}).accent);
  assert.match(rendered.body, /data-design-language="industrial"/);
  assert.match(rendered.body, /v2-nav-phone/);
  assert.match(rendered.body, /v2-nav-cta/);
  assert.match(rendered.css, /\[data-design-language="industrial"\]/);
  assert.match(rendered.css, /--language-rule:2px/);
});

test("ninguna sección recorta su propia caja: el fondo llega a los bordes", () => {
  for (const languageId of DESIGN_LANGUAGE_IDS) {
    const document = composeSiteSectionsV2({ content, designLanguage: languageId });
    const rendered = renderSiteV2({ ...document, leadEndpoint: "/api/leads" });
    // Un max-width en la caja de la sección deja el color flotando en una
    // franja centrada; el ancho de lectura lo pone la gramática del lenguaje.
    const recortadas = [...rendered.css.matchAll(/\[data-section-id="[\w-]+"\]\{([^}]*)\}/g)]
      .filter((match) => /max-width:\d/.test(match[1]));
    assert.equal(recortadas.length, 0, `${languageId}: ${recortadas.length} secciones con la caja recortada`);
    assert.match(rendered.css, /\.v2-section>div\{max-width:var\(--language-content\)\}/);
  }
});
