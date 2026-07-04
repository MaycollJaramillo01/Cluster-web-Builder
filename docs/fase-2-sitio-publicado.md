# Plan de trabajo Fase 2: el sitio publicado como producto

Objetivo: elevar la calidad de lo que el cliente final publica y ve. La Fase 1 cerró el
ciclo del editor (edición inline, copiar/pegar, diseño global, estilos de sección). La Fase 2
se concentra en el sitio publicado: que se vea profesional, que posicione en buscadores y que
el dominio propio sea un flujo terminado.

Duración estimada: 1.5 a 2 semanas.

## Contexto y hallazgos del código actual

Verificado sobre el repositorio antes de escribir este plan:

- **Render V2** (`lib/site/v2-render.ts`): el `<head>` del sitio publicado hoy solo emite
  `<title>` y `<meta name="description">`. No hay Open Graph, Twitter Card, canonical,
  `robots`, ni datos estructurados (JSON-LD).
- **Campos SEO** (`lib/site/v2-schema.ts`): `content.seo` ya existe con `title`,
  `description` y `keyword`, pero no hay UI en el editor para editarlos y el render apenas
  usa `title`/`description`.
- **Dominios propios**: el backend ya está bastante avanzado. `prisma/schema.prisma` tiene
  `domain`, `customDomain @unique`, `domainVerifiedAt`. Existe
  `app/api/sites/[siteId]/domain/route.ts` (PUT/POST/DELETE) que usa `lib/vercel-domains`
  (`addProjectDomain`, `verifyProjectDomain`, `removeProjectDomain`). Falta auditar y pulir
  la UI y el flujo de verificación.
- **Sitemap/robots**: existen `app/sitemap.ts` y `app/robots.ts` a nivel de la plataforma de
  marketing. Hay que revisar si incluyen los sitios publicados de los usuarios.

## Alcance de la Fase 2

Tres entregables, en orden de prioridad:

1. Auditoría y mejora de diseño del render (con la skill design-taste-frontend).
2. SEO por sitio (UI + salida completa en el `<head>` + sitemap de sitios publicados).
3. Dominios propios (auditar backend existente, terminar UI y flujo de verificación).

Fuera de alcance de esta fase: bandeja de leads en el dashboard, analytics para el usuario
final, tests E2E. Van a la Fase 3.

---

## Entregable 1 — Auditoría y mejora de diseño del render

Las capturas de sitios generados mostraban huecos blancos, footer que "flota", jerarquías
tipográficas inconsistentes y secciones vacías. El editor ya está bien; ahora el HTML que
produce `renderSiteV2` y las plantillas merecen la misma pasada de calidad.

### Enfoque
- Correr la skill `design-taste-frontend` en modo auditoría (redesign - preserve) sobre el
  render y las seis plantillas (`conversion`, `editorial`, `catalog`, `local`, `immersive`,
  `minimal`).
- Documentar hallazgos concretos antes de tocar código: qué secciones se rompen, dónde
  aparecen huecos, qué contraste falla, qué tipografías chocan.
- Aplicar correcciones priorizadas por impacto visual:
  - Espaciado y ritmo vertical entre secciones (`baseCss`, clases `v2-section`).
  - Footer que no "flota": revisar el layout de la región footer y su fondo.
  - Estados vacíos: una sección sin contenido no debe dejar un bloque en blanco; mostrar un
    placeholder discreto o colapsar.
  - Jerarquía tipográfica coherente (h1/h2/h3, cuerpo) en las seis plantillas.
  - Contraste AA en botones y texto sobre fondos de color o imagen.
- Respetar el bloqueo de tema (una sola paleta y modo por sitio) y las preferencias del
  usuario ya guardadas en memoria: galerías tipo bento tipográfico, sin imágenes sueltas
  con formas; nada de emojis.

### Archivos
- `lib/site/v2-render.ts` (`baseCss`, `sectionHtml`, estados vacíos por tipo de widget).
- `lib/site/v2-templates.ts` (composición de las seis plantillas si hay defectos estructurales).
- `scripts/check-design-diversity.mjs` (verificar que el guardarraíl de diversidad sigue verde).

