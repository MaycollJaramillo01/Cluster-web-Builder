# Implementación y prueba de 26 templates

Fecha: 2026-06-29

## Resultado

- 26 templates completos registrados.
- 26 recetas visuales únicas.
- 26 órdenes principales de secciones distintos.
- Las 26 variantes de la sección Nosotros están conectadas una a una.
- 6 familias de composición: service, editorial, immersive, catalog, local y minimal.
- 6 perfiles de movimiento: subtle, stagger, kinetic, editorial, cinematic y minimal.
- El selector continúa mostrando un máximo de 6 opciones contrastantes.
- Cambiar de template actualiza `visualStyle` y reordena las secciones en una transacción.

## Animaciones

- Entrada activada mediante `IntersectionObserver` cuando cada sección entra al viewport.
- Las secciones fuera del viewport permanecen con opacidad 0 y transformación inicial.
- Al recorrer la página de prueba Panorama, las 7 de 7 secciones terminaron visibles.
- Tarjetas, pasos, galería y preguntas utilizan stagger de 40 ms.
- Solo se animan `opacity` y `transform` para evitar reflow.
- Existe una regla `prefers-reduced-motion` que elimina transiciones y transformaciones.
- Navegación con entrada breve de 260 ms.

## Navegador

Se probaron StudioSplit, Portrait, Panorama, Gridline, Framed y Statement usando el mismo negocio, contenido y paleta.

- Los seis conservaron su orden estructural propio.
- Sin desbordamiento horizontal en escritorio después de corregir Panorama.
- Panorama validado a 375 × 812 px sin desbordamiento.
- Menú móvil disponible y hero animado al entrar al viewport.
- Sin errores de consola durante la prueba.
- Los seis proyectos temporales fueron eliminados.

## Automatización

- `npm run check:design`: correcto.
- `npm run test:m4`: correcto; confirma preview 3/6, persistencia y orden estructural.
- `npm run test:fast-prompt`: correcto; pesca conserva la composición Immersive.
- `npm run lint`: correcto, con una advertencia preexistente sobre `<img>` en `OnboardingWizard.tsx`.
- `npm run build`: correcto con Next.js 16.2.9.

## Evidencia

- `templates-26-contact-sheet-final.png`: seis familias representativas en escritorio.
- `templates-26-mobile-panorama.png`: Panorama a 375 px.
- `templates-26-{template}.png`: capturas individuales.
