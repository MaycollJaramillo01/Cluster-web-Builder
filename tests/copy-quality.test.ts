import assert from "node:assert/strict";
import test from "node:test";

import { auditBlueprintCopy, enforceBlueprintCopyQuality } from "@/lib/site/copy-quality";
import { buildFallbackSiteBlueprint } from "@/lib/site/fallback-site-blueprint";
import { onboardingFixture } from "./site-fixture";

test("las métricas reparan copy corto sin inventar datos", () => {
  const blueprint = buildFallbackSiteBlueprint(onboardingFixture);
  const hero = blueprint.site.pages[0].sections.find((section) => section.type === "hero");
  assert.ok(hero);
  hero.title = "Web";
  hero.subtitle = "Diseño";
  hero.body = "Texto corto";
  blueprint.site.seo.title = "Taller";
  blueprint.site.seo.metaDescription = "Arquitectura";

  const before = auditBlueprintCopy(blueprint);
  const improved = enforceBlueprintCopyQuality(blueprint, onboardingFixture);
  const after = auditBlueprintCopy(improved);
  const improvedHero = improved.site.pages[0].sections.find((section) => section.type === "hero");

  assert.equal(before.passed, false);
  assert.ok(after.score > before.score);
  assert.ok(improvedHero && improvedHero.title.includes(onboardingFixture.businessName));
  assert.ok(improved.site.seo.metaDescription.includes(onboardingFixture.businessName));
});
