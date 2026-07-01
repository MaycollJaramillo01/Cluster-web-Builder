import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { createSession, hashToken, SESSION_COOKIE, sessionCookie } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";
import { trackProductEvent } from "@/lib/product-events";

const schema = z.object({
  token: z.string().min(20).max(200),
  password: z.string().min(10).max(128).regex(/[a-z]/).regex(/[A-Z]/).regex(/\d/),
});

export async function POST(request: NextRequest) {
  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "El enlace o la contraseña no son válidos." }, { status: 400 });
  const reset = await prisma.passwordReset.findFirst({
    where: { tokenHash: hashToken(parsed.data.token), usedAt: null, expiresAt: { gt: new Date() } },
    select: { id: true, userId: true },
  });
  if (!reset) return NextResponse.json({ error: "El enlace venció o ya fue utilizado." }, { status: 400 });

  await prisma.$transaction([
    prisma.user.update({ where: { id: reset.userId }, data: { passwordHash: hashPassword(parsed.data.password) } }),
    prisma.passwordReset.update({ where: { id: reset.id }, data: { usedAt: new Date() } }),
    prisma.session.deleteMany({ where: { userId: reset.userId } }),
  ]);
  const session = await createSession(reset.userId);
  await trackProductEvent("password_reset_completed", { userId: reset.userId });
  const response = NextResponse.json({ ok: true });
  response.cookies.set(SESSION_COOKIE, session.token, sessionCookie(session.expiresAt));
  return response;
}
