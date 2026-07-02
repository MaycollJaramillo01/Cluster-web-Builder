import { ABOUT_US_STYLES, CONTACT_STYLES, DESIGN_STYLE_IDS, getAllDesignPresets, getDesignPreset, getDesignRecipeFingerprint, resolvePalette } from "../lib/site/design.ts";
import { getFamilyAffinity, selectLandingTemplate } from "../lib/site/template-intent.ts";
import { getTemplateCandidates } from "../lib/site/template-selection.ts";
import { normalizeSocialLinks } from "../lib/site/social-links.ts";
import { promptToOnboardingInput } from "../lib/validators/site-onboarding.ts";

const presets = getAllDesignPresets();
const expectedIds = [...DESIGN_STYLE_IDS].sort();
const selectedPalette = { primary: "#38bdf8", secondary: "#0f172a", accent: "#a3e635", background: "#020617", text: "#f8fafc" };

assert(presets.length === 46, `se esperaban 46 composiciones reales, existen ${presets.length}.`);
assert(JSON.stringify(presets.map((preset) => preset.id).sort()) === JSON.stringify(expectedIds), "el catálogo y las composiciones no coinciden.");
assert(new Set(presets.map(getDesignRecipeFingerprint)).size === 46, "dos templates comparten la misma receta visual.");
assert(new Set(presets.map((preset) => preset.sectionPlan.join(">"))).size === 46, "dos templates comparten el mismo orden principal de secciones.");
const aboutUsed = new Set(presets.map((preset) => preset.aboutUsStyle));
assert(ABOUT_US_STYLES.every((style) => aboutUsed.has(style)), "hay variantes de Nosotros sin conectar a ningún preset.");
assert(presets.every((preset) => ABOUT_US_STYLES.includes(preset.aboutUsStyle)), "algún preset usa una variante de Nosotros inexistente.");
assert(CONTACT_STYLES.length === 20, `se esperaban 20 estilos de formulario, existen ${CONTACT_STYLES.length}.`);
assert(new Set(presets.map((preset) => preset.contactStyle)).size === CONTACT_STYLES.length, "los 20 estilos de formulario no están conectados a los presets.");
assert(presets.every((preset) => CONTACT_STYLES.includes(preset.contactStyle)), "algún preset usa un formulario inexistente.");
assert(presets.every((preset) => preset.motionStyle), "algún template no tiene perfil de animación.");
assert(presets.filter((preset) => preset.heroMedia === "video").length === 6, "deben existir seis presets con hero de video.");
assert(presets.filter((preset) => preset.heroStyle === "gradient").every((preset) => preset.useImages), "ningún hero gradient puede quedar sin imagen.");
assert(presets.every((preset) => preset.sectionPlan[0] === "hero" && preset.sectionPlan.at(-1) === "footer"), "hero y footer deben delimitar todas las composiciones.");
assert(presets.every((preset) => preset.sectionPlan.includes("about_us")), "toda composicion debe incluir la seccion about_us.");
assert(new Set(presets.map((preset) => preset.family)).size === 6, "faltan familias de diseño.");
for (const family of ["service", "editorial", "immersive", "catalog", "local", "minimal"]) {
  const count = presets.filter((preset) => preset.family === family).length;
  assert(count >= 7, `la familia ${family} tiene ${count} composiciones; el mínimo viable es 7.`);
}
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

// Propuestas del picker: variedad entre sitios, afinidad por industria y soporte de estilos legados.
const proposalSets = new Set(
  ["site-1", "site-2", "site-3", "site-4", "site-5", "site-6"].map((siteId) =>
    getTemplateCandidates("Service", { siteId }).map((candidate) => candidate.style).join(","),
  ),
);
assert(proposalSets.size > 1, "todos los sitios reciben las mismas 6 propuestas de diseño.");

for (const siteId of ["site-1", "site-2"]) {
  const candidates = getTemplateCandidates("Service", { siteId, businessType: "Restaurante" });
  assert(candidates.length === 6, "el picker dejó de ofrecer 6 propuestas.");
  assert(new Set(candidates.map((candidate) => candidate.family)).size === 6, "las propuestas repiten familia.");
  assert(candidates[1].family === "catalog" && candidates[2].family === "local", "la afinidad de restaurante no encabeza las propuestas.");
}

const legacyCandidates = getTemplateCandidates("modern_clean", { siteId: "site-legacy" });
assert(legacyCandidates[0].style === "Service" && legacyCandidates.length === 6, "los estilos legados del onboarding no se normalizan en el picker.");

assert(getFamilyAffinity("Restaurante")[0] === "catalog", "la etiqueta Restaurante no mapea a la familia catalog.");
assert(getFamilyAffinity("restaurant")[0] === "catalog", "el enum restaurant no mapea a la familia catalog.");
assert(getFamilyAffinity("Negocio")[0] === "service", "una industria desconocida debe caer a la afinidad genérica.");

const social = normalizeSocialLinks({ instagram: "@cluster", facebook: "facebook.com/cluster" });
assert(social.instagram === "https://instagram.com/cluster", "Instagram no se normaliza a una URL funcional.");
assert(social.facebook === "https://facebook.com/cluster", "Facebook no se normaliza a una URL funcional.");

console.log(`Design system: ${presets.length} composiciones, ${ABOUT_US_STYLES.length} variantes About, ${CONTACT_STYLES.length} formularios, 6 familias (mínimo 7 por familia), afinidad por industria y propuestas variadas por sitio verificados.`);

function assert(condition, message) {
  if (!condition) {
    console.error(`Design system: ${message}`);
    process.exit(1);
  }
}
