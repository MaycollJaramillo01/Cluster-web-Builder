import type { MetadataRoute } from "next";

import { appOrigin } from "@/lib/site/public-url";

export default function robots(): MetadataRoute.Robots {
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/builder/", "/dashboard", "/admin/"] }, sitemap: `${appOrigin()}/sitemap.xml` };
}
