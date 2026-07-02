import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";
import { strFromU8, unzipSync } from "fflate";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const token = randomBytes(32).toString("base64url");
const cases = [
  ["about_us", "#123456"],
  ["footer", "#234567"],
  ["trust_badges", "#345678"],
  ["image", "#456789"],
  ["video", "#56789a"],
  ["testimonials", "#6789ab"],
];
let userId;

try {
  const user = await prisma.user.create({
    data: { username: `plan-a-${suffix}`, passwordHash: "qa", planStatus: "ACTIVE" },
  });
  userId = user.id;
  await prisma.session.create({ data: { userId, tokenHash: hash(token), expiresAt: new Date(Date.now() + 60_000) } });
  const site = await prisma.site.create({
    data: {
      userId,
      businessName: "QA Plan A",
      businessType: "Servicios",
      publicSlug: `qa-plan-a-${suffix}`,
      visualStyle: "Service",
      primaryColor: "#2563eb",
      secondaryColor: "#0f172a",
      accentColor: "#f59e0b",
      sections: {
        create: cases.map(([type, color], order) => ({
          type,
          order,
          title: `Titulo ${type}`,
          isVisible: true,
          content: {
            subtitle: `Subtitulo ${type}`,
            body: `Cuerpo ${type}`,
            mediaUrl: type === "image" ? "https://example.com/photo.webp" : type === "video" ? "https://example.com/video.mp4" : "",
            altText: "Medio QA",
          },
          settingsJson: {
            styleOverrides: { title: { color }, subtitle: { color: "#abcdef" }, body: { color: "#654321" } },
            ...(type === "trust_badges" ? { items: [{ value: "Garantia QA" }] } : {}),
            ...(type === "testimonials" ? { items: [{ name: "Ana QA", quote: "Excelente servicio", rating: 5, source: "Google" }] } : {}),
          },
        })),
      },
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  const cookie = `__cluster_session=${token}`;

  const save = await fetch(`${baseUrl}/api/sites/${site.id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Cookie: cookie },
    body: JSON.stringify({
      site: {
        businessName: site.businessName,
        phone: null,
        email: null,
        location: null,
        primaryColor: site.primaryColor,
        secondaryColor: site.secondaryColor,
        accentColor: site.accentColor,
      },
      deletedSectionIds: [],
      sections: site.sections.map((row) => ({
        id: row.id,
        type: row.type,
        title: row.title || "",
        subtitle: String(row.content?.subtitle || ""),
        body: String(row.content?.body || ""),
        ctaText: "",
        ctaLink: "",
        imagePrompt: "",
        mediaUrl: String(row.content?.mediaUrl || ""),
        altText: String(row.content?.altText || ""),
        settings: row.settingsJson || {},
        isVisible: row.isVisible,
        order: row.order,
      })),
    }),
  });
  assert(save.status === 200, `PUT del sitio fallo con ${save.status}: ${await save.text()}`);

  const previewResponse = await fetch(`${baseUrl}/preview/${site.id}`, { headers: { Cookie: cookie } });
  const preview = await previewResponse.text();
  assert(previewResponse.status === 200, `preview fallo con ${previewResponse.status}`);

  const download = await fetch(`${baseUrl}/api/sites/${site.id}/download`, { headers: { Cookie: cookie } });
  if (download.status !== 200) throw new Error(`ZIP fallo con ${download.status}: ${await download.text()}`);
  const files = unzipSync(new Uint8Array(await download.arrayBuffer()));
  const exported = strFromU8(files["index.html"]);

  for (const [type, color] of cases) {
    assert(preview.includes(color), `${type} no aplico ${color} en preview (titulo=${preview.includes(`Titulo ${type}`)})`);
    assert(exported.includes(`color:${color}`), `${type} no aplico ${color} en ZIP`);
  }
  assert(preview.includes("#abcdef"), "cards no aplico el subtitulo en preview");
  assert(exported.includes("color:#654321"), "image/video no aplicaron cuerpo en ZIP");
  console.log("Plan A styles: OK — PUT, preview y ZIP verificados para about, footer, badges, imagen, video y testimonios cards.");
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
