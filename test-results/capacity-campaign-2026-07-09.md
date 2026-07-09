# Capacity check para campaña de Meta Ads — 2026-07-09

Objetivo: estimar riesgo antes de invertir USD 3,000 en tráfico hacia Cluster.

## Entorno probado

- Producción: `https://cluster-web-builder.vercel.app`
- Home: `/`
- Sitio publicado: `/s/aa-painting-remodeling-high-point`
- Prueba segura con `fetch` desde Node.js, sin POST destructivos y sin atacar el sitio.

## Resultados

| Ruta | Concurrencia | Requests | OK | Errores | p50 | p90 | p95 | p99 | Máx. | Cache |
|---|---:|---:|---:|---:|---:|---:|---:|---:|---:|---|
| `/` | 25 | 100 | 100 | 0 | 104ms | 236ms | 284ms | - | 429ms | HIT |
| `/s/aa-painting-remodeling-high-point` | 25 | 100 | 100 | 0 | 161ms | 464ms | 573ms | - | 1703ms | MISS |
| `/` | 50 | 200 | 200 | 0 | 109ms | 347ms | 361ms | 459ms | 504ms | HIT |
| `/s/aa-painting-remodeling-high-point` | 50 | 200 | 200 | 0 | 160ms | 269ms | 497ms | 1578ms | 1583ms | MISS |

## Lectura técnica

- El home está cacheado por Vercel y responde muy bien.
- Los sitios publicados responden bien bajo presión moderada, pero cada request sale como `MISS`.
- En código, `app/s/[slug]/page.tsx` usa `dynamic = "force-dynamic"` y ejecuta `trackSiteView(site.id)` por visita.
- Eso significa que el cuello de botella real para campaña no es el frontend, sino servidor + Prisma/Postgres + contador de vistas.

## Conclusión conservadora

- Tráfico público moderado: apto.
- Campaña de USD 3,000: viable si el tráfico se reparte en varios días.
- Riesgo: picos fuertes hacia sitios publicados pueden cargar la base de datos porque no están sirviendo desde cache.

## Recomendación antes de escalar

1. Cachear HTML público de `/s/[slug]` o mover el conteo de vistas fuera del render principal.
2. Mantener formularios como endpoint dinámico separado.
3. Añadir rate limit a generación IA y leads.
4. Repetir prueba con 100, 250 y 500 concurrentes después del cache.

