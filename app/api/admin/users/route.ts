import { Prisma } from "@prisma/client";
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hashPassword } from "@/lib/password";

const createUserSchema = z.object({
  username: z.string().trim().min(3).max(50).regex(/^[a-zA-Z0-9._-]+$/),
  password: z.string().min(10).max(200),
  name: z.string().trim().max(100).optional().or(z.literal("")),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  role: z.enum(["ADMIN", "EDITOR"]).default("EDITOR"),
});

export async function POST(request: NextRequest) {
  const currentUser = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!currentUser) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });
  if (currentUser.role !== "ADMIN") return NextResponse.json({ error: "Acceso restringido." }, { status: 403 });

  let input: z.infer<typeof createUserSchema>;
  try {
    input = createUserSchema.parse(await request.json());
  } catch (error) {
    const message = error instanceof z.ZodError ? error.errors[0]?.message : null;
    return NextResponse.json({ error: message || "Datos inválidos." }, { status: 400 });
  }

  try {
    const user = await prisma.user.create({
      data: {
        username: input.username,
        passwordHash: await hashPassword(input.password),
        name: input.name || null,
        email: input.email || null,
        role: input.role,
      },
      select: { id: true, username: true, role: true },
    });
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return NextResponse.json({ error: "El usuario o email ya existe." }, { status: 409 });
    }
    return NextResponse.json({ error: "No se pudo crear el usuario." }, { status: 500 });
  }
}
