import Link from "next/link";
import { ArrowRight, Sparkles, Zap, LayoutDashboard } from "lucide-react";

import { Button } from "@/components/ui/button";

export default function HomePage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Top bar */}
      <header className="border-b bg-white/70 backdrop-blur">
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
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border bg-white px-4 py-1.5 text-sm text-slate-600 shadow-sm">
          <Zap className="h-4 w-4 text-primary" />
          Para empresas de hosting
        </div>
        <h1 className="text-4xl font-bold tracking-tight text-slate-900 sm:text-6xl">
          Vende sitios web generados con{" "}
          <span className="text-primary">Inteligencia Artificial</span>
        </h1>
        <p className="mx-auto mt-6 max-w-2xl text-lg text-slate-600">
          Tus clientes responden 5 preguntas y la IA genera un sitio completo,
          profesional y editable en segundos. Optimizado para conversión y SEO
          local.
        </p>
        <div className="mt-10 flex flex-col items-center justify-center gap-3 sm:flex-row">
          <Button asChild size="lg">
            <Link href="/builder">
              Generar mi sitio <ArrowRight className="h-4 w-4" />
            </Link>
          </Button>
          <Button asChild size="lg" variant="outline">
            <Link href="/dashboard">
              <LayoutDashboard className="h-4 w-4" /> Ver mis sitios
            </Link>
          </Button>
        </div>
      </section>

      {/* Feature cards */}
      <section className="mx-auto grid max-w-5xl gap-6 px-6 pb-24 sm:grid-cols-3">
        {[
          {
            title: "Onboarding en 5 pasos",
            desc: "Opciones visuales, sin formularios largos. El cliente termina en menos de un minuto.",
          },
          {
            title: "Generación en streaming",
            desc: "La IA construye el sitio en vivo, sección por sección, con OpenRouter.",
          },
          {
            title: "Editor incluido",
            desc: "Edita textos, colores y secciones, y comparte una vista previa al instante.",
          },
        ].map((f) => (
          <div
            key={f.title}
            className="rounded-2xl border bg-white p-6 shadow-sm"
          >
            <h3 className="font-semibold text-slate-900">{f.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{f.desc}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
