# Builder V2 — resultado de aceptación

Fecha: 2026-07-02.

## Gates

- TypeScript: correcto.
- ESLint: 0 errores (4 advertencias preexistentes).
- Unitarias: 45/45.
- Build Next.js de producción: correcto.
- Integración HTTP/DB: copia V1→V2, guardado atómico, revisión, deshacer, publicación sobre el ID original, conservación de URL/leads/métricas y ZIP: correcto.
- Migración de datos: respaldo verificado de 160 proyectos; 87 publicados V1 conservados; 73 `GENERATED` V1 eliminados solo después de checksum y prueba de restauración.

## Validación visual

Se probaron `conversion`, `editorial`, `catalog`, `local`, `immersive` y `minimal` en 1440×900, 768×1024 y 390×844.

- Cada plantilla contiene un H1 único, formulario funcional y entre 7 y 8 secciones.
- Las seis estructuras tienen fingerprints diferentes.
- No existe overflow horizontal en escritorio, tablet o móvil.
- La navegación se oculta en móvil y el formulario pasa a una columna.
- Se corrigió durante la prueba el padding horizontal de secciones con espaciado XL en móvil.
- Se corrigió el widget de video para mostrar una imagen de respaldo cuando el medio recibido no es un video real.

Evidencia: `six-templates-contact-sheet.jpg`, seis capturas `*-desktop.png`, `immersive-mobile.png`, seis HTML reproducibles y `visual-report.json`.
