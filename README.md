# AI Hosting Website Builder

## 1. Nombre del proyecto

**AI Hosting Website Builder** — un MVP de constructor de sitios web con IA pensado para empresas de hosting que quieren ofrecer a sus clientes sitios generados automáticamente.

## 2. Descripción

El cliente entra al builder, responde **máximo 5 preguntas** y la IA genera la estructura completa del sitio (copy, secciones, SEO y paleta de colores) mostrando el progreso con **streaming en tiempo real**. El sitio se guarda en **Neon PostgreSQL**, se renderiza con un **renderer de bloques React** controlado (sin HTML inseguro) y queda **editable** (textos, colores, visibilidad y orden de secciones). Incluye un **dashboard** de sitios y una **vista previa pública**.

> Fase actual: MVP. **No** incluye autenticación, pagos, WHMCS, cPanel, dominios personalizados, publicación real ni generación de imágenes. Esos puntos quedan como _placeholders_ para fases futuras.

## 3. Stack

- **Next.js 15** (App Router) + **TypeScript**
- **Tailwind CSS** + componentes estilo **shadcn/ui**
- **Zod** para validación
- **Prisma 6** (ORM) sobre **Neon PostgreSQL**
- **OpenRouter** para IA — modelo principal `qwen/qwen3-coder:free`
- **Streaming real** vía Server-Sent Events
- Deploy en **Vercel**

## 4. Variables de entorno

Crea un archivo `.env` (para local) basado en `.env.example`:

```env
OPENROUTER_API_KEY=
OPENROUTER_MODEL=qwen/qwen3-coder:free
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- `DATABASE_URL`: conexión **pooled** de Neon (runtime de la app). Recomendado añadir `?sslmode=require&pgbouncer=true`.
- `DIRECT_URL`: conexión **directa** de Neon (migraciones / comandos Prisma). Usa `?sslmode=require`.
- La `OPENROUTER_API_KEY` **nunca** se expone al frontend: todas las llamadas pasan por API Routes.

## 5. Instalación local

```bash
npm install
```

`postinstall` ejecuta `prisma generate` automáticamente.

## 6. Configuración de Neon

1. Crea un proyecto en [Neon](https://neon.tech).
2. En **Connection Details**, copia:
   - La cadena **Pooled connection** → `DATABASE_URL`.
   - La cadena **Direct connection** → `DIRECT_URL`.
3. Pégalas en tu `.env`.

`prisma/schema.prisma` usa:

```prisma
datasource db {
  provider  = "postgresql"
  url       = env("DATABASE_URL")
  directUrl = env("DIRECT_URL")
}
```

## 7b. Configuración de ImageKit (imágenes con IA)

Las imágenes de las secciones (hero, nosotros, CTA) se generan con **ImageKit GenAI** a partir del `imagePrompt` de cada sección.

1. Crea una cuenta en [ImageKit](https://imagekit.io).
2. En **Settings → URL-endpoint**, copia tu endpoint (forma `https://ik.imagekit.io/tu_id`).
3. Pégalo en `.env` como `NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT`.

- El **URL endpoint es público** y es lo único necesario para generar/servir imágenes (vía URL `…/ik-genimg-prompt-<texto>/…`).
- `IMAGEKIT_PUBLIC_KEY` / `IMAGEKIT_PRIVATE_KEY` solo se usan para **subir** archivos (fase futura). La private key es secreta — mantenla solo en el servidor.
- Si no configuras el endpoint, las imágenes caen automáticamente a fotos stock gratuitas (LoremFlickr), así la app funciona igual.
- ImageKit genera cada imagen una sola vez por prompt y la cachea en CDN; el plan free tiene un límite de generaciones.

## 7. Configuración de OpenRouter

