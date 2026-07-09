import { NextRequest, NextResponse } from "next/server";

import { claimGuestProjects, createSession, GUEST_COOKIE, SESSION_COOKIE, sessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { clearRateLimit, consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  let username: string;
  let password: string;
  try {
    const body = await req.json();
    username = String(body.username ?? "").trim();
    password = String(body.password ?? "");
  } catch {
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || req.headers.get("x-real-ip")
    || "local";
  const rateIdentifier = `${ip}:${username.toLowerCase()}`;
  if (!(await consumeRateLimit("login", rateIdentifier, 5, 15 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiados intentos. Espera 15 minutos." }, { status: 429 });
  }

  const user = await prisma.user.findFirst({ where: { OR: [
    { username: { equals: username, mode: "insensitive" } },
    { email: { equals: username, mode: "insensitive" } },
  ] } });
  if (!user || !(await verifyPassword(password, user.passwordHash))) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  await clearRateLimit("login", rateIdentifier, 15 * 60 * 1000);
  const guestToken = req.cookies.get(GUEST_COOKIE)?.value;
  await claimGuestProjects(user.id, guestToken);
  await Promise.all([
    prisma.session.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
    prisma.rateLimit.deleteMany({ where: { expiresAt: { lt: new Date() } } }),
  ]);
  const session = await createSession(user.id);
  const response = NextResponse.json({ ok: true, role: user.role });
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookie(session.expiresAt));
  if (guestToken) response.cookies.set(GUEST_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
