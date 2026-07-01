import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { absolutePublicSiteUrl, appOrigin } from "@/lib/site/public-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sites = await prisma.site.findMany({ where: { status: "PUBLISHED" }, select: { publicSlug: true, updatedAt: true } });
  const origin = appOrigin();
  const pages = ["", "/para-negocios", "/domains", "/pricing", "/help", "/terms", "/privacy", "/cookies", "/refund-policy", "/acceptable-use"];
  return [
    ...pages.map((path) => ({ url: `${origin}${path}`, changeFrequency: "monthly" as const, priority: path ? 0.7 : 1 })),
    ...sites.map((site) => ({ url: absolutePublicSiteUrl(site.publicSlug), lastModified: site.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
