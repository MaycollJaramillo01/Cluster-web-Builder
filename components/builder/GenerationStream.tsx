"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { ONBOARDING_STORAGE_KEY } from "@/components/builder/OnboardingWizard";

type Phase = "idle" | "streaming" | "saving" | "error";

export function GenerationStream() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<string[]>([]);
  const [preview, setPreview] = useState("");
  const [phase, setPhase] = useState<Phase>("idle");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const run = async () => {
    setError(null);
    setStatuses([]);
    setPreview("");
    setPhase("streaming");

    const stored = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) {
      router.replace("/builder");
      return;
    }

    try {
      const res = await fetch("/api/ai/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: stored,
      });

      // Non-streaming error (env/validation) returns JSON.
      if (!res.ok && res.headers.get("content-type")?.includes("json")) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo iniciar la generación.");
      }
      if (!res.body) throw new Error("El servidor no devolvió un stream.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        // SSE events are separated by a blank line.
        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          handleEvent(block);
        }
      }
    } catch (err) {
      setPhase("error");
      setError(
        err instanceof Error ? err.message : "Ocurrió un error inesperado."
      );
    }
  };

  const handleEvent = (block: string) => {
    let event = "message";
    let data = "";
    for (const line of block.split("\n")) {
      if (line.startsWith("event:")) event = line.slice(6).trim();
      else if (line.startsWith("data:")) data += line.slice(5).trim();
    }
    if (!data) return;

    let payload: Record<string, unknown> = {};
    try {
      payload = JSON.parse(data);
    } catch {
      return;
    }

    switch (event) {
      case "status":
        if (typeof payload.message === "string") {
          const msg = payload.message;
          setStatuses((prev) =>
            prev.includes(msg) ? prev : [...prev, msg]
          );
          if (msg.toLowerCase().includes("guardando")) setPhase("saving");
        }
        break;
      case "token":
        if (typeof payload.content === "string") {
          setPreview((prev) => (prev + payload.content).slice(-1200));
        }
        break;
      case "saved":
        if (typeof payload.siteId === "string") {
          sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
          router.push(`/builder/${payload.siteId}`);
        }
        break;
      case "error":
        setPhase("error");
        setError(
          typeof payload.message === "string"
            ? payload.message
            : "Error al generar el sitio."
        );
        break;
      default:
        break;
    }
  };

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void run();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const cardShadow =
    "shadow-[0_1px_2px_rgba(15,23,42,0.04),0_8px_24px_-12px_rgba(15,23,42,0.12)]";

  if (phase === "error") {
    return (
      <div
        className={`mx-auto max-w-xl rounded-2xl border border-slate-200 bg-white p-8 text-center ${cardShadow}`}
      >
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          No se pudo generar el sitio
        </h2>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button variant="outline" onClick={() => router.replace("/builder")}>
            Volver al formulario
          </Button>
          <Button
            onClick={() => {
              startedRef.current = true;
              void run();
            }}
          >
            Reintentar
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className={`overflow-hidden rounded-2xl border border-slate-200 bg-white ${cardShadow}`}>
        {/* Header */}
        <div className="flex items-center gap-4 border-b border-slate-100 px-8 py-6">
          <span className="relative flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <span className="absolute inset-0 animate-ping rounded-xl bg-primary/10" />
            <Sparkles className="relative h-6 w-6 text-primary" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-900">
              {phase === "saving"
                ? "Guardando tu sitio…"
                : "Generando tu sitio con IA"}
            </h2>
            <p className="text-sm text-slate-500">
              Estamos construyendo cada sección. Esto toma unos segundos.
            </p>
          </div>
        </div>

        {/* Timeline */}
        <div className="px-8 py-6">
          <ol className="relative space-y-1">
            {statuses.map((s, i) => {
              const isLast = i === statuses.length - 1;
              const active = isLast && phase !== "saving";
              return (
                <li key={s} className="flex items-start gap-3 py-1.5">
                  <span className="relative flex flex-col items-center">
                    {active ? (
                      <Loader2 className="h-5 w-5 animate-spin text-primary" />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/15">
                        <Check className="h-3 w-3 text-emerald-600" />
                      </span>
                    )}
                  </span>
                  <span
                    className={
                      active
                        ? "pt-0.5 text-sm font-medium text-slate-900"
                        : "pt-0.5 text-sm text-slate-500"
                    }
                  >
                    {s}
                  </span>
                </li>
              );
            })}
          </ol>

          {preview && (
            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="flex h-2 w-2 items-center justify-center">
                  <span className="absolute h-2 w-2 animate-ping rounded-full bg-emerald-400" />
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                </span>
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Contenido generándose en vivo
                </p>
              </div>
              <pre className="max-h-44 overflow-hidden rounded-xl border border-slate-800 bg-slate-900 p-4 text-xs leading-relaxed text-emerald-300/90">
                {preview}
              </pre>
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        No cierres esta ventana mientras generamos tu sitio.
      </p>
    </div>
  );
}
