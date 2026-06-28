import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserBySessionToken, GUEST_COOKIE, hashGuestToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toRenderSection } from "@/lib/site/section";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const hex = z
  .string()
  .regex(/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, "Color hex inválido.");

const updateSiteSchema = z.object({
  businessName: z.string().trim().min(1).max(120).optional(),
  phone: z.string().trim().max(40).nullable().optional(),
  email: z.string().trim().max(160).nullable().optional(),
  location: z.string().trim().max(160).nullable().optional(),
  domain: z.string().trim().max(160).nullable().optional(),
  primaryColor: hex.optional(),
  secondaryColor: hex.optional(),
  accentColor: hex.optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const user = await getUserBySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  const guestTokenHash = hashGuestToken(req.cookies.get(GUEST_COOKIE)?.value);
  if (!user && !guestTokenHash) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      OR: [
        ...(user ? [{ userId: user.id }] : []),
        ...(guestTokenHash ? [{ userId: null, guestTokenHash, guestExpiresAt: { gt: new Date() } }] : []),
      ],
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!site) {
    return NextResponse.json({ error: "Sitio no encontrado." }, { status: 404 });
  }

  return NextResponse.json({
    site: {
      id: site.id,
      businessName: site.businessName,
      businessType: site.businessType,
      phone: site.phone,
      email: site.email,
      location: site.location,
      domain: site.domain,
      language: site.language,
      status: site.status,
      primaryColor: site.primaryColor,
      secondaryColor: site.secondaryColor,
      accentColor: site.accentColor,
    },
    sections: site.sections.map(toRenderSection),
  });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;
  const user = await getUserBySessionToken(req.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Inicia sesión." }, { status: 401 });

  let data;
  try {
    data = updateSiteSchema.parse(await req.json());
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: err.errors[0]?.message ?? "Datos inválidos." },
        { status: 400 }
      );
    }
    return NextResponse.json({ error: "Solicitud inválida." }, { status: 400 });
  }

  try {
    const updated = await prisma.site.updateMany({
      where: { id: siteId, userId: user.id },
      data,
    });
    if (updated.count === 0) throw new Error("not-found");
    return NextResponse.json({ ok: true, site: { id: siteId } });
  } catch {
    return NextResponse.json(
      { error: "No se pudo actualizar el sitio (¿existe?)." },
      { status: 404 }
    );
  }
}
