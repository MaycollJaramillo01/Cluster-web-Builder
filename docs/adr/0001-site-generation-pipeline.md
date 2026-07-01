# ADR 0001: Pipeline de generación de sitios

- Estado: Aceptado
- Fecha: 2026-07-01

## Contexto

Cluster recibe información desde el formulario guiado o un prompt libre, genera un blueprint, normaliza el contenido, persiste el proyecto y permite elegir una plantilla. Esta secuencia estaba concentrada en la ruta HTTP y parte del protocolo SSE vivía dentro del componente visual, dificultando pruebas, recuperación ante fallos y cambios independientes.

## Decisión

El flujo oficial queda dividido en estas etapas:

1. **Formulario o prompt**: `parseGenerationInput` valida y convierte la entrada a `OnboardingInput`.
2. **Planificación**: `buildGenerationPlan` selecciona dirección visual, paleta, estructura y prompts.
3. **Blueprint**: `generateNormalizedSite` consume el proveedor de IA. Si la respuesta es recuperable, usa `buildFallbackNormalizedSite`.
4. **Normalización y copy**: `normalizeWithCopyQuality` valida páginas y secciones y aplica las métricas de contenido.
5. **Persistencia**: `persistGeneratedSite` aplica estructura, tema y redes antes de crear `Site` y `SiteSection`.
6. **Plantilla**: el usuario recibe seis candidatos contrastantes y `orderSectionsForTemplate` aplica el orden seleccionado sin perder contenido.

La ruta `POST /api/ai/generate-site` solo coordina autenticación, límites, eventos SSE y las etapas anteriores. El cliente consume los eventos mediante `useGenerationStream`; la interfaz no interpreta directamente el protocolo.

## Contratos

- La base de datos es el único requisito obligatorio para crear un sitio.
- Una respuesta inválida del proveedor debe activar el generador local cuando el error sea recuperable.
- Ningún blueprint puede persistirse sin al menos una página y una sección.
- La mejora de copy solo puede usar hechos entregados por el cliente.
- La plantilla modifica composición y orden, no el contenido confirmado.
- Los eventos SSE públicos son `status`, `token`, `saved`, `error` y `done`.

## Consecuencias

### Positivas

- Las etapas pueden probarse sin levantar una ruta HTTP completa.
- El proveedor de IA puede sustituirse sin modificar persistencia o interfaz.
- Los errores de streaming y fallback quedan aislados.
- El editor puede evolucionar por paneles sin aumentar el componente principal.

### Costes

- El flujo se distribuye entre más archivos.
- Cambiar el contrato de `OnboardingInput` requiere revisar planificación, fallback y persistencia.
- Las pruebas unitarias TypeScript usan `node:test` con el cargador `tsx`.

## Verificación obligatoria

Antes de integrar cambios en este flujo deben pasar:

```bash
npm run test:unit
npm run check:design
npm run lint
npm run build
```

Las pruebas cubren planificación, reconocimiento de errores recuperables, fallback renderizable, métricas de copy y selección/orden de plantillas.
