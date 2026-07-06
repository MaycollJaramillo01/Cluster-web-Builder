import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { renderSiteV2 } from "../lib/site/v2-render.ts";
import { instantiateTemplateV2 } from "../lib/site/v2-templates.ts";

const output = resolve("test-results/templates-randomized");
const selections = [
  { template: "essential", style: "Minimal", draw: 0 },
  { template: "assurance", style: "Corporate Professional", draw: 1 },
  { template: "nordic", style: "Scandinavian", draw: 2 },
  { template: "metro", style: "Metropolitan", draw: 3 },
  { template: "deco", style: "Art Deco", draw: 4 },
];
const content = {
  business: { name: "Forma Norte", type: "Arquitectura residencial", location: "Managua, Nicaragua", phone: "+505 8888 1234", email: "hola@formanorte.example", logo: "" },
  hero: { title: "Espacios claros para vivir mejor", subtitle: "Arquitectura que elimina lo innecesario", body: "Diseñamos hogares serenos, funcionales y duraderos a partir de cómo vives cada día.", ctaText: "Conversemos", ctaLink: "#contact", media: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200" },
  about: { title: "Menos ruido. Mejores decisiones.", subtitle: "Nuestra forma de trabajar", body: "Cada proyecto parte de una conversación directa, una lectura cuidadosa del lugar y decisiones que aportan valor real.", media: "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1200", highlights: [{ title: "Dirección cercana", description: "Un responsable acompaña todo el proceso." }, { title: "Materiales honestos", description: "Elegidos por uso, clima y permanencia." }] },
  services: [{ title: "Diseño residencial", description: "Distribución, planos y materialidad." }, { title: "Renovación", description: "Transformaciones precisas sin perder el carácter del espacio." }, { title: "Interiores", description: "Luz, mobiliario y acabados pensados como un conjunto." }],
  benefits: [{ title: "Proceso visible", description: "Siempre sabes qué sigue." }, { title: "Alcance claro", description: "Decisiones y costos documentados." }, { title: "Diseño duradero", description: "Soluciones para la vida real." }],
  reviews: [{ name: "Ana López", role: "Propietaria", quote: "El resultado se siente nuestro y cada espacio funciona mejor.", rating: 5, source: "Cliente" }, { name: "Carlos Ruiz", role: "Comerciante", quote: "El proceso fue claro desde la primera conversación hasta la entrega.", rating: 5, source: "Cliente" }],
  faqs: [{ question: "¿Podemos trabajar por etapas?", answer: "Sí. Podemos comenzar con diagnóstico y diseño antes de definir la obra." }, { question: "¿Atienden fuera de Managua?", answer: "Evaluamos cada proyecto según su alcance y calendario." }],
  contact: { title: "Hablemos de tu espacio", body: "Cuéntanos qué quieres mejorar y te responderemos con un siguiente paso claro.", ctaText: "Enviar consulta" },
  media: [], social: {}, seo: { title: "Forma Norte | Arquitectura residencial", description: "Arquitectura residencial clara, funcional y duradera en Managua.", keyword: "arquitectura residencial" },
};

await mkdir(output, { recursive: true });
const manifest = [];
for (const selection of selections) {
  const document = instantiateTemplateV2(selection.template, content);
  const rendered = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads", publicUrl: `https://${selection.template}.example.com`, indexable: true });
  await writeFile(resolve(output, `${selection.template}.html`), rendered.html, "utf8");
  manifest.push({ ...selection, sections: document.sections.length });
}
await writeFile(resolve(output, "manifest.json"), JSON.stringify({ selectionMethod: "cryptographic shuffle without replacement", candidateCount: 25, templates: manifest }, null, 2), "utf8");
console.log(`${manifest.length} plantillas aleatorias renderizadas en ${output}`);
