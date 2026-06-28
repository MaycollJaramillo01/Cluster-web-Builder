import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { cookies } from "next/headers";

import { getCurrentUser, GUEST_COOKIE, hashGuestToken } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { toRenderSection } from "@/lib/site/section";
import { themeFromSite } from "@/lib/site/theme";
import { SitePreview } from "@/components/builder/SitePreview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteId: string }>;
}): Promise<Metadata> {
  const { siteId } = await params;
  const user = await getCurrentUser();
  const guestTokenHash = hashGuestToken((await cookies()).get(GUEST_COOKIE)?.value);
  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      OR: [
        { status: "PUBLISHED" },
        ...(user ? [{ userId: user.id }] : []),
        ...(guestTokenHash ? [{ userId: null, guestTokenHash, guestExpiresAt: { gt: new Date() } }] : []),
      ],
    },
  });
  if (!site) return { title: "Sitio no encontrado" };

  const blueprint = site.blueprintJson as
    | { site?: { seo?: { title?: string; metaDescription?: string } } }
    | null;
  const seo = blueprint?.site?.seo;
  return {
    title: seo?.title || site.businessName,
    description: seo?.metaDescription || undefined,
  };
}

export default async function PreviewPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;
  const user = await getCurrentUser();
  const guestTokenHash = hashGuestToken((await cookies()).get(GUEST_COOKIE)?.value);

  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      OR: [
        { status: "PUBLISHED" },
        ...(user ? [{ userId: user.id }] : []),
        ...(guestTokenHash ? [{ userId: null, guestTokenHash, guestExpiresAt: { gt: new Date() } }] : []),
      ],
    },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!site) notFound();

  const theme = themeFromSite(site);
  return (
    <main>
      <SitePreview
        businessName={site.businessName}
        businessType={site.businessType}
        phone={site.phone}
        email={site.email}
        location={site.location}
        theme={theme}
        visualStyle={site.visualStyle}
        sections={site.sections.map(toRenderSection)}
      />
    </main>
  );
}
