import { randomBytes } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { hashToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { trackProductEvent } from "@/lib/product-events";
import { consumeRateLimit } from "@/lib/rate-limit";
import { appOrigin } from "@/lib/site/public-url";

const schema = z.object({ email: z.string().trim().email().max(160).transform((value) => value.toLowerCase()) });

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Escribe un correo válido." }, { status: 400 });
  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "local";
  if (!(await consumeRateLimit("password-reset", `${ip}:${parsed.data.email}`, 3, 60 * 60 * 1000))) {
    return NextResponse.json({ ok: true });
  }

  const user = await prisma.user.findUnique({ where: { email: parsed.data.email }, select: { id: true, email: true } });
  let devResetUrl: string | undefined;
  if (user?.email) {
    const token = randomBytes(32).toString("base64url");
    await prisma.passwordReset.create({ data: { tokenHash: hashToken(token), userId: user.id, expiresAt: new Date(Date.now() + 30 * 60 * 1000) } });
    const origin = appOrigin(request.nextUrl.origin);
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
    const delivered = await sendEmail({
      to: user.email,
      subject: "Restablece tu contraseña de Cluster",
      html: `<p>Recibimos una solicitud para cambiar tu contraseña.</p><p><a href="${resetUrl}">Crear una contraseña nueva</a></p><p>Este enlace vence en 30 minutos.</p>`,
    });
    if (!delivered && process.env.NODE_ENV !== "production") devResetUrl = resetUrl;
    await trackProductEvent("password_reset_requested", { userId: user.id });
  }
  return NextResponse.json({ ok: true, ...(devResetUrl ? { devResetUrl } : {}) });
}
