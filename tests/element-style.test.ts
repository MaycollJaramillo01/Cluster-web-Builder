import assert from "node:assert/strict";
import test from "node:test";

import {
  getStyleOverride,
  normalizeElementStyle,
  normalizeStyleOverrides,
  resolveElementStyle,
  resolveElementStyleString,
} from "../lib/site/element-style";

test("normalizeElementStyle acepta valores validos y descarta el resto", () => {
  assert.deepEqual(
    normalizeElementStyle({ color: "#8b5cf6", fontSize: "lg", fontWeight: "bold", align: "center", spacing: "loose", borderRadius: "full", borderWidth: "thin", borderColor: "#fff", shadow: "md" }),
    { color: "#8b5cf6", fontSize: "lg", fontWeight: "bold", align: "center", spacing: "loose", borderRadius: "full", borderWidth: "thin", borderColor: "#fff", shadow: "md" }
  );
  assert.deepEqual(
    normalizeElementStyle({ color: "javascript:alert(1)", fontSize: "huge", fontWeight: 900, align: "justify", spacing: "sm" }),
    {}
  );
  assert.deepEqual(normalizeElementStyle(null), {});
  assert.deepEqual(normalizeElementStyle("not-an-object"), {});
});

test("normalizeStyleOverrides normaliza cada rol y descarta roles vacios", () => {
  const result = normalizeStyleOverrides({
    title: { color: "#111111" },
    subtitle: { color: "not-a-hex" },
    section: { background: "#eeeeee", spacing: "tight" },
    unknownRole: { color: "#000000" },
  });
  assert.deepEqual(result, {
    title: { color: "#111111" },
    section: { background: "#eeeeee", spacing: "tight" },
  });
});

test("getStyleOverride lee un rol especifico directamente desde settings", () => {
  const settings = { layout: { width: "wide" }, styleOverrides: { ctaText: { fontWeight: "bold" } } };
  assert.deepEqual(getStyleOverride(settings, "ctaText"), { fontWeight: "bold" });
  assert.equal(getStyleOverride(settings, "body"), undefined);
  assert.equal(getStyleOverride(undefined, "title"), undefined);
});

test("resolveElementStyle solo emite las claves overrideadas, convertidas a CSS concreto", () => {
  assert.deepEqual(resolveElementStyle("title", undefined), {});
  assert.deepEqual(resolveElementStyle("title", { fontSize: "lg", color: "#8b5cf6" }), {
    fontSize: "3rem",
    color: "#8b5cf6",
  });
  assert.deepEqual(resolveElementStyle("section", { spacing: "tight", background: "#111" }), {
    paddingBlock: "1.5rem",
    backgroundColor: "#111",
  });
  assert.deepEqual(resolveElementStyle("body", { spacing: "loose" }), { marginTop: "2rem" });
});

test("resolveElementStyle deriva border-style y border-color por defecto al fijar un ancho de borde", () => {
  const style = resolveElementStyle("ctaText", { borderWidth: "thin" });
  assert.equal(style.borderWidth, "1px");
  assert.equal(style.borderStyle, "solid");
  assert.equal(style.borderColor, "currentColor");
});

test("resolveElementStyleString produce una cadena CSS lista para un atributo style", () => {
  const css = resolveElementStyleString("section", { background: "#101010", spacing: "loose" });
  assert.match(css, /background-color:#101010/);
  assert.match(css, /padding-block:5rem/);
  assert.equal(resolveElementStyleString("section", undefined), "");
});
