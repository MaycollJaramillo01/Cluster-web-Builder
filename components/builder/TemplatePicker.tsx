"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, Eye, Loader2, Shuffle, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { getAllTemplateCandidates, type TemplateCandidate } from "@/lib/site/template-selection";
import { cn } from "@/lib/utils";

export function TemplatePicker({ siteId, candidates, initialStyle }: { siteId: string; candidates: TemplateCandidate[]; initialStyle: string | null }) {
  const router = useRouter();
  const [visibleCount, setVisibleCount] = useState(3);
  const [selected, setSelected] = useState(initialStyle && candidates.some((item) => item.style === initialStyle) ? initialStyle : candidates[0].style);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function choose(style = selected) {
    setSaving(true);
    setError("");
    const response = await fetch(`/api/sites/${siteId}/template`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visualStyle: style }),
    });
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      setSaving(false);
      setError(data.error || "No se pudo aplicar el diseño. Intenta nuevamente.");
      return;
    }
    router.push(`/builder/${siteId}`);
  }

  function surprise() {
    // Sorprende de verdad: sortea entre todas las composiciones del catálogo, no solo las 6 propuestas.
    const alternatives = getAllTemplateCandidates().filter((item) => item.style !== selected);
    const style = alternatives[Math.floor(Math.random() * alternatives.length)]?.style ?? candidates[0].style;
    setSelected(style);
    void choose(style);
  }

  return (
    <div>
      <div className="grid gap-6 lg:grid-cols-3">
        {candidates.slice(0, visibleCount).map((candidate, index) => {
          const active = selected === candidate.style;
          return (
            <article key={candidate.style} className={cn("overflow-hidden rounded-xl border bg-card shadow-[var(--shadow-sm)] transition-[border-color,box-shadow] duration-200", active ? "border-[#a078ff] shadow-[var(--shadow-glow)]" : "border-border hover:border-[#6f647d]")}>
              <div className="relative aspect-[4/3] overflow-hidden border-b border-border bg-white">
                <DeferredPreview siteId={siteId} candidate={candidate} index={index} />
                <span className="absolute left-3 top-3 rounded-full border border-white/15 bg-[#0f0d15]/90 px-2.5 py-1 text-[11px] font-semibold text-white">Opción {index + 1}</span>
              </div>
              <div className="p-5">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <h2 className="text-lg font-semibold">{candidate.label}</h2>
                    <p className="mt-1 text-sm leading-6 text-muted-foreground">{candidate.description}</p>
                  </div>
                  {active && <span className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[#8b5cf6] text-white" aria-label="Diseño seleccionado"><Check className="h-4 w-4" /></span>}
                </div>
                <Button type="button" variant={active ? "default" : "outline"} className="mt-5 w-full" aria-pressed={active} onClick={() => setSelected(candidate.style)}>
                  {active ? <Check /> : <Eye />}{active ? "Seleccionado" : "Seleccionar diseño"}
                </Button>
              </div>
            </article>
          );
        })}
      </div>

      {visibleCount === 3 && (
        <div className="mt-8 text-center">
          <Button type="button" variant="outline" onClick={() => setVisibleCount(6)}>Ver 3 diseños más</Button>
          <p className="mt-2 text-xs text-muted-foreground">Máximo 6 opciones para mantener la decisión simple.</p>
        </div>
      )}

      <div className="sticky bottom-0 z-20 mt-10 border-t border-border bg-background/95 py-4 backdrop-blur-xl">
        <div className="flex flex-col-reverse gap-3 sm:flex-row sm:items-center sm:justify-between">
          <Button type="button" variant="ghost" disabled={saving} onClick={surprise}><Shuffle /> Sorpréndeme</Button>
          <div className="flex flex-col items-stretch gap-2 sm:items-end">
            {error && <p role="alert" className="text-sm text-[#ffb4ab]">{error}</p>}
            <Button type="button" disabled={saving} onClick={() => void choose()} className="min-w-52">
              {saving ? <Loader2 className="animate-spin" /> : <Sparkles />}{saving ? "Aplicando diseño…" : "Usar este diseño"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function DeferredPreview({ siteId, candidate, index }: { siteId: string; candidate: TemplateCandidate; index: number }) {
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), 80 + index * 120);
    return () => window.clearTimeout(timeout);
  }, [index]);

  if (!ready) return <div className="flex h-full items-center justify-center bg-[#191520] text-sm text-muted-foreground motion-safe:animate-pulse"><Loader2 className="mr-2 animate-spin" /> Preparando preview…</div>;
  return <iframe
    src={`/preview/${siteId}?style=${encodeURIComponent(candidate.style)}&compact=1`}
    title={`Vista previa ${candidate.label}`}
    loading="lazy"
    tabIndex={-1}
    className="pointer-events-none h-[400%] w-[400%] origin-top-left scale-[.25] border-0"
  />;
}
