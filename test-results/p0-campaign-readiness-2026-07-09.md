# P0 campaign readiness — 2026-07-09

## Cambios aplicados

- `/s/[slug]` ya no usa `dynamic = "force-dynamic"`.
- `/s/[slug]` ahora usa `dynamic = "force-static"` y `revalidate = 300`.
- `/d/[domain]` ahora usa `dynamic = "force-static"` y `revalidate = 300`.
- El conteo de vistas salió del render principal.
- Nuevo endpoint no bloqueante: `/api/public/sites/[slug]/view`.
- Los formularios públicos de leads devuelven `Cache-Control: no-store`.
- Nuevo healthcheck: `/api/health`.
- `absolutePublicSiteUrl()` ahora puede resolver origen desde variables de Vercel.

## Validación

### Unitarias

Comando:

```bash
npm run test:unit
```

Resultado:

- 67 tests ejecutados.
- 67 tests pasaron.
- 0 fallos.

### Build producción

Comando:

```bash
npm run build
```

Resultado:

- Compilación correcta.
- TypeScript correcto.
- `check:design` correcto.
- Next marca `/s/[slug]` como `○ Static`.
- Next marca `/d/[domain]` como `○ Static`.

## Lectura

El HTML público queda preparado para cache/ISR. Los leads y el tracking quedan separados como endpoints dinámicos. Esto reduce el riesgo de que una campaña cargue la DB en cada render de página.

## Pendiente después de deploy

Repetir la prueba de producción:

- 100 concurrentes.
- 250 concurrentes.
- 500 concurrentes.

Verificar que `x-vercel-cache` pase de `MISS` a `HIT`/`STALE` después de la primera carga.

