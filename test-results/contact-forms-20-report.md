# Implementación: 20 estilos de formulario

Fecha: 2026-06-30

## Estilos disponibles

1. Split
2. Editorial
3. Spotlight
4. Glass
5. Floating
6. Minimal Line
7. Reverse
8. Brutal
9. Centered
10. Bordered
11. Offset
12. Dark
13. Asymmetric
14. Quote
15. Sidebar
16. Banner
17. Framed
18. Steps
19. Stacked
20. Compact

Los 26 presets reciben un `contactStyle`. Los primeros 20 cubren cada estilo una vez; los seis restantes reutilizan estilos compatibles con su familia visual.

## Diferencias reales

- Orden del contenido y del formulario.
- Composición centrada, dividida, inversa, lateral, flotante o apilada.
- Rejillas de una, dos o tres columnas.
- Campos boxed, suaves, subrayados o brutalistas.
- Superficies claras, oscuras, glass y de alto contraste.
- Densidad, anchura, marcos, desplazamientos y jerarquía diferentes.
- Iconos Lucide accesibles para teléfono, email, ubicación, envío y confirmación.
- Los mismos estados funcionales: envío, éxito, error y bloqueo durante la petición.
- La exportación ZIP conserva el estilo asignado mediante `data-contact-style` y reglas responsive propias.

## Pruebas

- `check:design`: PASS — 20 estilos conectados a los 26 presets.
- `lint`: PASS con 0 errores y una advertencia previa en `OnboardingWizard.tsx`.
- `build`: PASS — compilación y TypeScript correctos.
- `test:multi-user`: PASS — publicación, leads, ZIP y aislamiento multiusuario.
- Navegador escritorio: Steps y Reverse muestran estructuras distintas y 5 controles funcionales.
- Navegador móvil 360 px: Reverse colapsa a una columna de 312 px sin desbordamiento horizontal.

## Archivos de evidencia

- `contact-forms-20-check.log`
- `contact-forms-20-lint.log`
- `contact-forms-20-build.log`
- `contact-forms-20-functional.log`
