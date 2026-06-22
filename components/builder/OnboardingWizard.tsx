"use client";

import { useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowUp, Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";

export const ONBOARDING_STORAGE_KEY = "ai-builder:onboarding";

const PROMPT_PRESETS = [
  { label: "Estudio de arquitectura sostenible", prompt: "Crea una landing editorial para un estudio de arquitectura sostenible, con proyectos destacados, filosofía de diseño y contacto para nuevas consultas." },
  { label: "Restaurante contemporáneo", prompt: "Diseña un sitio inmersivo para un restaurante contemporáneo, con menú, historia, ubicación y una llamada clara para reservar." },
  { label: "Portafolio de director creativo", prompt: "Crea un portafolio minimalista para un director creativo, centrado en proyectos, proceso, perfil profesional y contacto." },
  { label: "Tienda local artesanal", prompt: "Diseña una tienda local cálida para una marca artesanal, con productos destacados, historia, ubicación y pedidos por contacto." },
] as const;

type PromptComposerProps = { variant?: "hero" | "chat" };

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
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ prompt: value }));
    router.push("/builder/generating");
  };

  return (
    <div className="mx-auto w-full max-w-4xl">
      <form
        onSubmit={(event) => { event.preventDefault(); submit(); }}
        className="rounded-lg border border-[#494454] bg-[#15121b] p-3 shadow-[0_0_0_3px_rgb(139_92_246/0.08),var(--shadow-md)] focus-within:border-[#8b5cf6] focus-within:shadow-[var(--shadow-glow)]"
      >
        <label htmlFor={inputId} className="sr-only">
          Describe el sitio que quieres crear
        </label>
        <Textarea
          ref={textareaRef}
          id={inputId}
          value={prompt}
          maxLength={2000}
          onChange={(event) => { setPrompt(event.target.value); setError(null); }}
          onKeyDown={(event) => {
            if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submit(); }
          }}
          placeholder="Describe el sitio que quieres crear…"
          disabled={submitting}
          rows={variant === "hero" ? 3 : 6}
          className="min-h-32 resize-none border-0 bg-transparent px-2 py-2 text-base shadow-none focus-visible:ring-0 focus-visible:ring-offset-0"
          aria-describedby={`${inputId}-help${error ? ` ${inputId}-error` : ""}`}
        />
        <div className="flex items-center justify-between gap-3 border-t border-[#2d243d] px-2 pt-3">
          <p id={`${inputId}-help`} className="text-xs text-muted-foreground">
            {prompt.length}/2000 · Enter para enviar · Shift + Enter para otra línea
          </p>
          <Button type="submit" disabled={submitting} className="min-w-28">
            {submitting ? <Loader2 className="animate-spin" /> : <ArrowUp />}
            {submitting ? "Enviando" : "Generar"}
          </Button>
        </div>
      </form>

      {error && <p id={`${inputId}-error`} role="alert" className="mt-3 text-sm text-[#ffb4ab]">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Prompts sugeridos">
        {PROMPT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => choosePreset(preset.prompt)}
            disabled={submitting}
            className="min-h-11 cursor-pointer rounded-full border border-[#494454] bg-[#1d1a23] px-3.5 py-2 text-sm text-[#cbc3d7] transition-colors hover:border-[#8b5cf6] hover:bg-[#2c2141] hover:text-[#e9ddff] disabled:cursor-not-allowed disabled:opacity-50"
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
