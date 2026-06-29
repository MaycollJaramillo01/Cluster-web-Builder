import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { absolutePublicSiteUrl } from "@/lib/site/public-url";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const sites = await prisma.site.findMany({ where: { status: "PUBLISHED" }, select: { publicSlug: true, updatedAt: true } });
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  const origin = configured?.startsWith("http") ? configured.replace(/\/$/, "") : "http://localhost:3000";
  const pages = ["", "/para-negocios", "/domains", "/pricing", "/help", "/terms", "/privacy", "/cookies", "/refund-policy", "/acceptable-use"];
  return [
    ...pages.map((path) => ({ url: `${origin}${path}`, changeFrequency: "monthly" as const, priority: path ? 0.7 : 1 })),
    ...sites.map((site) => ({ url: absolutePublicSiteUrl(site.publicSlug), lastModified: site.updatedAt, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
