import { createHash, randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL || "http://localhost:3010";
const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const usernames = [`qa-a-${suffix}`, `qa-b-${suffix}`, `qa-admin-${suffix}`];
const siteNames = [`QA Site A ${suffix}`, `QA Site B ${suffix}`, `QA Guest ${suffix}`];
const tokens = [randomBytes(24).toString("base64url"), randomBytes(24).toString("base64url"), randomBytes(24).toString("base64url")];
const guestToken = randomBytes(24).toString("base64url");
const rateUsername = `rate-${suffix}`;
const rateIp = "198.51.100.42";
const createdUsername = `created-${suffix}`;

try {
  const [userA, userB, admin] = await Promise.all(usernames.map((username, index) => prisma.user.create({
    data: { username, passwordHash: "qa:not-used", role: index === 2 ? "ADMIN" : "EDITOR", planStatus: index === 0 ? "ACTIVE" : "FREE" },
  })));
  const [siteA, , guestSite] = await Promise.all([
    prisma.site.create({ data: { userId: userA.id, businessName: siteNames[0], businessType: "QA", publicSlug: `qa-a-${suffix}`, status: "DRAFT" } }),
    prisma.site.create({ data: { userId: userB.id, businessName: siteNames[1], businessType: "QA", publicSlug: `qa-b-${suffix}`, status: "DRAFT" } }),
    prisma.site.create({ data: { userId: null, guestTokenHash: hash(guestToken), guestExpiresAt: new Date(Date.now() + 60_000), businessName: siteNames[2], businessType: "QA", publicSlug: `qa-g-${suffix}`, status: "DRAFT" } }),
  ]);
  await Promise.all([userA, userB, admin].map((user, index) => prisma.session.create({
    data: { userId: user.id, tokenHash: hash(tokens[index]), expiresAt: new Date(Date.now() + 60_000) },
  })));

  const cookieA = { Cookie: `__cluster_session=${tokens[0]}` };
  const cookieB = { Cookie: `__cluster_session=${tokens[1]}` };
  const cookieAdmin = { Cookie: `__cluster_session=${tokens[2]}` };

  assert((await fetch(`${baseUrl}/api/sites/${siteA.id}`, { headers: cookieA })).status === 200, "el propietario no puede leer su sitio");
  assert((await fetch(`${baseUrl}/api/sites/${siteA.id}`, { headers: cookieB })).status === 404, "otro usuario puede leer el sitio");
  assert((await fetch(`${baseUrl}/api/sites/${siteA.id}`)).status === 404, "la API revela proyectos sin autorización");
  assert((await fetch(`${baseUrl}/api/sites/${siteA.id}`, { method: "PATCH", headers: { ...cookieB, "Content-Type": "application/json" }, body: JSON.stringify({ businessName: "Intrusión" }) })).status === 404, "otro usuario puede editar el sitio");

  const dashboard = await fetch(`${baseUrl}/dashboard`, { headers: cookieA }).then((response) => response.text());
  assert(dashboard.includes(siteNames[0]) && !dashboard.includes(siteNames[1]), "el dashboard mezcla proyectos de usuarios");
  assert((await fetch(`${baseUrl}/preview/${siteA.id}`, { redirect: "manual" })).status === 404, "un borrador es público");
  assert((await fetch(`${baseUrl}/preview/${siteA.id}`, { headers: cookieA })).status === 200, "el propietario no puede previsualizar su borrador");
  const published = await fetch(`${baseUrl}/api/sites/${siteA.id}/publish`, { method: "POST", headers: cookieA });
  const publishedData = await published.json();
  assert(published.status === 200 && publishedData.site.publicUrl.includes(siteA.publicSlug), "el propietario no puede publicar");
  assert((await fetch(`${baseUrl}/preview/${siteA.id}`)).status === 200, "un sitio publicado no es público");
  assert((await fetch(`${baseUrl}/s/${siteA.publicSlug}`)).status === 200, "la URL pública no funciona");

  const lead = await fetch(`${baseUrl}/api/public/sites/${siteA.publicSlug}/leads`, { method: "POST", headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.44" }, body: JSON.stringify({ name: "Cliente QA", email: "qa@example.com", message: "Necesito información" }) });
  assert(lead.status === 201 && await prisma.lead.count({ where: { siteId: siteA.id } }) === 1, "el formulario público no guarda contactos");
  const download = await fetch(`${baseUrl}/api/sites/${siteA.id}/download`, { headers: cookieA });
  const downloadBytes = new Uint8Array(await download.arrayBuffer());
  assert(download.status === 200 && downloadBytes[0] === 0x50 && downloadBytes[1] === 0x4b, "la descarga no entrega un ZIP válido");
  assert((await fetch(`${baseUrl}/api/sites/${siteA.id}/download`, { headers: cookieB })).status === 404, "otro usuario puede descargar el proyecto");
  assert((await fetch(`${baseUrl}/api/sites/${siteA.id}/download`)).status === 401, "se puede descargar sin iniciar sesión");

  const guestCookie = { Cookie: `__cluster_guest=${guestToken}` };
  assert((await fetch(`${baseUrl}/api/sites/${guestSite.id}`, { headers: guestCookie })).status === 200, "el invitado no puede abrir su borrador");
  assert((await fetch(`${baseUrl}/api/sites/${guestSite.id}`)).status === 404, "un borrador invitado se puede abrir sin token");
  assert((await fetch(`${baseUrl}/api/sites/${guestSite.id}`, { method: "PATCH", headers: { ...guestCookie, "Content-Type": "application/json" }, body: JSON.stringify({ businessName: "Sin login" }) })).status === 401, "el invitado puede guardar sin iniciar sesión");
  assert((await fetch(`${baseUrl}/api/sites/${guestSite.id}/publish`, { method: "POST", headers: guestCookie })).status === 401, "el invitado puede publicar sin iniciar sesión");
  assert((await fetch(`${baseUrl}/preview/${guestSite.id}`, { headers: guestCookie })).status === 200, "el invitado no puede previsualizar su borrador");

  assert((await fetch(`${baseUrl}/api/admin/users`, { method: "POST", headers: { ...cookieA, "Content-Type": "application/json" }, body: JSON.stringify({ username: `blocked-${suffix}`, password: "password-qa-123" }) })).status === 403, "un editor puede crear usuarios");
  const created = await fetch(`${baseUrl}/api/admin/users`, { method: "POST", headers: { ...cookieAdmin, "Content-Type": "application/json" }, body: JSON.stringify({ username: createdUsername, password: "password-qa-123" }) });
  assert(created.status === 201, "un administrador no puede crear usuarios");
  const login = await fetch(`${baseUrl}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": "198.51.100.41", ...guestCookie },
    body: JSON.stringify({ username: createdUsername, password: "password-qa-123" }),
  });
  const loginCookie = login.headers.get("set-cookie")?.split(";", 1)[0];
  assert(login.status === 200 && loginCookie, "el usuario creado no puede iniciar sesión");
  const claimed = await prisma.site.findUnique({ where: { id: guestSite.id }, select: { userId: true, guestTokenHash: true } });
  const createdUser = await prisma.user.findUnique({ where: { username: createdUsername }, select: { id: true } });
  assert(claimed?.userId === createdUser?.id && claimed?.guestTokenHash === null, "el login no reclamó el borrador invitado");
  await fetch(`${baseUrl}/api/auth/logout`, { method: "POST", headers: { Cookie: loginCookie }, redirect: "manual" });
  const closedToken = loginCookie.split("=", 2)[1];
  const closedSession = await prisma.session.findUnique({ where: { tokenHash: hash(closedToken) } });
  assert(!closedSession, "cerrar sesión no invalida el token");

  const attempts = [];
  for (let index = 0; index < 6; index++) {
    attempts.push((await fetch(`${baseUrl}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": rateIp },
      body: JSON.stringify({ username: rateUsername, password: "incorrect-password" }),
    })).status);
  }
  assert(attempts.slice(0, 5).every((status) => status === 401) && attempts[5] === 429, "el límite de intentos de login no funciona");

  const guestGenerationIp = "198.51.100.43";
  const guestGenerationStatuses = [];
  for (let index = 0; index < 4; index++) {
    guestGenerationStatuses.push((await fetch(`${baseUrl}/api/ai/generate-site`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-forwarded-for": guestGenerationIp },
      body: JSON.stringify({ prompt: "corto" }),
    })).status);
  }
  assert(guestGenerationStatuses.slice(0, 3).every((status) => status === 400) && guestGenerationStatuses[3] === 429, "el límite de generación invitada no funciona");

  console.log("M2: OK — publicación, formulario, contactos y ZIP con aislamiento multiusuario.");
} finally {
  await prisma.site.deleteMany({ where: { businessName: { in: siteNames } } });
  await prisma.user.deleteMany({ where: { username: { in: [...usernames, createdUsername, `blocked-${suffix}`] } } });
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: ratePrefix("login", `${rateIp}:${rateUsername}`) } } });
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: ratePrefix("login", `198.51.100.41:${createdUsername}`) } } });
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: ratePrefix("generation", "198.51.100.43") } } });
  await prisma.rateLimit.deleteMany({ where: { key: { startsWith: ratePrefix("lead", `qa-a-${suffix}:198.51.100.44`) } } });
  await prisma.$disconnect();
}

function hash(value) {
  return createHash("sha256").update(value).digest("hex");
}

function ratePrefix(scope, identifier) {
  return `${scope}:${hash(identifier).slice(0, 24)}:`;
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
