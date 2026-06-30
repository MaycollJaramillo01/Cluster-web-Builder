import { ABOUT_US_STYLES, CONTACT_STYLES, DESIGN_STYLE_IDS, getAllDesignPresets, getDesignPreset, getDesignRecipeFingerprint, resolvePalette } from "../lib/site/design.ts";
import { selectLandingTemplate } from "../lib/site/template-intent.ts";
import { normalizeSocialLinks } from "../lib/site/social-links.ts";
import { promptToOnboardingInput } from "../lib/validators/site-onboarding.ts";

const presets = getAllDesignPresets();
const expectedIds = [...DESIGN_STYLE_IDS].sort();
const selectedPalette = { primary: "#38bdf8", secondary: "#0f172a", accent: "#a3e635", background: "#020617", text: "#f8fafc" };

assert(presets.length === 26, `se esperaban 26 composiciones reales, existen ${presets.length}.`);
assert(JSON.stringify(presets.map((preset) => preset.id).sort()) === JSON.stringify(expectedIds), "el catálogo y las composiciones no coinciden.");
assert(new Set(presets.map(getDesignRecipeFingerprint)).size === 26, "dos templates comparten la misma receta visual.");
assert(new Set(presets.map((preset) => preset.sectionPlan.join(">"))).size === 26, "dos templates comparten el mismo orden principal de secciones.");
assert(new Set(presets.map((preset) => preset.aboutUsStyle)).size === ABOUT_US_STYLES.length, "las 26 variantes de Nosotros no están conectadas una a una.");
assert(CONTACT_STYLES.length === 20, `se esperaban 20 estilos de formulario, existen ${CONTACT_STYLES.length}.`);
assert(new Set(presets.map((preset) => preset.contactStyle)).size === CONTACT_STYLES.length, "los 20 estilos de formulario no están conectados a los presets.");
assert(presets.every((preset) => CONTACT_STYLES.includes(preset.contactStyle)), "algún preset usa un formulario inexistente.");
assert(presets.every((preset) => preset.motionStyle), "algún template no tiene perfil de animación.");
assert(presets.every((preset) => preset.sectionPlan[0] === "hero" && preset.sectionPlan.at(-1) === "footer"), "hero y footer deben delimitar todas las composiciones.");
assert(new Set(presets.map((preset) => preset.family)).size === 6, "faltan familias de diseño.");
assert(JSON.stringify(resolvePalette(selectedPalette, "Service", "Negocio")) === JSON.stringify(selectedPalette), "la paleta elegida dejó de ser autoritativa.");

const scenarios = [
  ["Immersive", "Sitio web de pesca y aventura en la naturaleza"],
  ["Manifesto", "Sitio brutal con formato de manifiesto rebelde"],
  ["Collage", "Portafolio collage para una agencia creativa"],
  ["Portrait", "Sitio de retrato personal para un autor"],
  ["Metrics", "Consultoría financiera enfocada en métricas y resultados"],
  ["Numbered", "Servicios explicados como proceso paso a paso"],
];
for (const [expected, prompt] of scenarios) {
  const input = promptToOnboardingInput(prompt);
  assert(selectLandingTemplate(input, prompt) === expected, `“${prompt}” no seleccionó ${expected}.`);
}

const genericFamilies = [
  ["service", "Sitio profesional para una consultoría de procesos"],
  ["editorial", "Portafolio editorial para un estudio de arquitectura"],
  ["catalog", "Tienda con catálogo de productos artesanales"],
  ["local", "Negocio local familiar para la comunidad"],
  ["minimal", "Sitio minimal simple y sobrio para un profesional"],
];
for (const [family, prompt] of genericFamilies) {
  const input = promptToOnboardingInput(prompt);
  const selected = selectLandingTemplate(input, prompt);
  assert(getDesignPreset(selected).family === family, `“${prompt}” no seleccionó la familia ${family}.`);
}

const social = normalizeSocialLinks({ instagram: "@cluster", facebook: "facebook.com/cluster" });
assert(social.instagram === "https://instagram.com/cluster", "Instagram no se normaliza a una URL funcional.");
assert(social.facebook === "https://facebook.com/cluster", "Facebook no se normaliza a una URL funcional.");

console.log("Design system: 26 composiciones, 26 variantes About, 20 formularios, 6 familias y 6 perfiles de movimiento verificados.");

function assert(condition, message) {
  if (!condition) {
    console.error(`Design system: ${message}`);
    process.exit(1);
  }
}
