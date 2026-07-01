# Resultado de M6 — Analytics y Bloque de Precios

Fecha: 2026-07-01

## Estado

M6 implementado y validado en entorno local. La migracion `20260701000001_m6_analytics` fue aplicada a la base de datos. TypeScript sin errores (`tsc --noEmit` limpio).

---

## Cobertura funcional

### Analytics de visitas

- Tabla `SiteView` en Postgres con clave compuesta `(siteId, date)` y borrado en cascada al eliminar el sitio.
- Indice en `siteId` para consultas rapidas.
- Conteo de visitas fire-and-forget en cada request a `/s/[slug]` y `/d/[domain]` via `trackSiteView(siteId)` — no bloquea el render del sitio publico.
- Upsert con `increment` para acumular visitas del mismo dia sin duplicar filas.
- Dashboard en `/builder/[siteId]/analytics`:
  - Tres tarjetas de resumen: visitas totales, ultimos 30 dias, ultimos 7 dias.
  - Callout del mejor dia historico con fecha y conteo.
  - Grafico de barras CSS de 30 dias con tooltip al hover (barra de hoy en morado claro `#a078ff`, dias con visitas en `#6d35db`, dias sin visitas en `#2d243d`).
  - Tabla de datos: hasta 20 filas, solo dias con visitas, ordenada de mas reciente a mas antiguo.
  - Estado vacio cuando el sitio no ha recibido visitas aun.
- Boton "Analytics" con icono `BarChart3` en la barra superior del editor (`SiteEditorPanel`), visible solo para usuarios autenticados.

### Bloque de precios (PricingBlock)

- Nuevo tipo de bloque `pricing` integrado en `SiteBlockRenderer`.
- 6 estilos de renderizado: `cards`, `table`, `list`, `featured`, `minimal`, `tiers`.
- 26 presets en el sistema de recetas de diseno (`PRICING_STYLES`, tipo `PricingStyle`).
- Campo `pricingStyle` agregado al esquema de diseno (`RecipeInput` y funcion `recipe()`).

---

## Archivos creados o modificados

| Archivo | Cambio |
| --- | --- |
| `prisma/schema.prisma` | Modelo `SiteView` agregado |
| `prisma/migrations/20260701000001_m6_analytics/migration.sql` | Crea tabla `SiteView` con PK compuesta e indice |
| `lib/site/track-view.ts` | Funcion `trackSiteView(siteId)` con upsert fire-and-forget |
| `app/s/[slug]/page.tsx` | `void trackSiteView(site.id)` al servir sitio publico por slug |
| `app/d/[domain]/page.tsx` | `void trackSiteView(site.id)` al servir sitio por dominio personalizado |
| `app/builder/[siteId]/analytics/page.tsx` | Dashboard de analytics (creado desde cero) |
| `components/builder/SiteEditorPanel.tsx` | Boton Analytics en barra superior |
| `components/site-blocks/PricingBlock.tsx` | Bloque de precios con 6 estilos (creado desde cero) |
| `components/site-blocks/SiteBlockRenderer.tsx` | Caso `pricing` agregado al switch de bloques |
| `components/site-blocks/types.ts` | Tipo `PricingBlock` y `PricingStyle` |
| `lib/validators/site-onboarding.ts` | Campo `pricingStyle` en schema de diseno |
| `next.config.mjs` | `allowedDevOrigins: ["192.168.1.20"]` para HMR en red local |
| `proxy.ts` | Funcion `isDevHost()` con deteccion de rangos RFC-1918 |

---

## Correcciones de infraestructura aplicadas en esta sesion

**HMR bloqueado desde red local**
- Causa: Next.js 15/16 bloquea websockets de HMR desde origenes que no sean `localhost`.
- Solucion: `allowedDevOrigins: ["192.168.1.20"]` en `next.config.mjs`.

**GET / devuelve 404 desde IP de red local**
- Causa: el middleware `proxy.ts` reescribia cualquier host distinto de `localhost` o `127.0.0.1` como dominio personalizado, convirtiendo `192.168.1.20` en `/d/192.168.1.20`.
- Solucion: funcion `isDevHost()` que detecta todos los rangos privados RFC-1918 (`10.x`, `192.168.x`, `172.16-31.x`) y los deja pasar sin reescritura.

**Login fallaba con email**
- Causa: la cuenta admin `Maycolljaramillo` tenia `email: null`; el sistema de login busca por `username OR email`, pero sin email registrado el acceso por correo era imposible.
- Solucion: email actualizado a `info@cluster.marketing` en la base de datos.
- Acceso: usuario `Maycolljaramillo` o email `info@cluster.marketing`.

**`prisma generate` bloqueado en Windows mientras corre el dev server**
- Causa: el proceso de Next.js mantiene un lock sobre `query_engine-windows.dll.node`.
- Estado: `tsc --noEmit` pasa limpio porque el cliente ya incluia el tipo `SiteView` en cache. Ejecutar `npx prisma generate` despues de detener el servidor para regenerar el cliente completamente.

---

## Migracion aplicada

```
npx prisma migrate deploy
```

Resultado: migracion `20260701000001_m6_analytics` aplicada. Tabla `SiteView` creada en `public`.

---

## Configuracion pendiente para produccion

- Ejecutar `npx prisma generate` con el servidor detenido para regenerar el cliente Prisma con el modelo `SiteView` completo.
- Aplicar la migracion en el entorno de produccion con `npx prisma migrate deploy` antes de hacer deploy.
- Las credenciales de Stripe, Vercel Domains y Brevo siguen sin configurar (heredado de M5).
