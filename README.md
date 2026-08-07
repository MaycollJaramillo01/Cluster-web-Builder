# Cluster Web Builder

Constructor de sitios web con IA para negocios. Un visitante puede generar y previsualizar un borrador sin cuenta; al registrarse, el proyecto invitado se transfiere a su cuenta. Cluster Pro habilita publicación, descarga ZIP y dominio propio.

## Stack

- Next.js 16, React 19 y TypeScript
- Tailwind CSS
- Prisma 6 y Neon PostgreSQL
- OpenRouter para generación de contenido
- Pexels para imágenes
- Stripe para suscripciones
- Brevo para correo transaccional
- Vercel para despliegue y dominios

## Desarrollo local

```bash
npm install
Copy-Item .env.example .env
npm run db:deploy
npm run dev
```

La aplicación queda disponible en `http://localhost:3000`.

## Variables de entorno

Copia `.env.example` a `.env` y configura:

- `DATABASE_URL` y `DIRECT_URL`: conexiones pooled y directa de Neon.
- `OPENROUTER_API_KEY` y `OPENROUTER_MODEL`: generación de contenido. Sin clave se usa el generador local.
- `PEXELS_API_KEY`: imágenes stock.
- `BLOB_READ_WRITE_TOKEN`: persistencia de media en Vercel Blob (sin esto las imágenes no se guardan).
- `NEXT_PUBLIC_APP_URL`: URL pública de la aplicación.
- `PUBLIC_ROOT_DOMAIN`: dominio raíz opcional para sitios publicados.
- `STRIPE_SECRET_KEY`, `STRIPE_PRICE_ID` y `STRIPE_WEBHOOK_SECRET`: suscripción Pro.
- `VERCEL_TOKEN`, `VERCEL_PROJECT_ID` y `VERCEL_TEAM_ID`: dominios personalizados.
- `BREVO_API_KEY`, `EMAIL_FROM` y `EMAIL_FROM_NAME`: recuperación de contraseña y avisos de leads.

Todas las claves son exclusivas del servidor. No uses prefijos `NEXT_PUBLIC_` para secretos.

## Activación comercial M5

1. Ejecuta `npm run db:deploy` contra la base de datos de producción.
2. Crea el producto y precio recurrente en Stripe.
3. Registra `POST /api/billing/webhook` como webhook de Stripe.
4. Añade las credenciales de Vercel Domains si ofrecerás dominio propio.
5. Verifica el remitente configurado en Brevo.
6. Configura `NEXT_PUBLIC_APP_URL` con la URL final de producción.
7. Crea el primer administrador con las variables `ADMIN_*` y `npm run db:create-admin`.
8. Revisa jurídicamente términos, privacidad, cookies y reembolsos antes de aceptar pagos.

El webhook despublica los sitios del cliente cuando la suscripción deja de estar activa. Los administradores conservan acceso operativo.

## Flujo principal

1. El visitante completa el modo guiado o escribe un prompt.
2. La IA produce el blueprint y el sistema lo normaliza y persiste.
3. El visitante elige diseño y edita el borrador.
4. Al registrarse, el borrador invitado se reclama automáticamente.
5. La suscripción Pro habilita publicar, descargar y conectar dominio.
6. Los formularios crean leads, notifican al propietario y permiten exportar CSV.

El flujo técnico está documentado en `docs/adr/0001-site-generation-pipeline.md`.

## Rutas operativas

- `/builder`: creación guiada y avanzada.
- `/dashboard`: proyectos del usuario.
- `/billing`: suscripción Pro.
- `/admin/users`: usuarios, solo administrador.
- `/admin/metrics`: métricas comerciales, solo administrador.
- `/s/[slug]`: sitio publicado.
- `/d/[domain]`: dominio personalizado.

## Verificación

```bash
npm run test:unit
npm run test:m3
npm run test:multi-user
npm run lint
npm run build
```

En producción usa `npm run db:deploy`; no uses `prisma migrate dev`.
