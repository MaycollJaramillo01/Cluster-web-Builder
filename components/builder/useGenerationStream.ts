"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";

import { ONBOARDING_STORAGE_KEY } from "@/components/builder/OnboardingWizard";

export type GenerationPhase = "idle" | "streaming" | "saving" | "error";

export type GenerationEvent = {
  event: string;
  payload: Record<string, unknown>;
};

export function parseGenerationEvent(block: string): GenerationEvent | null {
  let event = "message";
  let data = "";
  for (const line of block.split("\n")) {
    if (line.startsWith("event:")) event = line.slice(6).trim();
    else if (line.startsWith("data:")) data += line.slice(5).trim();
  }
  if (!data) return null;

  try {
    return { event, payload: JSON.parse(data) as Record<string, unknown> };
  } catch {
    return null;
  }
}

export function useGenerationStream() {
  const router = useRouter();
  const [statuses, setStatuses] = useState<string[]>([]);
  const [preview, setPreview] = useState("");
  const [phase, setPhase] = useState<GenerationPhase>("idle");
  const [error, setError] = useState<string | null>(null);
  const startedRef = useRef(false);

  const savedRef = useRef(false);
  const errorRef = useRef(false);

  const handleEvent = useCallback((block: string) => {
    const parsed = parseGenerationEvent(block);
    if (!parsed) return;
    const { event, payload } = parsed;

    if (event === "status" && typeof payload.message === "string") {
      const message = payload.message;
      setStatuses((current) => current.includes(message) ? current : [...current, message]);
      if (message.toLowerCase().includes("guardando")) setPhase("saving");
      return;
    }
    if (event === "token" && typeof payload.content === "string") {
      setPreview((current) => (current + payload.content).slice(-1200));
      return;
    }
    if (event === "saved" && typeof payload.siteId === "string") {
      savedRef.current = true;
      sessionStorage.removeItem(ONBOARDING_STORAGE_KEY);
      sessionStorage.removeItem("cluster_logo");
      sessionStorage.removeItem("cluster_cover");
      router.push(`/builder/${payload.siteId}`);
      return;
    }
    if (event === "error") {
      errorRef.current = true;
      setPhase("error");
      setError(typeof payload.message === "string" ? payload.message : "Error al generar el sitio.");
    }
  }, [router]);

  const run = useCallback(async () => {
    setError(null);
    setStatuses([]);
    setPreview("");
    setPhase("streaming");
    savedRef.current = false;
    errorRef.current = false;

    const stored = sessionStorage.getItem(ONBOARDING_STORAGE_KEY);
    if (!stored) {
      router.replace("/builder");
      return;
    }

    try {
      const request = JSON.parse(stored) as Record<string, unknown>;
      const logoDataUrl = sessionStorage.getItem("cluster_logo") || undefined;
      const coverDataUrl = sessionStorage.getItem("cluster_cover") || undefined;
      const response = await fetch("/api/ai/generate-site", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...request, assets: { logoDataUrl, coverDataUrl } }),
      });
      if (!response.ok && response.headers.get("content-type")?.includes("json")) {
        const data = await response.json().catch(() => null);
        throw new Error(data?.error ?? "No se pudo iniciar la generación.");
      }
      if (!response.body) throw new Error("El servidor no devolvió un stream.");

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let separator: number;
        while ((separator = buffer.indexOf("\n\n")) !== -1) {
          handleEvent(buffer.slice(0, separator));
          buffer = buffer.slice(separator + 2);
        }
      }
      if (buffer.trim()) handleEvent(buffer);

      if (!savedRef.current && !errorRef.current) {
        setPhase("error");
        setError("La generación se interrumpió antes de guardar. Intenta de nuevo.");
      }
    } catch (reason) {
      setPhase("error");
      setError(reason instanceof Error ? reason.message : "Ocurrió un error inesperado.");
    }
  }, [handleEvent, router]);

  useEffect(() => {
    if (startedRef.current) return;
    startedRef.current = true;
    void run();
  }, [run]);

  return { statuses, preview, phase, error, retry: run };
}
