import { notFound } from "next/navigation";

import { prisma } from "@/lib/db";
import { toRenderSection } from "@/lib/site/section";
import { themeFromSite } from "@/lib/site/theme";
import { parseNavPages } from "@/lib/site/structure";
import { SiteEditorPanel } from "@/components/builder/SiteEditorPanel";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function SiteEditorPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!site) notFound();

  const theme = themeFromSite(site);
  const navPages = parseNavPages(site.navPages);

  return (
    <SiteEditorPanel
      navPages={navPages}
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
        theme,
      }}
      initialSections={site.sections.map(toRenderSection)}
    />
  );
}
