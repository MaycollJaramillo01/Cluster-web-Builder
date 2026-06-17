import { notFound } from "next/navigation";
import type { Metadata } from "next";

import { prisma } from "@/lib/db";
import { toRenderSection } from "@/lib/site/section";
import { themeFromSite } from "@/lib/site/theme";
import { parseNavPages } from "@/lib/site/structure";
import { SitePreview } from "@/components/builder/SitePreview";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ siteId: string; slug: string }>;
}): Promise<Metadata> {
  const { siteId, slug } = await params;
  const site = await prisma.site.findUnique({ where: { id: siteId } });
  if (!site) return { title: "Sitio no encontrado" };
  const navPages = parseNavPages(site.navPages);
  const page = navPages.find((p) => p.slug === slug);
  return { title: page ? `${page.name} · ${site.businessName}` : site.businessName };
}

export default async function PreviewSubPage({
  params,
}: {
  params: Promise<{ siteId: string; slug: string }>;
}) {
  const { siteId, slug } = await params;

  const site = await prisma.site.findUnique({
    where: { id: siteId },
    include: { sections: { orderBy: { order: "asc" } } },
  });

  if (!site) notFound();

  const navPages = parseNavPages(site.navPages);
  // Unknown page slug -> 404 (home lives at the parent route).
  if (slug === "home" || !navPages.some((p) => p.slug === slug)) notFound();

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
        navPages={navPages}
        currentPageSlug={slug}
        baseHref={`/preview/${site.id}`}
      />
    </main>
  );
}
