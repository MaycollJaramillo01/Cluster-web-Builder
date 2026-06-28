import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { getUserBySessionToken, GUEST_COOKIE, hashGuestToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { isDesignStyle } from "@/lib/site/template-selection";

const schema = z.object({ visualStyle: z.string().refine(isDesignStyle, "Plantilla no válida.") });

export async function PUT(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const guestTokenHash = hashGuestToken(request.cookies.get(GUEST_COOKIE)?.value);
  if (!user && !guestTokenHash) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });

  const parsed = schema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: parsed.error.errors[0]?.message || "Plantilla no válida." }, { status: 400 });

  const updated = await prisma.site.updateMany({
    where: {
      id: siteId,
      OR: [
        ...(user ? [{ userId: user.id }] : []),
        ...(guestTokenHash ? [{ userId: null, guestTokenHash, guestExpiresAt: { gt: new Date() } }] : []),
      ],
    },
    data: { visualStyle: parsed.data.visualStyle },
  });
  if (!updated.count) return NextResponse.json({ error: "Proyecto no encontrado." }, { status: 404 });
  return NextResponse.json({ ok: true, visualStyle: parsed.data.visualStyle });
}
