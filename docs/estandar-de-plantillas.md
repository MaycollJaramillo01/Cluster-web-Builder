# Estándar de plantillas — qué hace válida y excepcional a una plantilla V2

Este documento define las reglas que debe cumplir toda plantilla nueva del constructor.
No es una guía de estilo opcional: es el criterio de aceptación. Una plantilla que no
cumple todo lo obligatorio no entra al catálogo.

Principio rector: **cada plantilla debe ser excepcional por sí sola y distinta de todas las
demás.** No añadimos plantillas para tener más; añadimos plantillas que resuelven un tipo de
negocio o una intención que ninguna de las existentes resuelve bien.

## 1. Qué es una plantilla aquí

Una plantilla (`TemplateDefinitionV2` en `lib/site/v2-templates.ts`) es la composición
completa de un sitio: una lista ordenada de secciones, cada una con filas, columnas y widgets
enlazados a los datos del negocio, más un tema (colores, tipografías, radio, animación).

Se construye con funciones puras: `section()`, `row()`, `column()`, `widget()`, `heading()`,
`text()`, `button()`, `image()`, `nav()`, `header()`, `footer()`. No se escribe HTML suelto.

Las seis familias actuales y su intención (referencia de lo que NO hay que repetir):

| Familia | Intención | Motion |
|---|---|---|
| conversion | Oferta directa, evidencia y formulario en un recorrido comercial | stagger |
| editorial | Lectura narrativa, serif protagonista, imágenes amplias | subtle |
| catalog | Colecciones, oferta visual, comparación rápida | stagger |
| local | Confianza, ubicación y contacto inmediato | subtle |
| immersive | Medios a pantalla completa, alto contraste | cinematic |
| minimal | Jerarquía tipográfica, mucho espacio, una sola acción | none |

## 2. El aporte: por qué existe cada plantilla

Toda plantilla nueva debe justificar su existencia en una frase antes de escribir código:
**"Esta plantilla es para [tipo de negocio/intención] y aporta [composición o recurso] que
ninguna de las seis actuales ofrece."**

Aportes válidos (al menos uno, idealmente varios):
- **Una intención de negocio distinta** (p. ej. reservas, portafolio de proyectos, evento con
  fecha, menú de restaurante, servicios profesionales por cita).
- **Una composición estructural nueva** (orden de secciones, ritmo, tipo de hero) que produce
  un fingerprint distinto en el guardarraíl de diseño.
- **Un uso distinto de los widgets existentes** (p. ej. galería como protagonista, acordeón
  como sección central, mapa y datos como eje).

Aporte inválido (rechazo automático): cambiar solo colores, fuentes u orden menor de una
plantilla existente. Eso es una variante de tema, no una plantilla.

## 3. Composición: materiales disponibles

Una plantilla solo puede usar estos materiales. No se inventan widgets ni slots.

### 3.A Widgets
`brand`, `nav`, `heading`, `text`, `image`, `video`, `button`, `business_info`, `list`,
`gallery`, `testimonials`, `accordion`, `form`, `social`, `map`, `divider`, `spacer`, `embed`.

Cada widget tiene variantes (el string `variant`). Vocabulario ya en uso, reutilizar antes de
inventar:
- `list`: cards, minimal, editorial, catalog, pills, metrics, numbered, bento, badges.
- `gallery`: grid, mosaic, filmstrip, editorial.
- `testimonials`: cards, quotes, featured, list, wall.
- `image`: framed, wide, product, rounded, portrait, monochrome, offset.
- `form`: card, minimal, inline, split, dark.
- `header`: bar, minimal, floating, overlay.
- `footer`: columns, editorial, local, dark, minimal.

### 3.B Slots de contenido (de dónde salen los textos)
`business.name/type/logo/location/phone/email`, `hero.title/subtitle/body/ctaText/ctaLink/media`,
`about.title/subtitle/body/media/highlights`, `services`, `benefits`, `reviews`, `faqs`,
`contact.title/body/ctaText`, `media`, `social`.

Los widgets se enlazan a estos slots para que el contenido del negocio fluya a toda la
plantilla. Nunca se escribe texto fijo de negocio en la plantilla; se usa el slot.

### 3.C Tokens de estilo por sección/columna/widget
`color`, `background`, `backgroundImage`, `align`, `fontSize` (xs, sm, md, lg, xl, 2xl,
display), `fontWeight` (normal, medium, semibold, bold, black), `padding`, `gap`, `radius`,
`shadow`, `width` (content, wide, full). Responsive: `desktop`, `tablet`, `mobile`.

### 3.D Tema
`primary`, `secondary`, `accent`, `background`, `text`, `muted`, `headingFont`, `bodyFont`,
`radius` (none, sm, md, lg, pill), `motion` (none, subtle, stagger, cinematic).

## 4. Requisitos obligatorios (todos, sin excepción)

Una plantilla no es válida si falla cualquiera de estos:

1. **Header y footer globales**: toda plantilla empieza con `header(...)` y termina con
   `footer(...)`. El resto son secciones `main`.
2. **Hero como primera sección main**: primera impresión clara, con título (`hero.title` como
   `h1`), apoyo y una acción primaria (`button()`).
3. **Una sola acción primaria por sitio**: un único intent de CTA (contacto/cotización/reserva)
   repetido, no tres botones que compiten. Sin CTAs de intención duplicada.
4. **Ruta de conversión**: debe existir una sección de contacto con `form` enlazado a los
   slots de contacto.
