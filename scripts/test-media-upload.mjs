import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { upload } from "@vercel/blob/client";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const token = randomBytes(32).toString("base64url");
let userId;

try {
  const user = await prisma.user.create({ data: { username: `media-${suffix}`, passwordHash: "qa" } });
  userId = user.id;
  await prisma.session.create({ data: { userId, tokenHash: hash(token), expiresAt: new Date(Date.now() + 60_000) } });
  const site = await prisma.site.create({ data: { userId, businessName: "QA Media", businessType: "QA", publicSlug: `qa-media-${suffix}` } });
  const cookie = `__cluster_session=${token}`;
  const png = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAusB9Wl2nWQAAAAASUVORK5CYII=", "base64");
  const file = new File([png], "pixel.png", { type: "image/png" });
  const result = await upload(`sites/${site.id}/${crypto.randomUUID()}.png`, file, {
    access: "public",
    handleUploadUrl: `${baseUrl}/api/sites/${site.id}/media`,
    headers: { Cookie: cookie },
    clientPayload: JSON.stringify({ size: file.size, type: file.type }),
  });
  assert(result.url.includes(`/sites/${site.id}/`), "el archivo quedó fuera del espacio del sitio");

  const usage = await fetch(`${baseUrl}/api/sites/${site.id}/media`, { headers: { Cookie: cookie } });
  const usageData = await usage.json();
  assert(usage.status === 200 && usageData.files === 1 && usageData.usedBytes > 0, "la cuota no registró el archivo");

  const section = await prisma.siteSection.create({ data: {
    siteId: site.id,
    type: "image",
    title: "Imagen QA",
    content: { mediaUrl: result.url },
    order: 0,
    settingsJson: {},
  } });
  const save = await fetch(`${baseUrl}/api/sites/${site.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      site: { businessName: "QA Media" },
      deletedSectionIds: [],
      sections: [{ id: section.id, type: "image", title: "Imagen QA", subtitle: "", body: "", ctaText: "", ctaLink: "", imagePrompt: "", mediaUrl: "", altText: "", settings: {}, isVisible: true, order: 0 }],
    }),
  });
  assert(save.status === 200, "no se guardó el bloque sin el archivo anterior");
  const finalUsage = await fetch(`${baseUrl}/api/sites/${site.id}/media`, { headers: { Cookie: cookie } }).then((response) => response.json());
  assert(finalUsage.files === 0, "el guardado no limpió el blob sin referencias");
  console.log("Media upload: OK — subida real, cuota, aislamiento y limpieza posterior al guardado verificados.");
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
