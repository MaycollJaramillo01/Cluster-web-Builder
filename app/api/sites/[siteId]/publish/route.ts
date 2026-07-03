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
    const existing = await prisma.site.findFirst({
      where: { id: siteId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
      include: { sections: { orderBy: { order: "asc" } }, replacesSite: { include: { sections: { orderBy: { order: "asc" } } } } },
    });
    if (!existing) throw new Error("not-found");
    if (!hasProAccess(user)) return NextResponse.json(proRequiredResponse, { status: 402 });
    let publishedId = existing.id;
    let publishedSlug = existing.publicSlug;
    if (existing.builderVersion === 2 && existing.replacesSite) {
      const source = existing.replacesSite;
      const snapshot = JSON.parse(JSON.stringify({ site: source, sections: source.sections }));
      await prisma.$transaction(async (tx) => {
        await tx.siteRevision.create({ data: { siteId: source.id, reason: "publish-v2-replacement", snapshotJson: snapshot } });
        await tx.siteSection.deleteMany({ where: { siteId: source.id } });
        await tx.site.delete({ where: { id: existing.id } });
        await tx.site.update({ where: { id: source.id }, data: {
          builderVersion: 2,
          templateId: existing.templateId,
          contentJson: existing.contentJson ?? undefined,
          designJson: existing.designJson ?? undefined,
          blueprintJson: existing.blueprintJson ?? undefined,
          visualStyle: existing.visualStyle,
          businessName: existing.businessName,
          businessType: existing.businessType,
          goal: existing.goal,
          location: existing.location,
          phone: existing.phone,
          email: existing.email,
          language: existing.language,
          logoUrl: existing.logoUrl,
          coverUrl: existing.coverUrl,
          primaryColor: existing.primaryColor,
          secondaryColor: existing.secondaryColor,
          accentColor: existing.accentColor,
          status: "PUBLISHED",
          publishedAt: new Date(),
        } });
        await tx.siteSection.createMany({ data: existing.sections.map((section) => ({
          id: section.id, siteId: source.id, type: section.type, title: section.title, content: section.content as object,
          order: section.order, isVisible: section.isVisible, settingsJson: section.settingsJson as object,
        })) });
      });
      publishedId = source.id;
      publishedSlug = source.publicSlug;
    } else {
      await prisma.site.update({ where: { id: siteId }, data: { status: "PUBLISHED", publishedAt: new Date() } });
    }
    await trackProductEvent("site_published", { userId: user.id, siteId: publishedId });
    revalidatePath("/");

    return NextResponse.json({ ok: true, site: { id: publishedId, status: "PUBLISHED", publicUrl: publicSiteUrl(publishedSlug) } });
  } catch {
    return NextResponse.json(
      { error: "No se encontró el sitio que quieres publicar." },
      { status: 404 }
    );
  }
}
