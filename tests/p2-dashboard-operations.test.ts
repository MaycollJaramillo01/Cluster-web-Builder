import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("dashboard calculates operational readiness and lead totals per site", () => {
  const dashboard = readFileSync("app/dashboard/page.tsx", "utf8");

  assert.match(dashboard, /getSiteLaunchReadiness/);
  assert.match(dashboard, /sections: \{ orderBy: \{ order: "asc" \}/);
  assert.match(dashboard, /leads: \{ where: \{ readAt: null \}/);
  assert.match(dashboard, /totalLeads: site\._count\.leads/);
  assert.match(dashboard, /launchPassed: readiness\.passed/);
  assert.match(dashboard, /missingForPublish: readiness\.missingForPublish/);
});

test("dashboard card exposes the next operational action", () => {
  const card = readFileSync("components/builder/DashboardSiteCard.tsx", "utf8");

  assert.match(card, /Estado operativo/);
  assert.match(card, /Falta para publicar/);
  assert.match(card, /Listo para publicar/);
  assert.match(card, /Publicado, ZIP pendiente/);
  assert.match(card, /Operativo/);
  assert.match(card, /\/builder\/\$\{site\.id\}\/analytics/);
  assert.match(card, /site\.totalLeads/);
  assert.match(card, /site\.launchPassed/);
});
