import { scryptSync, timingSafeEqual } from "node:crypto";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";

function verifyPassword(password: string, stored: string): boolean {
  const [salt, hash] = stored.split(":");
  if (!salt || !hash) return false;
  try {
    const derived = scryptSync(password, salt, 64);
    return timingSafeEqual(derived, Buffer.from(hash, "hex"));
  } catch {
    return false;
  }
}

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

  const secret = process.env.SESSION_SECRET;
  if (!secret) {
    console.error("[auth] Missing SESSION_SECRET env var.");
    return NextResponse.json({ error: "El servidor no está configurado para autenticación." }, { status: 500 });
  }

  const user = await prisma.user.findUnique({ where: { username } });

  if (!user || !verifyPassword(password, user.passwordHash)) {
    return NextResponse.json({ error: "Usuario o contraseña incorrectos." }, { status: 401 });
  }

  const isProd = process.env.NODE_ENV === "production";
  const response = NextResponse.json({ ok: true, role: user.role });
  response.cookies.set("__cluster_session", secret, {
    httpOnly: true,
    secure: isProd,
    sameSite: "lax",
    maxAge: 60 * 60 * 24 * 30,
    path: "/",
  });
  return response;
}
