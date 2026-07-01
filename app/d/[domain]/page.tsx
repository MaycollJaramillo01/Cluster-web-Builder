import type { Metadata } from "next";
import { notFound } from "next/navigation";

import { SitePreview } from "@/components/builder/SitePreview";
import { prisma } from "@/lib/db";
import { toRenderSection } from "@/lib/site/section";
import { themeFromSite } from "@/lib/site/theme";
import { socialLinksFromBlueprint } from "@/lib/site/social-links";
import { trackSiteView } from "@/lib/site/track-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function find(domain: string) {
  return prisma.site.findFirst({ where: { customDomain: domain.toLowerCase(), domainVerifiedAt: { not: null }, status: "PUBLISHED", user: { is: { OR: [{ planStatus: "ACTIVE" }, { role: "ADMIN" }] } } }, include: { sections: { orderBy: { order: "asc" } } } });
}

export async function generateMetadata({ params }: { params: Promise<{ domain: string }> }): Promise<Metadata> {
  const site = await find(decodeURIComponent((await params).domain));
  if (!site) return { title: "Sitio no encontrado", robots: { index: false, follow: false } };
  const seo = (site.blueprintJson as { site?: { seo?: { title?: string; metaDescription?: string } } } | null)?.site?.seo;
  const title = seo?.title || site.businessName;
  const description = seo?.metaDescription || `${site.businessName} — ${site.businessType}`;
  const url = `https://${site.customDomain}`;
  return { title, description, alternates: { canonical: url }, openGraph: { title, description, url, type: "website" }, robots: { index: true, follow: true } };
}

export default async function CustomDomainPage({ params }: { params: Promise<{ domain: string }> }) {
  const site = await find(decodeURIComponent((await params).domain));
  if (!site) notFound();
  void trackSiteView(site.id);
  const structuredData = { "@context": "https://schema.org", "@type": "LocalBusiness", name: site.businessName, url: `https://${site.customDomain}`, telephone: site.phone || undefined, email: site.email || undefined, address: site.location || undefined };
  return <main>
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
    <SitePreview businessName={site.businessName} businessType={site.businessType} phone={site.phone} email={site.email} location={site.location} publicSlug={site.publicSlug} showBranding={false} logoUrl={site.logoUrl} coverUrl={site.coverUrl} socialLinks={socialLinksFromBlueprint(site.blueprintJson)} theme={themeFromSite(site)} visualStyle={site.visualStyle} sections={site.sections.map(toRenderSection)} />
  </main>;
}
