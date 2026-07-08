import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowLeft, BarChart3, CreditCard, LayoutGrid, Plus, Search, Users } from "lucide-react";

import { BrandMark } from "@/components/brand/BrandMark";
import { getCurrentUser } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { DashboardSiteCard, type DashboardSite } from "@/components/builder/DashboardSiteCard";
import { LogoutButton } from "@/components/builder/LogoutButton";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export const metadata = { title: "Proyectos | Cluster Web Builder" };

export default async function DashboardPage({ searchParams }: { searchParams: Promise<{ q?: string }> }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login?from=/dashboard");
  const query = (await searchParams).q?.trim() ?? "";
  const sites = await prisma.site.findMany({
    where: {
      userId: user.id,
      ...(query ? { OR: [
        { businessName: { contains: query, mode: "insensitive" } },
        { businessType: { contains: query, mode: "insensitive" } },
      ] } : {}),
    },
    orderBy: { updatedAt: "desc" },
    select: {
      id: true, businessName: true, businessType: true, status: true, publicSlug: true, customDomain: true, domainVerifiedAt: true,
      createdAt: true, updatedAt: true, downloadedAt: true, primaryColor: true, secondaryColor: true, accentColor: true,
      _count: { select: { leads: { where: { readAt: null } } } },
    },
  });

  const data: DashboardSite[] = sites.map((site) => ({
    ...site,
    createdAt: site.createdAt.toISOString(),
    updatedAt: site.updatedAt.toISOString(),
    downloadedAt: site.downloadedAt?.toISOString() ?? null,
    domainVerifiedAt: site.domainVerifiedAt?.toISOString() ?? null,
    primaryColor: site.primaryColor ?? "#15121b",
    secondaryColor: site.secondaryColor ?? "#d0bcff",
    accentColor: site.accentColor ?? "#8b5cf6",
    unreadLeads: site._count.leads,
  }));

  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-[#2d243d] bg-[#0f0d15]">
        <div className="mx-auto flex min-h-16 max-w-7xl items-center justify-between gap-4 px-5 py-2 sm:px-8">
          <Link href="/" className="flex shrink-0 items-center gap-2.5 font-semibold tracking-tight">
            <BrandMark />
            <span className="hidden sm:inline">Cluster</span>
          </Link>
          <form action="/dashboard" className="hidden w-full max-w-md sm:block" role="search">
            <label htmlFor="project-search" className="sr-only">Buscar proyectos</label>
            <div className="relative">
              <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-muted-foreground" />
              <Input id="project-search" name="q" defaultValue={query} placeholder="Buscar por nombre o tipo…" className="pl-9" />
            </div>
          </form>
          <div className="flex shrink-0 items-center gap-2">
            <Button asChild size="sm" className="w-11 px-0 sm:w-auto sm:px-3"><Link href="/builder"><Plus /><span className="hidden sm:inline">Nuevo sitio</span></Link></Button>
            <Button asChild variant="outline" size="sm" className="w-11 px-0 sm:w-auto sm:px-3"><Link href="/billing"><CreditCard /><span className="hidden sm:inline">Plan</span></Link></Button>
            {user.role === "ADMIN" && <Button asChild variant="outline" size="sm" className="w-11 px-0 sm:w-auto sm:px-3"><Link href="/admin/sites"><LayoutGrid /><span className="hidden sm:inline">Sitios</span></Link></Button>}
            {user.role === "ADMIN" && <Button asChild variant="outline" size="sm" className="w-11 px-0 sm:w-auto sm:px-3"><Link href="/admin/users"><Users /><span className="hidden sm:inline">Usuarios</span></Link></Button>}
            {user.role === "ADMIN" && <Button asChild variant="outline" size="sm" className="w-11 px-0 sm:w-auto sm:px-3"><Link href="/admin/metrics"><BarChart3 /><span className="hidden sm:inline">Métricas</span></Link></Button>}
            <LogoutButton />
          </div>
        </div>
      </header>

      <section className="mx-auto max-w-[1440px] px-5 py-10 sm:px-8 sm:py-14">
        <Link href="/" className="mb-8 inline-flex min-h-11 items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground">
          <ArrowLeft className="h-4 w-4" /> Volver al inicio
        </Link>
        <div className="mb-10 flex flex-col gap-4 border-b border-border pb-8 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a078ff]">Espacio de trabajo</p>
            <h1 className="mt-2 font-[var(--font-outfit)] text-4xl font-semibold tracking-[-0.03em] sm:text-5xl">Tus sitios</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              {query ? `${data.length} resultados para “${query}”` : `${data.length} ${data.length === 1 ? "sitio guardado" : "sitios guardados"}`}
            </p>
            {!query && <p className="mt-1 text-xs text-muted-foreground">{data.filter((site) => site.status === "PUBLISHED").length} publicados · {data.filter((site) => site.downloadedAt).length} descargados</p>}
          </div>
        </div>

        <form action="/dashboard" className="mb-6 sm:hidden" role="search">
          <label htmlFor="mobile-project-search" className="sr-only">Buscar proyectos</label>
          <Input id="mobile-project-search" name="q" defaultValue={query} placeholder="Buscar proyectos…" />
        </form>

        {data.length === 0 ? <EmptyState hasQuery={Boolean(query)} /> : (
          <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
            {data.map((site) => <DashboardSiteCard key={site.id} site={site} />)}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState({ hasQuery }: { hasQuery: boolean }) {
  return (
    <div className="rounded-lg border border-dashed border-border bg-card px-6 py-20 text-center">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-lg bg-secondary"><LayoutGrid className="h-5 w-5" /></div>
      <h2 className="text-lg font-semibold">{hasQuery ? "No encontramos proyectos" : "Tu espacio está listo"}</h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-muted-foreground">
        {hasQuery ? "Prueba con otro nombre o tipo de negocio." : "Crea un primer borrador editable para comenzar."}
      </p>
      <Button asChild className="mt-6"><Link href={hasQuery ? "/dashboard" : "/builder"}>{hasQuery ? "Ver todos" : "Crear sitio"}</Link></Button>
    </div>
  );
}
