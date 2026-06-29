import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const origin = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  return { rules: { userAgent: "*", allow: "/", disallow: ["/api/", "/builder/", "/dashboard", "/admin/"] }, sitemap: `${origin.replace(/\/$/, "")}/sitemap.xml` };
}
