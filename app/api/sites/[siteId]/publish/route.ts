import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";

import { prisma } from "@/lib/db";
import { assertSiteAccess, SiteAccessError, siteAccessErrorResponse } from "@/lib/site/access";
import { hasProAccess, proRequiredResponse } from "@/lib/entitlements";
import { trackProductEvent } from "@/lib/product-events";
import { getSiteLaunchReadiness } from "@/lib/site/launch-readiness";
import { publicSiteUrl } from "@/lib/site/public-url";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const { siteId } = await params;

  try {
    const { site: existing, actor } = await assertSiteAccess({
      siteId,
      request,
      requireUser: true,
      include: {
        sections: { orderBy: { order: "asc" } },
        replacesSite: { include: { sections: { orderBy: { order: "asc" } } } },
      },
    });
    const user = actor.user!;
    if (!hasProAccess(user)) return NextResponse.json(proRequiredResponse, { status: 402 });
    const readiness = getSiteLaunchReadiness(existing as Parameters<typeof getSiteLaunchReadiness>[0]);
    if (!readiness.canPublish) {
      return NextResponse.json({
        error: `Antes de publicar completa: ${readiness.missingForPublish.join(", ")}.`,
        code: "LAUNCH_NOT_READY",
        readiness,
      }, { status: 409 });
    }
    let publishedId = existing.id;
    let publishedSlug = String(existing.publicSlug ?? "");
    const replacesSite = (existing as { replacesSite?: typeof existing & { sections: Array<Record<string, unknown>>; publicSlug: string; customDomain?: string | null } }).replacesSite;
    const sections = (existing.sections ?? []) as Array<{
      id: string;
      type: string;
      title: string | null;
      content: unknown;
      order: number;
      isVisible: boolean;
      settingsJson: unknown;
    }>;

    if (existing.builderVersion === 2 && replacesSite) {
      const source = replacesSite;
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
          blueprintJson: (existing as { blueprintJson?: unknown }).blueprintJson ?? undefined,
          visualStyle: existing.visualStyle,
          businessName: existing.businessName,
          businessType: existing.businessType,
          goal: existing.goal,
          location: existing.location,
          phone: existing.phone,
          email: existing.email,
          language: existing.language,
          logoUrl: typeof existing.logoUrl === "string" ? existing.logoUrl : null,
          coverUrl: typeof existing.coverUrl === "string" ? existing.coverUrl : null,
          primaryColor: existing.primaryColor,
          secondaryColor: existing.secondaryColor,
          accentColor: existing.accentColor,
          status: "PUBLISHED",
          publishedAt: new Date(),
        } });
        await tx.siteSection.createMany({ data: sections.map((section) => ({
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
    revalidatePath(`/s/${publishedSlug}`);
    const customDomain = typeof existing.customDomain === "string" ? existing.customDomain : null;
    if (customDomain) revalidatePath(`/d/${customDomain}`);
    if (replacesSite?.customDomain) revalidatePath(`/d/${replacesSite.customDomain}`);

    return NextResponse.json({ ok: true, site: { id: publishedId, status: "PUBLISHED", publicUrl: publicSiteUrl(publishedSlug) } });
  } catch (error) {
    if (error instanceof SiteAccessError && error.status === 401) {
      return NextResponse.json(
        { error: "Inicia sesión para publicar el sitio.", authRequired: true },
        { status: 401 },
      );
    }
    return siteAccessErrorResponse(error) ?? NextResponse.json(
      { error: "No se encontró el sitio que quieres publicar." },
      { status: 404 },
    );
  }
}
