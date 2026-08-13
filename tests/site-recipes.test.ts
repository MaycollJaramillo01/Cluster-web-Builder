import assert from "node:assert/strict";
import test from "node:test";

import {
  auditSiteRecipes,
  expandSiteRecipe,
  rankSiteRecipes,
  selectSiteRecipe,
  SITE_RECIPES,
} from "../lib/site/site-recipes";
import { onboardingFixture } from "./site-fixture";

test("todas las recetas cumplen el contrato funcional mínimo", () => {
  assert.deepEqual(auditSiteRecipes(), []);
  for (const recipe of Object.values(SITE_RECIPES)) {
    assert.equal(recipe.sections[0], "hero");
    assert.equal(recipe.sections.at(-1), "footer");
    assert.ok(recipe.sections.includes("contact"));
  }
});

test("el ranking de recetas responde al objetivo y al tipo de negocio", () => {
  const cases = [
    [{ ...onboardingFixture, businessType: "roofing" as const, customBusinessType: "", goal: "quote_forms" as const }, "contractor-pro"],
    // Mismo tipo de negocio; lo que cambia la receta es la urgencia declarada en los servicios.
    [{
      ...onboardingFixture,
      businessType: "roofing" as const,
      customBusinessType: "",
      goal: "calls" as const,
      services: "Contención de emergencia: Lonas y extracción de agua tras una tormenta.\nExpediente para el seguro: Fotos y mediciones para tu ajustador.",
    }, "storm-response"],
    [{
      ...onboardingFixture,
      businessType: "other" as const,
      customBusinessType: "Plomería y climatización",
      goal: "calls" as const,
    }, "storm-response"],
    [{ ...onboardingFixture, goal: "sell_products" as const }, "catalog"],
    [{ ...onboardingFixture, businessType: "restaurant" as const, customBusinessType: "", goal: "professional_presence" as const }, "appointments"],
    // Pintura y limpieza se juzgan por el resultado sobre la superficie, no por
    // el alcance de obra: su receta es la comparación.
    [{ ...onboardingFixture, businessType: "cleaning" as const, customBusinessType: "", goal: "quote_forms" as const }, "before-after"],
    [{ ...onboardingFixture, businessType: "painting" as const, customBusinessType: "", goal: "quote_forms" as const }, "before-after"],
    [{ ...onboardingFixture, businessType: "other" as const, customBusinessType: "Pressure washing de fachadas", goal: "calls" as const }, "before-after"],
    [{ ...onboardingFixture, businessType: "landscaping" as const, customBusinessType: "", goal: "quote_forms" as const }, "contractor-pro"],
    [{ ...onboardingFixture, businessType: "other" as const, customBusinessType: "Estudio de fotografía", goal: "show_services" as const }, "portfolio"],
  ] as const;

  for (const [input, expected] of cases) {
    const ranking = rankSiteRecipes(input);
    assert.equal(ranking[0].id, expected);
    assert.ok(ranking[0].score > ranking[1].score);
    assert.ok(ranking[0].reasons.length > 0);
  }
});

test("la receta se expande solo con datos reales disponibles", () => {
  const selection = selectSiteRecipe(onboardingFixture);
  const expanded = expandSiteRecipe(selection.recipe, { ...onboardingFixture, reviews: "Ana: Excelente proceso." });
  assert.ok(expanded.includes("location"));
  assert.ok(expanded.includes("testimonials"));
  assert.ok(expanded.indexOf("testimonials") < expanded.indexOf("contact"));

  const minimal = expandSiteRecipe(selection.recipe, { ...onboardingFixture, location: "Zona por definir", reviews: "" });
  assert.equal(minimal.includes("location"), false);
  assert.equal(minimal.includes("testimonials"), false);
});
