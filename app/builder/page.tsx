import Link from "next/link";
import { ArrowLeft, WandSparkles } from "lucide-react";

import { OnboardingWizard } from "@/components/builder/OnboardingWizard";

export const metadata = {
  title: "Crear sitio | Cluster Web Builder",
};

export default function BuilderPage() {
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
          <Link href="/dashboard" className="flex min-h-11 items-center gap-2 text-sm font-medium text-slate-500 transition-colors hover:text-violet-700">
            <ArrowLeft className="h-4 w-4" /> Proyectos
          </Link>
        </div>
      </header>

      <section className="px-5 py-10 sm:px-8 sm:py-14">
        <div className="mx-auto mb-8 max-w-4xl text-center">
          <p className="text-sm font-semibold text-violet-700">
            Comienza con una instrucción
          </p>
          <h1 className="mx-auto mt-2 max-w-3xl text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl">
            Describe el sitio que quieres crear
          </h1>
          <p className="mx-auto mt-3 max-w-2xl text-base leading-7 text-slate-500">
            Escribe con tus propias palabras o elige un prompt sugerido. La IA se encarga de convertirlo en una propuesta editable.
          </p>
        </div>
        <OnboardingWizard />
      </section>
    </main>
  );
}
