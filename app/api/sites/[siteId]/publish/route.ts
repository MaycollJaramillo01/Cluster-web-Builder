import { NextRequest, NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ siteId: string }> }
) {
  const secret = process.env.SESSION_SECRET;
  const session = request.cookies.get("__cluster_session")?.value;

  if (!secret || session !== secret) {
    return NextResponse.json(
      { error: "Inicia sesión para publicar el sitio.", authRequired: true },
      { status: 401 }
    );
  }

  const { siteId } = await params;

  try {
    const site = await prisma.site.update({
      where: { id: siteId },
      data: { status: "PUBLISHED" },
      select: { id: true, status: true },
    });

    return NextResponse.json({ ok: true, site });
  } catch {
    return NextResponse.json(
      { error: "No se encontró el sitio que quieres publicar." },
      { status: 404 }
    );
  }
}
