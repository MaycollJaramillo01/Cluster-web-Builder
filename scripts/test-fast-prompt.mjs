import { createHash } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL || "http://localhost:3010";
const ip = `203.0.113.${Math.floor(Math.random() * 100) + 100}`;
let siteId;

try {
  const startedAt = performance.now();
  const response = await fetch(`${baseUrl}/api/ai/generate-site`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": ip },
    body: JSON.stringify({ prompt: "Sitio web de pesca" }),
  });
  const cookie = response.headers.get("set-cookie")?.split(";", 1)[0];
  const stream = await response.text();
  const elapsed = Math.round(performance.now() - startedAt);
  const savedBlock = stream.split("\n\n").find((block) => block.startsWith("event: saved"));
  const payload = JSON.parse(savedBlock?.split("\ndata: ")[1] || "{}");
  siteId = payload.siteId;

  assert(response.status === 200 && siteId, "el prompt corto no generó un proyecto");
  assert(stream.includes("Explorando estilo modern_clean"), "el prompt de pesca no conservó la dirección visual esperada");

  const site = await prisma.site.findUnique({ where: { id: siteId }, include: { sections: true } });
  assert(/pesca/i.test(site?.businessName || "") && site?.businessType === "Pesca", "el parser no reconoció la actividad de pesca");
  assert(site?.visualStyle === "modern_clean", "el sitio de pesca no conservó su dirección visual");
  assertCopyQuality(site);
  const prompts = (site.blueprintJson?.site?.pages?.[0]?.sections || []).map((section) => section.content?.imagePrompt).filter(Boolean).join(" ");
  assert(/pesca|fishing/i.test(prompts), "las imágenes generadas no conservan el tema de pesca");

  const preview = await fetch(`${baseUrl}/preview/${siteId}?compact=1`, { headers: { Cookie: cookie || "" } }).then((result) => result.text());
  assert(preview.includes("fishing"), "las imágenes del preview no usan una búsqueda relacionada con pesca");
  assert(!preview.includes("fishing%2Cphotography") && !preview.includes("fishing%252Cphotography"), "la búsqueda mezcla pesca con fotografía genérica");
  console.log(`Prompt corto: OK — pesca reconocida, copy medido y documento V2 generado en ${elapsed} ms.`);
} finally {
  if (siteId) await prisma.site.deleteMany({ where: { id: siteId } });
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: `generation:${hash(ip).slice(0, 24)}:` } } });
  await prisma.$disconnect();
}

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function assert(condition, message) { if (!condition) throw new Error(message); }

function assertCopyQuality(site) {
  const blueprint = site?.blueprintJson?.site;
  assert(between(blueprint?.seo?.title, 25, 65), "el SEO title no cumple 25-65 caracteres");
  assert(between(blueprint?.seo?.metaDescription, 80, 165), "la meta description no cumple 80-165 caracteres");
  const sections = site?.blueprintJson?.site?.pages?.[0]?.sections || [];
  const hero = sections.find((section) => section.type === "hero");
  assert(between(hero?.title, 8, 72), "el título del hero no cumple 8-72 caracteres");
  assert(between(hero?.content?.subtitle, 12, 110), "el subtítulo del hero no cumple 12-110 caracteres");
  assert(between(hero?.content?.body, 45, 240), "el body del hero no cumple 45-240 caracteres");
  assert(wordCount(hero?.content?.ctaText) >= 1 && wordCount(hero?.content?.ctaText) <= 5, "el CTA del hero no cumple 1-5 palabras");
  const generic = /lleva tu negocio al siguiente nivel|soluciones innovadoras|transformamos tus ideas|experiencia premium|somos líderes|calidad garantizada/i;
  const allCopy = sections.map((section) => `${section.title} ${section.content?.subtitle || ""} ${section.content?.body || ""}`).join(" ");
  assert(!generic.test(allCopy), "el sitio conserva frases genéricas prohibidas");
}

function between(value, min, max) { return typeof value === "string" && value.trim().length >= min && value.trim().length <= max; }
function wordCount(value) { return typeof value === "string" && value.trim() ? value.trim().split(/\s+/).length : 0; }
