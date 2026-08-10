import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getAllTemplateCandidates } from "@/lib/site/template-selection";

export const metadata: Metadata = {
  title: "Galería local de templates",
  robots: { index: false, follow: false },
};

export default function LocalTemplatesPage() {
  if (process.env.NODE_ENV !== "development") notFound();

  const templates = getAllTemplateCandidates();

  return (
    <main className="min-h-screen bg-[#0b0b0d] px-4 py-10 text-white sm:px-8 lg:px-12">
      <header className="mx-auto mb-10 max-w-[1480px] border-b border-white/15 pb-8">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.24em] text-amber-300">
              Vista privada · solo desarrollo local
            </p>
            <h1 className="text-4xl font-semibold tracking-tight sm:text-6xl">
              Todos los templates
            </h1>
          </div>
          <p className="max-w-md text-sm leading-6 text-white/60">
            {templates.length} composiciones completas. Desplázate para cargarlas y abre cualquiera en tamaño real.
          </p>
        </div>
      </header>

      <section className="mx-auto grid max-w-[1480px] gap-8 xl:grid-cols-2">
        {templates.map((template, index) => {
          const previewUrl = `/plantillas-locales/${encodeURIComponent(template.style)}`;

          return (
            <article
              key={template.style}
              id={template.style}
              className="overflow-hidden rounded-2xl border border-white/15 bg-[#151518] shadow-2xl shadow-black/20"
              style={{ contentVisibility: "auto", containIntrinsicSize: "640px" }}
            >
              <div className="flex items-start justify-between gap-4 border-b border-white/10 px-5 py-4">
                <div>
                  <div className="flex items-center gap-3">
                    <span className="font-mono text-xs text-white/35">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <h2 className="text-lg font-semibold">{template.label}</h2>
                  </div>
                  <p className="mt-1 pl-8 text-sm text-white/50">{template.description}</p>
                </div>
                <span className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-[11px] font-medium uppercase tracking-wider text-white/60">
                  {template.family}
                </span>
              </div>

              <div className="relative aspect-[16/10] overflow-hidden bg-white">
                <iframe
                  src={previewUrl}
                  title={`Vista previa de ${template.label}`}
                  loading="lazy"
                  tabIndex={-1}
                  className="pointer-events-none absolute left-0 top-0 h-[400%] w-[400%] origin-top-left scale-[.25] border-0"
                />
              </div>

              <div className="flex items-center justify-between gap-4 px-5 py-4">
                <code className="text-xs text-white/40">{template.style}</code>
                <Link
                  href={previewUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-full bg-white px-4 py-2 text-sm font-semibold text-black transition hover:bg-amber-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-amber-300 focus-visible:ring-offset-2 focus-visible:ring-offset-[#151518]"
                >
                  Abrir en tamaño real ↗
                </Link>
              </div>
            </article>
          );
        })}
      </section>
    </main>
  );
}
