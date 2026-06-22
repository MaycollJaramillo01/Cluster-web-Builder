import Link from "next/link";
import { ArrowUpRight, LayoutDashboard, PanelsTopLeft, Sparkles, WandSparkles } from "lucide-react";

import { HomeCreationModes } from "@/components/builder/HomeCreationModes";
import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="marketing-shell min-h-dvh overflow-x-hidden text-foreground">
      <header className="border-b border-[#2d243d] bg-[#0f0d15]/90 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-8">
          <Brand />
          <nav className="flex items-center gap-1" aria-label="Navegación principal">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard"><LayoutDashboard /> <span className="hidden sm:inline">Proyectos</span></Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative px-4 pb-20 pt-16 sm:px-8 sm:pb-28 sm:pt-24">
        <div className="mx-auto max-w-5xl text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#494454] bg-[#1d1a23] px-3 py-1.5 text-xs font-medium text-[#cbc3d7]">
            <Sparkles className="h-3.5 w-3.5 text-[#d0bcff]" /> Tu próximo sitio empieza aquí
          </div>
          <h1 className="font-[var(--font-outfit)] text-5xl font-bold leading-[0.98] tracking-[-0.045em] text-[#f7f2fb] sm:text-7xl lg:text-[5.25rem]">
            Crea a tu manera.<br />
            <span className="text-[#a078ff]">Cluster diseña el sitio.</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-[#cbc3d7] sm:text-lg">
            Usa una guía paso a paso si estás comenzando o describe todo con libertad si ya sabes lo que necesitas.
          </p>
          <div className="mt-10 text-left">
            <HomeCreationModes />
          </div>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs font-medium text-[#958ea0]">
            <span>Sin plantillas rígidas</span><span aria-hidden="true">•</span>
            <span>Contenido editable</span><span aria-hidden="true">•</span>
            <span>Preview inmediato</span>
          </div>
        </div>
      </section>

      <section className="border-y border-[#2d243d] bg-[#120c1d] px-4 py-20 sm:px-8" aria-labelledby="workspace-title">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-[0.75fr_1.25fr] lg:items-center">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a078ff]">Un espacio de creación</p>
            <h2 id="workspace-title" className="mt-4 font-[var(--font-outfit)] text-3xl font-semibold tracking-[-0.03em] text-[#f7f2fb] sm:text-5xl">
              Del mensaje a un sitio que puedes controlar.
            </h2>
            <p className="mt-5 max-w-lg leading-7 text-[#cbc3d7]">
              Genera una dirección visual, revisa cada sección y ajusta el resultado sin perder el contexto de tu proyecto.
            </p>
            <Button asChild variant="outline" className="mt-7">
              <Link href="/dashboard">Abrir proyectos <ArrowUpRight /></Link>
            </Button>
          </div>
          <ProductCanvas />
        </div>
      </section>

      <footer className="border-t border-[#2d243d] bg-[#0f0d15]">
        <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 text-sm text-[#958ea0] sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Brand />
          <span>© {new Date().getFullYear()} Cluster Web Builder</span>
        </div>
      </footer>
    </main>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight text-[#f7f2fb]">
      <span className="flex h-8 w-8 items-center justify-center rounded bg-[#8b5cf6] text-white shadow-[0_0_20px_rgb(139_92_246/0.25)]">
        <WandSparkles className="h-4 w-4" />
      </span>
      <span>Cluster</span>
      <span className="rounded border border-[#494454] bg-[#211e27] px-1.5 py-0.5 text-[10px] font-bold uppercase text-[#d0bcff]">Beta</span>
    </Link>
  );
}

function ProductCanvas() {
  return (
    <div className="overflow-hidden rounded-lg border border-[#494454] bg-[#1d1a23] shadow-[0_24px_70px_rgb(0_0_0/0.38)]" aria-label="Vista previa del espacio de edición">
      <div className="flex h-12 items-center justify-between border-b border-[#494454] px-4 text-xs text-[#958ea0]">
        <span className="flex items-center gap-2 text-[#e7e0ed]"><PanelsTopLeft className="h-4 w-4 text-[#a078ff]" /> Estudio Norte</span>
        <span className="rounded border border-[#494454] bg-[#211e27] px-2 py-1">Guardado</span>
      </div>
      <div className="grid min-h-[390px] grid-cols-[116px_1fr] sm:grid-cols-[170px_1fr]">
        <aside className="border-r border-[#494454] bg-[#15121b] p-3 sm:p-4" aria-hidden="true">
          <p className="text-[10px] font-bold uppercase tracking-[0.12em] text-[#958ea0]">Secciones</p>
          <div className="mt-4 space-y-2">
            {["Header", "Hero", "Proyectos", "Nosotros", "Contacto"].map((item, index) => (
              <div key={item} className={`rounded border px-2 py-2 text-[11px] ${index === 1 ? "border-[#8b5cf6] bg-[#2c2141] text-[#e9ddff]" : "border-transparent text-[#958ea0]"}`}>{item}</div>
            ))}
          </div>
        </aside>
        <div className="soft-grid p-4 sm:p-6">
          <div className="mx-auto overflow-hidden rounded border border-[#494454] bg-[#f5f2ee] text-[#18151d] shadow-[0_18px_50px_rgb(0_0_0/0.25)]">
            <div className="flex items-center justify-between border-b border-black/10 px-5 py-3 text-[9px] font-semibold">
              <span>NORTE / STUDIO</span><span>PROYECTOS · CONTACTO</span>
            </div>
            <div className="p-6 sm:p-8">
              <div className="text-[9px] uppercase tracking-[0.18em] text-[#6c6470]">Arquitectura contemporánea</div>
              <div className="mt-4 h-5 w-4/5 bg-[#18151d]" />
              <div className="mt-2 h-5 w-3/5 bg-[#18151d]" />
              <div className="mt-5 h-2 w-2/3 bg-[#c9c3ca]" />
              <div className="mt-7 grid grid-cols-[1.3fr_0.7fr] gap-2">
                <div className="h-28 bg-[#27202d]" /><div className="h-28 bg-[#a078ff]" />
              </div>
            </div>
          </div>
          <p className="mt-4 flex items-center gap-2 text-xs text-[#958ea0]"><Sparkles className="h-3.5 w-3.5 text-[#a078ff]" /> Generado a partir de tu conversación</p>
        </div>
      </div>
    </div>
  );
}
