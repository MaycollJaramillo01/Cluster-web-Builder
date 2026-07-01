import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, BarChart3, Eye, TrendingUp } from "lucide-react";
import { cookies } from "next/headers";

import { getCurrentUser, GUEST_COOKIE, hashGuestToken } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function todayStr() {
  return new Date().toISOString().slice(0, 10);
}

function daysAgoStr(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}

function formatDate(dateStr: string): string {
  const [year, month, day] = dateStr.split("-");
  const months = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];
  return `${parseInt(day)} ${months[parseInt(month) - 1]}`;
}

export default async function SiteAnalyticsPage({
  params,
}: {
  params: Promise<{ siteId: string }>;
}) {
  const { siteId } = await params;

  const user = await getCurrentUser();
  const guestTokenHash = hashGuestToken((await cookies()).get(GUEST_COOKIE)?.value);
  if (!user && !guestTokenHash) redirect(`/login?from=/builder/${siteId}/analytics`);

  const site = await prisma.site.findFirst({
    where: {
      id: siteId,
      OR: [
        ...(user ? [{ userId: user.id }] : []),
        ...(guestTokenHash ? [{ userId: null, guestTokenHash, guestExpiresAt: { gt: new Date() } }] : []),
      ],
    },
    select: { id: true, businessName: true, publicSlug: true, status: true },
  });

  if (!site) notFound();

  const thirtyDaysAgo = daysAgoStr(29);
  const sevenDaysAgo = daysAgoStr(6);
  const today = todayStr();

  const allViews = await prisma.siteView.findMany({
    where: { siteId },
    orderBy: { date: "asc" },
  });

  const totalViews = allViews.reduce((sum, v) => sum + v.views, 0);

  const last30 = allViews.filter((v) => v.date >= thirtyDaysAgo);
  const views30 = last30.reduce((sum, v) => sum + v.views, 0);

  const last7 = allViews.filter((v) => v.date >= sevenDaysAgo);
  const views7 = last7.reduce((sum, v) => sum + v.views, 0);

  // Build a complete 30-day series filling missing days with 0
  const viewMap = new Map(allViews.map((v) => [v.date, v.views]));
  const series: { date: string; views: number }[] = [];
  for (let i = 29; i >= 0; i--) {
    const d = daysAgoStr(i);
    series.push({ date: d, views: viewMap.get(d) ?? 0 });
  }
  const maxViews = Math.max(...series.map((s) => s.views), 1);

  // Best day
  const bestDay = allViews.reduce(
    (best, v) => (v.views > (best?.views ?? 0) ? v : best),
    null as (typeof allViews)[0] | null
  );

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-[#2d243d] bg-[#0f0d15]">
        <div className="mx-auto flex min-h-16 max-w-5xl items-center gap-4 px-5 py-3 sm:px-8">
          <Link
            href={`/builder/${siteId}`}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Volver al editor
          </Link>
        </div>
      </header>

      <div className="mx-auto max-w-5xl px-5 py-10 sm:px-8">
        <div className="mb-8">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a078ff]">Analytics</p>
          <h1 className="mt-2 text-3xl font-semibold sm:text-4xl">{site.businessName}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Visitas registradas desde que el sitio fue publicado.
          </p>
        </div>

        {/* Stat cards */}
        <div className="grid gap-4 sm:grid-cols-3">
          <StatCard icon={Eye} label="Visitas totales" value={totalViews.toLocaleString("es")} />
          <StatCard icon={BarChart3} label="Ultimos 30 dias" value={views30.toLocaleString("es")} />
          <StatCard icon={TrendingUp} label="Ultimos 7 dias" value={views7.toLocaleString("es")} />
        </div>

        {/* Best day */}
        {bestDay && (
          <div className="mt-4 rounded-xl border border-border bg-card px-5 py-4 text-sm text-muted-foreground">
            Mejor dia:{" "}
            <span className="font-semibold text-foreground">
              {formatDate(bestDay.date)} — {bestDay.views.toLocaleString("es")} visitas
            </span>
          </div>
        )}

        {/* Bar chart — last 30 days */}
        <div className="mt-8 rounded-xl border border-border bg-card p-6">
          <p className="mb-6 text-sm font-semibold">Visitas diarias — ultimos 30 dias</p>
          {totalViews === 0 ? (
            <div className="flex h-40 items-center justify-center text-sm text-muted-foreground">
              Sin visitas registradas aun. Publica tu sitio para empezar a ver datos.
            </div>
          ) : (
            <div className="flex h-40 items-end gap-1">
              {series.map(({ date, views }) => {
                const heightPct = Math.max((views / maxViews) * 100, views > 0 ? 4 : 0);
                const isToday = date === today;
                return (
                  <div
                    key={date}
                    className="group relative flex flex-1 flex-col items-center justify-end"
                    title={`${formatDate(date)}: ${views} visitas`}
                  >
                    <div
                      className="w-full rounded-t transition-all duration-200"
                      style={{
                        height: `${heightPct}%`,
                        backgroundColor: isToday ? "#a078ff" : views > 0 ? "#6d35db" : "#2d243d",
                      }}
                    />
                    {/* Tooltip on hover */}
                    <div className="pointer-events-none absolute -top-9 left-1/2 z-10 hidden -translate-x-1/2 whitespace-nowrap rounded bg-[#1a1525] px-2 py-1 text-xs text-white shadow group-hover:block">
                      {formatDate(date)}: {views}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          {/* X-axis labels — first, middle, last */}
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span>{formatDate(series[0].date)}</span>
            <span>{formatDate(series[14].date)}</span>
            <span>{formatDate(series[29].date)}</span>
          </div>
        </div>

        {/* Raw data table (last 30 days with views) */}
        {last30.filter((v) => v.views > 0).length > 0 && (
          <div className="mt-8 overflow-hidden rounded-xl border border-border">
            <table className="w-full text-left text-sm">
              <thead className="bg-card text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-5 py-3">Fecha</th>
                  <th className="px-5 py-3 text-right">Visitas</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {[...last30]
                  .filter((v) => v.views > 0)
                  .sort((a, b) => b.date.localeCompare(a.date))
                  .slice(0, 20)
                  .map((v) => (
                    <tr key={v.date}>
                      <td className="px-5 py-3 font-medium">{formatDate(v.date)}</td>
                      <td className="px-5 py-3 text-right tabular-nums">{v.views.toLocaleString("es")}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}

function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl border border-border bg-card p-6">
      <div className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
        <p className="text-sm">{label}</p>
      </div>
      <p className="mt-3 text-4xl font-semibold tabular-nums">{value}</p>
    </div>
  );
}
