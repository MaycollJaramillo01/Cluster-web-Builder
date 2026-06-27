import { NextRequest } from "next/server";
import { ZodError } from "zod";

import { prisma } from "@/lib/db";
import {
  openRouterChatStream,
  parseOpenRouterStream,
  OpenRouterError,
} from "@/lib/openrouter";
import { nvidiaChatStream, NvidiaError } from "@/lib/nvidia";
import { buildSiteGenerationPrompt } from "@/lib/prompts/site-generator";
import { extractJsonFromModelResponse } from "@/lib/json/extract-json";
import { buildFallbackSiteBlueprint } from "@/lib/site/fallback-site-blueprint";
import { normalizeSiteBlueprint } from "@/lib/site/normalize-site-blueprint";
import { applyPageStructure } from "@/lib/site/structure";
import { resolvePalette } from "@/lib/site/design";
import {
  buildLandingDesignBrief,
  getLandingSectionPlan,
  LANDING_DESIGN_STYLES,
  mapLandingStyleToPaletteId,
  mapLandingStyleToVisualStyle,
  selectRandomLandingStyle,
  type LandingDesignStyle,
} from "@/lib/site/landing-design-brief";
import {
  onboardingSchema,
  promptToOnboardingInput,
  resolveBusinessTypeLabel,
  sitePromptSchema,
  type OnboardingInput,
} from "@/lib/validators/site-onboarding";

// Prisma + streaming require the Node.js runtime (not Edge).
export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

