import type { Metadata } from "next";

import { sanitizeLink } from "@/lib/site/links";
import { normalizeSiteContentV2 } from "@/lib/site/v2-schema";

type SiteMetadataSource = {
  builderVersion?: number | null;
  businessName: string;
  businessType: string;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  logoUrl?: string | null;
  coverUrl?: string | null;
  blueprintJson?: unknown;
  contentJson?: unknown;
};

function imageUrl(value: unknown) {
  const url = sanitizeLink(typeof value === "string" ? value : "");
  return url.startsWith("https://") && !/(?:youtu\.be|youtube\.com|\.mp4(?:$|[?#])|\.webm(?:$|[?#]))/i.test(url) ? url : "";
}

export function publishedSiteMetadata(site: SiteMetadataSource, url: string): Metadata {
  const content = normalizeSiteContentV2(site.contentJson);
  const legacySeo = (site.blueprintJson as { site?: { seo?: { title?: string; metaDescription?: string } } } | null)?.site?.seo;
  const title = (site.builderVersion === 2 ? content.seo.title : "") || legacySeo?.title || site.businessName;
  const description = (site.builderVersion === 2 ? content.seo.description : "") || legacySeo?.metaDescription || [site.businessName, site.businessType].filter(Boolean).join(" - ");
  const image = [content.hero.media, content.business.logo, site.coverUrl, site.logoUrl].map(imageUrl).find(Boolean);
  const icon = imageUrl(content.business.logo) || imageUrl(site.logoUrl);
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: true, follow: true },
    ...(icon ? { icons: { icon } } : {}),
    openGraph: {
      title, description, url, type: "website", siteName: site.businessName, locale: "es_ES",
      ...(image ? { images: [{ url: image, alt: site.businessName }] } : {}),
    },
    twitter: {
      card: "summary_large_image", title, description,
      ...(image ? { images: [image] } : {}),
    },
  };
}

export function publishedSiteStructuredData(site: SiteMetadataSource, url: string) {
  return {
    "@context": "https://schema.org",
    "@type": site.location || site.phone ? "LocalBusiness" : "Organization",
    name: site.businessName,
    url,
    ...(site.phone ? { telephone: site.phone } : {}),
    ...(site.email ? { email: site.email } : {}),
    ...(site.location ? { address: { "@type": "PostalAddress", streetAddress: site.location } } : {}),
    ...(imageUrl(site.logoUrl) ? { logo: imageUrl(site.logoUrl) } : {}),
  };
}
