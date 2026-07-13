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
  assert.match(source, /integrationStatus/);
  assert.match(source, /BLOB_READ_WRITE_TOKEN/);
  assert.match(source, /STRIPE_SECRET_KEY/);
  assert.match(source, /BREVO_API_KEY/);
});

test("home y portada usan contenido V2 real en vez de buscar hero legacy", () => {
  const home = readFileSync("components/marketing/HomeSections.tsx", "utf8");
  const cover = readFileSync("app/api/public/sites/[slug]/cover/route.ts", "utf8");

  assert.match(home, /builderVersion: true/);
  assert.match(home, /contentJson: true/);
  assert.match(home, /normalizeSiteContentV2/);
  assert.match(home, /v2\?\.hero\.subtitle/);

  assert.match(cover, /builderVersion: true/);
  assert.match(cover, /contentJson: true/);
  assert.match(cover, /designJson: true/);
  assert.match(cover, /normalizeSiteContentV2/);
  assert.match(cover, /v2Content\?\.hero\.media/);
  assert.match(cover, /imageUrlFor/);
});

test("guardado y generación V2 materializan medios antes de persistir", () => {
  const persist = readFileSync("lib/site/persist-generated-site.ts", "utf8");
  const route = readFileSync("app/api/sites/[siteId]/route.ts", "utf8");
  const media = readFileSync("lib/site/media.ts", "utf8");

  assert.match(media, /materializeDataUrlsForSite/);
  assert.match(media, /stripDataUrls/);
  assert.match(media, /put\(/);
  assert.match(media, /BLOB_READ_WRITE_TOKEN/);
  assert.doesNotMatch(persist, /logoUrl: input\.assets\?\.logoDataUrl \|\| null/);
  assert.doesNotMatch(persist, /coverUrl: input\.assets\?\.coverDataUrl \|\| null/);
  assert.match(persist, /stripDataUrls\(v2\.content\)/);
  assert.match(persist, /materializeDataUrlsForSite\(site\.id, v2\.content/);
  assert.match(route, /materializeDataUrlsForSite\(siteId, normalizedContent/);
  assert.match(route, /logoUrl: content\.business\.logo \|\| null/);
  assert.match(route, /coverUrl: content\.hero\.media/);
});
