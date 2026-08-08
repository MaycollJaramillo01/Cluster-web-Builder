import { NextRequest } from "next/server";

import { prisma } from "@/lib/db";
import { assertSiteAccess, siteAccessErrorResponse } from "@/lib/site/access";

export async function GET(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  try {
    await assertSiteAccess({ siteId, request, requireUser: true, select: { id: true } });
    const site = await prisma.site.findFirst({
      where: { id: siteId },
      select: { publicSlug: true, leads: { orderBy: { createdAt: "desc" } } },
    });
    if (!site) return Response.json({ error: "Sitio no encontrado." }, { status: 404 });
    const rows = [
      ["Nombre", "Email", "Teléfono", "Mensaje", "Fecha"],
      ...site.leads.map((lead) => [
        lead.name,
        lead.email || "",
        lead.phone || "",
        lead.message,
        lead.createdAt.toISOString(),
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${site.publicSlug}-contactos.csv"`,
      },
    });
  } catch (error) {
    return siteAccessErrorResponse(error) ?? Response.json({ error: "Sitio no encontrado." }, { status: 404 });
  }
}

function csvCell(value: string) { return `"${value.replace(/"/g, '""')}"`; }
