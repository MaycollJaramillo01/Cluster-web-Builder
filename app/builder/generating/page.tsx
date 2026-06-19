import Link from "next/link";
import { LoaderCircle, MessageSquareText, WandSparkles } from "lucide-react";

import {
  GenerationStream,
  StoredPromptPreview,
} from "@/components/builder/GenerationStream";

export const metadata = {
  title: "Generando sitio | Cluster Web Builder",
};

export default function GeneratingPage() {
  return (
    <main className="flex min-h-dvh flex-col bg-[#f5f6f8] text-slate-950">
      <header className="border-b border-slate-200 bg-white">
        <div className="flex h-16 items-center px-5 sm:px-8">
          <Link href="/" className="flex items-center gap-2.5 font-semibold tracking-tight">
            <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-violet-600 text-white shadow-sm">
              <WandSparkles className="h-4 w-4" />
            </span>
            <span>Cluster</span>
            <span className="rounded bg-violet-100 px-1.5 py-0.5 text-[10px] font-bold uppercase text-violet-700">Beta</span>
          </Link>
        </div>
      </header>
      <div className="grid flex-1 lg:grid-cols-[320px_1fr]">
        <aside className="hidden border-r border-slate-200 bg-white p-5 lg:flex lg:flex-col">
          <div className="rounded-2xl bg-slate-100 px-4 py-3">
            <StoredPromptPreview />
          </div>
          <div className="mt-5 flex items-center gap-2 text-sm text-slate-500">
            <LoaderCircle className="h-4 w-4 animate-spin text-violet-600" /> Pensando…
          </div>
          <div className="mt-auto rounded-2xl border border-slate-200 bg-white p-4 shadow-lg shadow-slate-200/60">
            <p className="text-sm text-slate-400">Preparando tu proyecto…</p>
            <div className="mt-8 flex items-center justify-between">
              <MessageSquareText className="h-5 w-5 text-slate-400" />
              <span className="h-10 w-10 rounded-xl bg-violet-100" />
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