/** Serializes a named SSE event with a JSON data payload. */
function sse(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

export async function POST(req: NextRequest) {
  // The database is the only hard requirement. OpenRouter can fail or be
  // missing and the local generator will still create a complete site.
  if (!process.env.DATABASE_URL) {
    return jsonError("Falta DATABASE_URL en el servidor.", 500);
  }

  // Parse + validate onboarding input.
  let input: OnboardingInput;
  let originalRequest: string | undefined;
  try {
    const body = await req.json();
    if (typeof body === "object" && body !== null && "prompt" in body) {
      const request = sitePromptSchema.parse(body);
      originalRequest = request.prompt;
      input = promptToOnboardingInput(request.prompt);
    } else {
      input = onboardingSchema.parse(body);
    }
  } catch (err) {
    if (err instanceof ZodError) {
      const first = err.errors[0];
      return jsonError(
        `Solicitud invalida: ${
          first?.message ?? "revisa los campos."
        }`,
        400
      );
    }
    return jsonError("No se pudo leer la solicitud.", 400);
  }

  // Both entry points must use the same 25-recipe design engine. Previously,
  // only free-prompt requests reached this branch; guided requests kept one of
  // seven legacy presets and therefore looked nearly identical.
  let recentStyles: string[] = [];
  try {
    const recentSites = await prisma.site.findMany({
      where: { visualStyle: { in: [...LANDING_DESIGN_STYLES] } },
      orderBy: { createdAt: "desc" },
      take: LANDING_DESIGN_STYLES.length - 1,
      select: { visualStyle: true },
    });
    recentStyles = recentSites.flatMap((site) =>
      site.visualStyle ? [site.visualStyle] : []
    );
  } catch {
    // Persistence errors are reported later; style selection can still proceed.
  }

  const selectedDesignStyle: LandingDesignStyle = selectRandomLandingStyle(recentStyles);
  const designBrief = buildLandingDesignBrief(
    selectedDesignStyle,
    originalRequest ?? buildGuidedDesignRequest(input)
  );
  const sectionPlan = getLandingSectionPlan(selectedDesignStyle);
  input = {
    ...input,
    structureType: "one_page",
    visualStyle: mapLandingStyleToVisualStyle(selectedDesignStyle),
  };

  const { system, user } = buildSiteGenerationPrompt(
    input,
    originalRequest,
    designBrief,
    sectionPlan
  );

  const stream = new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => {
        controller.enqueue(sse(event, data));
      };

      const statusStages = [
        "Analizando negocio...",
        "Definiendo estructura del sitio...",
        `Explorando estilo ${selectedDesignStyle}...`,
        "Generando copy comercial...",
        "Preparando SEO local...",
        "Construyendo secciones...",
      ];
      let stageIndex = 0;
      const advanceStage = () => {
        if (stageIndex < statusStages.length) {
          send("status", { message: statusStages[stageIndex++] });
        }
      };

      try {
        advanceStage();

        let normalizedSite: ReturnType<typeof normalizeSiteBlueprint>;

        try {
          // NVIDIA NIM is the primary provider when configured.
          // Falls back to OpenRouter, then to the local generator.
          let aiResponse: Response;
          try {
            aiResponse = await nvidiaChatStream(
              [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              { temperature: 0.4 }
            );
          } catch (nvidiaErr) {
            if (!(nvidiaErr instanceof NvidiaError)) throw nvidiaErr;
            // NVIDIA unavailable or not configured — try OpenRouter.
            aiResponse = await openRouterChatStream(
              [
                { role: "system", content: system },
                { role: "user", content: user },
              ],
              { temperature: 0.4 }
            );
          }

          advanceStage();

          let full = "";
          let charsSinceStage = 0;
          for await (const delta of parseOpenRouterStream(aiResponse.body!)) {
            full += delta;
            send("token", { content: delta });

            // Advance status messages progressively as real content arrives.
            charsSinceStage += delta.length;
            if (charsSinceStage > 400) {
              charsSinceStage = 0;
              advanceStage();
            }
          }

          if (!full.trim()) {
            throw new Error("La IA no devolvio contenido.");
          }

          const rawJson = extractJsonFromModelResponse(full);
          normalizedSite = normalizeSiteBlueprint(rawJson);
        } catch (err) {
          if (!canUseLocalGenerator(err)) throw err;
          send("status", { message: localGeneratorMessage(err) });
          normalizedSite = normalizeSiteBlueprint(
            buildFallbackSiteBlueprint(input, sectionPlan)
          );
        }

        // Flush remaining status stages before persisting.
        while (stageIndex < statusStages.length) advanceStage();
        send("status", { message: "Guardando proyecto..." });

        const { blueprint, sections: aiSections } = normalizedSite;

        // Keep the generated order on one-page sites; only legacy multipage
        // requests use predefined page distribution.
        const { sections, navPages } = applyPageStructure(
          aiSections,
          input.structureType,
          { businessName: input.businessName }
        );

        // Colors come from curated palettes (not the LLM, which often returns
        // the same colors). Varies by style and business name.
        const theme = resolvePalette(
          input.palette,
          mapLandingStyleToPaletteId(selectedDesignStyle),
          input.businessName
        );
        blueprint.site.visualStyle = {
          ...(blueprint.site.visualStyle ?? {}),
          name: selectedDesignStyle,
          designNotes:
            designBrief ?? blueprint.site.visualStyle?.designNotes ?? "",
          colors: { ...theme },
        };

        // Persist Site + SiteSections.
        const site = await prisma.site.create({
          data: {
            businessName: input.businessName,
            businessType: resolveBusinessTypeLabel(input),
            goal: input.goal,
            visualStyle: selectedDesignStyle,
            structureType: input.structureType,
            location: input.location === "Zona por definir" ? null : input.location || null,
            phone: input.phone || null,
            email: input.email || null,
            domain: input.domain || null,
            language: input.language,
            status: "GENERATED",
            primaryColor: theme.primary,
            secondaryColor: theme.secondary,
            accentColor: theme.accent,
            blueprintJson: blueprint as object,
            navPages: navPages as object,
            sections: {
              create: sections.map((section) => ({
                type: section.type,
                pageSlug: section.pageSlug,
                title: section.title,
                order: section.order,
                isVisible: section.isVisible,
                content: section.content as object,
                settingsJson: section.settings as object,
              })),
            },
          },
        });

        send("status", { message: "Preparando vista previa..." });
        send("saved", { siteId: site.id });
        send("done", { ok: true });
        controller.close();
      } catch (err) {
        send("error", { message: humanizeError(err) });
        send("done", { ok: false });
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
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

function canUseLocalGenerator(err: unknown): boolean {
  if (err instanceof OpenRouterError) return true;
  if (err instanceof NvidiaError) return true;
  if (err instanceof ZodError) return true;
  if (err instanceof Error) {
    const message = err.message.toLowerCase();
    return (
      message.includes("ia") ||
      message.includes("json") ||
      message.includes("pagina") ||
      message.includes("seccion") ||
      message.includes("blueprint")
    );
  }
  return false;
}

function localGeneratorMessage(err: unknown): string {
  if (err instanceof NvidiaError && err.status === 429) {
    return "NVIDIA NIM está ocupado; generando el sitio con el motor local...";
  }
  if (err instanceof NvidiaError) {
    return "NVIDIA NIM no respondió; generando el sitio con el motor local...";
  }
  if (err instanceof OpenRouterError && err.status === 429) {
    return "OpenRouter esta ocupado; generando el sitio con el motor local...";
  }
  if (err instanceof OpenRouterError) {
    return "OpenRouter no respondio; generando el sitio con el motor local...";
  }
  return "La respuesta de IA no fue usable; generando el sitio con el motor local...";
}

/** Converts internal errors into user-friendly Spanish messages (no stack traces). */
function humanizeError(err: unknown): string {
  if (err instanceof NvidiaError) return err.message;
  if (err instanceof OpenRouterError) return err.message;
  if (err instanceof ZodError) {
    return "La estructura generada por la IA no es valida. Intenta nuevamente.";
  }
  if (err instanceof Error) {
    if (err.message.includes("JSON")) return err.message;
    if (
      err.message.toLowerCase().includes("connect") ||
      err.message.toLowerCase().includes("database")
    ) {
      return "No se pudo guardar el sitio en la base de datos. Verifica la conexion.";
    }
    return err.message;
  }
  return "Ocurrio un error inesperado al generar el sitio.";
}
