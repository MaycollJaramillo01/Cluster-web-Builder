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
