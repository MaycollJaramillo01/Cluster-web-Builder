import Link from "next/link";
import { ArrowLeft, PanelsTopLeft } from "lucide-react";

import { OnboardingWizard } from "@/components/builder/OnboardingWizard";

export const metadata = { title: "Crear sitio | Cluster Web Builder" };

export default async function BuilderPage() {
  return (
    <main className="min-h-dvh bg-background text-foreground">
      <header className="border-b border-[#2d243d] bg-[#0f0d15]">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-[#8b5cf6] text-white"><PanelsTopLeft className="h-4 w-4" /></span>
            <span>Cluster</span>
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Beta</span>
          </Link>
          <Link href="/dashboard" className="flex min-h-11 items-center gap-2 text-sm font-medium text-muted-foreground hover:text-foreground">
            <ArrowLeft className="h-4 w-4" /> Proyectos
          </Link>
        </div>
      </header>

      <section className="px-5 py-12 sm:px-8 sm:py-16">
        <div className="mx-auto mb-9 max-w-4xl">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-[#a078ff]">Nuevo proyecto</p>
          <h1 className="mt-3 max-w-3xl font-[var(--font-outfit)] text-3xl font-semibold tracking-[-0.03em] sm:text-5xl">
            ¿Qué quieres crear?
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-muted-foreground">
            Explícalo como se lo contarías a un diseñador. Cluster interpretará el negocio, el objetivo y la dirección visual.
          </p>
        </div>
        <OnboardingWizard />
      </section>
    </main>
  );
}
