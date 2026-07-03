import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";
import { renderSiteV2 } from "../lib/site/v2-render.ts";
import { getAllTemplatesV2, instantiateTemplateV2 } from "../lib/site/v2-templates.ts";
import { normalizeSiteContentV2 } from "../lib/site/v2-schema.ts";

const output = resolve("test-results", "builder-v2");
await mkdir(output, { recursive: true });
const content = normalizeSiteContentV2({
  business: { name: "Forma Norte", type: "Arquitectura y diseño", location: "Managua, Nicaragua", phone: "+505 2222 2222", email: "hola@formanorte.test" },
  hero: { title: "Arquitectura que pertenece a su lugar", subtitle: "Vivienda, comercio y hospitalidad", body: "Diseñamos espacios claros, durables y conectados con el clima tropical.", ctaText: "Conocer proyectos", ctaLink: "#services", media: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600" },
  about: { title: "Diseño con criterio local", subtitle: "Sobre Forma Norte", body: "Un estudio cercano que acompaña decisiones desde el primer croquis hasta la obra.", media: "https://images.pexels.com/photos/1170412/pexels-photo-1170412.jpeg?auto=compress&cs=tinysrgb&w=1200", highlights: [{ title: "Proceso directo", description: "Una conversación clara en cada etapa." }] },
  services: [{ title: "Arquitectura residencial", description: "Casas pensadas para el clima y la vida diaria." }, { title: "Espacios comerciales", description: "Locales que ordenan la experiencia de marca." }, { title: "Dirección de obra", description: "Seguimiento técnico y decisiones documentadas." }],
  benefits: [{ title: "Contexto primero", description: "Cada decisión responde al sitio." }, { title: "Presupuesto visible", description: "Alcances y prioridades claros." }],
  reviews: [{ name: "María P.", role: "Propietaria", quote: "El proceso fue claro y el resultado se siente nuestro.", rating: 5 }],
  faqs: [{ question: "¿Trabajan fuera de Managua?", answer: "Sí, evaluamos proyectos en todo Nicaragua." }],
  contact: { title: "Conversemos sobre el proyecto", body: "Cuéntanos el lugar, el alcance y la etapa actual.", ctaText: "Enviar consulta" },
  social: { instagram: "https://instagram.com", facebook: "https://facebook.com" },
  seo: { title: "Forma Norte Arquitectura en Nicaragua", description: "Diseño arquitectónico residencial y comercial con enfoque tropical.", keyword: "arquitectura Nicaragua" },
});

const report = [];
for (const template of getAllTemplatesV2()) {
  const document = instantiateTemplateV2(template.id, content);
  const rendered = renderSiteV2({ content, design: template.theme, sections: document.sections, leadEndpoint: "/api/leads" });
  await writeFile(resolve(output, `${template.id}.html`), rendered.html);
  report.push({ id: template.id, sections: document.sections.length, rows: document.sections.reduce((sum, section) => sum + section.rows.length, 0), widgets: document.sections.flatMap((section) => section.rows).flatMap((row) => row.columns).reduce((sum, column) => sum + column.widgets.length, 0), motion: template.theme.motion });
}
await writeFile(resolve(output, "visual-report.json"), JSON.stringify({ generatedAt: new Date().toISOString(), viewportTargets: ["1440x900", "768x1024", "390x844"], templates: report }, null, 2));
console.log(`Resultados V2 creados en ${output}`);
