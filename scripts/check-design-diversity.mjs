import {
  DESIGN_STYLE_IDS,
  getAllDesignPresets,
  getDesignRecipeFingerprint,
  getPalette,
} from "../lib/site/design.ts";

const presets = getAllDesignPresets();
const fingerprints = presets.map(getDesignRecipeFingerprint);
const plans = presets.map((preset) => preset.sectionPlan.join(">"));
const footerStyles = presets.map((preset) => preset.footerStyle);
const expectedIds = [...DESIGN_STYLE_IDS].sort();
const actualIds = presets.map((preset) => preset.id).sort();
const expectedFooterStyles = ["brutal", "centered", "columns", "darkBand", "editorial", "minimal"];

function assert(condition, message) {
  if (!condition) {
    console.error(`Design diversity: ${message}`);
    process.exit(1);
  }
}

assert(presets.length === 25, `se esperaban 25 recetas, existen ${presets.length}.`);
assert(new Set(actualIds).size === 25, "hay identificadores de estilo duplicados.");
assert(JSON.stringify(actualIds) === JSON.stringify(expectedIds), "la lista de estilos y las recetas no coinciden.");
assert(new Set(fingerprints).size === 25, "dos estilos comparten la misma receta visual.");
assert(new Set(plans).size === 25, "dos estilos comparten exactamente el mismo plan de secciones.");
assert(
  JSON.stringify([...new Set(footerStyles)].sort()) === JSON.stringify(expectedFooterStyles),
  "faltan variantes de footer o alguna receta usa una variante desconocida."
);

for (const preset of presets) {
  assert(preset.sectionPlan[0] === "hero", `${preset.id} no empieza con hero.`);
  assert(preset.sectionPlan.includes("cta"), `${preset.id} no incluye CTA.`);
  assert(preset.sectionPlan.at(-1) === "footer", `${preset.id} no termina con footer.`);
  const palette = getPalette(preset.paletteId, preset.id);
  assert(
    contrastRatio(palette.background, palette.text) >= 4.5,
    `${preset.id} no cumple contraste AA entre fondo y texto.`
  );
  const ctaContrast = Math.max(
    contrastRatio(palette.accent, "#0f172a"),
    contrastRatio(palette.accent, "#ffffff")
  );
  assert(ctaContrast >= 4.5, `${preset.id} no tiene un color de CTA legible.`);
}

console.log("Design diversity: 25 estilos, 25 recetas, 25 planes unicos y 6 footers.");

function contrastRatio(first, second) {
  const firstLuminance = luminance(first);
  const secondLuminance = luminance(second);
  return (Math.max(firstLuminance, secondLuminance) + 0.05) /
    (Math.min(firstLuminance, secondLuminance) + 0.05);
}

function luminance(hex) {
  const value = hex.replace("#", "");
  const channels = [0, 2, 4].map((index) =>
    parseInt(value.slice(index, index + 2), 16) / 255
  );
  const [red, green, blue] = channels.map((channel) =>
    channel <= 0.03928 ? channel / 12.92 : ((channel + 0.055) / 1.055) ** 2.4
  );
  return 0.2126 * red + 0.7152 * green + 0.0722 * blue;
}
