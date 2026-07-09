import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("los sitios publicados no bloquean el render contando vistas", () => {
  for (const file of ["app/s/[slug]/page.tsx", "app/d/[domain]/page.tsx"]) {
    const source = readFileSync(file, "utf8");
    assert.match(source, /export const revalidate = 300/);
    assert.match(source, /export const dynamic = "force-static"/);
    assert.doesNotMatch(source, /force-dynamic/);
    assert.doesNotMatch(source, /trackSiteView/);
    assert.match(source, /ViewPixel/);
    assert.match(source, /\/api\/public\/sites\/\$\{encodeURIComponent\(slug\)\}\/view/);
  }
});

test("el tracking público vive en un endpoint no cacheable", () => {
  const source = readFileSync("app/api/public/sites/[slug]/view/route.ts", "utf8");
  assert.match(source, /trackSiteView/);
  assert.match(source, /after\(\(\) => trackSiteView\(site\.id\)\)/);
  assert.match(source, /Cache-Control/);
  assert.match(source, /no-store/);
  assert.match(source, /status: 204/);
});

test("los leads siguen siendo dinámicos y protegidos contra spam básico", () => {
  const source = readFileSync("app/api/public/sites/[slug]/leads/route.ts", "utf8");
  assert.match(source, /consumeRateLimit\("lead"/);
  assert.match(source, /prisma\.lead\.create/);
  assert.match(source, /Cache-Control/);
  assert.match(source, /no-store/);
});

test("hay healthcheck para monitoreo externo", () => {
  const source = readFileSync("app/api/health/route.ts", "utf8");
  assert.match(source, /SELECT 1/);
  assert.match(source, /status: 503/);
  assert.match(source, /Cache-Control/);
});