5. **Contenido enlazado a slots**: cero texto de negocio fijo; todo por slot.
6. **Fingerprint estructural distinto**: la composición debe pasar `npm run check:design`
   (mínimo 7 por familia, fingerprints únicos, afinidad por industria). Ver sección 6.
7. **Coherencia de tema (theme lock)**: un solo modo (claro u oscuro) y una sola paleta en
   toda la plantilla. Ninguna sección invierte el tema a mitad del sitio.
8. **Contraste AA**: todo texto y botón sobre su fondo cumple WCAG AA (4.5:1 texto normal,
   3:1 texto grande). Especial cuidado con secciones de `background` oscuro o `backgroundImage`.
9. **Responsive real**: cada layout multicolumna colapsa correctamente en móvil. Sin
   desbordamiento horizontal. El hero cabe en el viewport inicial.
10. **Sin secciones vacías**: si una sección puede quedarse sin datos, debe colapsar con
    dignidad, no dejar un bloque en blanco.
11. **thumbnail**: SVG de vista previa en `/public/templates/v2/<id>.svg`.
12. **Descripción honesta**: `name` y `description` claros, en español, sin jerga.

## 5. Reglas de diseño (calidad, no solo funcionamiento)

Estas reglas separan una plantilla que funciona de una excepcional. Alineadas con la skill
design-taste-frontend y las preferencias del proyecto.

- **Anti-defecto de IA**: nada de gradientes morados genéricos, tres tarjetas idénticas en
  fila, glassmorphism en todo, ni Inter por defecto en todo. Cada familia elige tipografía con
  intención.
- **Un acento por plantilla**: un solo color de acento, usado igual en todo el sitio.
- **Un sistema de esquinas**: un solo `radius` coherente en botones, tarjetas e imágenes.
- **Ritmo, no repetición**: no repetir la misma familia de layout en secciones consecutivas.
  Alternar hero, split, bento, ancho completo, galería. Máximo dos "imagen + texto" seguidas.
- **Jerarquía tipográfica clara**: un `h1` por página, escala coherente h1/h2/h3/cuerpo.
- **Galerías tipo bento tipográfico**: imagen por celda con estructura, nunca imágenes sueltas
  con formas decorativas.
- **Sin emojis** en ningún texto ni marcado de la plantilla.
- **Imágenes reales**: los slots de media esperan fotografía real; nada de rectángulos falsos
  ni SVG decorativos hechos a mano.
- **Copy de ejemplo digno**: los textos por defecto deben leerse como un negocio real, no
  "Lorem ipsum" ni nombres genéricos tipo "Acme".

## 6. Regla de diversidad (el guardarraíl)

`scripts/check-design-diversity.mjs` corre en `prebuild` y `prelint`. Una plantilla nueva
debe:
- Tener un **fingerprint estructural único** frente a las demás (orden y tipo de secciones,
  no solo tema).
- No reducir por debajo del mínimo de composiciones por familia.
- Mantener afinidad por industria coherente.

Si `npm run check:design` no pasa, la plantilla no es distinta de verdad. Rehacer la
composición, no forzar el guardarraíl.

## 7. Animación de entrada

- El nivel de animación se define en el tema (`motion`). Elegir el que corresponde a la
  personalidad: `minimal` estático, `immersive` cinemático, comercial escalonado.
- La animación debe estar **motivada** (jerarquía, revelado narrativo), no decorativa.
- **Obligatorio respetar `prefers-reduced-motion`**: toda animación colapsa a estático.
- Si el sistema de scroll-reveal por sección está disponible, la plantilla debe verse bien
  tanto con animación activa como desactivada.

## 8. Definición de excepcional

Una plantilla es excepcional (no solo válida) cuando cumple todo lo obligatorio y además:

- Un dueño de negocio de esa industria la vería y pensaría "esto es para mí", sin explicación.
- La primera pantalla comunica la propuesta de valor y la acción sin hacer scroll.
- La composición tiene al menos un momento memorable (un hero con carácter, una galería que
  luce, una sección de prueba social que convence) que no se siente plantilla.
- Se ve igual de cuidada en móvil que en escritorio.
- Nada en ella delata que la hizo una máquina: ni copy genérico, ni layout de relleno, ni
  contraste roto, ni secciones vacías.

Si al verla terminada no dirías "esta la publicaría para un cliente real hoy", no está lista.

## 9. Checklist de aceptación (antes de agregar al catálogo)

- [ ] Aporte declarado en una frase (sección 2) y distinto de las seis familias.
- [ ] Header y footer globales; hero como primera sección main.
- [ ] Una sola acción primaria; ruta de conversión con `form`.
- [ ] Todo el contenido enlazado a slots; sin texto de negocio fijo.
- [ ] Solo widgets, variantes, slots y tokens existentes.
- [ ] Theme lock: un modo, una paleta, un acento, un sistema de esquinas.
- [ ] Contraste AA en todo texto y botón, incluidas secciones oscuras o con imagen de fondo.
- [ ] Responsive verificado; hero cabe en viewport; sin desbordamiento móvil.
- [ ] Sin secciones vacías; colapso digno cuando falta contenido.
- [ ] Ritmo de layouts variado; sin tres bloques repetidos seguidos.
- [ ] Sin emojis; galerías bento tipográficas; imágenes reales; copy digno.
- [ ] `motion` acorde a la personalidad; respeta `prefers-reduced-motion`.
- [ ] thumbnail SVG en `/public/templates/v2/`.
- [ ] `npm run check:design` pasa (fingerprint único).
- [ ] `npx tsc --noEmit`, `npm run lint`, `npm run test:unit` en verde.
- [ ] Revisión visual en escritorio y móvil: se publicaría para un cliente real hoy.