### Criterios de aceptación
- Ninguna de las seis plantillas muestra huecos blancos ni footer flotante en desktop y móvil.
- Contraste AA en todos los botones y textos sobre fondo de color.
- Una sección sin contenido no rompe el layout.
- `npm run check:design` sigue pasando.
- Revisión visual lado a lado (antes/después) de las seis plantillas.

### Esfuerzo: 3 a 4 días

---

## Entregable 2 — SEO por sitio

Que cada sitio publicado posicione y se vea bien al compartirse. Cubre tres frentes: UI para
editar el SEO, salida completa en el `<head>` del render, y sitemap de sitios publicados.

### 2.A — UI de SEO en el editor
- Agregar una sección "SEO" en la pestaña Diseño (o una pestaña propia) de
  `SiteEditorV2.tsx` que edite `content.seo`:
  - **Título de la página** (`seo.title`) con contador de caracteres (recomendado < 60).
  - **Descripción** (`seo.description`) con contador (recomendado < 160).
  - **Palabra clave principal** (`seo.keyword`).
  - Vista previa de cómo se verá en Google (snippet) y al compartir (tarjeta social).
- Escribir con `applyContent` para que entre en el historial (Ctrl+Z).
- Fallbacks claros: si `seo.title` está vacío, se usa el nombre del negocio; si
  `seo.description` está vacía, se compone a partir de nombre + tipo (el render ya lo hace).

### 2.B — Salida completa en el `<head>` del render
En `renderSiteV2`, ampliar el `<head>` con:
- **Open Graph**: `og:title`, `og:description`, `og:type=website`, `og:url`, `og:image`,
  `og:site_name`, `og:locale=es`.
- **Twitter Card**: `twitter:card=summary_large_image`, `twitter:title`, `twitter:description`,
  `twitter:image`.
- **Canonical**: `<link rel="canonical">` a la URL pública (o dominio propio si está verificado).
- **Robots**: `index,follow` en sitios publicados; `noindex` en previsualización.
- **Datos estructurados JSON-LD**: `LocalBusiness` (o `Organization`) con nombre, teléfono,
  email, dirección y URL. Encaja perfecto con el público de negocios locales.
- **Favicon**: usar el logo del negocio si existe.
- La `og:image` sale del logo o cover del negocio; si no hay, dejar sin imagen (no inventar).

### 2.C — Sitemap de sitios publicados
- Revisar `app/sitemap.ts` y `app/robots.ts`. Asegurar que los sitios publicados (por
  `publicSlug` y por `customDomain` verificado) aparezcan.
- Evaluar si conviene un sitemap por sitio (para dominios propios) además del global.

### Consideraciones
- Escapar siempre con `escapeHtml` (ya existe) en todos los meta nuevos.
- No indexar previsualizaciones ni borradores (`status !== PUBLISHED`).
- Validar longitudes en `normalizeSiteContentV2` (ya recorta `seo` a límites sanos).

### Archivos
- `components/builder/SiteEditorV2.tsx` (UI de SEO + snippet de vista previa).
- `lib/site/v2-render.ts` (`<head>` completo, JSON-LD).
- `app/sitemap.ts`, `app/robots.ts` (inclusión de sitios publicados).
- `lib/site/v2-schema.ts` solo si se agrega algún campo nuevo (p. ej. `seo.ogImage`).

### Criterios de aceptación
- Editar título y descripción SEO se refleja en el `<head>` del sitio publicado.
- Al compartir el enlace en WhatsApp/Facebook/X aparece tarjeta con título, descripción e imagen.
- El JSON-LD de LocalBusiness valida en la herramienta de resultados enriquecidos de Google.
- Las previsualizaciones llevan `noindex`; los publicados, `index,follow`.
- Los sitios publicados aparecen en el sitemap.
- Tipos, lint y los tests unitarios pasan.

### Esfuerzo: 3 días

---

## Entregable 3 — Dominios propios (terminar el flujo)

El backend ya existe (esquema, ruta API, integración con Vercel). Falta auditar qué funciona,
terminar la UI y hacer el flujo de verificación claro para un usuario no técnico.

### Enfoque
- **Auditar lo existente**: probar `app/api/sites/[siteId]/domain/route.ts` de punta a punta
  (agregar, verificar, quitar). Confirmar que `lib/vercel-domains` responde y que
  `domainVerifiedAt` se actualiza.
