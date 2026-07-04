# Fase 2 — revisión visual del render V2

Fecha: 4 de julio de 2026.

La línea base corresponde a `test-results/builder-v2/`. El resultado corregido está en esta
carpeta. Las seis familias se renderizaron con el mismo contenido y medios para que la
comparación mida composición, ritmo, contraste y responsive, no diferencias de copy.

| Familia | Antes | Después |
|---|---|---|
| Conversion | [desktop](../builder-v2/conversion-desktop.png) | [desktop](conversion-desktop.png) · [móvil](conversion-mobile.png) |
| Editorial | [desktop](../builder-v2/editorial-desktop.png) | [desktop](editorial-desktop.png) · [móvil](editorial-mobile.png) |
| Catalog | [desktop](../builder-v2/catalog-desktop.png) | [desktop](catalog-desktop.png) · [móvil](catalog-mobile.png) |
| Local | [desktop](../builder-v2/local-desktop.png) | [desktop](local-desktop.png) · [móvil](local-mobile.png) |
| Immersive | [desktop](../builder-v2/immersive-desktop.png) | [desktop](immersive-desktop.png) · [móvil](immersive-mobile.png) |
| Minimal | [desktop](../builder-v2/minimal-desktop.png) | [desktop](minimal-desktop.png) · [móvil](minimal-mobile.png) |

## Resultado

- Las seis estructuras mantienen fingerprints distintos.
- Las secciones sin contenido colapsan en publicación y conservan un placeholder discreto en edición.
- El footer queda pegado al final mediante layout flex, incluso con poco contenido.
- Los CTA calculan texto claro u oscuro según el color del tema.
- Las tarjetas usan el color de texto contextual, evitando perder contraste en secciones oscuras.
- Las capturas móviles no presentan desbordamiento horizontal.
- Preview, publicación y ZIP comparten `renderSiteV2`.

## Gates ejecutados

- `npm run check:design`: correcto.
- `npm run test:unit`: 53/53.
- `npx tsc --noEmit`: correcto.
- `npm run lint`: 0 errores; 4 advertencias preexistentes fuera del alcance.
- `npm run build`: correcto.
