import Link from "next/link";
import { redirect } from "next/navigation";

import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
const METRICS_WINDOW_START = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

export default async function MetricsPage() {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/admin/metrics");
  if (user.role !== "ADMIN") redirect("/dashboard");
  const [users, activeUsers, publishedSites, leads, events] = await Promise.all([
    prisma.user.count(),
    prisma.user.count({ where: { planStatus: "ACTIVE" } }),
    prisma.site.count({ where: { status: "PUBLISHED" } }),
    prisma.lead.count(),
    prisma.productEvent.groupBy({ by: ["name"], where: { createdAt: { gte: METRICS_WINDOW_START } }, _count: { _all: true }, orderBy: { _count: { name: "desc" } } }),
  ]);
  return <main className="min-h-dvh bg-background px-5 py-10 text-foreground sm:px-8"><div className="mx-auto max-w-6xl">
    <Link href="/dashboard" className="text-sm text-muted-foreground">← Volver al dashboard</Link>
    <h1 className="mt-8 text-4xl font-semibold">Métricas comerciales</h1>
    <p className="mt-2 text-muted-foreground">Actividad acumulada y eventos de los últimos 30 días.</p>
    <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <Metric label="Usuarios" value={users} /><Metric label="Planes activos" value={activeUsers} /><Metric label="Sitios publicados" value={publishedSites} /><Metric label="Contactos" value={leads} />
    </div>
    <div className="mt-8 overflow-hidden rounded-xl border border-border"><table className="w-full text-left text-sm"><thead className="bg-card text-xs uppercase text-muted-foreground"><tr><th className="p-4">Evento</th><th className="p-4 text-right">Últimos 30 días</th></tr></thead><tbody>{events.map((event) => <tr key={event.name} className="border-t border-border"><td className="p-4 font-medium">{event.name}</td><td className="p-4 text-right tabular-nums">{event._count._all}</td></tr>)}</tbody></table></div>
  </div></main>;
}

function Metric({ label, value }: { label: string; value: number }) { return <div className="rounded-xl border border-border bg-card p-6"><p className="text-sm text-muted-foreground">{label}</p><p className="mt-3 text-4xl font-semibold tabular-nums">{value}</p></div>; }
