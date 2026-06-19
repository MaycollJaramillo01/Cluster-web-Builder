import Link from "next/link";
import { ArrowLeft, LayoutGrid, Plus, WandSparkles } from "lucide-react";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  DashboardSiteCard,
  type DashboardSite,
} from "@/components/builder/DashboardSiteCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard | Cluster Web Builder",
};

export default async function DashboardPage() {
  const sites = await prisma.site.findMany({
    orderBy: { createdAt: "desc" },
    select: {
      id: true,
      businessName: true,
      businessType: true,
      status: true,
      createdAt: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
    },
  });

  const data: DashboardSite[] = sites.map((s) => ({
    id: s.id,
    businessName: s.businessName,
    businessType: s.businessType,
    status: s.status,
    createdAt: s.createdAt.toISOString(),
    primaryColor: s.primaryColor ?? "#1d4ed8",
    secondaryColor: s.secondaryColor ?? "#0f172a",
    accentColor: s.accentColor ?? "#f59e0b",
  }));

  return (
    <main className="soft-grid min-h-dvh bg-[#f7f7fa] text-slate-950">
      <header className="border-b border-slate-200 bg-white/90 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
              <WandSparkles className="h-4 w-4" />
            </span>
            <span>Cluster</span>
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-700">Beta</span>
          </Link>
          <Button asChild size="sm" className="bg-violet-700 text-white hover:bg-violet-800">
            <Link href="/builder">
              <Plus className="h-4 w-4" /> Nuevo sitio
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-5 py-10 sm:px-8 sm:py-14">
        <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <Link href="/" className="mb-6 inline-flex items-center gap-2 text-sm text-slate-500 transition-colors hover:text-violet-700">
              <ArrowLeft className="h-4 w-4" /> Volver al inicio
            </Link>
            <h1 className="text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
              Tus proyectos
            </h1>
            <p className="mt-2 text-sm text-slate-500">
              {data.length} {data.length === 1 ? "sitio guardado" : "sitios guardados"}
            </p>
          </div>
        </div>

        {data.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {data.map((site) => (
              <DashboardSiteCard key={site.id} site={site} />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}

function EmptyState() {
  return (
    <div className="rounded-3xl border border-dashed border-violet-200 bg-white/90 px-6 py-20 text-center shadow-sm">
      <div className="mx-auto mb-5 flex h-12 w-12 items-center justify-center rounded-2xl bg-violet-100">
        <LayoutGrid className="h-5 w-5 text-violet-700" />
      </div>
      <h2 className="text-lg font-semibold text-slate-950">
        Tu espacio está listo
      </h2>
      <p className="mx-auto mt-2 max-w-sm text-sm leading-6 text-slate-500">
        Describe tu primer proyecto y obtén una propuesta editable en minutos.
      </p>
      <Button asChild className="mt-6 bg-violet-700 text-white hover:bg-violet-800">
        <Link href="/builder">
          <Plus className="h-4 w-4" /> Crear sitio
        </Link>
      </Button>
    </div>
  );
}
