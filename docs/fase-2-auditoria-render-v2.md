# Auditoría del render V2 antes de Fase 2

Fecha: 2026-07-04

## Lectura de diseño

Rediseño preservativo para sitios de pequeños negocios. Se conserva la identidad de las seis plantillas y se corrigen defectos sistémicos del renderer.

- `DESIGN_VARIANCE`: 7
- `MOTION_INTENSITY`: 5
- `VISUAL_DENSITY`: 4
- Base técnica: CSS nativo y tokens V2 existentes, sin dependencias nuevas.

## Hallazgos

1. El footer de todas las plantillas fuerza `#111827`, incluso en Editorial, Inmersivo y Minimal. Esto rompe la continuidad del tema.
2. `.v2-site` solo define altura mínima. No es una columna flex, por lo que el footer puede quedar suspendido cuando falta contenido.
3. Listas, galerías, reseñas y preguntas vacías producen contenedores y secciones con espaciado completo.
4. Los placeholders de medios también aparecen en el sitio publicado, aunque son útiles únicamente dentro del editor.
5. Los botones siempre usan texto blanco. Los acentos claros de Local, Conversión e Inmersivo no alcanzan contraste AA.
6. El tamaño `display` y el `h1` global permiten titulares demasiado grandes para textos largos y pantallas móviles.
7. El ritmo vertical usa el mismo tratamiento para hero, contenido y footer. El resultado deja vacíos excesivos en páginas con poco contenido.
8. Las tarjetas de listas y reseñas comparten una composición demasiado uniforme entre familias.
9. La navegación móvil desaparece sin dejar un acceso alternativo. Se conserva en esta fase por alcance, pero queda registrado como deuda.
10. El render interno no recibe URL pública ni estado de indexación, por lo que no puede emitir canonical, robots, Open Graph o JSON-LD completos.

## Correcciones priorizadas

- Colapsar secciones sin contenido útil y limitar placeholders al modo editor.
- Convertir el sitio en columna flex con footer al final.
- Derivar el color legible del CTA a partir del acento.
- Normalizar escalas tipográficas y ritmo responsive.
- Hacer el footer dependiente de los tokens del tema.
- Ampliar el contrato del renderer con URL pública, estado de indexación e imagen social.
- Mantener la diversidad estructural y el guardarraíl de las seis plantillas.
