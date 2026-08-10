import { ZodError } from "zod";

import { extractJsonFromModelResponse } from "@/lib/json/extract-json";
import { OpenRouterError, openrouterChatStream, parseChatStream } from "@/lib/openrouter";
import { buildSiteGenerationPrompt } from "@/lib/prompts/site-generator";
import type { SectionType } from "@/lib/site/blueprint";
import { auditBlueprintCopy, enforceBlueprintCopyQuality } from "@/lib/site/copy-quality";
import { buildFallbackSiteBlueprint } from "@/lib/site/fallback-site-blueprint";
import { normalizeSiteBlueprint, type NormalizedSite } from "@/lib/site/normalize-site-blueprint";
import {
  onboardingSchema,
  promptToOnboardingInput,
  resolveBusinessTypeLabel,
  sitePromptSchema,
  type OnboardingInput,
} from "@/lib/validators/site-onboarding";

export type GenerationRequest = {
  input: OnboardingInput;
  originalRequest?: string;
};

export type GenerationPlan = {
  selectedDesignStyle: string;
  designBrief: string;
  sectionPlan: SectionType[];
  paletteId: string;
  systemPrompt: string;
  userPrompt: string;
};

export function parseGenerationInput(body: unknown): GenerationRequest {
  if (typeof body === "object" && body !== null && "prompt" in body) {
    const request = sitePromptSchema.parse(body);
    return { input: promptToOnboardingInput(request.prompt), originalRequest: request.prompt };
  }
  return { input: onboardingSchema.parse(body) };
}

export function buildGenerationPlan(input: OnboardingInput, originalRequest?: string): GenerationPlan {
  const designRequest = originalRequest ?? buildGuidedDesignRequest(input);
  const selectedDesignStyle = input.visualStyle;
  const designBrief = buildVisualDirection(input, designRequest);
  const sectionPlan = buildSectionPlan(input);
  const prompt = buildSiteGenerationPrompt(
    input,
    originalRequest,
    designBrief,
    sectionPlan,
    "Claro, específico y orientado a convertir visitas en contactos, sin frases genéricas.",
  );

  return {
    selectedDesignStyle,
    designBrief,
    sectionPlan,
    paletteId: input.visualStyle,
    systemPrompt: prompt.system,
    userPrompt: prompt.user,
  };
}

export function generationStatusStages(style: string) {
  return [
    "Analizando negocio...",
    "Definiendo estructura del sitio...",
    `Explorando estilo ${style}...`,
    "Generando copy comercial...",
    "Preparando SEO local...",
    "Construyendo secciones...",
  ];
}

function buildVisualDirection(input: OnboardingInput, request: string): string {
  return [
    `Dirección visual solicitada: ${input.visualStyle.replaceAll("_", " ")}.`,
    `Contexto: ${request}.`,
    "Construye una interfaz original desde bloques editables; no imites ni selecciones una plantilla prearmada.",
  ].join(" ");
}

function buildSectionPlan(input: OnboardingInput): SectionType[] {
  const hasLocation = input.location.trim().length > 0;
  return [
    "hero",
    "services",
    "about_us",
    "benefits",
    ...(hasLocation ? ["location" as const] : []),
    "faq",
    "contact",
    "cta",
    "footer",
  ];
}

export async function generateNormalizedSite({
  input,
  plan,
  onToken,
  onProgress,
  onFallback,
}: {
  input: OnboardingInput;
  plan: GenerationPlan;
  onToken: (content: string) => void;
  onProgress: () => void;
  onFallback: (message: string) => void;
}): Promise<NormalizedSite> {
  try {
    const abort = new AbortController();
    // Leave headroom under Vercel maxDuration=60 for normalize + fast persist.
    const timeout = setTimeout(() => abort.abort(), 42_000);
    try {
      const response = await openrouterChatStream(
        [
          { role: "system", content: plan.systemPrompt },
          { role: "user", content: plan.userPrompt },
        ],
        { temperature: 0.4, signal: abort.signal },
      );
      onProgress();

      let fullResponse = "";
      let charsSinceProgress = 0;
      for await (const delta of parseChatStream(response.body!)) {
        fullResponse += delta;
        onToken(delta);
        charsSinceProgress += delta.length;
        if (charsSinceProgress > 400) {
          charsSinceProgress = 0;
          onProgress();
        }
      }
      if (!fullResponse.trim()) throw new Error("La IA no devolvió contenido.");
      return normalizeWithCopyQuality(extractJsonFromModelResponse(fullResponse), input);
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    if (!canUseLocalGenerator(error)) throw error;
    onFallback(localGeneratorMessage(error));
    return buildFallbackNormalizedSite(input, plan.sectionPlan);
  }
}

export function normalizeWithCopyQuality(raw: unknown, input: OnboardingInput): NormalizedSite {
  let normalized = normalizeSiteBlueprint(raw);
  if (!auditBlueprintCopy(normalized.blueprint).passed) {
    normalized = normalizeSiteBlueprint(enforceBlueprintCopyQuality(normalized.blueprint, input));
  }
  return normalized;
}

export function buildFallbackNormalizedSite(input: OnboardingInput, sectionPlan: SectionType[]): NormalizedSite {
  const fallback = buildFallbackSiteBlueprint(input, sectionPlan);
  return normalizeSiteBlueprint(
    auditBlueprintCopy(fallback).passed ? fallback : enforceBlueprintCopyQuality(fallback, input),
  );
}

export function canUseLocalGenerator(error: unknown): boolean {
  if (error instanceof OpenRouterError || error instanceof ZodError) return true;
  if (!(error instanceof Error)) return false;
  const message = error.message.toLowerCase();
  return ["ia", "json", "pagina", "página", "seccion", "sección", "blueprint", "abort"]
    .some((fragment) => message.includes(fragment));
}

export function localGeneratorMessage(error: unknown): string {
  if (error instanceof OpenRouterError && error.status === 429) {
    return "Los modelos de IA están ocupados; generando el sitio con el motor local...";
  }
  if (error instanceof OpenRouterError) {
    return "La IA no respondió; generando el sitio con el motor local...";
  }
  if (error instanceof Error && error.message.toLowerCase().includes("abort")) {
    return "La IA tardó demasiado; generando el sitio con el motor local...";
  }
  return "La respuesta de IA no fue usable; generando el sitio con el motor local...";
}

export function humanizeGenerationError(error: unknown): string {
  if (error instanceof OpenRouterError) return error.message;
  if (error instanceof ZodError) return "La estructura generada por la IA no es válida. Intenta nuevamente.";
  if (error instanceof Error) {
    if (error.message.includes("JSON")) return error.message;
    const message = error.message.toLowerCase();
    if (message.includes("abort") || message.includes("timeout")) {
      return "La generación agotó el tiempo. Intenta de nuevo.";
    }
    if (message.includes("connect") || message.includes("database")) {
      return "No se pudo guardar el sitio en la base de datos. Verifica la conexión.";
    }
    return error.message;
  }
  return "Ocurrió un error inesperado al generar el sitio.";
}

function buildGuidedDesignRequest(input: OnboardingInput): string {
  return [
    `Sitio web para ${input.businessName}`,
    `negocio de ${resolveBusinessTypeLabel(input)}`,
    `ubicado en ${input.location}`,
    `dirigido a ${input.targetCustomer}`,
    `con estos servicios: ${input.services}`,
  ].join(", ");
}
