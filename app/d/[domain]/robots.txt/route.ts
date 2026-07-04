import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { hasProAccess } from "@/lib/entitlements";

export async function GET(_request: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const normalized = decodeURIComponent(domain).toLowerCase();
  const site = await prisma.site.findFirst({
    where: { customDomain: normalized, status: "PUBLISHED", domainVerifiedAt: { not: null } },
    include: { user: true },
  });
  if (!site || !hasProAccess(site.user)) return new NextResponse("User-agent: *\nDisallow: /", { status: 404, headers: { "Content-Type": "text/plain; charset=utf-8" } });
  return new NextResponse(`User-agent: *\nAllow: /\nSitemap: https://${normalized}/sitemap.xml`, { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=300" } });
}
