import { NextRequest, NextResponse } from "next/server";
import { strToU8, zipSync } from "fflate";

import { prisma } from "@/lib/db";
import { assertSiteAccess, SiteAccessError, siteAccessErrorResponse } from "@/lib/site/access";
import { hasProAccess, proRequiredResponse } from "@/lib/entitlements";
import { trackProductEvent } from "@/lib/product-events";
import { exportSiteHtml } from "@/lib/site/export-html";
import { getSiteLaunchReadiness } from "@/lib/site/launch-readiness";
import { toRenderSection } from "@/lib/site/section";
import { themeFromSite } from "@/lib/site/theme";
import { renderSiteV2 } from "@/lib/site/v2-render";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  try {
    const { site, actor } = await assertSiteAccess({
      siteId,
      request,
      requireUser: true,
      include: { sections: { orderBy: { order: "asc" } } },
    });
    const user = actor.user!;
    if (!hasProAccess(user)) return NextResponse.json(proRequiredResponse, { status: 402 });
    const readiness = getSiteLaunchReadiness(site as Parameters<typeof getSiteLaunchReadiness>[0]);
    if (!readiness.canDownload) {
      const missing = readiness.missingForDownload.join(", ");
      return NextResponse.json({
        error: `Antes de descargar completa: ${missing}. El ZIP usa el endpoint público de leads, por eso el sitio debe estar publicado.`,
        code: "LAUNCH_NOT_READY",
        readiness,
      }, { status: 409 });
    }

    const sections = site.sections ?? [];
    const publicSlug = String(site.publicSlug ?? siteId);
    const endpoint = `${request.nextUrl.origin}/api/public/sites/${publicSlug}/leads`;
    const showBranding = user.planStatus !== "ACTIVE";
    const publicUrl = site.status === "PUBLISHED"
      ? (site.domainVerifiedAt && site.customDomain ? `https://${site.customDomain}` : `${request.nextUrl.origin}/s/${publicSlug}`)
      : undefined;
    const html = site.builderVersion === 2
      ? renderSiteV2({
        content: site.contentJson,
        design: site.designJson,
        sections: sections.map((section) => section.content),
        leadEndpoint: endpoint,
        showBranding,
        publicUrl,
        indexable: Boolean(publicUrl),
      }).html
      : exportSiteHtml({
        ...(site as object),
        showBranding,
        theme: themeFromSite(site as Parameters<typeof themeFromSite>[0]),
        sections: sections.map(toRenderSection),
      } as Parameters<typeof exportSiteHtml>[0], endpoint);
    const readme = showBranding
      ? "Abre index.html o súbelo a cualquier hosting estático. El formulario envía los contactos a Cluster mientras el proyecto permanezca publicado."
      : "Abre index.html o súbelo a cualquier hosting estático. El formulario requiere que el proyecto permanezca publicado.";
    const zip = zipSync({ "index.html": strToU8(html), "README.txt": strToU8(readme) });
    await prisma.site.update({ where: { id: site.id }, data: { downloadedAt: new Date() } });
    await trackProductEvent("site_downloaded", { userId: user.id, siteId: site.id });
    return new Response(zip, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${publicSlug}.zip"` } });
  } catch (error) {
    if (error instanceof SiteAccessError && error.status === 401) {
      return NextResponse.json({ error: "Inicia sesión para descargar el sitio.", authRequired: true }, { status: 401 });
    }
    return siteAccessErrorResponse(error) ?? NextResponse.json({ error: "Sitio no encontrado." }, { status: 404 });
  }
}
