/**
 * NVIDIA NIM / NVIDIA Build API client.
 * Uses the OpenAI-compatible chat completions endpoint.
 * Configure via NVIDIA_API_KEY and NVIDIA_MODEL environment variables.
 */

const NVIDIA_API_URL = "https://integrate.api.nvidia.com/v1/chat/completions";

// The model slug as listed in the NVIDIA Build catalog.
// Override with NVIDIA_MODEL in your .env file.
const DEFAULT_MODEL = "z-ai/glm-5.1";

export class NvidiaError extends Error {
  status?: number;
  constructor(message: string, status?: number) {
    super(message);
    this.name = "NvidiaError";
    this.status = status;
  }
}

export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

/**
 * Opens a streaming chat completion against NVIDIA NIM.
 * Returns the raw Response; caller consumes `response.body` as a stream.
 * The SSE format is OpenAI-compatible.
 */
export async function nvidiaChatStream(
  messages: ChatMessage[],
  options?: { temperature?: number; signal?: AbortSignal }
): Promise<Response> {
  const apiKey = process.env.NVIDIA_API_KEY;
  if (!apiKey) {
    throw new NvidiaError("Falta NVIDIA_API_KEY en el entorno del servidor.");
  }

  const model = process.env.NVIDIA_MODEL || DEFAULT_MODEL;

  const MAX_RETRIES = 2;
  let lastError: NvidiaError | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    let response: Response;
    try {
      response = await fetch(NVIDIA_API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiKey}`,
          "Content-Type": "application/json",
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
      lastError = new NvidiaError(
        `No se pudo conectar con NVIDIA NIM: ${
          err instanceof Error ? err.message : "error de red"
        }`
      );
      break;
    }

    if (response.ok) {
      if (!response.body) {
        throw new NvidiaError("NVIDIA NIM respondió sin cuerpo (sin stream).");
      }
      return response;
    }

    const detail = await safeReadText(response);

    if (response.status === 429) {
      lastError = new NvidiaError(
        "NVIDIA NIM está limitando las solicitudes. Intenta de nuevo en unos segundos.",
        429
      );
      if (attempt < MAX_RETRIES) {
        await sleep(1500 * (attempt + 1));
        continue;
      }
      break;
    }

    lastError = new NvidiaError(
      `NVIDIA NIM respondió con error ${response.status}: ${detail}`,
      response.status
    );
    break;
  }

  throw lastError ?? new NvidiaError("No se pudo obtener respuesta de NVIDIA NIM.");
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function safeReadText(response: Response): Promise<string> {
  try {
    return (await response.text()).slice(0, 300);
  } catch {
    return "(sin detalle)";
  }
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
          // Ignore keep-alive or malformed provider events.
        }
      }
    }
  } finally {
    reader.releaseLock();
  }
}
