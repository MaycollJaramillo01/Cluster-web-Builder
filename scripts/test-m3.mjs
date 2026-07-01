import { createHash, randomBytes } from "node:crypto";
import { request as httpRequest } from "node:http";
import { PrismaClient } from "@prisma/client";
import { strFromU8, unzipSync } from "fflate";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL || "http://localhost:3010";
const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const domain = `qa-${suffix}.example.com`;
const users = [`m3-free-${suffix}`, `m3-pro-${suffix}`];
const names = [`M3 Free ${suffix}`, `M3 Pro ${suffix}`];
const tokens = [randomBytes(24).toString("base64url"), randomBytes(24).toString("base64url")];
let rateUserIds = [];

try {
  const [free, pro] = await Promise.all([
    prisma.user.create({ data: { username: users[0], passwordHash: "qa", planStatus: "FREE" } }),
    prisma.user.create({ data: { username: users[1], passwordHash: "qa", planStatus: "ACTIVE" } }),
  ]);
  rateUserIds = [free.id, pro.id];
  const [freeSite, proSite] = await Promise.all([
    createSite(free.id, names[0], `m3-free-${suffix}`),
    createSite(pro.id, names[1], `m3-pro-${suffix}`),
  ]);
  await Promise.all([free, pro].map((user, index) => prisma.session.create({
    data: { userId: user.id, tokenHash: hash(tokens[index]), expiresAt: new Date(Date.now() + 60_000) },
  })));
  const freeHeaders = { Cookie: `__cluster_session=${tokens[0]}` };
  const proHeaders = { Cookie: `__cluster_session=${tokens[1]}` };

  const billing = await fetch(`${baseUrl}/billing`, { headers: freeHeaders }).then((response) => response.text());
  assert(billing.includes("Cluster Pro") && billing.includes("Un solo plan"), "la página de cobro no presenta el plan único");
  assert((await fetch(`${baseUrl}/api/sites/${freeSite.id}/domain`, { method: "PUT", headers: { ...freeHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ domain }) })).status === 402, "un usuario gratis puede configurar dominio propio");

  if (!process.env.VERCEL_TOKEN) {
    const pending = await fetch(`${baseUrl}/api/sites/${proSite.id}/domain`, { method: "PUT", headers: { ...proHeaders, "Content-Type": "application/json" }, body: JSON.stringify({ domain }) });
    const data = await pending.json();
    assert(pending.status === 200 && data.providerConfigured === false && data.verified === false, "el dominio pendiente no se guarda sin configuración de Vercel");
  }
  await prisma.site.update({ where: { id: proSite.id }, data: { customDomain: domain, domainVerifiedAt: new Date() } });

  const freePublic = await fetch(`${baseUrl}/s/${freeSite.publicSlug}`).then((response) => response.text());
  const proPublic = await fetch(`${baseUrl}/s/${proSite.publicSlug}`).then((response) => response.text());
  const customPublic = await fetch(`${baseUrl}/d/${domain}`).then((response) => response.text());
  assert(freePublic.includes("Creado con Cluster"), "la versión gratis no muestra la marca Cluster");
  assert(!proPublic.includes("Creado con Cluster") && !customPublic.includes("Creado con Cluster"), "Cluster Pro no elimina la marca");

  const hostResponse = await requestWithHost(domain);
  assert(hostResponse.status === 200 && hostResponse.body.includes(names[1]), `el proxy no resuelve el dominio personalizado (${hostResponse.status}: ${hostResponse.body.slice(0, 80)})`);

  const freeZipResponse = await fetch(`${baseUrl}/api/sites/${freeSite.id}/download`, { headers: freeHeaders });
  const proZip = await zipHtml(proSite.id, proHeaders);
  assert(freeZipResponse.status === 402 && !proZip.includes("Creado con Cluster"), "la descarga no respeta los permisos del plan");

  const freeStatuses = await invalidGenerations(freeHeaders, `203.0.113.${Math.floor(Math.random() * 100) + 1}`, 11);
  const proStatuses = await invalidGenerations(proHeaders, `198.51.100.${Math.floor(Math.random() * 100) + 1}`, 11);
  assert(freeStatuses.at(-1) === 429 && proStatuses.every((status) => status === 400), "los límites de IA no distinguen gratis (10) y Pro (100)");

  console.log("M3: OK — plan único, límites, dominio, proxy y marca blanca verificados.");
} finally {
  await prisma.site.deleteMany({ where: { businessName: { in: names } } });
  await prisma.user.deleteMany({ where: { username: { in: users } } });
  await Promise.all(rateUserIds.map((id) => prisma.rateLimit.deleteMany({ where: { key: { startsWith: `generation:${hash(id).slice(0, 24)}:` } } })));
  await prisma.$disconnect();
}

function createSite(userId, businessName, publicSlug) {
  return prisma.site.create({ data: {
    userId, businessName, businessType: "QA", publicSlug, status: "PUBLISHED", phone: "+50588888888",
    sections: { create: { type: "footer", title: businessName, order: 1, content: { body: "QA" }, settingsJson: {} } },
  } });
}

async function zipHtml(siteId, headers) {
  const response = await fetch(`${baseUrl}/api/sites/${siteId}/download`, { headers });
  assert(response.status === 200, "no se pudo descargar el ZIP");
  return strFromU8(unzipSync(new Uint8Array(await response.arrayBuffer()))["index.html"]);
}

async function invalidGenerations(headers, ip, count) {
  const statuses = [];
  for (let index = 0; index < count; index++) statuses.push((await fetch(`${baseUrl}/api/ai/generate-site`, {
    method: "POST", headers: { ...headers, "Content-Type": "application/json", "x-forwarded-for": ip }, body: JSON.stringify({ prompt: "corto" }),
  })).status);
  return statuses;
}

function requestWithHost(host) {
  const target = new URL(baseUrl);
  return new Promise((resolve, reject) => {
    const request = httpRequest({ hostname: target.hostname, port: target.port, path: "/", headers: { host } }, (response) => {
      let body = "";
      response.setEncoding("utf8");
      response.on("data", (chunk) => { body += chunk; });
      response.on("end", () => resolve({ status: response.statusCode, body }));
    });
    request.on("error", reject);
    request.end();
  });
}

function hash(value) { return createHash("sha256").update(value).digest("hex"); }
function assert(condition, message) { if (!condition) throw new Error(message); }
