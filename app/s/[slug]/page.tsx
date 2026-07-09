import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePreview } from "@/components/builder/SitePreview";
import { SitePreviewV2 } from "@/components/builder/SitePreviewV2";
import { prisma } from "@/lib/db";
import { absolutePublicSiteUrl } from "@/lib/site/public-url";
import { publishedSiteMetadata, publishedSiteStructuredData } from "@/lib/site/metadata";
import { toRenderSection } from "@/lib/site/section";
import { themeFromSite } from "@/lib/site/theme";
import { socialLinksFromBlueprint } from "@/lib/site/social-links";
import { hasProAccess } from "@/lib/entitlements";

export const runtime = "nodejs";
export const dynamic = "force-static";
export const revalidate = 300;

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await prisma.site.findFirst({ where: { publicSlug: slug, status: "PUBLISHED" } });
  if (!site) return { title: "Sitio no encontrado", robots: { index: false, follow: false } };
  const url = site.domainVerifiedAt && site.customDomain ? `https://${site.customDomain}` : absolutePublicSiteUrl(site.publicSlug);
  return publishedSiteMetadata(site, url);
}

export default async function PublicSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findFirst({
    where: { publicSlug: slug, status: "PUBLISHED" },
    include: { sections: { orderBy: { order: "asc" } }, user: { select: { planStatus: true, role: true } } },
  });
  if (!site) notFound();

  const publicUrl = site.domainVerifiedAt && site.customDomain ? `https://${site.customDomain}` : absolutePublicSiteUrl(site.publicSlug);

  if (site.builderVersion === 2) {
    return <main>
      <SitePreviewV2
        content={site.contentJson}
        design={site.designJson}
        sections={site.sections.map((section) => section.content)}
        leadEndpoint={`/api/public/sites/${site.publicSlug}/leads`}
        showBranding={!hasProAccess(site.user)}
        publicUrl={publicUrl}
        indexable
      />
      <ViewPixel slug={site.publicSlug} />
    </main>;
  }

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(publishedSiteStructuredData(site, publicUrl)).replace(/</g, "\\u003c") }} />
      <SitePreview
        businessName={site.businessName}
        businessType={site.businessType}
        phone={site.phone}
        email={site.email}
        location={site.location}
        publicSlug={site.publicSlug}
        showBranding={!hasProAccess(site.user)}
        logoUrl={site.logoUrl}
        coverUrl={site.coverUrl}
        socialLinks={socialLinksFromBlueprint(site.blueprintJson)}
        theme={themeFromSite(site)}
        visualStyle={site.visualStyle}
        sections={site.sections.map(toRenderSection)}
      />
      <ViewPixel slug={site.publicSlug} />
    </main>
  );
}

function ViewPixel({ slug }: { slug: string }) {
  return <img src={`/api/public/sites/${encodeURIComponent(slug)}/view`} alt="" aria-hidden="true" style={{ display: "none" }} />;
}
