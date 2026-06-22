import Link from "next/link";
import { LoaderCircle, MessageSquareText, PanelsTopLeft } from "lucide-react";

import { GenerationStream, StoredPromptPreview } from "@/components/builder/GenerationStream";

export const metadata = { title: "Generando sitio | Cluster Web Builder" };

export default function GeneratingPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-background text-foreground">
      <header className="border-b border-[#2d243d] bg-[#0f0d15]">
        <div className="flex h-16 items-center px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded bg-[#8b5cf6] text-white"><PanelsTopLeft className="h-4 w-4" /></span>
            <span>Cluster</span>
            <span className="rounded border border-border px-1.5 py-0.5 text-[10px] font-bold uppercase text-muted-foreground">Beta</span>
          </Link>
        </div>
      </header>
      <div className="grid flex-1 lg:grid-cols-[320px_1fr]">
        <aside className="hidden border-r border-border bg-[#15121b] p-5 lg:flex lg:flex-col">
          <div className="rounded-lg bg-muted px-4 py-3"><StoredPromptPreview /></div>
          <div className="mt-5 flex items-center gap-2 text-sm text-muted-foreground">
            <LoaderCircle className="h-4 w-4 animate-spin text-[#a078ff]" /> Preparando el borrador…
          </div>
          <div className="mt-auto rounded-lg border border-border bg-[#1d1a23] p-4 shadow-[var(--shadow-sm)]">
            <p className="text-sm text-muted-foreground">Creando una base editable…</p>
            <div className="mt-8 flex items-center justify-between">
              <MessageSquareText className="h-5 w-5 text-muted-foreground" />
              <span className="h-10 w-10 rounded-lg bg-secondary" />
            </div>
          </div>
        </aside>
        <section className="soft-grid flex min-w-0 items-center justify-center px-5 py-12 sm:px-8">
          <GenerationStream />
        </section>
      </div>
    </main>
  );
}
