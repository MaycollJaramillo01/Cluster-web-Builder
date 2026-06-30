# OpenRouter Integration — Pruebas 2026-06-30

## Configuración activa

| Variable | Valor |
|---|---|
| `OPENROUTER_MODEL` | `openrouter/free` (auto-routing) |
| `OPENROUTER_FALLBACK_MODELS` | `nvidia/nemotron-3-nano-30b-a3b:free`, `nvidia/nemotron-nano-9b-v2:free`, `google/gemma-4-31b-it:free` |
| Timeout IA | 55s |
| `route.ts` proveedor | `openrouterChatStream` (lib/openrouter.ts) |

## Modelos OpenRouter evaluados (26 modelos gratuitos disponibles)

| Modelo | Resultado |
|---|---|
| `openrouter/free` | ✅ auto-routing, elige el mejor disponible |
| `nvidia/nemotron-3-nano-30b-a3b:free` | ✅ 454ms respuesta, JSON válido |
| `nvidia/nemotron-nano-9b-v2:free` | ✅ 661ms |
| `google/gemma-4-31b-it:free` | ✅ 1060ms (intermitente 429) |
| `poolside/laguna-xs.2:free` | ⚠️ responde pero sin campo `content` |
| `qwen/qwen3-coder:free` | ❌ 429 rate limit |
| `meta-llama/llama-3.3-70b-instruct:free` | ❌ 429 rate limit |
| `openai/gpt-oss-120b:free` | ❌ 429 rate limit |
| Otros modelos "gratis" anteriores | ❌ 404 (ya no son gratuitos) |

## Prueba Ronda 1 (timeout 45s — problema de guardado)

| Negocio | Motor | Tokens | Tiempo | Guardado |
|---|---|---|---|---|
| Taller Mecánico Lopez | OpenRouter ✅ | 1008 | 10.5s | ✅ |
| Salon Valentina | OpenRouter ✅ | 460 | 4.3s | ✅ |
| Restaurante El Rincon | — | — | — | ❌ rate limit app |

## Prueba Ronda 2 (timeout 45s)

| Negocio | Motor | Tokens | Tiempo | Guardado |
|---|---|---|---|---|
| Peluqueria Estilo Libre | OpenRouter ✅ | 4099 | 44.3s | ❌ (JSON cortado por timeout) |
| Clinica Dental Sonrisa | Motor local ⚠️ | 2464 | 47.6s | ✅ |
| Gimnasio FitZona | OpenRouter ✅ | 265 | 43.2s | ✅ (JSON parcial pero válido) |

## Prueba Ronda 3 (timeout 55s — FINAL)

| Negocio | Motor | Tokens | Tiempo | Guardado | SiteID |
|---|---|---|---|---|---|
| Peluqueria Estilo Libre | Motor local ⚠️ | 3553 | 56.1s | ✅ | cmr08pbpg000jkub0vqpzf38t |
| Estudio de Yoga Dharma | **OpenRouter ✅** | 2160 | **34.6s** | ✅ | cmr08q5me000ukub0hrdr3epk |
| Pasteleria La Dulce Vida | Motor local ⚠️ | 159 | 56.4s | ✅ | cmr08rfby0014kub0a691ln6n |

**Total ronda 3: 3/3 sitios guardados exitosamente.**

## Análisis de calidad (Yoga — OpenRouter directo)

El modelo `nemotron-3-nano-30b-a3b` (al que enruta `openrouter/free`) genera:
- ✅ 8 secciones correctas (estructura completa)
- ⚠️ Títulos genéricos ("Introducción", "Servicios", "Datos")
- ⚠️ El business name toma el prompt completo como nombre

## Diagnóstico del comportamiento inconsistente

`openrouter/free` **auto-enruta** al modelo más disponible en el momento:
- Cuando elige `nemotron-nano`: responde en ~35s ✅
- Cuando elige un modelo más lento: supera los 55s y el JSON queda incompleto

El fallback local funciona correctamente en ese caso — el sitio siempre se guarda.

## Estado del sistema

| Componente | Estado |
|---|---|
| `lib/openrouter.ts` | ✅ Creado — cliente con cadena de fallback por modelos |
| `route.ts` proveedor | ✅ Cambiado de NVIDIA a OpenRouter |
| Motor local fallback | ✅ Funciona — todos los sitios se guardan |
| Sitios con IA real | ~33% de los casos (cuando el modelo responde en <55s) |

## Recomendación

Para aumentar la tasa de éxito con IA real (no motor local), cambiar:
```
OPENROUTER_MODEL=nvidia/nemotron-3-nano-30b-a3b:free
```
Este modelo responde en ~500ms al primer token vs los 40s del auto-routing.
