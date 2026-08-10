import assert from "node:assert/strict";
import test from "node:test";
import { scryptSync } from "node:crypto";

import { hashPassword, passwordNeedsRehash, verifyPassword } from "../lib/password";
import { clientIpFromHeaders } from "../lib/security/client-ip";
import { csvCell } from "../lib/security/csv";
import { hasTrustedMutationOrigin, isCsrfExemptPath } from "../lib/security/request-origin";
import { publishedMapSiteWhere } from "../lib/site/public-map";

test("el mapa publico consulta exclusivamente sitios publicados", () => {
  assert.deepEqual(publishedMapSiteWhere, {
    status: "PUBLISHED",
    location: { not: null },
  });
});

test("csvCell neutraliza formulas de hojas de calculo", () => {
  for (const payload of [
    '=HYPERLINK("https://evil.example","Abrir")',
    "+1+1",
    "-1+2",
    "@SUM(1,2)",
    "  =cmd|' /C calc'!A0",
    "\t@SUM(1,2)",
  ]) {
    const result = csvCell(payload);
    assert.ok(result.startsWith("\"'"), `debe neutralizar ${JSON.stringify(payload)}`);
  }
});

test("csvCell conserva texto normal y duplica comillas", () => {
  assert.equal(csvCell("Hola, mundo"), '"Hola, mundo"');
  assert.equal(csvCell('Dijo "hola"'), '"Dijo ""hola"""');
});

test("las cabeceras IP solo se aceptan desde infraestructura confiable", () => {
  const headers = new Headers({
    "x-forwarded-for": "203.0.113.10, 10.0.0.1",
    "x-real-ip": "198.51.100.20",
  });
  assert.equal(clientIpFromHeaders(headers, { vercel: false, trustedProxy: false }), "local");
  assert.equal(clientIpFromHeaders(headers, { vercel: true, trustedProxy: false }), "203.0.113.10");
  assert.equal(clientIpFromHeaders(headers, { vercel: false, trustedProxy: true }), "198.51.100.20");
});

test("scrypt usa el costo actual y conserva compatibilidad con hashes anteriores", async () => {
  const password = "UnaClaveSegura123";
  const current = await hashPassword(password);
  assert.match(current, /^scrypt\$131072\$8\$1\$/);
  assert.equal(await verifyPassword(password, current), true);
  assert.equal(await verifyPassword("incorrecta", current), false);
  assert.equal(passwordNeedsRehash(current), false);

  const salt = "0123456789abcdef0123456789abcdef";
  const legacy = `${salt}:${scryptSync(password, salt, 64).toString("hex")}`;
  assert.equal(await verifyPassword(password, legacy), true);
  assert.equal(passwordNeedsRehash(legacy), true);
});

function mutationRequest(origin?: string, extra: Record<string, string> = {}) {
  const headers = new Headers({ host: "cluster.example", ...extra });
  if (origin !== undefined) headers.set("origin", origin);
  return { method: "POST", url: "https://cluster.example/api/sites/1", headers };
}

test("la proteccion CSRF acepta mismo origen y rechaza origenes cruzados", () => {
  assert.equal(hasTrustedMutationOrigin(mutationRequest("https://cluster.example")), true);
  assert.equal(hasTrustedMutationOrigin(mutationRequest("https://attacker.example")), false);
  assert.equal(hasTrustedMutationOrigin(mutationRequest("null")), false);
  assert.equal(hasTrustedMutationOrigin(mutationRequest(undefined, { "sec-fetch-site": "cross-site" })), false);
  assert.equal(hasTrustedMutationOrigin(mutationRequest(undefined, { "sec-fetch-site": "same-origin" })), true);
});

test("solo integraciones publicas verificadas quedan exentas del filtro CSRF", () => {
  assert.equal(isCsrfExemptPath("/api/billing/webhook"), true);
  assert.equal(isCsrfExemptPath("/api/public/sites/demo/leads"), true);
  assert.equal(isCsrfExemptPath("/api/sites/site-1/publish"), false);
});
