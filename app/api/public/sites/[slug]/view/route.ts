import { after, NextResponse } from "next/server";

import { prisma } from "@/lib/db";
import { trackSiteView } from "@/lib/site/track-view";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const headers = {
  "Cache-Control": "no-store, max-age=0",
};

export async function GET(_request: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const site = await prisma.site.findFirst({
    where: { publicSlug: slug, status: "PUBLISHED" },
    select: { id: true },
  });

  if (site) after(() => trackSiteView(site.id));
  return new NextResponse(null, { status: 204, headers });
}

