"use client";

import {
  useEffect,
  useRef,
  useState,
  useSyncExternalStore,
  type ComponentProps,
} from "react";
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

      if (!res.ok && res.headers.get("content-type")?.includes("json")) {
        const data = await res.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo iniciar la generacion.");
      }
      if (!res.body) throw new Error("El servidor no devolvio un stream.");

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });

        let sep: number;
        while ((sep = buffer.indexOf("\n\n")) !== -1) {
          const block = buffer.slice(0, sep);
          buffer = buffer.slice(sep + 2);
          handleEvent(block);
        }
      }
    } catch (err) {
      setPhase("error");
      setError(err instanceof Error ? err.message : "Ocurrio un error inesperado.");
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
          setStatuses((prev) => (prev.includes(msg) ? prev : [...prev, msg]));
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
      <MotionSurface
        role="dialog"
        aria-live="assertive"
        aria-label="Error al generar el sitio"
        className="mx-auto w-full max-w-xl rounded-3xl border border-red-200 bg-white p-7 text-center shadow-xl shadow-slate-200/60"
      >
        <div className="mx-auto mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-red-200 bg-red-50">
          <AlertCircle className="h-6 w-6 text-red-600" />
        </div>
        <h2 className="text-lg font-semibold text-slate-950">No se pudo generar el sitio</h2>
        <p className="mt-2 text-sm text-slate-500">{error}</p>
        <div className="mt-6 flex justify-center gap-3">
          <Button
            variant="outline"
            className="border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
            onClick={() => router.replace("/builder")}
          >
            Volver al formulario
          </Button>
          <Button
            className="bg-violet-700 text-white hover:bg-violet-800"
            onClick={() => {
              startedRef.current = true;
              void run();
            }}
          >
            Reintentar
          </Button>
        </div>
      </MotionSurface>
    );
  }

  return (
    <MotionSurface className="mx-auto w-full max-w-2xl">
      <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-xl shadow-slate-200/70">
        <div className="flex items-center gap-4 border-b border-slate-100 px-6 py-5 sm:px-8">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-violet-100">
            <Loader2 className="h-5 w-5 animate-spin text-violet-700" />
          </span>
          <div>
            <h2 className="text-lg font-semibold tracking-tight text-slate-950">
              {phase === "saving" ? "Guardando tu sitio..." : "Generando tu sitio con IA"}
            </h2>
            <p className="text-sm text-slate-500">
              Estamos construyendo cada sección. Esto toma unos segundos.
            </p>
          </div>
        </div>

        <div className="px-6 py-5 sm:px-8 sm:py-6">
          <ol className="relative space-y-1">
            {statuses.map((s, i) => {
              const isLast = i === statuses.length - 1;
              const active = isLast && phase !== "saving";
              return (
                <li key={s} className="flex items-start gap-3 py-1.5">
                  <span className="relative flex flex-col items-center">
                    {active ? (
                      <Loader2 className="h-5 w-5 animate-spin text-violet-700" />
                    ) : (
                      <span className="flex h-5 w-5 items-center justify-center rounded-full bg-emerald-100">
                        <Check className="h-3 w-3 text-emerald-700" />
                      </span>
                    )}
                  </span>
                  <span className={active ? "pt-0.5 text-sm font-medium text-slate-950" : "pt-0.5 text-sm text-slate-500"}>
                    {s}
                  </span>
                </li>
              );
            })}
          </ol>

          {preview && (
            <div className="mt-6">
              <div className="mb-2 flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                <p className="text-xs font-medium uppercase tracking-wide text-slate-400">
                  Contenido generándose en vivo
                </p>
              </div>
              <pre className="max-h-44 overflow-hidden rounded-xl border border-slate-200 bg-slate-950 p-4 text-xs leading-relaxed text-emerald-300">
                {preview}
              </pre>
            </div>
          )}
        </div>
      </div>
      <p className="mt-4 text-center text-xs text-slate-400">
        No cierres esta ventana mientras generamos tu sitio.
      </p>
    </MotionSurface>
  );
}

export function StoredPromptPreview() {
  const stored = useSyncExternalStore(
    () => () => undefined,
    () => sessionStorage.getItem(ONBOARDING_STORAGE_KEY) ?? "",
    () => ""
  );
  let prompt = "Crear un nuevo sitio web";
  try {
    const value = JSON.parse(stored) as {
      prompt?: unknown;
      businessName?: unknown;
    };
    if (typeof value.prompt === "string") prompt = value.prompt;
    else if (typeof value.businessName === "string") {
      prompt = `Crear el sitio de ${value.businessName}`;
    }
  } catch {
    // Keep the generic preview when storage is stale.
  }

  return <p className="text-sm leading-6 text-slate-700">{prompt}</p>;
}

function MotionSurface({ className, children, ...props }: ComponentProps<"div">) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => setOpen(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  return (
    <div className={`${open ? "t-modal is-open" : "t-modal"} ${className ?? ""}`} {...props}>
      {children}
    </div>
  );
}
