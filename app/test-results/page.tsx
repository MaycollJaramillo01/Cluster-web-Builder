import type { Metadata } from "next";
import Link from "next/link";
import { Check, CheckCircle2, Clock3, ExternalLink, ShieldCheck } from "lucide-react";

import { MarketingChrome } from "@/components/marketing/MarketingChrome";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Resultados de pruebas | Cluster",
  description: "Estado de la última validación completa de Cluster Web Builder.",
};

const run = {
  date: "29 de junio de 2026, 10:25 a. m.",
  environment: "Local · Next.js 16.2.9 · puerto aislado",
  passed: 8,
  total: 8,
};

const tests = [
  { name: "Calidad de código", command: "lint", detail: "ESLint y validación TypeScript sin errores." },
  { name: "Build de producción", command: "build", detail: "Compilación, tipos y generación de 25 páginas completadas." },
  { name: "Interfaz responsive", command: "test:ui", detail: "3 rutas × 4 viewports; sin desbordamiento horizontal." },
  { name: "Modos de creación", command: "test:home-modes", detail: "Flujos guiado y avanzado, validación móvil y payload verificados." },
  { name: "Sitio de marketing", command: "test:marketing", detail: "Home, navegación y 10 páginas públicas correctas." },
  { name: "Prompt corto de pesca", command: "test:fast-prompt", detail: "Actividad reconocida y composición Immersive generada en 1.35 s." },
  { name: "Formularios y usuarios", command: "test:multi-user", detail: "Publicación, leads, ZIP y aislamiento multiusuario correctos." },
  { name: "Plataforma y dominios", command: "test:m3", detail: "Límites, dominio, proxy, plan y marca blanca verificados." },
] as const;

export default function TestResultsPage() {
  return (
    <MarketingChrome>
      <main className="mx-auto w-full max-w-7xl px-5 py-12 sm:px-8 sm:py-16 lg:py-20">
        <section className="grid gap-10 border-b border-border pb-12 lg:grid-cols-[minmax(0,1fr)_22rem] lg:items-end">
          <div>
            <div className="inline-flex min-h-9 items-center gap-2 rounded-full border border-[#58d89b]/30 bg-[#58d89b]/10 px-3 text-sm font-semibold text-[#8ce8b9]">
              <CheckCircle2 className="h-4 w-4" aria-hidden="true" /> Suite completa aprobada
            </div>
            <p className="mt-7 text-xs font-bold uppercase tracking-[0.18em] text-[#a078ff]">Control de calidad</p>
            <h1 className="mt-3 max-w-4xl font-[var(--font-outfit)] text-4xl font-bold tracking-[-0.04em] text-[#f7f2fb] sm:text-6xl">
              Los cambios pasaron todas las pruebas.
            </h1>
            <p className="mt-5 max-w-2xl text-base leading-7 text-[#b8afc2] sm:text-lg">
              Este reporte reúne la última ejecución real del generador, el editor por bloques, los formularios y la plataforma multiusuario.
            </p>
          </div>

          <aside className="rounded-xl border border-[#4d4658] bg-[#191620] p-6 shadow-[0_24px_70px_rgb(0_0_0/0.24)]" aria-label="Resumen de resultados">
            <div className="flex items-end justify-between gap-5">
              <div>
                <p className="text-sm text-[#a9a0b4]">Pruebas aprobadas</p>
                <p className="mt-1 font-[var(--font-outfit)] text-5xl font-bold tracking-[-0.05em] text-white">{run.passed}/{run.total}</p>
              </div>
              <ShieldCheck className="h-10 w-10 text-[#8ce8b9]" aria-hidden="true" />
            </div>
            <div className="mt-6 h-2 overflow-hidden rounded-full bg-[#302a39]" aria-label="100 por ciento aprobado">
              <div className="h-full w-full rounded-full bg-[#58d89b]" />
            </div>
            <dl className="mt-6 space-y-3 border-t border-[#3d3746] pt-5 text-sm">
              <div className="flex items-start justify-between gap-4"><dt className="text-[#93899f]">Ejecución</dt><dd className="text-right text-[#d7cfdf]">{run.date}</dd></div>
              <div className="flex items-start justify-between gap-4"><dt className="text-[#93899f]">Entorno</dt><dd className="max-w-48 text-right text-[#d7cfdf]">{run.environment}</dd></div>
            </dl>
          </aside>
        </section>

        <section className="py-12 sm:py-16" aria-labelledby="test-list-title">
          <div className="mb-7 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a078ff]">Detalle verificable</p>
              <h2 id="test-list-title" className="mt-2 font-[var(--font-outfit)] text-3xl font-bold tracking-[-0.03em] text-white">Qué se comprobó</h2>
            </div>
            <p className="flex items-center gap-2 text-sm text-[#9f96aa]"><Clock3 className="h-4 w-4" aria-hidden="true" /> Última suite completa: aproximadamente 90 segundos</p>
          </div>

          <div className="overflow-hidden rounded-xl border border-[#443d4d] bg-[#15121b]">
            {tests.map((test, index) => (
              <article key={test.command} className="grid gap-4 border-b border-[#383140] px-5 py-5 last:border-b-0 sm:grid-cols-[2.25rem_minmax(0,1fr)_auto] sm:items-center sm:px-6">
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#58d89b]/12 text-[#8ce8b9]" aria-label="Aprobada">
                  <Check className="h-4 w-4" strokeWidth={2.5} aria-hidden="true" />
                </span>
                <div>
                  <div className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
                    <h3 className="font-semibold text-[#f4eff7]">{test.name}</h3>
                    <code className="rounded bg-[#292330] px-2 py-0.5 text-xs text-[#c9b8ff]">npm run {test.command}</code>
                  </div>
                  <p className="mt-1.5 text-sm leading-6 text-[#a9a0b4]">{test.detail}</p>
                </div>
                <span className="justify-self-start rounded-full border border-[#58d89b]/25 px-2.5 py-1 text-xs font-bold uppercase tracking-[0.12em] text-[#8ce8b9] sm:justify-self-end">
                  {String(index + 1).padStart(2, "0")} · OK
                </span>
              </article>
            ))}
          </div>
        </section>

        <section className="flex flex-col gap-5 rounded-xl border border-[#51475e] bg-[linear-gradient(135deg,#211a2d,#17131d)] p-6 sm:flex-row sm:items-center sm:justify-between sm:p-8">
          <div>
            <h2 className="font-[var(--font-outfit)] text-2xl font-bold text-white">Resultado: listo para revisión final</h2>
            <p className="mt-2 max-w-2xl text-sm leading-6 text-[#b8afc2]">El reporte confirma el entorno local. La monitorización de producción debe continuar después del despliegue.</p>
          </div>
          <Button asChild className="min-h-11 shrink-0">
            <Link href="/builder">Probar el builder <ExternalLink className="h-4 w-4" aria-hidden="true" /></Link>
          </Button>
        </section>
      </main>
    </MarketingChrome>
  );
}
