"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AlertCircle, Check, Loader2 } from "lucide-react";

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

  if (phase === "error") {
    return (
      <div className="mx-auto max-w-xl rounded-2xl border bg-white p-8 text-center shadow-sm">
        <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
          <AlertCircle className="h-6 w-6 text-destructive" />
        </div>
        <h2 className="text-lg font-semibold text-slate-900">
          No se pudo generar el sitio
        </h2>
        <p className="mt-2 text-sm text-slate-600">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="outline"
            onClick={() => router.replace("/builder")}
          >
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
      <div className="rounded-2xl border bg-white p-8 shadow-sm">
        <div className="flex items-center gap-3">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
          <h2 className="text-lg font-semibold text-slate-900">
            {phase === "saving"
              ? "Guardando tu sitio..."
              : "Generando tu sitio con IA..."}
          </h2>
        </div>

        <ul className="mt-6 space-y-3">
          {statuses.map((s, i) => {
            const isLast = i === statuses.length - 1;
            return (
              <li key={s} className="flex items-center gap-3 text-sm">
                {isLast && phase !== "saving" ? (
                  <Loader2 className="h-4 w-4 animate-spin text-primary" />
                ) : (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-emerald-100">
                    <Check className="h-3 w-3 text-emerald-600" />
                  </span>
                )}
                <span
                  className={
                    isLast ? "font-medium text-slate-900" : "text-slate-500"
                  }
                >
                  {s}
                </span>
              </li>
            );
          })}
        </ul>

        {preview && (
          <div className="mt-6">
            <p className="mb-2 text-xs uppercase tracking-wide text-slate-400">
              Vista del contenido generándose en vivo
            </p>
            <pre className="max-h-48 overflow-hidden rounded-lg bg-slate-900 p-4 text-xs leading-relaxed text-emerald-300">
              {preview}
            </pre>
          </div>
        )}
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        Esto puede tardar unos segundos. No cierres esta ventana.
      </p>
    </div>
  );
}
