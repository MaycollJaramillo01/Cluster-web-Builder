import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserBySessionToken, GUEST_COOKIE, hashGuestToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDesignStyle } from "@/lib/site/template-selection";
import { orderSectionsForTemplate } from "@/lib/site/template-layout";

const schema = z.object({ visualStyle: z.string().refine(isDesignStyle, "Plantilla no válida.") });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const guestTokenHash = hashGuestToken(request.cookies.get(GUEST_COOKIE)?.value);
  if (!user && !guestTokenHash) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message || "Plantilla no válida." }, { status: 400 });

  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      ...(user?.role === "ADMIN" ? {} : { OR: [
        ...(user ? [{ userId: user.id }] : []),
        ...(guestTokenHash ? [{ userId: null, guestTokenHash, guestExpiresAt: { gt: new Date() } }] : []),
      ] }),
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });
  if (!site) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

  const orderedSections = orderSectionsForTemplate(site.sections, parsed.data.visualStyle);
  await prisma.$transaction([
    prisma.site.update({ where: { id: site.id }, data: { visualStyle: parsed.data.visualStyle } }),
    ...orderedSections.map((section, order) => prisma.siteSection.update({
      where: { id: section.id },
      data: { order },
    })),
  ]);
  return NextResponse.json({ ok: true, visualStyle: parsed.data.visualStyle });
}
