import { DESIGN_STYLE_IDS, getAllDesignPresets, getDesignRecipeFingerprint, resolvePalette } from "../lib/site/design.ts";
import { selectLandingTemplate } from "../lib/site/template-intent.ts";
import { normalizeSocialLinks } from "../lib/site/social-links.ts";
import { promptToOnboardingInput } from "../lib/validators/site-onboarding.ts";

const presets = getAllDesignPresets();
const expectedIds = [...DESIGN_STYLE_IDS].sort();
const selectedPalette = { primary: "#38bdf8", secondary: "#0f172a", accent: "#a3e635", background: "#020617", text: "#f8fafc" };

assert(presets.length === 6, `se esperaban 6 composiciones reales, existen ${presets.length}.`);
assert(JSON.stringify(presets.map((preset) => preset.id).sort()) === JSON.stringify(expectedIds), "el catálogo y las composiciones no coinciden.");
assert(new Set(presets.map(getDesignRecipeFingerprint)).size === 6, "dos templates comparten la misma estructura visual.");
assert(new Set(presets.map((preset) => preset.sectionPlan.join(">"))).size === 6, "dos templates comparten el mismo orden de secciones.");
assert(presets.every((preset) => preset.motionStyle), "algún template no tiene animación.");
assert(presets.every((preset) => preset.sectionPlan[0] === "hero" && preset.sectionPlan.at(-1) === "footer"), "hero y footer deben delimitar todas las composiciones.");
assert(JSON.stringify(resolvePalette(selectedPalette, "Service", "Negocio")) === JSON.stringify(selectedPalette), "la paleta elegida dejó de ser autoritativa.");

const scenarios = [
  ["Service", "Sitio profesional para una consultoría de procesos"],
  ["Editorial", "Portafolio editorial para un estudio de arquitectura"],
  ["Immersive", "Sitio web de pesca y aventura en la naturaleza"],
  ["Catalog", "Tienda con catálogo de productos artesanales"],
  ["Local", "Negocio local familiar para la comunidad"],
  ["Minimal", "Sitio minimal simple y sobrio para un profesional"],
];
for (const [expected, prompt] of scenarios) {
  const input = promptToOnboardingInput(prompt);
  assert(selectLandingTemplate(input, prompt) === expected, `“${prompt}” no seleccionó ${expected}.`);
}

const social = normalizeSocialLinks({ instagram: "@cluster", facebook: "facebook.com/cluster" });
assert(social.instagram === "https://instagram.com/cluster", "Instagram no se normaliza a una URL funcional.");
assert(social.facebook === "https://facebook.com/cluster", "Facebook no se normaliza a una URL funcional.");

console.log("Design system: 6 composiciones estructurales, selección semántica, animación y redes verificadas.");

function assert(condition, message) {
  if (!condition) {
    console.error(`Design system: ${message}`);
    process.exit(1);
  }
}
