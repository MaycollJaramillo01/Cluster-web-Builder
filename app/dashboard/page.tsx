import Link from "next/link";
import { Plus, Sparkles, LayoutGrid } from "lucide-react";

import { prisma } from "@/lib/db";
import { Button } from "@/components/ui/button";
import {
  DashboardSiteCard,
  type DashboardSite,
} from "@/components/builder/DashboardSiteCard";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export const metadata = {
  title: "Dashboard · AI Website Builder",
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
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI Website Builder</span>
          </Link>
          <Button asChild size="sm">
            <Link href="/builder">
              <Plus className="h-4 w-4" /> Nuevo sitio
            </Link>
          </Button>
        </div>
      </header>

      <section className="mx-auto max-w-6xl px-6 py-10">
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Mis sitios</h1>
            <p className="text-sm text-slate-500">
              {data.length} {data.length === 1 ? "sitio" : "sitios"} generados
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
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed bg-white py-20 text-center">
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10">
        <LayoutGrid className="h-7 w-7 text-primary" />
      </div>
      <h2 className="text-lg font-semibold text-slate-900">
        Aún no tienes sitios
      </h2>
      <p className="mt-1 max-w-sm text-sm text-slate-500">
        Crea tu primer sitio web con IA en menos de un minuto respondiendo 5
        preguntas.
      </p>
      <Button asChild className="mt-6">
        <Link href="/builder">
          <Plus className="h-4 w-4" /> Crear mi primer sitio
        </Link>
      </Button>
    </div>
  );
}
