# ADR 0001: Pipeline de generación de sitios

- Estado: Aceptado
- Fecha: 2026-07-01
- Actualizado: 2026-08-10

## Decisión

El flujo oficial se divide en estas etapas:

1. `parseGenerationInput` valida el formulario o prompt y produce `OnboardingInput`.
2. `buildGenerationPlan` puntúa recetas funcionales y lenguajes visuales; conserva las razones de ambas decisiones.
3. `generateNormalizedSite` genera el contenido y usa un fallback local ante errores recuperables.
4. `normalizeWithCopyQuality` valida la estructura y mejora el texto usando solo datos del cliente.
5. `persistGeneratedSite` compone un documento V2 editable desde el registro canónico, aplica el lenguaje elegido y lo persiste.
6. El usuario entra directamente al editor V2 y trabaja con secciones, filas, columnas y bloques.

No existe un catálogo de HTML prearmado. Las "plantillas" son recetas funcionales: ordenan etapas y expresan afinidades visuales, pero la composición final parte del contenido, del registro de bloques y del grafo.

## Contratos

- La base de datos es el único requisito obligatorio para crear un sitio.
- Ningún documento se persiste sin header, contenido principal y footer.
- Toda receta debe iniciar con hero, terminar con footer, incluir contacto y declarar afinidad visual.
- Todo bloque debe declarar función, requisitos de datos, compatibilidad responsive y perfil de composición.
- La paleta del cliente es independiente del lenguaje visual y nunca se reemplaza al cambiar de receta.
- Una respuesta inválida del proveedor activa el generador local cuando el error es recuperable.
- La mejora de texto solo puede usar hechos entregados por el cliente.
- Los eventos SSE públicos son `status`, `token`, `saved`, `error` y `done`.

## Verificación obligatoria

```bash
npm run test:unit
npm run lint
npm run build
```
