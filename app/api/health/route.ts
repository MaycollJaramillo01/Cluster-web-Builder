import { NextResponse } from "next/server";

import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const startedAt = Date.now();
  const integrations = integrationStatus();
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json(
      { ok: true, db: "ok", latencyMs: Date.now() - startedAt, integrations },
      { headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  } catch {
    return NextResponse.json(
      { ok: false, db: "error", latencyMs: Date.now() - startedAt, integrations },
      { status: 503, headers: { "Cache-Control": "no-store, max-age=0" } },
    );
  }
}

function integrationStatus() {
  return {
    blob: Boolean(process.env.BLOB_READ_WRITE_TOKEN),
    stripe: Boolean(process.env.STRIPE_SECRET_KEY && process.env.STRIPE_WEBHOOK_SECRET),
    email: Boolean(process.env.BREVO_API_KEY && process.env.EMAIL_FROM),
    domains: Boolean(process.env.VERCEL_TOKEN && process.env.VERCEL_PROJECT_ID),
    appUrl: Boolean(process.env.NEXT_PUBLIC_APP_URL),
  };
}
