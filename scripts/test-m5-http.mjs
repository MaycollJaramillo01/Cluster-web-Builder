import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const baseUrl = process.env.BASE_URL || "http://localhost:3000";
const suffix = `${Date.now()}-${randomBytes(3).toString("hex")}`;
const email = `m5-${suffix}@example.com`;
const password = "ClusterM5-123";
const newPassword = "ClusterM5-456";
const ip = `198.51.100.${Math.floor(Math.random() * 150) + 20}`;
let userId;

try {
  const register = await jsonRequest("/api/auth/register", {
    name: "QA M5",
    email,
    password,
    acceptTerms: true,
  });
  assert(register.response.status === 200, `registro respondió ${register.response.status}`);
  const cookie = register.response.headers.get("set-cookie")?.match(/__cluster_session=[^;]+/)?.[0];
  assert(cookie, "el registro no creó una sesión");

  const user = await prisma.user.findUnique({ where: { email } });
  assert(user, "el usuario no quedó persistido");
  userId = user.id;
  const site = await prisma.site.create({ data: {
    userId,
    businessName: "QA Comercial M5",
    businessType: "Pruebas",
    publicSlug: `qa-m5-${suffix}`,
    status: "GENERATED",
  } });

  const publish = await fetch(`${baseUrl}/api/sites/${site.id}/publish`, {
    method: "POST",
    headers: { Cookie: cookie },
  });
  assert(publish.status === 402, `una cuenta Free pudo publicar (${publish.status})`);

  const forgot = await jsonRequest("/api/auth/forgot-password", { email });
  assert(forgot.response.status === 200, `recuperación respondió ${forgot.response.status}`);
  assert(forgot.data.devResetUrl, "la prueba local necesita correo desactivado para recuperar el token");
  const token = new URL(forgot.data.devResetUrl).searchParams.get("token");
  assert(token, "no se obtuvo el token de recuperación");

  const reset = await jsonRequest("/api/auth/reset-password", { token, password: newPassword });
  assert(reset.response.status === 200, `cambio de contraseña respondió ${reset.response.status}`);

  const login = await jsonRequest("/api/auth/login", { username: email, password: newPassword }, `${ip}:login`);
  assert(login.response.status === 200, `el acceso con la contraseña nueva respondió ${login.response.status}`);
  console.log("M5 HTTP: OK — registro, sesión, paywall, recuperación y nuevo acceso verificados.");
} finally {
  if (userId) {
    await prisma.productEvent.deleteMany({ where: { userId } });
    await prisma.site.deleteMany({ where: { userId } });
    await prisma.passwordReset.deleteMany({ where: { userId } });
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
  }
  await prisma.$disconnect();
}

async function jsonRequest(path, body, forwardedIp = ip) {
  const response = await fetch(`${baseUrl}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-forwarded-for": forwardedIp },
    body: JSON.stringify(body),
  });
  const data = await response.json().catch(() => ({}));
  return { response, data };
}

function assert(condition, message) {
  if (!condition) throw new Error(message);
}