- **UI en el dashboard o editor**: pantalla para conectar un dominio propio:
  - Campo para escribir el dominio.
  - Instrucciones claras de DNS (registro CNAME o A) con los valores exactos a copiar.
  - Botón "Verificar" que llama al endpoint POST y muestra estado (pendiente / verificado /
    error) en lenguaje simple.
  - Estado visible del dominio y opción de quitarlo.
- **Enrutamiento**: confirmar que `proxy.ts` (raíz del repo) resuelve el `customDomain`
  verificado al sitio correcto y sirve el render publicado.
- **Gating por plan**: conectar dominio es funcionalidad Pro (ya hay `hasProAccess` /
  `proRequiredResponse` en el flujo de publicar). Mostrar el paywall de forma clara.
- **Canonical y SEO**: cuando hay dominio verificado, el canonical y el sitemap deben usarlo.

### Consideraciones
- El texto de la UI debe ser para público no técnico: explicar qué es un CNAME sin jerga,
  con pasos numerados y valores listos para copiar.
- Manejar el caso "DNS aún propagando": mensaje de "puede tardar hasta X horas", no un error.
- No prometer venta de dominios (el copy actual aclara que Cluster solo permite conectarlos).

### Archivos
- Dashboard o editor: nueva vista de dominio (ubicación a definir en implementación).
- `app/api/sites/[siteId]/domain/route.ts` (ajustes si la auditoría revela huecos).
- `lib/vercel-domains.ts` (revisar).
- `proxy.ts` (confirmar resolución de dominio).
- `lib/site/v2-render.ts` (canonical con dominio propio).

### Criterios de aceptación
- Un usuario Pro puede conectar su dominio, ver las instrucciones DNS y verificarlo.
- Un dominio verificado sirve el sitio publicado correctamente.
- El canonical y el sitemap usan el dominio propio cuando está verificado.
- Un usuario Free ve el paywall al intentar conectar dominio.
- Quitar el dominio funciona y revierte al enlace gratuito.

### Esfuerzo: 3 a 4 días

---

## Secuencia sugerida (por días)

| Día | Trabajo |
|---|---|
| 1 | Auditoría de diseño del render con la skill (documentar hallazgos) |
| 2-4 | Aplicar correcciones de diseño al render y las seis plantillas |
| 5-6 | SEO: UI en el editor + salida completa en el `<head>` (OG, Twitter, JSON-LD) |
| 7 | SEO: sitemap de sitios publicados + noindex en previsualización |
| 8-9 | Dominios: auditoría del backend + UI de conexión y verificación |
| 10 | Dominios: enrutamiento, canonical con dominio propio, paywall, pruebas |

## Riesgos y mitigaciones

- **Verificación de dominio depende de Vercel y de DNS externos**: probar con un dominio real
  en un entorno de staging; no bloquear la fase si la propagación tarda, dejar el estado
  "pendiente" bien resuelto.
- **og:image sin imagen del negocio**: no inventar una imagen; dejar la tarjeta sin imagen es
  preferible a una genérica. Evaluar generación de OG image en la Fase 3.
- **Cambios en el render tocan a todos los sitios publicados**: son aditivos (más meta, mejor
  CSS), pero revisar que ningún sitio existente se rompa. Probar con varios sitios reales.
- **Guardarraíl de diversidad de diseño**: `npm run check:design` corre en prebuild; mantenerlo
  verde tras los cambios de plantilla.

## Definición de terminado (toda la fase)

- `npx tsc --noEmit` sin errores.
- `npx eslint` limpio en los archivos tocados.
- `npm run test:unit` en verde; `npm run check:design` en verde.
- Las seis plantillas revisadas visualmente (antes/después) sin huecos ni footer flotante.
- Un sitio publicado con SEO editable, tarjeta social correcta y JSON-LD válido.
- Flujo de dominio propio completo para un usuario Pro, con canonical apuntando al dominio.
- El sitio publicado no incluye nada del código del modo editor.

## Siguiente fase (referencia, fuera de este plan)

Fase 3 (negocio y conversión): bandeja de leads en el dashboard con notificación por email,
analytics simple por sitio para el usuario final, explotación de `ProductEvent` en el admin de
métricas, y tests E2E del editor con Playwright.
