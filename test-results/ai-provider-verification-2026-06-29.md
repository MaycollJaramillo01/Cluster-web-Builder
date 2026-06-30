# AI Provider Verification — 2026-06-29

## Contexto

Se detectó que el generador guiado usaba siempre el motor local (fallback) en lugar de
la IA real. Se diagnosticó la causa raíz y se verificó el fix.

---

## Diagnóstico inicial

| Problema | Detalle |
|---|---|
| Modelo configurado | `z-ai/glm-5.1` |
| Error devuelto | `503 "ResourceExhausted: All workers are busy"` |
| Timeout | 12 segundos (demasiado corto para generación de 4096 tokens) |
| Comportamiento | Toda generación caía silenciosamente al motor local |
| `.env` duplicado | `NVIDIA_API_KEY` y `NVIDIA_MODEL` aparecían dos veces; dotenv tomaba la última |

## Modelos NVIDIA NIM probados

| Modelo | Resultado |
|---|---|
| `z-ai/glm-5.1` | 503 All workers busy |
| `meta/llama-3.3-70b-instruct` | Timeout (>45s) |
| `meta/llama-3.1-8b-instruct` | ✅ 200 OK — primer token en 465ms |
| `mistralai/mistral-7b-instruct-v0.3` | 404 Not Found |
| `nvidia/llama-3.1-nemotron-70b-instruct` | 404 Not Found |
| `qwen/qwen2.5-72b-instruct` | 404 Not Found |

## Fixes aplicados (NVIDIA)

- `NVIDIA_MODEL` → `meta/llama-3.1-8b-instruct`
- Timeout → `45_000` ms (de 12s a 45s)
- Ambas entradas de `.env` actualizadas para consistencia

---

## Verificación NVIDIA NIM — Resultados

### Test 1: Taller Mecánico Lopez, Bogotá
- **Motor:** NVIDIA NIM ✅
- **Tokens SSE:** 1008
- **Tiempo total:** 10.5s
- **Secciones generadas:** 9 (hero, about_us, benefits, services, process, faq, cta, contact, footer)
- **Style elegido:** Metrics
- **Hero title:** "Taller Mecanico Lopez en Bogota"
- **Hero CTA:** "Contactanos"
- **SiteID:** cmr07v62i0001kuekqeev9ovg

### Test 2: Salon Valentina, Medellín
- **Motor:** NVIDIA NIM ✅
- **Tokens SSE:** 460
- **Tiempo total:** 4.3s
- **Secciones generadas:** 2 (hero + footer) ⚠️
- **Style elegido:** Immersive
- **SiteID:** cmr07vnt3000ckuek36s7z52t

### Test 3: Restaurante El Rincon Paisa
- **Motor:** No llegó a NVIDIA
- **Resultado:** HTTP 429 — rate limit de la app (3 generaciones/hora para guests)

---

## Findings

1. ⚠️ **Modelo 8b no sigue `sectionPlan` completo** en prompts cortos/simples.
   El Salon generó solo 2 secciones en lugar de 8 (Immersive sectionPlan).
   Causa probable: `meta/llama-3.1-8b-instruct` es demasiado pequeño para instrucciones
   complejas de múltiples secciones.

2. ⚠️ **Business name parsing con comas**: El parser `promptToOnboardingInput` corta
   en la primera coma, incluyendo parte del nombre del servicio en el business name.
   "Salon de belleza Valentina en Medellin. Cortes, tintes..." → businessName incluye "Cortes".

3. ⚠️ **Fallback no probado**: el rate limit bloqueó el 3er test antes de llegar a NVIDIA.
   Para probar el fallback se necesita cuenta autenticada o esperar el reset de rate limit.

---

## Próximo paso: OpenRouter

Los modelos gratuitos de OpenRouter también estaban rate-limited (429) durante la verificación.
Se implementará cliente OpenRouter con cadena de fallback entre modelos.

| Variable | Valor |
|---|---|
| `OPENROUTER_API_KEY` | configurada en `.env` |
| `OPENROUTER_MODEL` | `qwen/qwen3-coder:free` |
| `OPENROUTER_FALLBACK_MODELS` | `openai/gpt-oss-120b:free,qwen/qwen3-next-80b-a3b-instruct:free,meta-llama/llama-3.3-70b-instruct:free` |
