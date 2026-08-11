import assert from "node:assert/strict";
import { existsSync, readFileSync, readdirSync } from "node:fs";
import test from "node:test";

import { isLocalPreviewHost, isLocalPreviewRequest } from "../lib/site/local-preview";

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

test("los catálogos y el editor Legacy ya no existen", () => {
  assert.equal(existsSync("components/builder/SiteEditorPanel.tsx"), false);
  assert.equal(existsSync("components/builder/TemplatePickerV2.tsx"), false);
  assert.equal(existsSync("app/plantillas-locales/page.tsx"), false);
  assert.equal(existsSync("lib/site/v2-templates.ts"), false);
  assert.equal(existsSync("lib/site/template-selection.ts"), false);
  assert.equal(existsSync("app/api/sites/[siteId]/template/route.ts"), false);
  assert.deepEqual(
    existsSync("public/templates/v2") ? readdirSync("public/templates/v2", { recursive: true }) : [],
    [],
  );
});

test("el laboratorio de sitios solo acepta hosts locales", () => {
  assert.equal(isLocalPreviewHost("127.0.0.1:3000"), true);
  assert.equal(isLocalPreviewHost("localhost:3000"), true);
  assert.equal(isLocalPreviewHost("[::1]:3000"), true);
  assert.equal(isLocalPreviewHost("sitios.example.com"), false);
  assert.equal(isLocalPreviewHost("localhost.example.com"), false);
  assert.equal(isLocalPreviewHost(null), false);
  assert.equal(isLocalPreviewRequest("localhost:3000", "development"), true);
  assert.equal(isLocalPreviewRequest("localhost:3000", "production"), false);
});
