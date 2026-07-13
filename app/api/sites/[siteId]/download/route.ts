import { NextRequest, NextResponse } from "next/server";
import { strToU8, zipSync } from "fflate";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { hasProAccess, proRequiredResponse } from "@/lib/entitlements";
import { trackProductEvent } from "@/lib/product-events";
import { exportSiteHtml } from "@/lib/site/export-html";
import { getSiteLaunchReadiness } from "@/lib/site/launch-readiness";
import { toRenderSection } from "@/lib/site/section";
import { themeFromSite } from "@/lib/site/theme";
import { renderSiteV2 } from "@/lib/site/v2-render";

export const runtime = "nodejs";

export async function GET(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.json({ error: "Inicia sesión para descargar el sitio.", authRequired: true }, { status: 401 });
  const { siteId } = await params;
  const site = await prisma.site.findFirst({ where: { id: siteId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) }, include: { sections: { orderBy: { order: "asc" } } } });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado." }, { status: 404 });
  if (!hasProAccess(user)) return NextResponse.json(proRequiredResponse, { status: 402 });
  const readiness = getSiteLaunchReadiness(site);
  if (!readiness.canDownload) {
    const missing = readiness.missingForDownload.join(", ");
    return NextResponse.json({
      error: `Antes de descargar completa: ${missing}. El ZIP usa el endpoint público de leads, por eso el sitio debe estar publicado.`,
      code: "LAUNCH_NOT_READY",
      readiness,
    }, { status: 409 });
  }

  const endpoint = `${request.nextUrl.origin}/api/public/sites/${site.publicSlug}/leads`;
  const showBranding = user.planStatus !== "ACTIVE";
  const publicUrl = site.status === "PUBLISHED" ? (site.domainVerifiedAt && site.customDomain ? `https://${site.customDomain}` : `${request.nextUrl.origin}/s/${site.publicSlug}`) : undefined;
  const html = site.builderVersion === 2
    ? renderSiteV2({ content: site.contentJson, design: site.designJson, sections: site.sections.map((section) => section.content), leadEndpoint: endpoint, showBranding, publicUrl, indexable: Boolean(publicUrl) }).html
    : exportSiteHtml({ ...site, showBranding, theme: themeFromSite(site), sections: site.sections.map(toRenderSection) }, endpoint);
  const readme = showBranding
    ? "Abre index.html o súbelo a cualquier hosting estático. El formulario envía los contactos a Cluster mientras el proyecto permanezca publicado."
    : "Abre index.html o súbelo a cualquier hosting estático. El formulario requiere que el proyecto permanezca publicado.";
  const zip = zipSync({ "index.html": strToU8(html), "README.txt": strToU8(readme) });
  await prisma.site.update({ where: { id: site.id }, data: { downloadedAt: new Date() } });
  await trackProductEvent("site_downloaded", { userId: user.id, siteId: site.id });
  return new Response(zip, { headers: { "Content-Type": "application/zip", "Content-Disposition": `attachment; filename="${site.publicSlug}.zip"` } });
}
