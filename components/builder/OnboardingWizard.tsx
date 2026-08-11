"use client";
/* eslint-disable @next/next/no-img-element */

import { useId, useRef, useState, type ChangeEvent, type DragEvent } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ArrowUp, ImageIcon, Loader2, Sparkles, Upload } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { compressImageFile } from "@/lib/client-image";

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
  const [generatingLogo, setGeneratingLogo] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

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

  const processFile = async (file: File) => {
    if (file.size > 8 * 1024 * 1024) {
      setLogoError("El archivo original no puede superar 8 MB.");
      return;
    }
    setLogoError(null);
    try {
      setLogoDataUrl(await compressImageFile(file, 512, 350_000));
    } catch (reason) {
      setLogoError(reason instanceof Error ? reason.message : "No se pudo procesar el logo.");
    }
  };

  const handleLogoFile = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    await processFile(file);
    event.target.value = "";
  };

  const handleLogoDrop = async (event: DragEvent<HTMLButtonElement>) => {
    event.preventDefault();
    setIsDragging(false);
    const file = event.dataTransfer.files?.[0];
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      setLogoError("Solo se aceptan archivos de imagen.");
      return;
    }
    await processFile(file);
  };

  const generateAiLogo = async () => {
    setGeneratingLogo(true);
    setLogoError(null);
    try {
      const res = await fetch("/api/generate-logo", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt }),
      });
      const data = await res.json() as { dataUrl?: string; error?: string };
      if (!res.ok || !data.dataUrl) throw new Error(data.error ?? "Error al generar logo.");
      setLogoDataUrl(data.dataUrl);
    } catch (reason) {
      setLogoError(reason instanceof Error ? reason.message : "No se pudo generar el logo.");
    } finally {
      setGeneratingLogo(false);
    }
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
        <div className="rounded-lg border border-zinc-700 bg-zinc-950 p-6 shadow-lg shadow-black/20">
          <button
            type="button"
            onClick={() => { setStep("prompt"); setLogoDataUrl(null); setLogoError(null); }}
            className="mb-5 flex items-center gap-1.5 text-sm text-zinc-400 transition-colors hover:text-zinc-100 active:translate-y-px"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Volver al prompt
          </button>

          <p className="mb-1 text-lg font-semibold text-zinc-100">¿Tienes un logo?</p>
          <p className="mb-6 text-sm text-zinc-400">
            Súbelo o arrástralo al área, o deja que la IA lo cree automáticamente.
          </p>

          <div className="grid gap-3 sm:grid-cols-2">
            {/* Upload — click o drag-and-drop */}
            <button
              type="button"
              onClick={() => logoInputRef.current?.click()}
              onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragEnter={(e) => { e.preventDefault(); setIsDragging(true); }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={handleLogoDrop}
              disabled={submitting}
              className={[
                "flex flex-col items-center gap-3 rounded-lg border px-5 py-6 text-center transition-colors disabled:cursor-not-allowed disabled:opacity-50",
                isDragging
                  ? "border-violet-400 bg-zinc-800 ring-2 ring-violet-400/30"
                  : "border-zinc-700 bg-zinc-900 hover:border-violet-400 hover:bg-zinc-800",
              ].join(" ")}
            >
              {logoDataUrl ? (
                <img
                  src={logoDataUrl}
                  alt="Logo cargado"
                  className="h-14 w-auto max-w-[120px] rounded object-contain"
                />
              ) : (
                <Upload className={`h-7 w-7 ${isDragging ? "text-violet-200" : "text-violet-400"}`} />
              )}
              <span className="text-sm font-medium text-zinc-100">
                {logoDataUrl ? "Cambiar logo" : isDragging ? "Suelta aquí" : "Subir mi logo"}
              </span>
              <span className="text-xs text-zinc-400">
                {isDragging ? "Suelta el archivo para subirlo" : "PNG, SVG, WebP o JPG. Máximo 8 MB. También puedes arrastrarlo."}
              </span>
            </button>
            <input
              ref={logoInputRef}
              id={logoInputId}
              type="file"
              accept="image/png,image/jpeg,image/svg+xml,image/webp"
              className="sr-only"
              onChange={handleLogoFile}
            />

            {/* Generar con IA */}
            <button
              type="button"
              onClick={generateAiLogo}
              disabled={submitting || generatingLogo}
              className="flex flex-col items-center gap-3 rounded-lg border border-zinc-700 bg-zinc-900 px-5 py-6 text-center transition-colors hover:border-violet-400 hover:bg-zinc-800 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
            >
              {generatingLogo ? (
                <Loader2 className="h-7 w-7 animate-spin text-violet-400" />
              ) : (
                <Sparkles className="h-7 w-7 text-violet-400" />
              )}
              <span className="text-sm font-medium text-zinc-100">
                {generatingLogo ? "Generando..." : "Que la IA lo cree"}
              </span>
              <span className="text-xs text-zinc-400">
                {generatingLogo ? "Un momento..." : "Creamos un logotipo para tu negocio"}
              </span>
            </button>
          </div>

          {logoError && (
            <p role="alert" className="mt-3 text-sm text-red-300">{logoError}</p>
          )}

          {logoDataUrl ? (
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
          ) : (
            <div className="mt-5 flex justify-end">
              <button
                type="button"
                onClick={() => finish(false)}
                disabled={submitting || generatingLogo}
                className="text-sm text-zinc-400 transition-colors hover:text-zinc-100 active:translate-y-px disabled:opacity-50"
              >
                Continuar sin logo
              </button>
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
        className="rounded-lg border border-zinc-700 bg-zinc-950 p-3 shadow-lg shadow-black/20 transition focus-within:border-violet-400 focus-within:ring-2 focus-within:ring-violet-400/20"
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
        <div className="flex items-center justify-between gap-3 border-t border-zinc-800 px-2 pt-3">
          <p id={`${inputId}-help`} className="text-xs text-muted-foreground">
            {prompt.length}/2000 · Enter para enviar · Shift + Enter para otra línea
          </p>
          <Button type="submit" disabled={submitting} className="min-w-28">
            {submitting ? <Loader2 className="animate-spin" /> : <ArrowUp />}
            {submitting ? "Enviando" : "Siguiente"}
          </Button>
        </div>
      </form>

      {error && <p id={`${inputId}-error`} role="alert" className="mt-3 text-sm text-red-300">{error}</p>}

      <div className="mt-4 flex flex-wrap gap-2" aria-label="Prompts sugeridos">
        {PROMPT_PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            onClick={() => choosePreset(preset.prompt)}
            disabled={submitting}
            className="min-h-11 cursor-pointer rounded-md border border-zinc-700 bg-zinc-900 px-3.5 py-2 text-sm text-zinc-300 transition-colors hover:border-violet-400 hover:bg-zinc-800 hover:text-zinc-100 active:translate-y-px disabled:cursor-not-allowed disabled:opacity-50"
          >
            {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
