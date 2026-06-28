import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { headers } from "next/headers";

import { SitePreview } from "@/components/builder/SitePreview";
import { prisma } from "@/lib/db";
import { absolutePublicSiteUrl } from "@/lib/site/public-url";
import { toRenderSection } from "@/lib/site/section";
import { themeFromSite } from "@/lib/site/theme";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

async function requestOrigin() {
  const values = await headers();
  const host = values.get("x-forwarded-host") || values.get("host");
  const protocol = values.get("x-forwarded-proto") || (host?.startsWith("localhost") ? "http" : "https");
  return host ? `${protocol}://${host}` : undefined;
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const site = await prisma.site.findFirst({ where: { publicSlug: slug, status: "PUBLISHED" } });
  if (!site) return { title: "Sitio no encontrado", robots: { index: false, follow: false } };
  const seo = (site.blueprintJson as { site?: { seo?: { title?: string; metaDescription?: string } } } | null)?.site?.seo;
  const title = seo?.title || site.businessName;
  const description = seo?.metaDescription || `${site.businessName} — ${site.businessType}`;
  const url = absolutePublicSiteUrl(site.publicSlug, await requestOrigin());
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url, type: "website", siteName: site.businessName },
    robots: { index: true, follow: true },
  };
}

export default async function PublicSitePage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findFirst({
    where: { publicSlug: slug, status: "PUBLISHED" },
    include: { sections: { orderBy: { order: "asc" } }, user: { select: { planStatus: true } } },
  });
  if (!site) notFound();

  const structuredData = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: site.businessName,
    url: absolutePublicSiteUrl(site.publicSlug, await requestOrigin()),
    telephone: site.phone || undefined,
    email: site.email || undefined,
    address: site.location || undefined,
  };

  return (
    <main>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(structuredData).replace(/</g, "\\u003c") }} />
      <SitePreview
        businessName={site.businessName}
        businessType={site.businessType}
        phone={site.phone}
        email={site.email}
        location={site.location}
        publicSlug={site.publicSlug}
        showBranding={site.user?.planStatus !== "ACTIVE"}
        theme={themeFromSite(site)}
        visualStyle={site.visualStyle}
        sections={site.sections.map(toRenderSection)}
      />
    </main>
  );
}
