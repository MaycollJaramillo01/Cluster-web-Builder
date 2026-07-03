import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { unzipSync, strFromU8 } from "fflate";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL || "http://localhost:3020";
const suffix = Date.now();
const token = randomBytes(32).toString("base64url");
let userId;

try {
  const user = await prisma.user.create({ data: { username: `v2-${suffix}`, passwordHash: "qa", planStatus: "ACTIVE" } });
  userId = user.id;
  await prisma.session.create({ data: { userId, tokenHash: createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 120_000) } });
  const source = await prisma.site.create({ data: {
    userId, businessName: "QA V2 Arquitectura", businessType: "Arquitectura", publicSlug: `qa-v2-${suffix}`, status: "PUBLISHED",
    sections: { create: [
      { type: "hero", title: "Diseño que responde al lugar", order: 0, content: { subtitle: "Arquitectura", body: "Proyectos residenciales y comerciales.", ctaText: "Cotizar", ctaLink: "#contact" }, settingsJson: {} },
      { type: "about_us", title: "Sobre el estudio", order: 1, content: { body: "Atención directa en cada etapa." }, settingsJson: {} },
      { type: "services", title: "Servicios", order: 2, content: {}, settingsJson: { items: [{ name: "Diseño residencial", description: "Planos y acompañamiento" }] } },
      { type: "contact", title: "Contacto", order: 3, content: { body: "Cuéntanos tu proyecto", ctaText: "Enviar" }, settingsJson: {} },
      { type: "footer", title: "QA V2", order: 4, content: {}, settingsJson: {} },
    ] },
    leads: { create: { name: "Lead existente", email: "lead@example.com", message: "Conservar" } },
    views: { create: { date: "2026-07-02", views: 7 } },
  } });
  const headers = { Cookie: `__cluster_session=${token}`, "Content-Type": "application/json" };
  const cloneResponse = await fetch(`${baseUrl}/api/sites/${source.id}/clone-v2`, { method: "POST", headers });
  const clone = await cloneResponse.json();
  assert(cloneResponse.status === 201 && clone.siteId, "no se creó la copia V2");

  const document = await fetch(`${baseUrl}/api/sites/${clone.siteId}`, { headers }).then((response) => response.json());
  assert(document.site.builderVersion === 2 && document.sections.length >= 3, "la copia no contiene un documento V2");
  const main = document.sections.find((section) => section.region === "main");
  const widget = main.rows[0].columns[0].widgets[0];
  if (main.rows[0].columns.length > 1) {
    main.rows[0].columns[0].widgets = main.rows[0].columns[0].widgets.filter((item) => item.id !== widget.id);
    main.rows[0].columns[1].widgets.push(widget);
  }
  const save = await fetch(`${baseUrl}/api/sites/${clone.siteId}`, { method: "PUT", headers, body: JSON.stringify({ builderVersion: 2, templateId: document.site.templateId, content: document.site.content, design: document.site.design, sections: document.sections, site: { businessName: "QA V2 Arquitectura" } }) });
  assert(save.status === 200, `guardado V2 respondió ${save.status}`);

  const template = await fetch(`${baseUrl}/api/sites/${clone.siteId}/template`, { method: "PUT", headers, body: JSON.stringify({ templateId: "editorial" }) }).then(async (response) => ({ status: response.status, data: await response.json() }));
  assert(template.status === 200 && template.data.revisionId, "cambiar plantilla no creó revisión");
  const restore = await fetch(`${baseUrl}/api/sites/${clone.siteId}/revisions/${template.data.revisionId}/restore`, { method: "POST", headers });
  assert(restore.status === 200, "no se pudo deshacer la plantilla");

  const publish = await fetch(`${baseUrl}/api/sites/${clone.siteId}/publish`, { method: "POST", headers }).then(async (response) => ({ status: response.status, data: await response.json() }));
  assert(publish.status === 200 && publish.data.site.id === source.id, "la publicación no reemplazó el sitio original");
  const replaced = await prisma.site.findUnique({ where: { id: source.id }, include: { leads: true, views: true, sections: true } });
  assert(replaced?.builderVersion === 2 && replaced.publicSlug === source.publicSlug, "se perdió URL o versión al reemplazar");
  assert(replaced.leads.length === 1 && replaced.views[0]?.views === 7, "se perdieron leads o métricas");
  assert(!await prisma.site.findUnique({ where: { id: clone.siteId } }), "la copia temporal no fue retirada");

  const publicHtml = await fetch(`${baseUrl}/s/${source.publicSlug}`).then((response) => response.text());
  assert(publicHtml.includes("v2-site") && publicHtml.includes("data-cluster-form"), "el público no usa renderSiteV2");
  const zipResponse = await fetch(`${baseUrl}/api/sites/${source.id}/download`, { headers });
  const zipHtml = strFromU8(unzipSync(new Uint8Array(await zipResponse.arrayBuffer()))["index.html"]);
  assert(zipResponse.status === 200 && zipHtml.includes("v2-site") && zipHtml.includes("data-cluster-form"), "el ZIP no usa el renderer V2");
  console.log("Builder V2 HTTP: OK — copia, guardado, revisión, reemplazo, renderer público y ZIP verificados.");
} finally {
  if (userId) {
    await prisma.productEvent.deleteMany({ where: { userId } });
    await prisma.site.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  }
  await prisma.$disconnect();
}

function assert(value, message) { if (!value) throw new Error(message); }
