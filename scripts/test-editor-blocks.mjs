import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const token = randomBytes(32).toString("base64url");
let userId;

try {
  const user = await prisma.user.create({ data: { username: `blocks-${suffix}`, passwordHash: "qa" } });
  userId = user.id;
  await prisma.session.create({ data: { userId, tokenHash: hash(token), expiresAt: new Date(Date.now() + 60_000) } });
  const site = await prisma.site.create({ data: { userId, businessName: "QA Blocks", businessType: "QA", publicSlug: `qa-blocks-${suffix}` } });
  const cookie = `__cluster_session=${token}`;

  const create = await fetch(`${baseUrl}/api/sites/${site.id}/sections`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ type: "image", title: "Proyecto terminado", mediaUrl: "https://images.example.com/project.webp", altText: "Proyecto terminado", order: 1 }),
  });
  const created = await create.json();
  assert(create.status === 201 && created.section?.type === "image", "no se creó el bloque de imagen");

  const update = await fetch(`${baseUrl}/api/sites/${site.id}/sections/${created.section.id}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({ body: "Resultado del proyecto", altText: "Interior renovado" }),
  });
  const updated = await update.json();
  assert(update.status === 200 && updated.section?.altText === "Interior renovado", "no se editó el bloque");

  const atomic = await fetch(`${baseUrl}/api/sites/${site.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      site: { businessName: "QA Blocks guardado", primaryColor: "#112233", secondaryColor: "#223344", accentColor: "#ffcc00" },
      deletedSectionIds: [],
      sections: [{ ...updated.section, settings: { layout: { width: "narrow", align: "center", background: "tonal", spacing: "compact" } } }],
    }),
  });
  const atomicallySaved = await atomic.json();
  assert(atomic.status === 200 && atomicallySaved.sections?.[0]?.settings?.layout?.width === "narrow", "el guardado atómico no conservó el layout");

  const anonymousMedia = await fetch(`${baseUrl}/api/sites/${site.id}/media`);
  assert(anonymousMedia.status === 404, "un visitante pudo consultar la cuota de medios");

  const forbidden = await fetch(`${baseUrl}/api/sites/${site.id}/sections/${created.section.id}`, { method: "DELETE" });
  assert(forbidden.status === 401, "un visitante pudo eliminar el bloque");
  const remove = await fetch(`${baseUrl}/api/sites/${site.id}/sections/${created.section.id}`, { method: "DELETE", headers: { Cookie: cookie } });
  assert(remove.status === 200, "no se eliminó el bloque");
  console.log("Editor blocks: OK — creación, edición, autorización y eliminación verificadas.");
} finally {
  if (userId) {
    await prisma.site.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  }
  await prisma.$disconnect();
}

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function assert(condition, message) { if (!condition) throw new Error(message); }
