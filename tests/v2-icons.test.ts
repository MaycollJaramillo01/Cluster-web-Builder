import assert from "node:assert/strict";
import test from "node:test";

import { iconSvg, resolveIconName, V2_ICON_NAMES } from "../lib/site/v2-icons";

test("el icono se deduce del significado del punto, no de su posicion", () => {
  const casos: Array<[string, string]> = [
    ["Despacho propio. Sin centro de llamadas externo.", "phone"],
    ["Licenciados y asegurados. Verificable antes de firmar.", "shield"],
    ["Expediente fotográfico. Listo para tu ajustador.", "camera"],
    ["Un supervisor asignado. El mismo de principio a fin.", "user"],
    ["Equipo de medición. Secado con datos, no a ojo.", "gauge"],
    ["Alcance por escrito. Antes de empezar la obra.", "document"],
    ["Atención 24/7. Contestamos siempre.", "clock"],
    ["Cobertura en tres condados. Zona metropolitana.", "pin"],
    ["Reparación el mismo día. Sin esperas.", "wrench"],
    ["Presupuesto sin compromiso. Cotización detallada.", "document"],
  ];
  for (const [texto, esperado] of casos) {
    assert.equal(resolveIconName(texto), esperado, `"${texto}" deberia dar ${esperado}`);
  }
});

test("los tokens cortos no arrastran significados ajenos", () => {
  // "guardia" contiene "dia" y "diagnostico" empieza por "dia": ninguno es un reloj.
  assert.notEqual(resolveIconName("Cuadrilla de guardia"), "clock");
  assert.notEqual(resolveIconName("Diagnóstico gratuito"), "clock");
});

test("sin señal reconocible cae en un icono neutro", () => {
  assert.equal(resolveIconName("Trato cercano"), "check");
  assert.equal(resolveIconName(""), "check");
});

test("cada icono emite un SVG en linea que hereda el color", () => {
  for (const name of V2_ICON_NAMES) {
    const svg = iconSvg(name);
    assert.match(svg, /^<svg viewBox="0 0 24 24"/);
    assert.match(svg, /stroke="currentColor"/);
    assert.match(svg, /aria-hidden="true"/);
    assert.match(svg, /<\/svg>$/);
    // Ni data URL ni peticiones externas: el sitio publicado es autocontenido.
    assert.doesNotMatch(svg, /data:|https?:\/\//);
  }
});
