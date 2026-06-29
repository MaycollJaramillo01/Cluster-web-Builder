"use client";

import { useId, useRef, useState, type ChangeEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, ImageIcon, Loader2, Sparkles, Upload } from "lucide-react";

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
  const logoInputId = useId();
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const logoInputRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<"prompt" | "logo">("prompt");
  const [prompt, setPrompt] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [logoDataUrl, setLogoDataUrl] = useState<string | null>(null);
  const [logoError, setLogoError] = useState<string | null>(null);

  const choosePreset = (value: string) => {
    setPrompt(value);
    setError(null);
    requestAnimationFrame(() => textareaRef.current?.focus());
  };

  const submitPrompt = () => {
    const value = prompt.trim();
    if (value.length < 10) {
      setError("Describe un poco más el sitio que quieres crear.");
      textareaRef.current?.focus();
      return;
    }
    setStep("logo");
    setError(null);
  };

  const handleLogoFile = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 2 * 1024 * 1024) {
      setLogoError("El logo no puede superar 2 MB.");
      event.target.value = "";
      return;
    }
    setLogoError(null);
    const reader = new FileReader();
    reader.onload = (e) => setLogoDataUrl(e.target?.result as string);
    reader.readAsDataURL(file);
  };

  const finish = (withLogo: boolean) => {
    setSubmitting(true);
    if (withLogo && logoDataUrl) {
      sessionStorage.setItem("cluster_logo", logoDataUrl);
    } else {
      sessionStorage.removeItem("cluster_logo");
    }
    sessionStorage.setItem(ONBOARDING_STORAGE_KEY, JSON.stringify({ prompt: prompt.trim() }));
    router.push("/builder/generating");
  };

  if (step === "logo") {
    return (
      <div className="mx-auto w-full max-w-4xl">
        <div className="rounded-lg border border-[#494454] bg-[#15121b] p-6 shadow-[0_0_0_3px_rgb(139_92_246/0.08),var(--shadow-md)]">
          <button
            type="button"
            onClick={() => { setStep("prompt"); setLogoDataUrl(null); setLogoError(null); }}
            className="mb-5 flex items-center gap-1.5 text-sm text-[#9b8ab4] hover:text-[#cbc3d7] transition-colors"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al prompt
          </button>

          <p className="mb-1 text-lg font-semibold text-[#f7f2fb]">¿Tienes un logo?</p>
          <p className="mb-6 text-sm text-[#9b8ab4]">
            Súbelo para incluirlo en tu sitio, o deja que la IA lo cree automáticamente.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Upload option */}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              disabled={submitting}
              className="flex flex-col items-center gap-3 rounded-lg border border-[#494454] bg-[#1d1a23] px-5 py-6 text-center transition-colors hover:border-[#8b5cf6] hover:bg-[#2c2141] disabled:cursor-not-allowed disabled:opacity-50"
            >
              {logoDataUrl ? (
                <img
                  src={logoDataUrl}
                  alt="Logo subido"
                  className="h-14 w-auto max-w-[120px] rounded object-contain"
                />
              ) : (
                <Upload className="h-7 w-7 text-[#8b5cf6]" />
              )}
              <span className="text-sm font-medium text-[#f7f2fb]">
                {logoDataUrl ? "Cambiar logo" : "Subir mi logo"}
              </span>
              <span className="text-xs text-[#9b8ab4]">PNG, SVG o JPG · máx. 2 MB</span>
            </button>
            <input
              ref={logoInputRef}
              id={logoInputId}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="sr-only"
              onChange={handleLogoFile}
            />

            {/* AI option */}
            <button
              type="button"
              onClick={() => finish(false)}
              disabled={submitting}
              className="flex flex-col items-center gap-3 rounded-lg border border-[#494454] bg-[#1d1a23] px-5 py-6 text-center transition-colors hover:border-[#8b5cf6] hover:bg-[#2c2141] disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Sparkles className="h-7 w-7 text-[#8b5cf6]" />
              <span className="text-sm font-medium text-[#f7f2fb]">Que la IA lo cree</span>
              <span className="text-xs text-[#9b8ab4]">Generamos un logotipo para ti</span>
            </button>
          </div>

          {logoError && (
            <p role="alert" className="mt-3 text-sm text-[#ffb4ab]">{logoError}</p>
          )}

          {logoDataUrl && (
            <div className="mt-5 flex justify-end">
              <Button
                onClick={() => finish(true)}
                disabled={submitting}
                className="min-w-36"
              >
                {submitting ? <Loader2 className="animate-spin" /> : <ImageIcon className="h-4 w-4" />}
                {submitting ? "Generando…" : "Usar este logo"}
              </Button>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto w-full max-w-4xl">
      <form
        onSubmit={(event) => { event.preventDefault(); submitPrompt(); }}
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
            if (event.key === "Enter" && !event.shiftKey) { event.preventDefault(); submitPrompt(); }
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
            {submitting ? "Enviando" : "Siguiente"}
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
