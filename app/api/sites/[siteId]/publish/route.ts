import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasProAccess, proRequiredResponse } from "@/lib/entitlements";
import { trackProductEvent } from "@/lib/product-events";
import { publicSiteUrl } from "@/lib/site/public-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) {
    return NextResponse.json(
      { error: "Inicia sesión para publicar el sitio.", authRequired: true },
      { status: 401 }
    );
  }
  const { siteId } = await params;

  try {
    const existing = await prisma.site.findFirst({ where: { id: siteId, userId: user.id }, select: { publicSlug: true } });
    if (!existing) throw new Error("not-found");
    if (!hasProAccess(user)) return NextResponse.json(proRequiredResponse, { status: 402 });
    await prisma.site.update({ where: { id: siteId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    await trackProductEvent("site_published", { userId: user.id, siteId });
    revalidatePath("/");

    return NextResponse.json({ ok: true, site: { id: siteId, status: "PUBLISHED", publicUrl: publicSiteUrl(existing.publicSlug) } });
  } catch {
    return NextResponse.json(
      { error: "No se encontró el sitio que quieres publicar." },
      { status: 404 }
    );
  }
}
