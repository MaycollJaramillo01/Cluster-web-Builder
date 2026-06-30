# Prueba de diferencia visual de templates

Fecha: 2026-06-29

## Método

Se renderizaron seis sitios temporales con el mismo negocio, contenido, paleta y once secciones. La única variable fue `visualStyle`: Service, Editorial, Immersive, Catalog, Local y Minimal.

Se capturó cada página completa en 1280 px de ancho, se inspeccionó su DOM y se normalizaron las capturas a 240 × 720 píxeles en escala de grises. La distancia visual indicada es el promedio absoluto de diferencia por píxel; 0 % sería una imagen idéntica.

## Resultado estructural

- Templates examinados: 6.
- Órdenes de secciones únicos: 1.
- Todos mostraron las mismas diez secciones renderizadas.
- Orden compartido: `hero > services > benefits > process > about_us > gallery > faq > location > contact > cta`.
- No se registraron errores ni advertencias en la consola durante el renderizado.

## Distancia visual

| Comparación | Diferencia |
| --- | ---: |
| Service vs Minimal | 8.36 % |
| Editorial vs Minimal | 13.69 % |
| Service vs Editorial | 14.10 % |
| Catalog vs Local | 15.07 % |
| Editorial vs Catalog | 30.53 % |
| Service vs Catalog | 30.69 % |
| Catalog vs Minimal | 34.47 % |
| Service vs Local | 36.79 % |
| Immersive vs Local | 37.85 % |
| Editorial vs Local | 38.54 % |
| Local vs Minimal | 43.01 % |
| Immersive vs Catalog | 45.37 % |
| Editorial vs Immersive | 58.40 % |
| Service vs Immersive | 58.95 % |
| Immersive vs Minimal | 64.95 % |

Promedio: 35.38 %. La cercanía más grave es Service/Minimal con 8.36 %, seguida por Editorial/Minimal, Service/Editorial y Catalog/Local.

## Conclusión

La prueba falla como sistema de variedad estructural: existen diferencias visibles en hero, tipografía, superficies e imágenes, pero los seis templates conservan exactamente la misma arquitectura y orden de contenido. El resultado confirma que actualmente son tratamientos visuales de un mismo sitio, no seis composiciones completas.

El comando existente `npm run check:design` termina correctamente y afirma que hay seis composiciones estructurales. Esa prueba solo compara recetas y `sectionPlan`; no comprueba la estructura que finalmente aparece en el navegador. Por eso produce un resultado positivo que contradice el renderizado real.

## Evidencia

- `visual-difference-contact-sheet.png`: comparación del primer viewport.
- `visual-difference-full-contact-sheet.png`: comparación de las páginas completas.
- `visual-difference-{template}.png`: captura completa individual de cada template.
