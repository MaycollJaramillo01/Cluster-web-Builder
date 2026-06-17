import Link from "next/link";
import { Sparkles } from "lucide-react";

import { OnboardingWizard } from "@/components/builder/OnboardingWizard";

export const metadata = {
  title: "Crear sitio · AI Website Builder",
};

export default function BuilderPage() {
  return (
    <main className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <Sparkles className="h-5 w-5 text-primary" />
            <span>AI Website Builder</span>
          </Link>
          <Link href="/dashboard" className="text-sm text-slate-600 hover:text-slate-900">
            Dashboard
          </Link>
        </div>
      </header>

      <section className="px-6 py-12">
        <div className="mx-auto mb-10 max-w-3xl text-center">
          <h1 className="text-3xl font-bold text-slate-900">
            Construyamos tu sitio
          </h1>
          <p className="mt-2 text-slate-600">
            Responde 5 preguntas rápidas y la IA generará tu sitio web completo.
          </p>
        </div>
        <OnboardingWizard />
      </section>
    </main>
  );
}
