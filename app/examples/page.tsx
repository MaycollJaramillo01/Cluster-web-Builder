import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export const dynamic = "force-dynamic";
export const metadata = { title: "Ejemplos de sitios | Cluster", description: "Explora sitios públicos creados con Cluster." };

export default async function ExamplesPage() {
  const sites = await prisma.site.findMany({ where: { status: "PUBLISHED" }, orderBy: { updatedAt: "desc" }, take: 9, select: { businessName: true, businessType: true, publicSlug: true, primaryColor: true, secondaryColor: true, accentColor: true } });
  return <MarketingChrome><main><section className="border-b border-border px-5 py-16 text-center sm:px-8 sm:py-24"><h1 className="font-[var(--font-outfit)] text-4xl font-semibold tracking-[-.04em] sm:text-6xl">Sitios creados con Cluster</h1><p className="mx-auto mt-5 max-w-2xl text-lg text-muted-foreground">Proyectos públicos reales, creados desde un formulario o una descripción.</p></section><section className="px-5 py-16 sm:px-8"><div className="mx-auto max-w-7xl">{sites.length ? <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">{sites.map((site) => <article key={site.publicSlug} className="overflow-hidden rounded-xl border border-border bg-card"><div className="h-44 p-6" style={{ background: `linear-gradient(135deg, ${site.secondaryColor || "#15121b"}, ${site.primaryColor || "#8b5cf6"})` }}><div className="h-full rounded-lg border border-white/20 bg-white/90 p-5"><div className="h-2 w-1/3 rounded bg-black/70" /><div className="mt-8 h-4 w-4/5 rounded bg-black/80" /><div className="mt-2 h-4 w-1/2 rounded bg-black/80" /><div className="mt-5 h-8 w-24 rounded" style={{ backgroundColor: site.accentColor || "#8b5cf6" }} /></div></div><div className="p-5"><h2 className="text-xl font-semibold">{site.businessName}</h2><p className="mt-1 text-sm text-muted-foreground">{site.businessType}</p><Link href={`/s/${site.publicSlug}`} target="_blank" className="mt-4 inline-flex min-h-11 items-center gap-2 text-sm font-semibold text-[#d0bcff]">Visitar sitio <ArrowUpRight className="h-4 w-4" /></Link></div></article>)}</div> : <div className="rounded-xl border border-dashed border-border bg-card px-6 py-16 text-center"><h2 className="text-xl font-semibold">Los primeros ejemplos aparecerán aquí</h2><p className="mt-2 text-sm text-muted-foreground">Publica un sitio para incorporarlo a la galería.</p><Button asChild className="mt-6"><Link href="/builder">Crear sitio</Link></Button></div>}</div></section></main></MarketingChrome>;
}
