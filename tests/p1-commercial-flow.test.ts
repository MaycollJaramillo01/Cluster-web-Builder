import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("editor exposes the commercial launch checklist", () => {
  const editor = readFileSync("components/builder/SiteEditorV2.tsx", "utf8");

  assert.match(editor, /Checklist para lanzar/);
  assert.match(editor, /Contenido base/);
  assert.match(editor, /Logo o portada/);
  assert.match(editor, /Datos de contacto/);
  assert.match(editor, /Formulario activo/);
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

  assert.match(route, /revalidatePath\("\/"\)/);
  assert.match(route, /revalidatePath\(`\/s\/\$\{publishedSlug\}`\)/);
  assert.match(route, /existing\.customDomain/);
  assert.match(route, /replacesSite\?\.customDomain/);
});
