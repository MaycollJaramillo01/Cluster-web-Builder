import { notFound, redirect } from "next/navigation";
import { cookies } from "next/headers";

import { getCurrentUser, GUEST_COOKIE, hashGuestToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toRenderSection } from "@/lib/site/section";
import { themeFromSite } from "@/lib/site/theme";
import { publicSiteUrl } from "@/lib/site/public-url";
import { SiteEditorPanel } from "@/components/builder/SiteEditorPanel";
import { socialLinksFromBlueprint } from "@/lib/site/social-links";
import { SiteEditorV2 } from "@/components/builder/SiteEditorV2";
import { LegacyEditorGate } from "@/components/builder/LegacyEditorGate";
import { normalizeCanvasSectionsV2, normalizeSiteContentV2, normalizeThemeV2, V2_TEMPLATE_IDS } from "@/lib/site/v2-schema";

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

  if (site.builderVersion === 1) {
    return <LegacyEditorGate siteId={site.id} published={site.status === "PUBLISHED"} />;
  }

  if (site.builderVersion === 2) {
    const templateId = (V2_TEMPLATE_IDS as readonly string[]).includes(String(site.templateId)) ? site.templateId as (typeof V2_TEMPLATE_IDS)[number] : "conversion";
    return <SiteEditorV2 initialSite={{
      id: site.id,
      templateId,
      content: normalizeSiteContentV2(site.contentJson),
      design: normalizeThemeV2(site.designJson),
      sections: normalizeCanvasSectionsV2(site.sections.map((section) => section.content)),
      status: site.status,
      publicSlug: site.publicSlug,
      publicUrl: site.domainVerifiedAt && site.customDomain ? `https://${site.customDomain}` : publicSiteUrl(site.publicSlug),
      updatedAt: site.updatedAt.toISOString(),
    }} />;
  }

  const theme = themeFromSite(site);
  return (
    <SiteEditorPanel
      isAuthenticated={Boolean(user)}
      initialSite={{
        id: site.id,
        businessName: site.businessName,
        businessType: site.businessType,
        phone: site.phone,
        email: site.email,
        location: site.location,
        domain: site.domain,
        language: site.language,
        visualStyle: site.visualStyle,
        status: site.status,
        publicSlug: site.publicSlug,
        publicUrl: site.domainVerifiedAt && site.customDomain ? `https://${site.customDomain}` : publicSiteUrl(site.publicSlug),
        logoUrl: site.logoUrl,
        coverUrl: site.coverUrl,
        theme,
        socialLinks: socialLinksFromBlueprint(site.blueprintJson),
      }}
      initialSections={site.sections.map(toRenderSection)}
    />
  );
}
