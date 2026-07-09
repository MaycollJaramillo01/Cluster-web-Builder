# Post-deploy capacity check — 2026-07-09

## Producción

Base URL: `https://cluster-web-builder.vercel.app`

## Healthcheck

`GET /api/health`

- Status: `200`
- Body: `{"ok":true,"db":"ok","latencyMs":210}`
- Cache: `MISS`
- Cache-Control: `no-store, max-age=0`

## Cache público

`GET /s/aa-painting-remodeling-high-point`

Después de la primera carga ISR:

- Status: `200`
- `x-vercel-cache`: `HIT`
- `age`: subiendo correctamente
- Latencias repetidas: 104ms–426ms

## Prueba de concurrencia segura

Configuración:

- Concurrencia: 100
- Requests por ruta: 300
- Método: `GET`
- Sin POST destructivos.

| Ruta | OK | Errores | p50 | p90 | p95 | p99 | Máx. | Cache |
|---|---:|---:|---:|---:|---:|---:|---:|---|
| `/` | 300 | 0 | 116ms | 919ms | 938ms | 1002ms | 1303ms | HIT |
| `/s/aa-painting-remodeling-high-point` | 300 | 0 | 125ms | 177ms | 184ms | 238ms | 307ms | HIT |

## Conclusión

El deploy contiene P0:

- `/api/health` existe.
- `/api/public/sites/[slug]/view` responde `204`.
- `/s/[slug]` ya sirve desde cache después del primer request.
- La prueba de concurrencia 100 no produjo errores.

Para campaña de Meta Ads, el riesgo principal de saturar DB por visitas públicas bajó considerablemente.

