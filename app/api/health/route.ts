import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { ok: true, db: "ok", latencyMs: Date.now() - startedAt },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, db: "error", latencyMs: Date.now() - startedAt },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

