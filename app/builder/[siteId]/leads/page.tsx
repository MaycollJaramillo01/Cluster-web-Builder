import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Inbox } from "lucide-react";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export default async function LeadsPage({ params }: { params: Promise<{ siteId: string }> }) {
  const user = await getCurrentUser();
  const { siteId } = await params;
  if (!user) redirect(`/login?from=/builder/${siteId}/leads`);
  const site = await prisma.site.findFirst({
    where: { id: siteId, ...(user.role === "ADMIN" ? {} : { userId: user.id }) },
    select: { businessName: true, leads: { orderBy: { createdAt: "desc" } } },
  });
  if (!site) notFound();
  await prisma.lead.updateMany({ where: { siteId, readAt: null }, data: { readAt: new Date() } });

  return (
    <main className="min-h-dvh bg-background px-5 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-5xl">
        <Button asChild variant="ghost"><Link href={`/builder/${siteId}`}><ArrowLeft /> Volver al editor</Link></Button>
        <div className="mt-8 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
          <Inbox className="h-7 w-7 text-[#a078ff]" />
          <div><h1 className="text-3xl font-semibold">Contactos</h1><p className="text-sm text-muted-foreground">{site.businessName}</p></div>
          </div>
          <Button asChild variant="outline"><a href={`/api/sites/${siteId}/leads/export`}>Exportar CSV</a></Button>
        </div>
        {site.leads.length === 0 ? (
          <div className="mt-8 rounded-lg border border-dashed border-border p-12 text-center text-muted-foreground">Aún no hay mensajes.</div>
        ) : (
          <div className="mt-8 overflow-x-auto rounded-lg border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-xs uppercase text-muted-foreground"><tr><th className="p-4">Contacto</th><th className="p-4">Mensaje</th><th className="p-4">Fecha</th></tr></thead>
              <tbody>{site.leads.map((lead) => (
                <tr key={lead.id} className="border-t border-border align-top">
                  <td className="p-4"><strong>{lead.name}</strong><div className="mt-1 text-muted-foreground">{lead.email || lead.phone}</div></td>
                  <td className="max-w-xl whitespace-pre-wrap p-4">{lead.message}</td>
                  <td className="whitespace-nowrap p-4 text-muted-foreground">{lead.createdAt.toLocaleString("es")}</td>
                </tr>
              ))}</tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}
