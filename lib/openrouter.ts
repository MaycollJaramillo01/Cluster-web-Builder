/**
 * OpenRouter API client.
 * Uses the OpenAI-compatible chat completions endpoint.
 * Configure via OPENROUTER_API_KEY, OPENROUTER_MODEL, and OPENROUTER_FALLBACK_MODELS.
 */

const OPENROUTER_API_URL = "https://openrouter.ai/api/v1/chat/completions";
const DEFAULT_MODEL = "openrouter/free";

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

function getModels(): string[] {
  const primary = process.env.OPENROUTER_MODEL || DEFAULT_MODEL;
  const fallbackEnv = process.env.OPENROUTER_FALLBACK_MODELS || "";
  const fallbacks = fallbackEnv
    .split(",")
    .map((m) => m.trim())
    .filter(Boolean);
  return [primary, ...fallbacks];
}

/**
 * Opens a streaming chat completion against OpenRouter.
 * Tries the primary model first, then each fallback on 429.
 * Returns the raw Response; caller consumes `response.body` as a stream.
 */
export async function openrouterChatStream(
  messages: ChatMessage[],
  options?: { temperature?: number; signal?: AbortSignal }
): Promise<Response> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    throw new OpenRouterError("Falta OPENROUTER_API_KEY en el entorno del servidor.");
  }

  const models = getModels();
  let lastError: OpenRouterError | null = null;

  for (const model of models) {
    let response: Response;
    try {
      response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://cluster-web-builder.vercel.app",
          "X-Title": "Cluster Web Builder",
        },
        body: JSON.stringify({
          model,
          stream: true,
          temperature: options?.temperature ?? 0.4,
          max_tokens: 4096,
          messages,
        }),
        signal: options?.signal,
      });
    } catch (err) {
      lastError = new OpenRouterError(
        `No se pudo conectar con OpenRouter: ${err instanceof Error ? err.message : "error de red"}`
      );
      break;
    }

    if (response.ok) {
      if (!response.body) {
        throw new OpenRouterError("OpenRouter respondió sin cuerpo (sin stream).");
      }
      return response;
    }

    const detail = await safeReadText(response);

    if (response.status === 429) {
      lastError = new OpenRouterError(
        `OpenRouter: modelo ${model} con rate limit. Intentando siguiente...`,
        429
      );
      // Try next model in the list
      continue;
    }

    lastError = new OpenRouterError(
      `OpenRouter respondió con error ${response.status} para ${model}: ${detail}`,
      response.status
    );
    break;
  }

  throw lastError ?? new OpenRouterError("No se pudo obtener respuesta de OpenRouter.");
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return "(sin detalle)";
  }
}

export async function openrouterChatComplete(
  messages: ChatMessage[],
  options?: { temperature?: number; maxTokens?: number }
): Promise<string> {
  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) throw new OpenRouterError("Falta OPENROUTER_API_KEY en el entorno del servidor.");

  const models = getModels();
  let lastError: OpenRouterError | null = null;

  for (const model of models) {
    let response: Response;
    try {
      response = await fetch(OPENROUTER_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
          "HTTP-Referer": process.env.NEXT_PUBLIC_APP_URL || "https://cluster-web-builder.vercel.app",
          "X-Title": "Cluster Web Builder",
        },
        body: JSON.stringify({
          model,
          stream: false,
          temperature: options?.temperature ?? 0.3,
          max_tokens: options?.maxTokens ?? 256,
          messages,
        }),
      });
    } catch (err) {
      lastError = new OpenRouterError(
        `No se pudo conectar con OpenRouter: ${err instanceof Error ? err.message : "error de red"}`
      );
      break;
    }

    if (response.ok) {
      const json = await response.json();
      const content = json?.choices?.[0]?.message?.content;
      if (typeof content === "string") return content;
      throw new OpenRouterError("OpenRouter respondió sin contenido.");
    }

    const detail = await safeReadText(response);
    if (response.status === 429) {
      lastError = new OpenRouterError(`OpenRouter: modelo ${model} con rate limit.`, 429);
      continue;
    }
    lastError = new OpenRouterError(
      `OpenRouter respondió con error ${response.status}: ${detail}`,
      response.status
    );
    break;
  }

  throw lastError ?? new OpenRouterError("No se pudo obtener respuesta de OpenRouter.");
}

export async function* parseChatStream(
  body: ReadableStream<Uint8Array>
): AsyncGenerator<string, void, unknown> {
  const reader = body.getReader();
  const decoder = new TextDecoder();
  let buffer = "";

  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) return;
      buffer += decoder.decode(value, { stream: true });

      let newlineIndex: number;
      while ((newlineIndex = buffer.indexOf("\n")) !== -1) {
        const line = buffer.slice(0, newlineIndex).trim();
        buffer = buffer.slice(newlineIndex + 1);
        if (!line.startsWith("data:")) continue;
        const data = line.slice(5).trim();
        if (data === "[DONE]") return;
        try {
          const json = JSON.parse(data);
          const delta = json?.choices?.[0]?.delta?.content;
          if (typeof delta === "string") yield delta;
        } catch {
          // Ignore malformed keep-alive events.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
