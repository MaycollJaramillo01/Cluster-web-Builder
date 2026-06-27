import {
  DESIGN_STYLE_IDS,
  getAllDesignPresets,
  getDesignRecipeFingerprint,
  getPalette,
  resolvePalette,
} from "../lib/site/design.ts";
import { promptToOnboardingInput } from "../lib/validators/site-onboarding.ts";

const presets = getAllDesignPresets();
const fingerprints = presets.map(getDesignRecipeFingerprint);
const plans = presets.map((preset) => preset.sectionPlan.join(">"));
const footerStyles = presets.map((preset) => preset.footerStyle);
const aboutUsStyles = presets.map((preset) => preset.aboutUsStyle);
const expectedIds = [...DESIGN_STYLE_IDS].sort();
const actualIds = presets.map((preset) => preset.id).sort();
const expectedFooterStyles = ["brutal", "centered", "columns", "darkBand", "editorial", "minimal"];
const selectedPalette = {
  primary: "#38bdf8",
  secondary: "#0f172a",
  accent: "#a3e635",
  background: "#020617",
  text: "#f8fafc",
};

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
assert(new Set(aboutUsStyles).size >= 12, "las recetas no ofrecen suficiente variedad para About Us.");
assert(presets.some((preset) => preset.sectionPlan.includes("about_us")), "ninguna receta genera About Us.");
assert(presets.every((preset) => !preset.sectionPlan.includes("about")), "una receta nueva sigue usando el bloque About anterior.");
assert(
  JSON.stringify(resolvePalette(selectedPalette, "luxury_light", "otro negocio")) === JSON.stringify(selectedPalette),
  "una paleta elegida por el usuario fue reemplazada por la paleta del diseno."
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

const genericInput = promptToOnboardingInput("Crea un sitio profesional para mi negocio local");
assert(genericInput.targetCustomer === "Clientes potenciales", "el parser produce una audiencia genérica o robótica.");

console.log(`Design diversity: 25 estilos, 25 recetas, 25 planes, 6 footers y ${new Set(aboutUsStyles).size} variantes About Us.`);

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
