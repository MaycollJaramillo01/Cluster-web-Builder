import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePreview } from "@/components/builder/SitePreview";
import { SitePreviewV2 } from "@/components/builder/SitePreviewV2";
import { prisma } from "@/lib/db";
import { toRenderSection } from "@/lib/site/section";
import { themeFromSite } from "@/lib/site/theme";
import { socialLinksFromBlueprint } from "@/lib/site/social-links";
import { publishedSiteMetadata, publishedSiteStructuredData } from "@/lib/site/metadata";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 300;

async function find(domain: string) {
  return prisma.site.findFirst({ where: { customDomain: domain.toLowerCase(), domainVerifiedAt: { not: null }, status: "PUBLISHED", user: { is: { OR: [{ planStatus: "ACTIVE" }, { role: "ADMIN" }] } } }, include: { sections: { orderBy: { order: "asc" } } } });
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const site = await find(decodeURIComponent((await params).domain));
  if (!site) return { title: "Sitio no encontrado", robots: { index: false, follow: false } };
  const url = `https://${site.customDomain}`;
  return publishedSiteMetadata(site, url);
}

export default async function CustomDomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const site = await find(decodeURIComponent((await params).domain));
  if (!site) notFound();
  const publicUrl = `https://${site.customDomain}`;
  if (site.builderVersion === 2) return <main>
    <SitePreviewV2 content={site.contentJson} design={site.designJson} sections={site.sections.map((section) => section.content)} leadEndpoint={`/api/public/sites/${site.publicSlug}/leads`} showBranding={false} publicUrl={publicUrl} indexable />
    <ViewPixel slug={site.publicSlug} />
  </main>;
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(publishedSiteStructuredData(site, publicUrl)).replace(/</g, "\\u003c") }} />
    <SitePreview businessName={site.businessName} businessType={site.businessType} phone={site.phone} email={site.email} location={site.location} publicSlug={site.publicSlug} showBranding={false} logoUrl={site.logoUrl} coverUrl={site.coverUrl} socialLinks={socialLinksFromBlueprint(site.blueprintJson)} theme={themeFromSite(site)} visualStyle={site.visualStyle} sections={site.sections.map(toRenderSection)} />
    <ViewPixel slug={site.publicSlug} />
  </main>;
}

function ViewPixel({ slug }: { slug: string }) {
  return <img src={`/api/public/sites/${encodeURIComponent(slug)}/view`} alt="" aria-hidden="true" style={{ display: "none" }} />;
}
