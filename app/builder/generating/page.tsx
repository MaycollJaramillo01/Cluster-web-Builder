import { Sparkles } from "lucide-react";

import { GenerationStream } from "@/components/builder/GenerationStream";

export const metadata = {
  title: "Generando sitio · AI Website Builder",
};

export default function GeneratingPage() {
  return (
    <main className="flex min-h-screen flex-col bg-gradient-to-b from-slate-50 to-white">
      <header className="border-b bg-white/70 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-2 px-6 py-4 font-semibold">
          <Sparkles className="h-5 w-5 text-primary" />
          <span>AI Website Builder</span>
        </div>
      </header>
      <section className="flex flex-1 items-center justify-center px-6 py-16">
        <GenerationStream />
      </section>
    </main>
  );
}
