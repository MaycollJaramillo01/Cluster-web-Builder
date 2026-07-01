import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

import { prisma } from "@/lib/db";
import { consumeRateLimit } from "@/lib/rate-limit";
import { escapeHtml, sendEmail } from "@/lib/email";
import { trackProductEvent } from "@/lib/product-events";

export const runtime = "nodejs";
const cors = { "Access-Control-Allow-Origin": "*" };
const inputSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().max(160).optional().or(z.literal("")),
  phone: z.string().trim().max(40).optional(),
  message: z.string().trim().min(3).max(2000),
  website: z.string().max(200).optional(),
});

export function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: { ...cors, "Access-Control-Allow-Headers": "content-type", "Access-Control-Allow-Methods": "POST, OPTIONS" },
  });
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ slug: string }> }) {
  const parsed = inputSchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Revisa los datos del formulario." }, { status: 400, headers: cors });
  if (parsed.data.website) return NextResponse.json({ ok: true }, { headers: cors });
  if (!parsed.data.email && !parsed.data.phone) {
    return NextResponse.json({ error: "Incluye email o teléfono." }, { status: 400, headers: cors });
  }

  const { slug } = await params;
  const site = await prisma.site.findFirst({ where: { publicSlug: slug, status: "PUBLISHED" }, select: { id: true, businessName: true, user: { select: { id: true, email: true } } } });
  if (!site) return NextResponse.json({ error: "Sitio no encontrado." }, { status: 404, headers: cors });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
  if (!(await consumeRateLimit("lead", `${slug}:${ip}`, 5, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiados intentos. Prueba más tarde." }, { status: 429, headers: cors });
  }

  const lead = await prisma.lead.create({ data: {
    siteId: site.id,
    name: parsed.data.name,
    email: parsed.data.email || null,
    phone: parsed.data.phone || null,
    message: parsed.data.message,
  } });
  await trackProductEvent("lead_received", { userId: site.user?.id, siteId: site.id });
  if (site.user?.email) await sendEmail({
    to: site.user.email,
    subject: `Nuevo contacto desde ${site.businessName}`,
    html: `<p><strong>${escapeHtml(lead.name)}</strong> dejó un mensaje:</p><p>${escapeHtml(lead.message)}</p><p>${escapeHtml(lead.email || lead.phone || "Sin contacto")}</p>`,
  });
  return NextResponse.json({ ok: true }, { status: 201, headers: cors });
}
