import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { hasProAccess } from "@/lib/entitlements";

function xml(value: string) {
  return value.replace(/[<>&'\"]/g, (character) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", "'": "&apos;", '\"': "&quot;" })[character] || character);
}

export async function GET(_request: Request, { params }: { params: Promise<{ domain: string }> }) {
  const { domain } = await params;
  const normalized = decodeURIComponent(domain).toLowerCase();
  const site = await prisma.site.findFirst({
    where: { customDomain: normalized, status: "PUBLISHED", domainVerifiedAt: { not: null } },
    include: { user: true },
  });
  if (!site || !hasProAccess(site.user)) return new NextResponse("Not found", { status: 404 });
  const url = `https://${normalized}`;
  const body = `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${xml(url)}</loc><lastmod>${site.updatedAt.toISOString()}</lastmod><changefreq>weekly</changefreq><priority>1.0</priority></url></urlset>`;
  return new NextResponse(body, { headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=300, s-maxage=300" } });
}
