import assert from "node:assert/strict";
import test from "node:test";

import {
  buildGenerationPlan,
  canUseLocalGenerator,
  generationStatusStages,
  parseGenerationInput,
  selectGenerationBlueprint,
} from "@/lib/site/generation-pipeline";
import { onboardingFixture } from "./site-fixture";

test("la entrada guiada produce un plan completo y determinista", () => {
  const parsed = parseGenerationInput(onboardingFixture);
  const plan = buildGenerationPlan(parsed.input, parsed.originalRequest);

  assert.equal(parsed.input.businessName, onboardingFixture.businessName);
  assert.ok(plan.sectionPlan.includes("hero"));
  assert.ok(plan.sectionPlan.includes("contact"));
  assert.equal(plan.blueprintId, "portfolio");
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

test("los errores recuperables activan el motor local", () => {
  assert.equal(canUseLocalGenerator(new Error("El sitio generado no contiene páginas.")), true);
  assert.equal(canUseLocalGenerator(new Error("JSON inválido")), true);
  assert.equal(canUseLocalGenerator(new Error("Permiso denegado")), false);
});
