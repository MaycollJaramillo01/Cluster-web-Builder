import { ZodError } from "zod";

import { extractJsonFromModelResponse } from "@/lib/json/extract-json";
import { OpenRouterError, openrouterChatStream, parseChatStream } from "@/lib/openrouter";
import { buildSiteGenerationPrompt } from "@/lib/prompts/site-generator";
import type { SectionType } from "@/lib/site/blueprint";
import { auditBlueprintCopy, enforceBlueprintCopyQuality } from "@/lib/site/copy-quality";
import { getDesignLanguagePack, selectDesignLanguage } from "@/lib/site/design-languages";
import { buildFallbackSiteBlueprint } from "@/lib/site/fallback-site-blueprint";
import { normalizeSiteBlueprint, type NormalizedSite } from "@/lib/site/normalize-site-blueprint";
import {
  expandSiteRecipe,
  rankSiteRecipes,
  selectSiteRecipe,
  SITE_RECIPES,
  type SiteRecipe,
  type SiteRecipeId,
} from "@/lib/site/site-recipes";
import type { DesignLanguageId } from "@/lib/site/design-language-types";
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
  blueprintId: GenerationBlueprintId;
  recipeReasons: string[];
  designLanguage: DesignLanguageId;
  designLanguageReasons: string[];
  selectedDesignStyle: string;
  designBrief: string;
  sectionPlan: SectionType[];
  paletteId: string;
  systemPrompt: string;
  userPrompt: string;
};

export type GenerationBlueprintId = SiteRecipeId;
export type GenerationBlueprint = SiteRecipe;
export const GENERATION_BLUEPRINTS = SITE_RECIPES;

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
  const recipeRanking = rankSiteRecipes(input);
  const recipeSelection = recipeRanking[0];
  const blueprint = recipeSelection.recipe;
  const languageSelection = selectDesignLanguage({
    visualStyle: input.visualStyle,
    businessType: resolveBusinessTypeLabel(input),
    goal: input.goal,
    aboutLength: input.proofPoints?.length ?? 0,
    mediaCount: Number(Boolean(input.assets?.logoDataUrl)) + Number(Boolean(input.assets?.coverDataUrl)),
    languageAffinity: blueprint.languageAffinity,
  });
  const designBrief = buildVisualDirection(input, designRequest, blueprint, languageSelection.id, languageSelection.reasons);
  const sectionPlan = expandBlueprint(blueprint, input);
  const prompt = buildSiteGenerationPrompt(
    input,
    originalRequest,
    designBrief,
    sectionPlan,
    "Claro, específico y orientado a convertir visitas en contactos, sin frases genéricas.",
  );

  return {
    blueprintId: blueprint.id,
    recipeReasons: recipeSelection.reasons,
    designLanguage: languageSelection.id,
    designLanguageReasons: languageSelection.reasons,
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

function buildVisualDirection(
  input: OnboardingInput,
  request: string,
  blueprint: GenerationBlueprint,
  designLanguage: DesignLanguageId,
  languageReasons: readonly string[],
): string {
  const language = getDesignLanguagePack(designLanguage);
  return [
    `Dirección visual solicitada: ${input.visualStyle.replaceAll("_", " ")}.`,
    `Contexto: ${request}.`,
    `Receta funcional ${blueprint.name}: ${blueprint.description}`,
    `Lenguaje visual ${language.name}${languageReasons.length ? `: ${languageReasons.join(", ")}` : ""}.`,
    "La paleta y los datos del cliente permanecen en variables independientes del lenguaje visual.",
    "Compón una interfaz original con bloques editables y variantes compatibles. No generes HTML ni estilos fuera del contrato.",
  ].join(" ");
}

export function selectGenerationBlueprint(input: OnboardingInput): GenerationBlueprint {
  return selectSiteRecipe(input).recipe;
}

function expandBlueprint(blueprint: GenerationBlueprint, input: OnboardingInput): SectionType[] {
  return expandSiteRecipe(blueprint, input);
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
