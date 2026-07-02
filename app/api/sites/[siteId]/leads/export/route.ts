import { NextRequest } from "next/server";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { prisma } from "@/lib/db";

export async function GET(request: NextRequest, { params }: { params: Promise<{ siteId: string }> }) {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return Response.json({ error: "Inicia sesión." }, { status: 401 });
  const { siteId } = await params;
  const site = await prisma.site.findFirst({ where: { id: siteId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) }, select: { publicSlug: true, leads: { orderBy: { createdAt: "desc" } } } });
  if (!site) return Response.json({ error: "Sitio no encontrado." }, { status: 404 });
  const rows = [["Nombre", "Email", "Teléfono", "Mensaje", "Fecha"], ...site.leads.map((lead) => [lead.name, lead.email || "", lead.phone || "", lead.message, lead.createdAt.toISOString()])];
  const csv = rows.map((row) => row.map(csvCell).join(",")).join("\r\n");
  return new Response(`\uFEFF${csv}`, { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="${site.publicSlug}-contactos.csv"` } });
}

function csvCell(value: string) { return `"${value.replace(/"/g, '""')}"`; }
