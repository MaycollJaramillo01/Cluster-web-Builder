import { NextRequest, NextResponse } from "next/server";
import { ZodError } from "zod";

import {
  createGuestAccess,
  GUEST_COOKIE,
  GUEST_MS,
  guestCookie,
  hashGuestToken,
  getUserBySessionToken,
  SESSION_COOKIE,
} from "@/lib/auth";
import { consumeRateLimit } from "@/lib/rate-limit";
import {
  buildGenerationPlan,
  generateNormalizedSite,
  generationStatusStages,
  humanizeGenerationError,
  parseGenerationInput,
} from "@/lib/site/generation-pipeline";
import { persistGeneratedSite } from "@/lib/site/persist-generated-site";

export const runtime = "nodejs";
export const maxDuration = 60;
export const dynamic = "force-dynamic";

const encoder = new TextEncoder();

export async function POST(request: NextRequest) {
  if (!process.env.DATABASE_URL) return jsonError("Falta DATABASE_URL en el servidor.", 500);

  const authUser = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  const existingGuestToken = request.cookies.get(GUEST_COOKIE)?.value;
  const existingGuestHash = hashGuestToken(existingGuestToken);
  const guestAccess = authUser
    ? null
    : existingGuestToken && existingGuestHash
      ? { token: existingGuestToken, tokenHash: existingGuestHash, expiresAt: new Date(Date.now() + GUEST_MS) }
      : createGuestAccess();

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
    || request.headers.get("x-real-ip")
    || "local";
  const rateId = authUser?.id ?? ip;
  const generationLimit = authUser?.planStatus === "ACTIVE" ? 100 : authUser ? 10 : 3;
  if (!(await consumeRateLimit("generation", rateId, generationLimit, 60 * 60 * 1000))) {
    return jsonError(`Alcanzaste el límite de ${generationLimit} generaciones por hora.`, 429);
  }

  let generationRequest: ReturnType<typeof parseGenerationInput>;
  try {
    generationRequest = parseGenerationInput(await request.json());
  } catch (error) {
    if (error instanceof ZodError) {
      return jsonError(`Solicitud inválida: ${error.errors[0]?.message ?? "revisa los campos."}`, 400);
    }
    return jsonError("No se pudo leer la solicitud.", 400);
  }

  const { input, originalRequest } = generationRequest;
  const plan = buildGenerationPlan(input, originalRequest);
  const stream = createGenerationStream({
    input,
    plan,
    userId: authUser?.id ?? null,
    guestAccess,
  });

  const response = new NextResponse(stream, {
    headers: {
      "Content-Type": "text/event-stream; charset=utf-8",
      "Cache-Control": "no-cache, no-transform",
      Connection: "keep-alive",
      "X-Accel-Buffering": "no",
    },
  });
  if (guestAccess) response.cookies.set(GUEST_COOKIE, guestAccess.token, guestCookie(guestAccess.expiresAt));
  return response;
}

function createGenerationStream({ input, plan, userId, guestAccess }: {
  input: ReturnType<typeof parseGenerationInput>["input"];
  plan: ReturnType<typeof buildGenerationPlan>;
  userId: string | null;
  guestAccess: ReturnType<typeof createGuestAccess> | null;
}) {
  return new ReadableStream<Uint8Array>({
    async start(controller) {
      const send = (event: string, data: unknown) => controller.enqueue(sse(event, data));
      const stages = generationStatusStages(plan.selectedDesignStyle);
      let stageIndex = 0;
      const advanceStage = () => {
        if (stageIndex < stages.length) send("status", { message: stages[stageIndex++] });
      };

      try {
        advanceStage();
        const normalizedSite = await generateNormalizedSite({
          input,
          plan,
          onToken: (content) => send("token", { content }),
          onProgress: advanceStage,
          onFallback: (message) => send("status", { message }),
        });

        while (stageIndex < stages.length) advanceStage();
        send("status", { message: "Guardando proyecto..." });
        const site = await persistGeneratedSite({ input, normalizedSite, plan, userId, guestAccess });
        send("status", { message: "Preparando vista previa..." });
        send("saved", { siteId: site.id });
        send("done", { ok: true });
      } catch (error) {
        send("error", { message: humanizeGenerationError(error) });
        send("done", { ok: false });
      } finally {
        controller.close();
      }
    },
  });
}

function sse(event: string, data: unknown): Uint8Array {
  return encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`);
}

function jsonError(message: string, status: number) {
  return new Response(JSON.stringify({ error: message }), {
    status,
    headers: { "Content-Type": "application/json" },
  });
}
