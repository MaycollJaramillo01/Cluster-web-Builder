# ADR 0001: Pipeline de generación de sitios

- Estado: Aceptado
- Fecha: 2026-07-01
- Actualizado: 2026-08-10

## Decisión

El flujo oficial se divide en estas etapas:

1. `parseGenerationInput` valida el formulario o prompt y produce `OnboardingInput`.
2. `buildGenerationPlan` define una dirección visual y un plan de secciones.
3. `generateNormalizedSite` genera el contenido y usa un fallback local ante errores recuperables.
4. `normalizeWithCopyQuality` valida la estructura y mejora el texto usando solo datos del cliente.
5. `persistGeneratedSite` compone un documento V2 editable y lo persiste.
6. El usuario entra directamente al editor V2 y trabaja con secciones, filas, columnas y bloques.

No existe un catálogo de sitios prearmados ni una etapa de selección. La composición parte del contenido y de bloques independientes.

## Contratos

- La base de datos es el único requisito obligatorio para crear un sitio.
- Ningún documento se persiste sin header, contenido principal y footer.
- Una respuesta inválida del proveedor activa el generador local cuando el error es recuperable.
- La mejora de texto solo puede usar hechos entregados por el cliente.
- Los eventos SSE públicos son `status`, `token`, `saved`, `error` y `done`.

## Verificación obligatoria

```bash
npm run test:unit
npm run lint
npm run build
```
