/**
 * Extracts a single JSON object from a raw model response.
 *
 * Handles common cases:
 *  - JSON wrapped in ```json ... ``` or ``` ... ``` fences
 *  - JSON with arbitrary text before/after it
 *  - JSON that is already clean
 *
 * Throws a clear error if no valid JSON object can be found/parsed.
 */
export function extractJsonFromModelResponse(text: string): unknown {
  if (!text || !text.trim()) {
    throw new Error("La respuesta de la IA está vacía.");
  }

  let cleaned = text.trim();

  // 1. Remove markdown code fences (```json ... ``` or ``` ... ```).
  const fenceMatch = cleaned.match(/```(?:json)?\s*([\s\S]*?)```/i);
  if (fenceMatch && fenceMatch[1]) {
    cleaned = fenceMatch[1].trim();
  }

  // 2. Fast path: maybe it's already valid JSON.
  const directParse = tryParse(cleaned);
  if (directParse.ok) return directParse.value;

  // 3. Find the first balanced JSON object by scanning braces.
  const candidate = extractFirstJsonObject(cleaned);
  if (candidate) {
    const parsed = tryParse(candidate);
    if (parsed.ok) return parsed.value;
  }

  throw new Error(
    "No se pudo extraer un JSON válido de la respuesta de la IA."
  );
}

function tryParse(
  input: string
): { ok: true; value: unknown } | { ok: false } {
  try {
    return { ok: true, value: JSON.parse(input) };
  } catch {
    return { ok: false };
  }
}

/**
 * Scans the text and returns the first balanced { ... } block,
 * respecting strings and escapes so braces inside strings don't break it.
 */
function extractFirstJsonObject(text: string): string | null {
  const start = text.indexOf("{");
  if (start === -1) return null;

  let depth = 0;
  let inString = false;
  let escaped = false;

  for (let i = start; i < text.length; i++) {
    const char = text[i];

    if (inString) {
      if (escaped) {
        escaped = false;
      } else if (char === "\\") {
        escaped = true;
      } else if (char === '"') {
        inString = false;
      }
      continue;
    }

    if (char === '"') {
      inString = true;
    } else if (char === "{") {
      depth++;
    } else if (char === "}") {
      depth--;
      if (depth === 0) {
        return text.slice(start, i + 1);
      }
    }
  }

  return null;
}
