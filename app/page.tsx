import Link from "next/link";
import {
  ArrowRight,
  ChevronDown,
  Code2,
  Globe2,
  LayoutDashboard,
  MousePointer2,
  PanelsTopLeft,
  ShieldCheck,
  Sparkles,
  UserRound,
  WandSparkles,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { PromptComposer } from "@/components/builder/OnboardingWizard";

export default function HomePage() {
  return (
    <main className="marketing-shell min-h-dvh overflow-x-hidden text-white">
      <header className="border-b border-white/10 bg-[#100a1f]/70 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Brand />
          <nav className="flex items-center gap-1" aria-label="Navegación principal">
            <Button
              asChild
              variant="ghost"
              size="sm"
              className="hidden text-violet-100 hover:bg-white/10 hover:text-white sm:inline-flex"
            >
              <Link href="/dashboard">
                <LayoutDashboard /> Proyectos
              </Link>
            </Button>
            <Button
              asChild
              variant="ghost"
              size="icon"
              className="h-11 w-11 text-violet-100 hover:bg-white/10 hover:text-white"
            >
              <Link href="/dashboard" aria-label="Abrir perfil">
                <UserRound />
              </Link>
            </Button>
          </nav>
        </div>
      </header>

      <section className="relative px-5 pb-28 pt-20 text-center sm:pt-28">
        <div className="mx-auto max-w-4xl">
          <div className="mx-auto mb-6 inline-flex items-center gap-2 rounded-full border border-violet-300/20 bg-white/5 px-3 py-1.5 text-xs font-medium text-violet-200">
            <Sparkles className="h-3.5 w-3.5" /> Tu próximo sitio empieza aquí
          </div>
          <h1 className="max-w-full text-balance text-3xl font-bold leading-[1.08] tracking-[-0.04em] sm:text-6xl lg:text-7xl">
            Describe <span className="text-violet-400">tu idea.</span> Obtén un sitio web en vivo en minutos.
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-base leading-7 text-violet-100/70 sm:text-lg">
            Sin código ni plantillas rígidas. Cuéntanos sobre el negocio y crea una base completa que puedes editar y compartir.
          </p>

          <div className="mt-10">
            <PromptComposer variant="hero" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-24 sm:px-8">
        <div className="grid items-center gap-12 lg:grid-cols-[0.82fr_1.18fr]">
          <div>
            <p className="text-sm font-semibold text-violet-300">Comienza con una instrucción</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              De la idea a la publicación de principio a fin
            </h2>
            <p className="mt-5 max-w-xl text-base leading-7 text-violet-100/65">
              Cada proyecto conserva objetivos, páginas, estilo y datos del negocio. La IA convierte ese contexto en una propuesta que puedes revisar sin perder control.
            </p>
          </div>
          <EditorMockup />
        </div>

        <div className="mt-16 grid gap-8 border-t border-white/10 pt-10 md:grid-cols-3">
          {STEPS.map((step, index) => (
            <article key={step.title}>
              <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-400/15 text-sm font-bold text-violet-300">
                0{index + 1}
              </span>
              <h3 className="mt-5 text-lg font-semibold">{step.title}</h3>
              <p className="mt-2 text-sm leading-6 text-violet-100/60">{step.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="border-y border-white/10 bg-[#120c22]/45">
        <div className="mx-auto grid max-w-6xl gap-12 px-5 py-24 sm:px-8 lg:grid-cols-2 lg:items-center">
          <div className="hidden lg:block">
            <div className="relative mx-auto h-72 max-w-md">
              <div className="absolute inset-8 rotate-[-5deg] rounded-3xl border border-white/10 bg-white/5" />
              <div className="absolute inset-8 rotate-[5deg] rounded-3xl border border-violet-300/20 bg-violet-500/10" />
              <div className="absolute inset-8 flex items-center justify-center rounded-3xl border border-white/15 bg-[#211638] shadow-2xl">
                <ShieldCheck className="h-20 w-20 text-violet-300" />
              </div>
            </div>
          </div>
          <div>
            <p className="text-sm font-semibold text-violet-300">Diseñado para trabajo real</p>
            <h2 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">
              IA que se envía en una infraestructura de producto real
            </h2>
            <p className="mt-5 text-base leading-7 text-violet-100/65">
              No es una demo desconectada. Los proyectos se guardan, se editan por sección y tienen una vista previa lista para compartir.
            </p>
            <div className="mt-8 grid gap-4 sm:grid-cols-2">
              {BENEFITS.map(({ icon: Icon, title }) => (
                <div key={title} className="flex items-center gap-3 text-sm text-violet-100/80">
                  <span className="flex h-9 w-9 items-center justify-center rounded-lg border border-white/10 bg-white/5 text-violet-300">
                    <Icon className="h-4 w-4" />
                  </span>
                  {title}
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-4xl px-5 py-24 sm:px-8">
        <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">Preguntas frecuentes</h2>
        <div className="mt-8 divide-y divide-white/10 border-y border-white/10">
          {FAQS.map((item) => (
            <details key={item.question} className="group py-5">
              <summary className="flex cursor-pointer list-none items-center justify-between gap-5 text-base font-medium focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-300">
                {item.question}
                <ChevronDown className="h-5 w-5 shrink-0 text-violet-300 transition-transform group-open:rotate-180" />
              </summary>
              <p className="max-w-2xl pt-3 text-sm leading-6 text-violet-100/60">{item.answer}</p>
            </details>
          ))}
        </div>
      </section>

      <section className="px-5 pb-24 sm:px-8">
        <div className="mx-auto flex max-w-4xl flex-col items-start gap-7 rounded-3xl border border-white/10 bg-white/10 p-8 shadow-2xl backdrop-blur sm:p-12">
          <div>
            <h2 className="text-3xl font-bold">¿Listo para construir algo?</h2>
            <p className="mt-3 max-w-xl text-sm leading-6 text-violet-100/65">
              Empieza con el brief guiado y termina con un sitio editable en el mismo flujo.
            </p>
          </div>
          <Button asChild size="lg" className="bg-white text-violet-800 hover:bg-violet-50">
            <Link href="/builder">
              Crear mi sitio <ArrowRight />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-white/10 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 text-sm text-violet-100/45 sm:px-8">
          <span>Cluster Web Builder</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}

function Brand() {
  return (
    <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-500 text-white shadow-lg shadow-violet-950/30">
        <WandSparkles className="h-4 w-4" />
      </span>
      <span>Cluster</span>
      <span className="rounded bg-violet-500/25 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-200">Beta</span>
    </Link>
  );
}

function EditorMockup() {
  return (
    <div className="overflow-hidden rounded-3xl border border-white/15 bg-[#f7f7fa] p-2 shadow-[0_30px_90px_rgba(0,0,0,0.35)]">
      <div className="flex items-center justify-between rounded-t-2xl border-b border-slate-200 bg-white px-4 py-3 text-slate-500">
        <div className="flex gap-1.5"><span className="h-2.5 w-2.5 rounded-full bg-red-300" /><span className="h-2.5 w-2.5 rounded-full bg-amber-300" /><span className="h-2.5 w-2.5 rounded-full bg-emerald-300" /></div>
        <span className="rounded-lg bg-violet-100 px-3 py-1 text-xs font-medium text-violet-700">Editando</span>
        <span className="h-6 w-6 rounded-full bg-slate-100" />
      </div>
      <div className="grid min-h-80 grid-cols-[120px_1fr] text-slate-700 sm:grid-cols-[160px_1fr]">
        <aside className="border-r border-slate-200 bg-white p-3">
          <div className="h-7 rounded-lg bg-violet-100" />
          <div className="mt-4 space-y-2">{[72, 88, 62, 80].map((width) => <div key={width} className="h-2 rounded bg-slate-100" style={{ width: `${width}%` }} />)}</div>
        </aside>
        <div className="soft-grid flex items-center justify-center p-5">
          <div className="w-full max-w-sm overflow-hidden rounded-xl border border-slate-200 bg-white shadow-xl">
            <div className="h-28 bg-gradient-to-br from-violet-600 to-fuchsia-400 p-5 text-white">
              <div className="h-2 w-14 rounded bg-white/50" /><div className="mt-4 h-4 w-4/5 rounded bg-white/90" /><div className="mt-2 h-2 w-2/3 rounded bg-white/50" />
            </div>
            <div className="grid grid-cols-3 gap-2 p-4">{[1, 2, 3].map((item) => <div key={item} className="h-16 rounded-lg bg-slate-100" />)}</div>
          </div>
        </div>
      </div>
    </div>
  );
}

const STEPS = [
  { title: "De la idea al primer borrador", description: "Describe el negocio y el objetivo. El sistema organiza el brief antes de generar." },
  { title: "Edición guiada", description: "Ajusta textos, orden, visibilidad y colores sin tocar código." },
  { title: "Comparte el resultado", description: "Abre una vista previa multipágina y presenta el proyecto al cliente." },
];

const BENEFITS = [
  { icon: PanelsTopLeft, title: "Editor visual integrado" },
  { icon: Globe2, title: "Sitios multipágina" },
  { icon: Code2, title: "Salida estructurada" },
  { icon: MousePointer2, title: "Vista previa compartible" },
];

const FAQS = [
  { question: "¿Necesito experiencia en programación?", answer: "No. El flujo está diseñado para crear y ajustar el sitio desde controles visuales." },
  { question: "¿Puedo editar el sitio que genera la IA?", answer: "Sí. Puedes cambiar datos, colores, textos, orden y visibilidad de cada sección." },
  { question: "¿Qué pasa si la generación con IA falla?", answer: "El generador incluye una base local para que el flujo continúe y siempre tengas un borrador editable." },
  { question: "¿Puedo crear sitios con varias páginas?", answer: "Sí. Puedes elegir una sola página, estructuras de tres o cuatro páginas, o dejar que la IA decida." },
];
