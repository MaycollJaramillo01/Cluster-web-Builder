# AI Hosting Website Builder

## 1. Nombre del proyecto

**AI Hosting Website Builder** — un MVP de constructor de sitios web con IA pensado para empresas de hosting que quieren ofrecer a sus clientes sitios generados automáticamente.

## 2. Descripción

El visitante responde **máximo 5 preguntas** y genera su primer borrador sin crear una cuenta. Puede previsualizarlo y editarlo durante 72 horas; al guardar o publicar, inicia sesión y el proyecto se transfiere automáticamente a su cuenta. Cada usuario solo puede consultar y modificar sus propios proyectos.

> Fase actual: MVP multiusuario. No incluye registro público, pagos, equipos compartidos, WHMCS, cPanel ni dominios personalizados.

## 3. Stack

- **Next.js 16** (App Router) + **TypeScript**
- **Tailwind CSS** + componentes estilo **shadcn/ui**
- **Zod** para validación
- **Prisma 6** (ORM) sobre **Neon PostgreSQL**
- **NVIDIA NIM** para IA — modelo configurable con `NVIDIA_MODEL`
- **Streaming real** vía Server-Sent Events
- Deploy en **Vercel**

## 4. Variables de entorno

Crea un archivo `.env` (para local) basado en `.env.example`:

```env
NVIDIA_API_KEY=
NVIDIA_MODEL=z-ai/glm-5.1
DATABASE_URL=
DIRECT_URL=
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

- `DATABASE_URL`: conexión **pooled** de Neon (runtime de la app). Recomendado añadir `?sslmode=require&pgbouncer=true`.
- `DIRECT_URL`: conexión **directa** de Neon (migraciones / comandos Prisma). Usa `?sslmode=require`.
- La `NVIDIA_API_KEY` **nunca** se expone al frontend: todas las llamadas pasan por API Routes.

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

## 7. Configuración de proveedores

- Añade `NVIDIA_API_KEY` para la generación de contenido. Sin ella se usa el generador local.
- Añade `PEXELS_API_KEY` para fotografías stock. Sin ella se usa LoremFlickr como respaldo.

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

## 8b. Crear el primer administrador

Configura temporalmente `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_NAME` y `ADMIN_EMAIL`, y ejecuta:

```bash
npm run db:create-admin
```

Los administradores crean cuentas adicionales desde `/admin/users`. Las sesiones y los borradores invitados usan tokens aleatorios almacenados como hash; no existe una contraseña global compartida.

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
   - `NVIDIA_API_KEY`
   - `NVIDIA_MODEL`
   - `PEXELS_API_KEY`
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

### Publicación en subdominios

Configura `PUBLIC_ROOT_DOMAIN=sites.tudominio.com`, añade `*.sites.tudominio.com` al proyecto de Vercel y crea un registro DNS wildcard apuntando a Vercel. Vercel emite el SSL; localmente y sin esa variable se usa `/s/[slug]`.

> El runtime de la ruta de IA es **Node.js** (`export const runtime = "nodejs"`) con `maxDuration = 60`, requerido por Prisma + streaming en Vercel.

## 11. Cómo probar streaming

1. Abre `/builder` y responde las 5 preguntas.
2. Pulsa **Generar mi sitio** → te lleva a `/builder/generating`.
3. Verás:
   - Mensajes de estado progresivos (_Analizando negocio…_, _Construyendo secciones…_, etc.).
   - El contenido generándose **token a token** en una vista en vivo.
4. La ruta `POST /api/ai/generate-site` reenvía eventos SSE: `status`, `token`, `saved`, `error`, `done`.

## 12. Cómo generar el primer sitio

1. Entra a `/` o `/builder` y genera el borrador sin iniciar sesión.
2. Espera el streaming hasta el evento `saved`.
3. Serás redirigido a `/builder/[siteId]` (editor + preview).
4. Edita textos y colores. Al pulsar **Guardar cambios**, inicia sesión para reclamar el proyecto.
5. **Ver preview** abre `/preview/[siteId]` como un sitio real.
6. Encuentra todos tus sitios en `/dashboard`.

## 13. Próximos pasos (fases futuras)

- Dominios personalizados por cliente (la publicación gratuita por subdominio ya está disponible).
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
  admin/users/page.tsx             Administración de cuentas
  preview/[siteId]/page.tsx        Preview público
  api/ai/generate-site/route.ts    Generación con streaming (Node runtime)
  api/sites/[siteId]/route.ts      GET/PATCH sitio
  api/sites/[siteId]/sections/[sectionId]/route.ts   PATCH sección
lib/
  nvidia.ts                        Cliente + parser de stream
  prompts/site-generator.ts        System + user prompt
  validators/site-onboarding.ts    Zod del onboarding
  json/extract-json.ts             Extracción robusta de JSON
  site/normalize-site-blueprint.ts Normalización del blueprint
  db.ts                            Prisma singleton
  auth.ts                          Sesiones individuales
  rate-limit.ts                    Límites de login y generación
components/
  builder/*                        Wizard, streaming, editor, dashboard card
  site-blocks/*                    Renderer de bloques controlado
prisma/schema.prisma
```
