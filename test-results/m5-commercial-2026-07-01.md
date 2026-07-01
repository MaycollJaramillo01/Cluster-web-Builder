# Resultado de M5 comercial

Fecha: 2026-07-01

## Estado

M5 quedó implementado y validado en el entorno local. La migración `20260701000000_m5_commercialization` fue aplicada a la base configurada.

## Cobertura funcional

- Registro público, inicio de sesión por correo o usuario y reclamación de borradores invitados.
- Recuperación y cambio de contraseña con token de un solo uso.
- Paywall Pro para publicar, descargar ZIP y conectar dominio.
- Stripe Checkout, portal y webhook con despublicación al perder acceso.
- Logo y portada persistentes, comprimidos antes de enviar.
- Formularios con persistencia de leads, notificación y exportación CSV.
- Métricas comerciales para administradores.
- Eventos de producto para registro, generación, checkout, suscripción, publicación, descarga, dominio y leads.

## Pruebas ejecutadas

| Comando | Resultado |
| --- | --- |
| `npm run test:unit` | 10/10 aprobadas |
| `npm run test:m5-http` | Registro, sesión, paywall, recuperación y nuevo acceso aprobados |
| `BASE_URL=http://localhost:3000 npm run test:m3` | Plan, límites, dominio, proxy y marca blanca aprobados |
| `BASE_URL=http://localhost:3000 npm run test:multi-user` | Publicación, formularios, leads, ZIP y aislamiento aprobados |
| `npm run lint` | 0 errores; 2 advertencias no bloqueantes |
| `npm run build` | Compilación y TypeScript correctos; 36 rutas generadas |
| `codegraph sync` | Índice actualizado con los cambios de M5 |

El control de diversidad también aprobó 26 composiciones, 26 variantes About, 20 formularios, 6 familias y 6 perfiles de movimiento.

## Configuración externa pendiente

En el `.env` local aún no están configurados Stripe, Vercel Domains ni Brevo. Por ello el código está listo, pero pagos reales, dominio propio y correo transaccional no deben considerarse activos hasta agregar y verificar esas credenciales en producción.

También falta la revisión jurídica final de términos, privacidad, cookies y reembolsos antes de cobrar clientes.
