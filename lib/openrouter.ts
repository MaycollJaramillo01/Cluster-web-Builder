/**
 * Minimal OpenRouter client with real streaming (SSE) support.
 * Never import this from client components — it reads OPENROUTER_API_KEY.
 */

const OPENROUTER_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "qwen/qwen3-coder:free";

export class OpenRouterError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "OpenRouterError";
    this.status = status;
  }
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Opens a streaming chat completion against OpenRouter.
 * Returns the raw Response; caller consumes `response.body` as a stream.
 */
export async function openRouterChatStream(
  messages: ChatMessage[],
  options?: { temperature?: number; signal?: AbortSignal }
): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError(
      "Falta OPENROUTER_API_KEY en el entorno del servidor."
    );
  }

  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const models = resolveModels();

  // Try each model in order. Within a model, retry on 429 with backoff.
  // Any other per-model failure (e.g. a 404 for an unavailable slug) advances
  // to the next model rather than aborting the whole generation.
  const MAX_RETRIES_PER_MODEL = 2;
  let lastError: OpenRouterError | null = null;
  let sawRateLimit = false;

  for (const model of models) {
    let nextModel = false;

    for (let attempt = 0; attempt <= MAX_RETRIES_PER_MODEL; attempt++) {
      let response: Response;
      try {
        response = await fetch(OPENROUTER_URL, {
          method: "POST",
          headers: {
            Authorization: `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": appUrl,
            "X-Title": "AI Hosting Website Builder",
          },
          body: JSON.stringify({
            model,
            stream: true,
            temperature: options?.temperature ?? 0.4,
            messages,
          }),
          signal: options?.signal,
        });
      } catch (err) {
        lastError = new OpenRouterError(
          `No se pudo conectar con OpenRouter: ${
            err instanceof Error ? err.message : "error de red"
          }`
        );
        nextModel = true;
        break;
      }

      if (response.ok) {
        if (!response.body) {
          throw new OpenRouterError(
            "OpenRouter respondió sin cuerpo (sin stream)."
          );
        }
        return response;
      }

      const detail = await safeReadText(response);

      // 429: back off and retry the same model, then fall through to next model.
      if (response.status === 429) {
        sawRateLimit = true;
        lastError = new OpenRouterError(
          "OpenRouter está limitando las solicitudes (rate limit). Intenta de nuevo en unos segundos.",
          429
        );
        if (attempt < MAX_RETRIES_PER_MODEL) {
          await sleep(1500 * (attempt + 1)); // 1.5s, 3s
          continue;
        }
        nextModel = true;
        break;
      }

      // Other errors (404 unavailable model, 400, 5xx): try the next model.
      lastError = new OpenRouterError(
        `OpenRouter respondió con error ${response.status}: ${detail}`,
        response.status
      );
      nextModel = true;
      break;
    }

    if (nextModel) continue;
  }

  // Every model failed. Prefer the rate-limit message when that was the cause.
  if (sawRateLimit) {
    throw new OpenRouterError(
      "OpenRouter está limitando las solicitudes (rate limit). Intenta de nuevo en unos segundos.",
      429
    );
  }
  throw (
    lastError ??
    new OpenRouterError("No se pudo obtener respuesta de OpenRouter.")
  );
}

/**
 * Builds the ordered list of models to try: the configured primary model first,
 * then any comma-separated fallbacks from OPENROUTER_FALLBACK_MODELS, then a
 * built-in free fallback. Duplicates are removed while preserving order.
 */
function resolveModels(): string[] {
  const primary = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const fallbacks = (process.env.OPENROUTER_FALLBACK_MODELS || "")
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);

  const builtInFallback = "meta-llama/llama-3.3-70b-instruct:free";
  const ordered = [primary, ...fallbacks, builtInFallback];
  return Array.from(new Set(ordered));
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Parses an OpenRouter SSE stream and yields incremental content deltas.
 * Handles `data: {...}` lines and ignores `data: [DONE]`.
 */
export async function* parseOpenRouterStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });

      // SSE events are separated by newlines; process complete lines.
      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const rawLine = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);

        if (!rawLine || !rawLine.startsWith("data:")) continue;

        const data = rawLine.slice(5).trim();
        if (data === "[DONE]") return;

        try {
          const json = JSON.parse(data);
          const delta: string | undefined =
            json?.choices?.[0]?.delta?.content ??
            json?.choices?.[0]?.message?.content;
          if (delta) yield delta;
        } catch {
          // Ignore malformed/keep-alive lines; keep streaming.
        }
      }
    }
  } catch (err) {
    throw new OpenRouterError(
      `Error leyendo el stream de OpenRouter: ${
        err instanceof Error ? err.message : "desconocido"
      }`
    );
  } finally {
    reader.releaseLock();
  }
}

async function safeReadText(response: Response): Promise<string> {
  try {
    const text = await response.text();
    return text.slice(0, 300);
  } catch {
    return "(sin detalle)";
  }
}
