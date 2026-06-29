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
  assert(stream.includes("Explorando estilo Immersive"), "el prompt de pesca no seleccionó la composición inmersiva");

  const site = await prisma.site.findUnique({ where: { id: siteId }, include: { sections: true } });
  assert(/pesca/i.test(site?.businessName || "") && site?.businessType === "Pesca", "el parser no reconoció la actividad de pesca");
  assert(site?.visualStyle === "Immersive", "el sitio de pesca terminó usando una plantilla genérica");
  const prompts = site.sections.map((section) => section.content?.imagePrompt).filter(Boolean).join(" ");
  assert(/pesca|fishing/i.test(prompts), "las imágenes generadas no conservan el tema de pesca");

  const preview = await fetch(`${baseUrl}/preview/${siteId}?compact=1`, { headers: { Cookie: cookie || "" } }).then((result) => result.text());
  assert(preview.includes("fishing"), "las imágenes del preview no usan una búsqueda relacionada con pesca");
  assert(!preview.includes("fishing%2Cphotography") && !preview.includes("fishing%252Cphotography"), "la búsqueda mezcla pesca con fotografía genérica");
  console.log(`Prompt corto: OK — pesca reconocida con composición Immersive en ${elapsed} ms.`);
} finally {
  if (siteId) await prisma.site.deleteMany({ where: { id: siteId } });
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: `generation:${hash(ip).slice(0, 24)}:` } } });
  await prisma.$disconnect();
}

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function assert(condition, message) { if (!condition) throw new Error(message); }
