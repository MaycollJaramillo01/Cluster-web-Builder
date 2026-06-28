import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { absolutePublicSiteUrl } from "@/lib/site/public-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sites = await prisma.site.findMany({ where: { status: "PUBLISHED" }, select: { publicSlug: true, updatedAt: true } });
  return sites.map((site) => ({ url: absolutePublicSiteUrl(site.publicSlug), lastModified: site.updatedAt, changeFrequency: "weekly", priority: 0.8 }));
}
