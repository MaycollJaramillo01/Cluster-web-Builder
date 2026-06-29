import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { prisma } from "@/lib/db";

export async function HomeSections() {
  const sites = await prisma.site.findMany({
    where: {
      status: "PUBLISHED",
      NOT: { user: { username: { startsWith: "qa-" } } },
    },
    orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
    take: 3,
    select: {
      businessName: true,
      businessType: true,
      publicSlug: true,
      location: true,
      primaryColor: true,
      secondaryColor: true,
      accentColor: true,
      publishedAt: true,
      sections: { where: { type: "hero", isVisible: true }, take: 1, select: { content: true } },
    },
  });

  const showcaseSites = sites.map(toShowcaseSite);
  return <>
    <Showcase sites={showcaseSites} />
    {showcaseSites[0] ? <ProjectSpotlight site={showcaseSites[0]} /> : null}
  </>;
}

type ShowcaseSite = ReturnType<typeof toShowcaseSite>;

function Showcase({ sites }: { sites: ShowcaseSite[] }) {
  return <section className="bg-[#f3f0f7] px-5 py-20 text-[#18131f] sm:px-8 sm:py-28" aria-labelledby="showcase-title">
    <div className="mx-auto max-w-7xl">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-xs font-bold uppercase tracking-[.18em] text-[#6d35db]">Recién publicados</p>
        <h2 id="showcase-title" className="mt-4 font-[var(--font-outfit)] text-4xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-6xl">Los últimos sitios que salieron de Cluster.</h2>
        <p className="mx-auto mt-5 max-w-2xl text-base leading-7 text-[#665e6d] sm:text-lg">Tres proyectos reales, ordenados por su fecha de publicación.</p>
      </div>

      {sites.length ? <div className="mt-14 grid gap-5 lg:grid-cols-3">
        {sites.map((site, index) => <article key={site.slug} className={`group overflow-hidden rounded-[1.4rem] border border-[#d8d1df] bg-white p-3 shadow-[0_18px_55px_rgb(38_22_55/.08)] transition-transform duration-300 hover:-translate-y-1 ${index === 1 ? "lg:-translate-y-5 lg:hover:-translate-y-6" : ""}`}>
          <div className="relative aspect-[4/3] overflow-hidden rounded-[1rem] bg-[#ddd6e4]">
            <Image src={site.image} alt={`Sitio publicado de ${site.name}`} fill unoptimized loading="lazy" sizes="(max-width: 1024px) 100vw, 33vw" className="object-cover transition-transform duration-500 motion-reduce:transition-none group-hover:scale-[1.03]" />
            <span className="absolute right-3 top-3 rounded-full bg-[#18131f]/90 px-3 py-1.5 text-[10px] font-bold uppercase tracking-[.12em] text-white backdrop-blur">{site.category}</span>
            <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" aria-hidden="true" />
            <div className="absolute bottom-4 left-4 flex gap-1.5" aria-label={`Paleta de ${site.name}`}>{site.colors.map((color) => <span key={color} className="h-5 w-5 rounded-full border-2 border-white shadow" style={{ backgroundColor: color }} />)}</div>
          </div>
          <div className="p-3 pb-4 pt-5">
            <div className="flex items-start justify-between gap-4"><div><h3 className="font-[var(--font-outfit)] text-2xl font-semibold tracking-tight">{site.name}</h3><p className="mt-2 leading-6 text-[#665e6d]">{site.description}</p></div><Link href={`/s/${site.slug}`} target="_blank" aria-label={`Visitar ${site.name}`} className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-[#18131f] text-white transition-colors hover:bg-[#6d35db]"><ArrowUpRight className="h-4 w-4" /></Link></div>
            <div className="mt-5 flex items-center justify-between border-t border-[#e5dfea] pt-4 text-[11px] font-bold uppercase tracking-[.12em] text-[#766e7d]"><span>{site.publishedLabel}</span><span>{String(index + 1).padStart(2, "0")} / {String(sites.length).padStart(2, "0")}</span></div>
          </div>
        </article>)}
      </div> : <div className="mx-auto mt-14 max-w-2xl rounded-2xl border border-dashed border-[#c9c0d1] bg-white/60 px-6 py-12 text-center"><h3 className="text-xl font-semibold">Aún no hay sitios publicados</h3><p className="mt-2 text-[#665e6d]">Los proyectos aparecerán aquí después de publicarse.</p><Button asChild className="mt-6"><Link href="/dashboard">Ir a proyectos</Link></Button></div>}

      <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row">
        <Button asChild size="lg"><Link href="/builder">Crear un sitio <ArrowUpRight /></Link></Button>
        <Button asChild size="lg" variant="outline" className="border-[#bcb3c6] bg-transparent text-[#18131f] hover:bg-white hover:text-[#18131f]"><Link href="/para-negocios">Ver qué incluye</Link></Button>
      </div>
    </div>
  </section>;
}

function toShowcaseSite(site: {
  businessName: string;
  businessType: string;
  publicSlug: string;
  location: string | null;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
  publishedAt: Date | null;
  sections: { content: unknown }[];
}) {
  const hero = asRecord(site.sections[0]?.content);
  const imagePrompt = typeof hero.imagePrompt === "string" ? hero.imagePrompt : `${site.businessType} professional business`;
  const subtitle = typeof hero.subtitle === "string" ? hero.subtitle : "";
  const body = typeof hero.body === "string" ? hero.body : "";
  const ctaText = typeof hero.ctaText === "string" ? hero.ctaText : "Contactar";
  return {
    name: site.businessName,
    category: site.businessType,
    slug: site.publicSlug,
    description: [subtitle, site.location].filter(Boolean).join(" · ") || "Sitio creado y publicado con Cluster.",
    body: body || subtitle || "Un proyecto creado para presentar el negocio con claridad.",
    ctaText,
    location: site.location || "En línea",
    image: `/api/images/pexels?q=${encodeURIComponent(imagePrompt.slice(0, 80))}&w=960&h=720&seed=${encodeURIComponent(site.publicSlug)}`,
    colors: [site.secondaryColor || "#17131b", site.primaryColor || "#8b5cf6", site.accentColor || "#d0bcff"],
    publishedLabel: site.publishedAt ? new Intl.DateTimeFormat("es", { day: "numeric", month: "short", year: "numeric" }).format(site.publishedAt) : "Publicado recientemente",
  };
}

function asRecord(value: unknown): Record<string, unknown> {
  return value && typeof value === "object" && !Array.isArray(value) ? value as Record<string, unknown> : {};
}

function ProjectSpotlight({ site }: { site: ShowcaseSite }) {
  return <section className="border-y border-[#352d3d] bg-[#110d16] px-5 py-20 text-[#f4eef7] sm:px-8 sm:py-28" aria-labelledby="spotlight-title">
    <div className="mx-auto max-w-7xl">
      <div className="grid gap-10 border-b border-[#403747] pb-8 sm:grid-cols-[1fr_auto] sm:items-end">
        <div><p className="text-xs font-bold uppercase tracking-[.2em] text-[#b896ff]">Proyecto en detalle</p><h2 id="spotlight-title" className="mt-4 max-w-4xl font-[var(--font-outfit)] text-4xl font-semibold leading-[1.02] tracking-[-.045em] sm:text-6xl">Un negocio real, contado con su propia voz.</h2></div>
        <span className="font-mono text-sm text-[#8f8498]">PROYECTO / 001</span>
      </div>

      <div className="grid gap-10 pt-10 lg:grid-cols-[1.35fr_.65fr] lg:gap-16">
        <figure>
          <div className="relative aspect-[4/3] overflow-hidden bg-[#2a2230]">
            <Image src={site.image} alt={`Imagen principal del sitio ${site.name}`} fill unoptimized loading="lazy" sizes="(max-width: 1024px) 100vw, 66vw" className="object-cover" />
            <div className="absolute inset-x-0 bottom-0 flex items-end justify-between bg-gradient-to-t from-black/80 via-black/20 to-transparent p-5 pt-24 text-xs font-bold uppercase tracking-[.14em] sm:p-7"><span>{site.category}</span><span>{site.location}</span></div>
          </div>
          <figcaption className="mt-3 text-xs uppercase tracking-[.14em] text-[#827889]">Sitio publicado con Cluster</figcaption>
        </figure>

        <div className="flex flex-col justify-between">
          <div>
            <h3 className="font-[var(--font-outfit)] text-4xl font-semibold tracking-[-.035em] sm:text-5xl">{site.name}</h3>
            <p className="mt-6 text-lg leading-8 text-[#bdb3c4]">{site.body}</p>
            <dl className="mt-10 border-t border-[#403747] text-sm">
              <div className="grid grid-cols-[8rem_1fr] gap-4 border-b border-[#403747] py-5"><dt className="uppercase tracking-[.13em] text-[#8f8498]">Sector</dt><dd>{site.category}</dd></div>
              <div className="grid grid-cols-[8rem_1fr] gap-4 border-b border-[#403747] py-5"><dt className="uppercase tracking-[.13em] text-[#8f8498]">Ubicación</dt><dd>{site.location}</dd></div>
              <div className="grid grid-cols-[8rem_1fr] gap-4 border-b border-[#403747] py-5"><dt className="uppercase tracking-[.13em] text-[#8f8498]">Acción</dt><dd>{site.ctaText}</dd></div>
              <div className="grid grid-cols-[8rem_1fr] gap-4 border-b border-[#403747] py-5"><dt className="uppercase tracking-[.13em] text-[#8f8498]">Paleta</dt><dd className="flex gap-2">{site.colors.map((color) => <span key={color} className="h-6 w-10 border border-white/20" style={{ backgroundColor: color }}><span className="sr-only">{color}</span></span>)}</dd></div>
            </dl>
          </div>
          <Link href={`/s/${site.slug}`} target="_blank" className="mt-10 inline-flex min-h-12 w-fit items-center gap-3 border-b border-[#b896ff] text-base font-semibold text-[#e4d8ff] transition-colors hover:text-white">Ver el sitio publicado <ArrowUpRight className="h-4 w-4" /></Link>
        </div>
      </div>
    </div>
  </section>;
}
