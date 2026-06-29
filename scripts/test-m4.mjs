import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL || "http://localhost:3010";
const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const guestToken = randomBytes(24).toString("base64url");
const businessName = `M4 Templates ${suffix}`;

try {
  const site = await prisma.site.create({ data: {
    userId: null,
    guestTokenHash: hash(guestToken),
    guestExpiresAt: new Date(Date.now() + 60_000),
    businessName,
    businessType: "Cafetería",
    publicSlug: `m4-${suffix}`,
    status: "GENERATED",
    visualStyle: "Service",
    primaryColor: "#123456",
    secondaryColor: "#234567",
    accentColor: "#345678",
    blueprintJson: { site: { visualStyle: { colors: { primary: "#123456", secondary: "#234567", accent: "#345678", background: "#fefefe", text: "#111111" } } } },
    sections: { create: [
      { type: "hero", title: businessName, order: 0, content: { subtitle: "Café local", body: "Contenido real del negocio", ctaText: "Visítanos", ctaLink: "#contact" }, settingsJson: {} },
      { type: "footer", title: businessName, order: 1, content: { body: "Managua" }, settingsJson: {} },
    ] },
  } });
  const headers = { Cookie: `__cluster_guest=${guestToken}` };

  const page = await fetch(`${baseUrl}/builder/${site.id}/templates`, { headers });
  const html = await page.text();
  assert(page.status === 200 && html.includes(businessName), "el invitado no puede abrir la selección de plantillas");
  assert((html.match(/<article/g) || []).length === 3, "la pantalla inicial no muestra exactamente tres opciones");
  assert(html.includes("Ver 3 diseños más") && !html.includes("Opción 4"), "la divulgación progresiva hasta seis opciones no funciona");

  const preview = await fetch(`${baseUrl}/preview/${site.id}?style=Immersive`, { headers }).then((response) => response.text());
  assert(preview.includes('data-design-style="Immersive"') && preview.includes('data-site-template="immersive"'), "el preview no aplica la composición solicitada");

  const update = await fetch(`${baseUrl}/api/sites/${site.id}/template`, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ visualStyle: "Editorial" }) });
  const saved = await prisma.site.findUnique({ where: { id: site.id } });
  assert(update.status === 200 && saved?.visualStyle === "Editorial", "la plantilla elegida no se guarda");
  assert(saved?.primaryColor === "#123456" && saved.secondaryColor === "#234567" && saved.accentColor === "#345678", "cambiar plantilla altera la paleta elegida");
  assert(await prisma.site.count({ where: { businessName } }) === 1, "M4 duplicó el proyecto al generar alternativas");

  assert((await fetch(`${baseUrl}/api/sites/${site.id}/template`, { method: "PUT", headers: { ...headers, "Content-Type": "application/json" }, body: JSON.stringify({ visualStyle: "Inventado" }) })).status === 400, "la API acepta plantillas inexistentes");
  assert((await fetch(`${baseUrl}/api/sites/${site.id}/template`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ visualStyle: "Minimal" }) })).status === 404, "la API permite cambiar proyectos sin autorización");

  console.log("M4: OK — 3/6 previews, selección invitada, paleta y proyecto único verificados.");
} finally {
  await prisma.site.deleteMany({ where: { businessName } });
  await prisma.$disconnect();
}

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function assert(condition, message) { if (!condition) throw new Error(message); }