1. Crea una cuenta en [OpenRouter](https://openrouter.ai) y genera una API key.
2. Ponla en `OPENROUTER_API_KEY`.
3. (Opcional) Cambia `OPENROUTER_MODEL`; por defecto `qwen/qwen3-coder:free`.

## 8. Correr migraciones

Desarrollo (crea y aplica migraciones):

```bash
npm run db:migrate
```

Generar el cliente Prisma manualmente:

```bash
npm run db:generate
```

Explorar la base de datos:

```bash
npm run db:studio
```

## 9. Desarrollo local

```bash
npm install
npx prisma generate
npx prisma migrate dev
npm run dev
```

App disponible en `http://localhost:3000`.

## 10. Deploy en Vercel con Neon

1. **Crear proyecto en Neon** y obtener las cadenas de conexión.
2. **Copiar `DATABASE_URL`** (pooled) y **`DIRECT_URL`** (direct).
3. **Crear proyecto en Vercel** importando este repositorio.
4. **Agregar variables de entorno en Vercel** (Project → Settings → Environment Variables):
   - `OPENROUTER_API_KEY`
   - `OPENROUTER_MODEL`
   - `DATABASE_URL`
   - `DIRECT_URL`
   - `NEXT_PUBLIC_APP_URL` (la URL de producción de Vercel)
5. **Ejecutar las migraciones contra producción** (desde tu máquina, con el `.env` apuntando a la DB de producción, o vía CI):
   ```bash
   npm run db:deploy
   ```
   > Nunca uses `migrate dev` en producción.
6. **Verificar conexión**: el `build` de Vercel ejecuta `prisma generate` automáticamente.
7. **Probar generación**: entra a `/builder` en la URL de Vercel.
8. **Ver dashboard**: `/dashboard`.
9. **Ver preview**: `/preview/[siteId]`.

> El runtime de la ruta de IA es **Node.js** (`export const runtime = "nodejs"`) con `maxDuration = 60`, requerido por Prisma + streaming en Vercel.

## 11. Cómo probar streaming

1. Abre `/builder` y responde las 5 preguntas.
2. Pulsa **Generar mi sitio** → te lleva a `/builder/generating`.
3. Verás:
   - Mensajes de estado progresivos (_Analizando negocio…_, _Construyendo secciones…_, etc.).
   - El contenido generándose **token a token** en una vista en vivo.
4. La ruta `POST /api/ai/generate-site` reenvía eventos SSE: `status`, `token`, `saved`, `error`, `done`.

## 12. Cómo generar el primer sitio

1. `/builder` → completa el wizard.
2. Espera el streaming hasta el evento `saved`.
3. Serás redirigido a `/builder/[siteId]` (editor + preview).
4. Edita textos y colores → **Guardar cambios**.
5. **Ver preview** abre `/preview/[siteId]` como un sitio real.
6. Encuentra todos tus sitios en `/dashboard`.

## 13. Próximos pasos (fases futuras)

- 🔐 Autenticación de usuarios (el modelo `User` ya está listo).
- 🚀 **Publicación real**: dominios personalizados + hosting.
- 🔌 Integraciones de hosting: **WHMCS**, **cPanel**.
- 💳 Pagos y planes.
- 🖼️ Generación de imágenes para las secciones (`imagePrompt` ya se guarda).
- 🧱 Editor avanzado: drag & drop, más tipos de bloque, multipágina navegable.

---

### Estructura relevante

```
app/
  page.tsx                         Landing
  builder/page.tsx                 Wizard (5 preguntas)
  builder/generating/page.tsx      Streaming
  builder/[siteId]/page.tsx        Editor + preview
  dashboard/page.tsx               Lista de sitios
  preview/[siteId]/page.tsx        Preview público
  api/ai/generate-site/route.ts    Generación con streaming (Node runtime)
  api/sites/[siteId]/route.ts      GET/PATCH sitio
  api/sites/[siteId]/sections/[sectionId]/route.ts   PATCH sección
lib/
  openrouter.ts                    Cliente + parser de stream
  prompts/site-generator.ts        System + user prompt
  validators/site-onboarding.ts    Zod del onboarding
  json/extract-json.ts             Extracción robusta de JSON
  site/normalize-site-blueprint.ts Normalización del blueprint
  db.ts                            Prisma singleton
components/
  builder/*                        Wizard, streaming, editor, dashboard card
  site-blocks/*                    Renderer de bloques controlado
prisma/schema.prisma
```
