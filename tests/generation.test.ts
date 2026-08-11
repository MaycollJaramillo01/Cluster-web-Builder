import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenerationPlan,
  canUseLocalGenerator,
  generationStatusStages,
  parseGenerationInput,
  selectGenerationBlueprint,
} from "@/lib/site/generation-pipeline";
import { composeGeneratedSiteDocument } from "@/lib/site/generation-document";
import { onboardingFixture } from "./site-fixture";

test("la entrada guiada produce un plan completo y determinista", () => {
  const parsed = parseGenerationInput(onboardingFixture);
  const plan = buildGenerationPlan(parsed.input, parsed.originalRequest);

  assert.equal(parsed.input.businessName, onboardingFixture.businessName);
  assert.ok(plan.sectionPlan.includes("hero"));
  assert.ok(plan.sectionPlan.includes("contact"));
  assert.equal(plan.blueprintId, "portfolio");
  assert.equal(plan.designLanguage, "editorial");
  assert.ok(plan.recipeReasons.length > 0);
  assert.ok(plan.designLanguageReasons.length > 0);
  assert.match(plan.designBrief, /Receta funcional Portafolio visual/);
  assert.match(plan.designBrief, /Lenguaje visual Editorial UI/);
  assert.ok(plan.systemPrompt.length > 100);
  assert.ok(plan.userPrompt.includes(onboardingFixture.businessName));
  assert.equal(generationStatusStages(plan.selectedDesignStyle).length, 6);
});

test("el blueprint responde al objetivo sin introducir otro motor", () => {
  assert.equal(selectGenerationBlueprint({ ...onboardingFixture, goal: "sell_products" }).id, "catalog");
  assert.equal(selectGenerationBlueprint({
    ...onboardingFixture,
    businessType: "other",
    customBusinessType: "Estudio de arquitectura",
    goal: "professional_presence",
  }).id, "portfolio");
});

test("el documento generado conserva el lenguaje elegido y la paleta del cliente", () => {
  const document = composeGeneratedSiteDocument({
    businessName: "Taller Norte",
    businessType: "Arquitectura",
    location: "Managua",
    phone: "+505 4000 1000",
    email: "hola@example.com",
    logoUrl: null,
    coverUrl: "https://cdn.example.com/portada.webp",
    visualStyle: "premium_elegant",
    designLanguage: "bauhaus",
    blueprintJson: { site: { seo: {}, socialLinks: {} } },
    primaryColor: "#112233",
    secondaryColor: "#223344",
    accentColor: "#cc3300",
  }, [{
    type: "hero",
    title: "Arquitectura que responde al lugar",
    content: { subtitle: "Estudio local", body: "Diseño residencial y comercial.", ctaText: "Hablemos", ctaLink: "#contact" },
    settingsJson: {},
    order: 0,
  }, {
    type: "contact",
    title: "Hablemos",
    content: { body: "Cuéntanos qué quieres construir.", ctaText: "Enviar" },
    settingsJson: {},
    order: 1,
  }], ["hero", "contact", "footer"]);

  assert.equal(document.design.language, "bauhaus");
  assert.equal(document.design.primary, "#112233");
  assert.equal(document.design.secondary, "#223344");
  assert.equal(document.design.accent, "#cc3300");
});

test("los errores recuperables activan el motor local", () => {
  assert.equal(canUseLocalGenerator(new Error("El sitio generado no contiene páginas.")), true);
  assert.equal(canUseLocalGenerator(new Error("JSON inválido")), true);
  assert.equal(canUseLocalGenerator(new Error("Permiso denegado")), false);
});
