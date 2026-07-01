import assert from "node:assert/strict";
import test from "node:test";

import { buildFallbackNormalizedSite } from "@/lib/site/generation-pipeline";
import { onboardingFixture } from "./site-fixture";

test("el fallback siempre entrega una página renderizable", () => {
  const normalized = buildFallbackNormalizedSite(
    onboardingFixture,
    ["hero", "services", "about_us", "contact", "footer"],
  );
  const types = normalized.sections.map((section) => section.type);

  assert.deepEqual(types, ["hero", "services", "about_us", "contact", "footer"]);
  assert.equal(normalized.blueprint.site.pages.length, 1);
  assert.equal(normalized.blueprint.site.businessName, onboardingFixture.businessName);
  assert.ok(normalized.sections.every((section) => section.isVisible));
});
