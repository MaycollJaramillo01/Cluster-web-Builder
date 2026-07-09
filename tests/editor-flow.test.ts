import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import test from "node:test";

test("la generación abre directo el editor, no el selector de templates", () => {
  const stream = readFileSync("components/builder/useGenerationStream.ts", "utf8");
  assert.match(stream, /router\.push\(`\/builder\/\$\{payload\.siteId\}`\)/);
  assert.doesNotMatch(stream, /\/builder\/\$\{payload\.siteId\}\/templates/);
});

test("el editor principal no muestra cambio de plantilla", () => {
  const editor = readFileSync("components/builder/SiteEditorV2.tsx", "utf8");
  assert.doesNotMatch(editor, /getAllTemplatesV2\(\)/);
  assert.doesNotMatch(editor, /applyTemplate/);
  assert.doesNotMatch(editor, /Cambiar plantilla/);
});
