import Link from "next/link";
import { redirect } from "next/navigation";
import { Globe, MapPin, Search } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Sitios | Admin Cluster" };

const STATUS_STYLE = {
  GENERATED: { label: "Generado",  dot: "bg-emerald-400", text: "text-emerald-300", bg: "bg-emerald-950/40 border-emerald-800" },
  DRAFT:     { label: "Borrador",  dot: "bg-[#a078ff]",   text: "text-[#d0bcff]",  bg: "bg-[#1d1a23] border-[#573878]" },
  PUBLISHED: { label: "Publicado", dot: "bg-sky-400",      text: "text-sky-300",    bg: "bg-sky-950/40 border-sky-800" },
} as const;

export default async function AdminSitesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string; page?: string }>;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/admin/sites");
  if (user.role !== "ADMIN") redirect("/dashboard");

  const { q = "", status = "", page = "1" } = await searchParams;
  const pageSize = 50;
  const skip = (Math.max(1, Number(page)) - 1) * pageSize;

  const where = {
    ...(q ? {
      OR: [
        { businessName: { contains: q, mode: "insensitive" as const } },
        { businessType: { contains: q, mode: "insensitive" as const } },
        { location: { contains: q, mode: "insensitive" as const } },
      ],
    } : {}),
    ...(status ? { status: status as "DRAFT" | "GENERATED" | "PUBLISHED" } : {}),
  };

  const [sites, total, counts] = await Promise.all([
    prisma.site.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip,
      take: pageSize,
      select: {
        id: true,
        businessName: true,
        businessType: true,
        location: true,
        status: true,
        publicSlug: true,
        customDomain: true,
        domainVerifiedAt: true,
        language: true,
        createdAt: true,
        user: { select: { username: true, name: true } },
      },
    }),
    prisma.site.count({ where }),
    prisma.site.groupBy({ by: ["status"], _count: { id: true } }),
  ]);

  const countMap = Object.fromEntries(counts.map((c) => [c.status, c._count.id]));
  const totalAll   = (countMap.DRAFT ?? 0) + (countMap.GENERATED ?? 0) + (countMap.PUBLISHED ?? 0);
  const totalPages = Math.ceil(total / pageSize);

  const buildUrl = (params: Record<string, string>) => {
    const sp = new URLSearchParams({ ...(q && { q }), ...(status && { status }), page: "1", ...params });
    return `/admin/sites?${sp}`;
  };

  return (
    <main className="min-h-dvh bg-background px-4 py-10 text-foreground sm:px-8">
      <div className="mx-auto max-w-7xl">

        {/* Header */}
        <div className="mb-8 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a078ff]">Administración</p>
            <h1 className="mt-2 text-3xl font-semibold">Todos los sitios</h1>
            <p className="mt-1 text-sm text-muted-foreground">{totalAll} proyectos creados · {total} visibles con los filtros actuales</p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" size="sm"><Link href="/admin/users">Usuarios</Link></Button>
            <Button asChild variant="outline" size="sm"><Link href="/dashboard">Dashboard</Link></Button>
          </div>
        </div>

        {/* Stat pills */}
        <div className="mb-6 flex flex-wrap gap-3">
          {(["GENERATED", "PUBLISHED", "DRAFT"] as const).map((s) => {
            const st = STATUS_STYLE[s];
            return (
              <Link
                key={s}
                href={buildUrl({ status: status === s ? "" : s })}
                className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-sm font-medium transition-colors ${
                  status === s ? st.bg + " " + st.text : "border-border bg-card text-muted-foreground hover:border-[#8b5cf6]"
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${st.dot}`} />
                {st.label} <span className="opacity-70">{countMap[s] ?? 0}</span>
              </Link>
            );
          })}
        </div>

        {/* Search */}
        <form action="/admin/sites" className="mb-6">
          {status && <input type="hidden" name="status" value={status} />}
          <div className="relative max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input name="q" defaultValue={q} placeholder="Buscar por nombre, tipo o ciudad…" className="pl-9" />
          </div>
        </form>

        {/* Table */}
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-[#0f0d15] text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3">Negocio</th>
                <th className="px-4 py-3">Tipo</th>
                <th className="px-4 py-3">Ubicación</th>
                <th className="px-4 py-3">Estado</th>
                <th className="px-4 py-3">Usuario</th>
                <th className="px-4 py-3">Creado</th>
                <th className="px-4 py-3 text-right">Ver</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {sites.length === 0 && (
                <tr>
                  <td colSpan={7} className="px-4 py-16 text-center text-muted-foreground">
                    No se encontraron sitios.
                  </td>
                </tr>
              )}
              {sites.map((site) => {
                const st = STATUS_STYLE[site.status as keyof typeof STATUS_STYLE] ?? STATUS_STYLE.DRAFT;
                const previewUrl = site.status === "PUBLISHED" && site.customDomain && site.domainVerifiedAt
                  ? `https://${site.customDomain}`
                  : `/preview/${site.id}`;
                const date = new Date(site.createdAt).toLocaleDateString("es", {
                  day: "numeric", month: "short", year: "numeric",
                });
                return (
                  <tr key={site.id} className="transition-colors hover:bg-[#0f0d15]/50">
                    <td className="px-4 py-3">
                      <Link href={previewUrl} target="_blank" className="font-medium hover:text-[#d0bcff] hover:underline">
                        {site.businessName}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{site.businessType}</td>
                    <td className="px-4 py-3">
                      {site.location ? (
                        <span className="inline-flex items-center gap-1 text-muted-foreground">
                          <MapPin className="h-3 w-3 shrink-0" />
                          {site.location}
                        </span>
                      ) : (
                        <span className="text-muted-foreground/40">—</span>
                      )}
                    </td>
                    <td className="px-4 py-3">
                      <span className={`inline-flex items-center gap-1.5 rounded border px-2 py-0.5 text-xs font-semibold ${st.bg} ${st.text}`}>
                        <span className={`h-1.5 w-1.5 rounded-full ${st.dot}`} />
                        {st.label}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {site.user ? (site.user.name ?? `@${site.user.username}`) : <span className="opacity-40">invitado</span>}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{date}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex justify-end gap-1">
                        <Button asChild size="icon" variant="ghost" className="h-7 w-7">
                          <Link href={previewUrl} target="_blank" aria-label="Ver preview">
                            <Globe className="h-3.5 w-3.5" />
                          </Link>
                        </Button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex items-center justify-between text-sm text-muted-foreground">
            <span>Mostrando {skip + 1}–{Math.min(skip + pageSize, total)} de {total}</span>
            <div className="flex gap-2">
              {Number(page) > 1 && (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildUrl({ page: String(Number(page) - 1) })}>Anterior</Link>
                </Button>
              )}
              {Number(page) < totalPages && (
                <Button asChild variant="outline" size="sm">
                  <Link href={buildUrl({ page: String(Number(page) + 1) })}>Siguiente</Link>
                </Button>
              )}
            </div>
          </div>
        )}

      </div>
    </main>
  );
}
