import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { claimGuestProjects, createSession, GUEST_COOKIE, SESSION_COOKIE, sessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail, escapeHtml } from "@/lib/email";
import { hashPassword } from "@/lib/password";
import { trackProductEvent } from "@/lib/product-events";
import { consumeRateLimit } from "@/lib/rate-limit";

export const runtime = "nodejs";

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()),
  password: z.string().min(10).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/),
  acceptTerms: z.literal(true),
});

export async function POST(request: NextRequest) {
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  if (!(await consumeRateLimit("register", ip, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiados registros. Intenta más tarde." }, { status: 429 });
  }
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Revisa tus datos. La contraseña necesita 10 caracteres, mayúscula, minúscula y número." }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true } });
  if (existing) return NextResponse.json({ error: "Ya existe una cuenta con este correo." }, { status: 409 });

  const local = parsed.data.email.split("@")[0].replace(/[^a-z0-9]+/gi, "-").replace(/^-|-$/g, "").toLowerCase() || "cliente";
  const username = `${local.slice(0, 40)}-${randomBytes(2).toString("hex")}`;
  const user = await prisma.user.create({ data: {
    username,
    email: parsed.data.email,
    name: parsed.data.name,
    passwordHash: hashPassword(parsed.data.password),
  } });
  const claimedProjects = await claimGuestProjects(user.id, request.cookies.get(GUEST_COOKIE)?.value);
  const session = await createSession(user.id);
  await Promise.all([
    trackProductEvent("user_registered", { userId: user.id, metadata: { claimedProjects } }),
    sendEmail({
      to: user.email!,
      subject: "Tu cuenta de Cluster está lista",
      html: `<p>Hola ${escapeHtml(user.name || "")},</p><p>Tu cuenta está lista. Ya puedes editar, publicar y administrar tus proyectos desde Cluster.</p>`,
    }),
  ]);

  const response = NextResponse.json({ ok: true, claimedProjects });
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookie(session.expiresAt));
  response.cookies.set(GUEST_COOKIE, "", { path: "/", maxAge: 0 });
  return response;
}
