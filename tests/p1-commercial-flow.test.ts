import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("editor exposes the commercial launch checklist", () => {
  const editor = readFileSync("components/builder/SiteEditorV2.tsx", "utf8");
  const readiness = readFileSync("lib/site/launch-readiness.ts", "utf8");

  assert.match(editor, /getLaunchReadinessV2/);
  assert.match(editor, /Checklist para lanzar/);
  assert.match(editor, /Publica el sitio para habilitar el ZIP/);
  assert.match(readiness, /Contenido base/);
  assert.match(readiness, /Logo o portada/);
  assert.match(readiness, /Teléfono o email/);
  assert.match(readiness, /Formulario activo/);
  assert.match(editor, /\/builder\/\$\{siteId\}\/leads/);
  assert.match(editor, /\/builder\/\$\{siteId\}\/domain/);
  assert.match(editor, /onDownload/);
});

test("published sites can be updated from the editor and gated intentionally", () => {
  const editor = readFileSync("components/builder/SiteEditorV2.tsx", "utf8");

  assert.match(editor, /response\.status === 401/);
  assert.match(editor, /\/login\?from=/);
  assert.match(editor, /response\.status === 402/);
  assert.match(editor, /\/billing\?from=/);
  assert.match(editor, /status === "PUBLISHED" \? "Actualizar" : "Publicar"/);
});

test("publishing invalidates cached public entry points", () => {
  const route = readFileSync("app/api/sites/[siteId]/publish/route.ts", "utf8");

  assert.match(route, /getSiteLaunchReadiness/);
  assert.match(route, /LAUNCH_NOT_READY/);
  assert.match(route, /revalidatePath\("\/"\)/);
  assert.match(route, /revalidatePath\(`\/s\/\$\{publishedSlug\}`\)/);
  assert.match(route, /existing\.customDomain/);
  assert.match(route, /replacesSite\?\.customDomain/);
});

test("download is gated so exported forms stay functional", () => {
  const route = readFileSync("app/api/sites/[siteId]/download/route.ts", "utf8");

  assert.match(route, /getSiteLaunchReadiness/);
  assert.match(route, /canDownload/);
  assert.match(route, /endpoint público de leads/);
  assert.match(route, /LAUNCH_NOT_READY/);
});
