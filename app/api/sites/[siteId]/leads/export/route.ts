import { NextRequest } from "next/server";

import { assertSiteAccess, siteAccessErrorResponse } from "@/lib/site/access";

export async function GET(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const { siteId } = await params;
  try {
    const { site } = await assertSiteAccess({
      siteId,
      request,
      requireUser: true,
      select: { publicSlug: true, leads: { orderBy: { createdAt: "desc" } } },
    });
    const leads = (site.leads ?? []) as Array<{
      name: string;
      email: string | null;
      phone: string | null;
      message: string;
      createdAt: Date | string;
    }>;
    const rows = [
      ["Nombre", "Email", "Teléfono", "Mensaje", "Fecha"],
      ...leads.map((lead) => [
        lead.name,
        lead.email || "",
        lead.phone || "",
        lead.message,
        lead.createdAt instanceof Date ? lead.createdAt.toISOString() : String(lead.createdAt),
      ]),
    ];
    const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
    return new Response(`\uFEFF${csv}`, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${String(site.publicSlug ?? siteId)}-contactos.csv"`,
      },
    });
  } catch (error) {
    return siteAccessErrorResponse(error) ?? Response.json({ error: "Sitio no encontrado." }, { status: 404 });
  }
}

function csvCell(value: string) { return `"${value.replace(/"/g, '""')}"`; }
