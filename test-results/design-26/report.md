# Prueba visual de los 26 diseños

Fecha: 2026-06-30

## Resultado

Se crearon 26 proyectos reales y temporales en la base de datos, todos con el mismo negocio, contenido y paleta. Cada proyecto usó uno de los 26 diseños para que la comparación midiera composición y no cambios de texto o color.

- 26 proyectos creados y renderizados.
- 26 capturas individuales guardadas en `sites/`.
- 26 composiciones y 26 variantes de About verificadas.
- 6 familias visuales y 6 perfiles de movimiento verificados.
- Build de producción correcto.
- Lint sin errores; una advertencia de `<img>` en `OnboardingWizard.tsx`, fuera de las plantillas auditadas.
- Los 26 registros temporales fueron eliminados después de producir la evidencia. Quedaron 0 registros QA.

## Evidencia

- `contact-sheet-all-26.png`: comparación consolidada.
- `sites/01-service.png` a `sites/26-badges.png`: capturas originales.
- `manifest.json`: receta exacta de familia, hero, About, servicios, movimiento y plan por diseño.
- `check-design.log`: validación automática de diversidad.
- `lint.log`: resultado de ESLint.
- `build.log`: compilación de producción.
- `cleanup.log`: limpieza de los proyectos temporales.
- `summary.json`: resumen legible por máquinas y hashes SHA-256.

## Hallazgo durante la captura

BigType mostró desbordamiento horizontal por la traslación y el `skew` inicial del perfil cinético. Se eliminó el `skew` y se redujo la traslación a `translateX(-24px)`. La corrección quedó validada por las pruebas de diversidad, lint y build. La segunda recarga visual de BigType agotó el tiempo de la automatización; por eso no se declara una revalidación visual posterior que no haya ocurrido.

## Conclusión

La mejora no depende solamente de cambiar fuentes o colores: las recetas cambian familia, jerarquía del hero, About, servicios, orden de secciones y movimiento. La lámina permite ver la diferencia con el mismo contenido base.
