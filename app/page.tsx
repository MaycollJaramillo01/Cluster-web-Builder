import Link from "next/link";
import {
  ArrowRight,
  Sparkles,
  Zap,
  LayoutDashboard,
  ListChecks,
  Radio,
  Pencil,
  MessagesSquare,
  Wand2,
  Globe,
} from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* Top bar */}
      <header className="sticky top-0 z-30 border-b border-slate-200/70 bg-white/80 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI Website Builder</span>
          </div>
          <nav className="flex items-center gap-2">
            <Button asChild variant="ghost" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
            <Button asChild size="sm">
              <Link href="/builder">Crear sitio</Link>
            </Button>
          </nav>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        {/* Decorative glow */}
        <div
          aria-hidden
          className="pointer-events-none absolute left-1/2 top-[-10rem] h-[28rem] w-[48rem] -translate-x-1/2 rounded-full bg-gradient-to-tr from-primary/20 via-indigo-300/20 to-transparent blur-3xl"
        />
        <div className="relative mx-auto max-w-4xl px-6 py-24 text-center sm:py-28">
          <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-4 py-1.5 text-sm text-slate-600 shadow-sm">
            <Zap className="h-4 w-4 text-primary" />
            Plataforma para empresas de hosting
          </div>
          <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
            Vende sitios web creados con{" "}
            <span className="bg-gradient-to-r from-primary to-indigo-500 bg-clip-text text-transparent">
              Inteligencia Artificial
            </span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
            Tus clientes responden 5 preguntas y la IA genera un sitio completo,
            profesional y editable en segundos. Optimizado para conversión y SEO
            local.
          </p>
          <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild size="lg" className="px-7">
              <Link href="/builder">
                Generar mi sitio <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="px-7">
              <Link href="/dashboard">
                <LayoutDashboard className="h-4 w-4" /> Ver mis sitios
              </Link>
            </Button>
          </div>
          {/* Trust chips */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-slate-400">
            <span className="flex items-center gap-1.5"><Radio className="h-4 w-4" /> Generación en streaming</span>
            <span className="flex items-center gap-1.5"><Globe className="h-4 w-4" /> Sitios multipágina</span>
            <span className="flex items-center gap-1.5"><Wand2 className="h-4 w-4" /> Imágenes con IA</span>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="border-y border-slate-100 bg-slate-50/60">
        <div className="mx-auto max-w-5xl px-6 py-16">
          <h2 className="text-center text-2xl font-semibold tracking-tight text-slate-900">
            Cómo funciona
          </h2>
          <p className="mx-auto mt-2 max-w-xl text-center text-sm text-slate-500">
            De cero a un sitio publicable en tres pasos.
          </p>
          <div className="mt-12 grid gap-8 sm:grid-cols-3">
            {STEPS.map((s, i) => (
              <div key={s.title} className="relative text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 text-primary">
                  <s.icon className="h-6 w-6" />
                </div>
                <div className="mt-4 text-xs font-semibold uppercase tracking-wide text-primary">
                  Paso {i + 1}
                </div>
                <h3 className="mt-1 font-semibold text-slate-900">{s.title}</h3>
                <p className="mx-auto mt-1.5 max-w-xs text-sm text-slate-500">
                  {s.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto max-w-5xl px-6 py-20">
        <div className="grid gap-6 sm:grid-cols-3">
          {FEATURES.map((f) => (
            <div
              key={f.title}
              className="rounded-2xl border border-slate-200 bg-white p-6 shadow-[0_1px_2px_rgba(15,23,42,0.04)] transition-shadow hover:shadow-[0_12px_32px_-16px_rgba(15,23,42,0.18)]"
            >
              <div className="flex h-11 w-11 items-center justify-center rounded-lg bg-slate-100 text-slate-700">
                <f.icon className="h-5 w-5" />
              </div>
              <h3 className="mt-4 font-semibold text-slate-900">{f.title}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">
                {f.desc}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <section className="px-6 pb-24">
        <div className="mx-auto max-w-4xl overflow-hidden rounded-3xl bg-gradient-to-br from-primary to-indigo-600 px-8 py-14 text-center text-white shadow-xl">
          <h2 className="text-3xl font-bold tracking-tight">
            Empieza a crear hoy
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-white/85">
            Genera tu primer sitio en menos de un minuto. Sin tarjeta, sin
            complicaciones.
          </p>
          <Button
            asChild
            size="lg"
            variant="secondary"
            className="mt-8 bg-white px-8 text-slate-900 hover:bg-white/90"
          >
            <Link href="/builder">
              Crear mi sitio <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
        </div>
      </section>

      <footer className="border-t border-slate-100 py-8">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 text-sm text-slate-400">
          <span className="flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-primary" /> AI Website Builder
          </span>
          <span>© {new Date().getFullYear()}</span>
        </div>
      </footer>
    </main>
  );
}

const STEPS = [
  {
    title: "Responde 5 preguntas",
    desc: "Tipo de negocio, objetivo, estilo, páginas y datos de contacto.",
    icon: MessagesSquare,
  },
  {
    title: "La IA genera el sitio",
    desc: "Estructura, textos, paleta e imágenes, en vivo y por streaming.",
    icon: Wand2,
  },
  {
    title: "Edita y comparte",
    desc: "Ajusta textos y colores, y comparte una vista previa al instante.",
    icon: Pencil,
  },
];

const FEATURES = [
  {
    title: "Onboarding en 5 pasos",
    desc: "Opciones visuales, sin formularios largos. El cliente termina en menos de un minuto.",
    icon: ListChecks,
  },
  {
    title: "Generación en streaming",
    desc: "La IA construye el sitio en vivo, sección por sección, con OpenRouter.",
    icon: Radio,
  },
  {
    title: "Editor incluido",
    desc: "Edita textos, colores y secciones, y comparte una vista previa al instante.",
    icon: Pencil,
  },
];
