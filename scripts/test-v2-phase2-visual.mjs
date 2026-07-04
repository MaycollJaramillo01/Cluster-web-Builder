import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

import { renderSiteV2 } from "../lib/site/v2-render.ts";
import { instantiateTemplateV2 } from "../lib/site/v2-templates.ts";

const output = resolve("test-results/fase-2-render-v2");
const templates = ["conversion", "editorial", "catalog", "local", "immersive", "minimal"];
const content = {
  business: { name: "Casa Norte", type: "Arquitectura y renovación", location: "Managua, Nicaragua", phone: "+505 8888 1234", email: "hola@casanorte.example", logo: "" },
  hero: { title: "Espacios que funcionan todos los días", subtitle: "Diseño local con atención directa", body: "Diseñamos y renovamos hogares con soluciones claras, materiales duraderos y seguimiento cercano.", ctaText: "Solicitar consulta", ctaLink: "#contact", media: "https://images.pexels.com/photos/323780/pexels-photo-323780.jpeg?auto=compress&cs=tinysrgb&w=1600" },
  about: { title: "Diseño basado en cómo vives", subtitle: "Sobre Casa Norte", body: "Cada proyecto comienza con una conversación práctica. Estudiamos luz, circulación y presupuesto para convertir necesidades reales en espacios cómodos.", media: "https://images.pexels.com/photos/1571460/pexels-photo-1571460.jpeg?auto=compress&cs=tinysrgb&w=1200", highlights: [{ title: "Dirección cercana", description: "Un responsable acompaña cada etapa." }, { title: "Decisiones claras", description: "Alcance, materiales y tiempos documentados." }] },
  services: [
    { title: "Diseño residencial", description: "Distribución, planos y selección de materiales.", image: "https://images.pexels.com/photos/1643383/pexels-photo-1643383.jpeg?auto=compress&cs=tinysrgb&w=900" },
    { title: "Renovación integral", description: "Coordinación de obra para viviendas y comercios.", image: "https://images.pexels.com/photos/3935333/pexels-photo-3935333.jpeg?auto=compress&cs=tinysrgb&w=900" },
    { title: "Interiores", description: "Iluminación, mobiliario y acabados coherentes.", image: "https://images.pexels.com/photos/1457842/pexels-photo-1457842.jpeg?auto=compress&cs=tinysrgb&w=900" },
    { title: "Consultoría", description: "Evaluación puntual antes de comprar o construir." },
  ],
  benefits: [{ title: "Proceso visible", description: "Sabes qué sigue y quién responde." }, { title: "Presupuesto cuidado", description: "Priorizamos decisiones que aportan valor." }, { title: "Diseño durable", description: "Soluciones adaptadas al clima y al uso diario." }],
  reviews: [{ name: "María López", role: "Propietaria", quote: "Entendieron cómo usamos la casa y resolvieron cada espacio sin complicar el proceso.", rating: 5, source: "Cliente" }, { name: "Carlos Ruiz", role: "Comerciante", quote: "La obra mantuvo un orden claro y pudimos abrir en la fecha acordada.", rating: 5, source: "Cliente" }, { name: "Ana Torres", role: "Propietaria", quote: "El resultado se siente nuestro y funciona mejor de lo que imaginábamos.", rating: 5, source: "Cliente" }],
  faqs: [{ question: "¿Trabajan proyectos por etapas?", answer: "Sí. Podemos comenzar con diagnóstico y diseño antes de definir la construcción." }, { question: "¿Cómo inicia una consulta?", answer: "Conversamos sobre el espacio, los objetivos y el rango de inversión disponible." }, { question: "¿Atienden fuera de Managua?", answer: "Evaluamos proyectos en otras ciudades según alcance y calendario." }],
  contact: { title: "Conversemos sobre tu espacio", body: "Cuéntanos qué quieres mejorar y te responderemos con el siguiente paso.", ctaText: "Enviar consulta" },
  media: [{ url: "https://images.pexels.com/photos/271795/pexels-photo-271795.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Sala renovada" }, { url: "https://images.pexels.com/photos/259588/pexels-photo-259588.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Casa contemporánea" }, { url: "https://images.pexels.com/photos/276724/pexels-photo-276724.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Interior luminoso" }, { url: "https://images.pexels.com/photos/1732414/pexels-photo-1732414.jpeg?auto=compress&cs=tinysrgb&w=1000", alt: "Fachada residencial" }],
  social: { Instagram: "https://instagram.com/casanorte", Facebook: "https://facebook.com/casanorte" },
  seo: { title: "Casa Norte | Arquitectura y renovación en Managua", description: "Diseño residencial, interiores y renovación con atención directa en Managua.", keyword: "arquitectura en Managua" },
};

await mkdir(output, { recursive: true });
const manifest = [];
for (const id of templates) {
  const document = instantiateTemplateV2(id, content);
  const rendered = renderSiteV2({ content: document.content, design: document.template.theme, sections: document.sections, leadEndpoint: "/api/leads", publicUrl: `https://${id}.example.com`, indexable: true });
  const file = resolve(output, `${id}.html`);
  await writeFile(file, rendered.html, "utf8");
  manifest.push({ id, file, sections: document.sections.length, bytes: Buffer.byteLength(rendered.html) });
}
await writeFile(resolve(output, "manifest.json"), JSON.stringify(manifest, null, 2), "utf8");
console.log(`Fase 2 visual: ${manifest.length} plantillas renderizadas en ${output}`);
