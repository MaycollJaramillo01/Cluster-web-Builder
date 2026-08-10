import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getCurrentUser, GUEST_COOKIE, hashGuestToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { publicSiteUrl } from "@/lib/site/public-url";
import { SiteEditorV2 } from "@/components/builder/SiteEditorV2";
import { normalizeCanvasSectionsV2, normalizeSiteContentV2, normalizeThemeV2 } from "@/lib/site/v2-schema";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SiteEditorPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const user = await getCurrentUser();
  const guestTokenHash = hashGuestToken((await cookies()).get(GUEST_COOKIE)?.value);
  if (!user && !guestTokenHash) redirect(`/login?from=/builder/${siteId}`);

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

  if (!site) notFound();

  if (site.builderVersion !== 2) notFound();

  return <SiteEditorV2 initialSite={{
    id: site.id,
    content: normalizeSiteContentV2(site.contentJson),
    design: normalizeThemeV2(site.designJson),
    sections: normalizeCanvasSectionsV2(site.sections.map((section: { content: unknown }) => section.content)),
    status: site.status,
    publicSlug: site.publicSlug,
    publicUrl: site.domainVerifiedAt && site.customDomain ? `https://${site.customDomain}` : publicSiteUrl(site.publicSlug),
    updatedAt: site.updatedAt.toISOString(),
  }} />;
}
