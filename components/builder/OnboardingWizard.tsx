"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2, WandSparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export const ONBOARDING_STORAGE_KEY = "ai-builder:onboarding";

const PROMPT_PRESETS = [
  {
    label: "Restaurante",
    prompt:
      "Crea un sitio moderno para un restaurante, con presentación, menú, ubicación y una llamada a reservar.",
  },
  {
    label: "Sitio de servicios",
    prompt:
      "Crea un sitio profesional para una empresa de servicios locales, con servicios, zona de cobertura y solicitud de cotización.",
  },
  {
    label: "Portafolio",
    prompt:
      "Crea un portafolio minimalista para presentar mi trabajo, mis proyectos y una forma clara de contactarme.",
  },
  {
    label: "Tienda local",
    prompt:
      "Crea un sitio para una tienda local que presente sus productos, beneficios, ubicación y contacto.",
  },
  {
    label: "Landing de campaña",
    prompt:
      "Crea una landing page enfocada en conversión, con una oferta clara, beneficios, preguntas frecuentes y llamada a la acción.",
  },
] as const;

type PromptComposerProps = {
  variant?: "hero" | "chat";
};

export function PromptComposer({ variant = "chat" }: PromptComposerProps) {
  const router = useRouter();
  const inputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const choosePreset = (value: string) => {
    setPrompt(value);
    setError(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const submit = () => {
    const value = prompt.trim();
    if (value.length < 10) {
      setError("Describe un poco más el sitio que quieres crear.");
      textareaRef.current?.focus();
      return;
    }

    setSubmitting(true);
    sessionStorage.setItem(
      ONBOARDING_STORAGE_KEY,
      JSON.stringify({ prompt: value })
    );
    router.push("/builder/generating");
  };

  const composer = (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        submit();
      }}
      className={cn(
        "overflow-hidden border bg-white shadow-xl",
        variant === "hero"
          ? "rounded-2xl border-violet-300/60 p-3 shadow-violet-950/25 ring-4 ring-violet-500/15"
          : "rounded-3xl border-slate-200 p-3 shadow-violet-100/50"
      )}
    >
      <label htmlFor={inputId} className="sr-only">
        Describe el sitio web que quieres crear
      </label>
      <Textarea
        ref={textareaRef}
        id={inputId}
        value={prompt}
        onChange={(event) => {
          setPrompt(event.target.value);
          setError(null);
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            submit();
          }
        }}
        placeholder="Describe el sitio que quieres crear…"
        disabled={submitting}
        rows={variant === "hero" ? 2 : 5}
        className="min-h-24 resize-none border-0 bg-transparent px-3 py-3 text-base text-slate-900 shadow-none placeholder:text-slate-400 focus-visible:ring-0 focus-visible:ring-offset-0"
        aria-describedby={`${inputId}-help${error ? ` ${inputId}-error` : ""}`}
      />
      <div className="flex items-center justify-between gap-3 border-t border-slate-100 px-2 pt-3">
        <p id={`${inputId}-help`} className="hidden text-xs text-slate-400 sm:block">
          Enter para enviar · Shift + Enter para otra línea
        </p>
        <Button
          type="submit"
          disabled={submitting}
          className="ml-auto min-w-28 bg-violet-700 text-white hover:bg-violet-800"
        >
          {submitting ? <Loader2 className="animate-spin" /> : <ArrowUp />}
          {submitting ? "Enviando" : "Generar"}
        </Button>
      </div>
    </form>
  );

  return (
    <div className="mx-auto w-full max-w-3xl">
      {variant === "chat" && (
        <div className="mb-6 flex items-start gap-3" aria-live="polite">
          <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-violet-700 text-white">
            <WandSparkles className="h-5 w-5" />
          </span>
          <div className="max-w-2xl rounded-2xl rounded-tl-md border border-slate-200 bg-white px-4 py-3 text-sm leading-6 text-slate-700 shadow-sm">
            Cuéntame qué sitio quieres crear. Puedes incluir el nombre del negocio,
            lo que ofrece, su ciudad y el contacto si ya los tienes.
          </div>
        </div>
      )}

      {composer}

      {error && (
        <p
          id={`${inputId}-error`}
          role="alert"
          className={cn(
            "mt-3 text-sm",
            variant === "hero" ? "text-red-200" : "text-red-700"
          )}
        >
          {error}
        </p>
      )}

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Prompts sugeridos">
        {PROMPT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => choosePreset(preset.prompt)}
            disabled={submitting}
            className={cn(
              "min-h-11 cursor-pointer rounded-full border px-3.5 py-2 text-sm transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-violet-400 disabled:cursor-not-allowed disabled:opacity-50",
              variant === "hero"
                ? "border-white/15 bg-white/5 text-violet-100/80 hover:border-violet-300/40 hover:bg-white/10 hover:text-white"
                : "border-slate-200 bg-white text-slate-600 hover:border-violet-300 hover:bg-violet-50 hover:text-violet-800"
            )}
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}

export function OnboardingWizard() {
  return <PromptComposer variant="chat" />;
}
