# Plan de trabajo: cerrar el ciclo del Editor V2

Objetivo: llevar el Editor V2 de "funcional" a "completo" al nivel de un builder tipo Elementor.
Duración estimada: 1 a 2 semanas. El editor ya tiene selección en lienzo, panel único
contextual, ajustes por bloque, drag and drop desde el panel, deshacer/rehacer, publicar y
menú contextual por niveles. Este plan cubre lo que falta para cerrar la experiencia.

## Estado actual (punto de partida)

Componentes y archivos base:
- `components/builder/SiteEditorV2.tsx` — editor, panel, lienzo (iframe), historial, menú contextual.
- `components/builder/V2WidgetSettings.tsx` — ajustes específicos por tipo de bloque.
- `lib/site/v2-render.ts` — genera el HTML del sitio; modo `editable` inyecta selección,
  drag and drop, undo/redo y clic derecho vía `postMessage`.
- `lib/site/v2-schema.ts` — esquema Zod: `WidgetV2`, `CanvasSectionV2`, `ThemeTokensV2`,
  `StyleTokensV2`, `ResponsiveStyleV2`.
- `lib/site/v2-section-library.ts` — bloques de sección independientes para el lienzo.

Lo que ya funciona: agregar/editar/eliminar/duplicar/mover bloques, secciones y columnas;
selección bidireccional lienzo-panel; publicar; historial global con Ctrl+Z / Ctrl+Y.

## Alcance de este ciclo

Cuatro entregables, en orden de prioridad:

1. Edición de texto inline en el lienzo.
2. Copiar/pegar bloque y copiar/pegar estilo (segunda tanda del menú contextual).
3. Pestaña Diseño completa (tipografías, radio de esquinas, animación).
4. Estilos de sección (fondo de color o imagen, espaciado, ancho).

Fuera de alcance de este ciclo (van al siguiente): edición por dispositivo real,
biblioteca de bloques guardados, generación de secciones con IA, tests E2E Playwright.

---

## Entregable 1 — Edición de texto inline

Doble clic sobre un título, párrafo o botón en el lienzo permite escribir directamente,
sin pasar por el panel. Es el salto de calidad más visible frente a Elementor.

### Enfoque técnico
- En `v2-render.ts`, modo editable: marcar los widgets de texto (`heading`, `text`, `button`)
  con `data-editable-text="1"`. Al `dblclick` sobre uno, poner `contentEditable="true"`,
  enfocar y seleccionar el contenido.
- Al perder foco (`blur`) o presionar Escape/Enter, enviar por `postMessage`
  `{ kind: "edit-text", id, value }` con el texto plano resultante (usar `innerText`, no HTML,
  para no inyectar marcado arbitrario).
- En `SiteEditorV2.tsx`, manejar ese mensaje: si el widget tiene `slot`, escribir con
  `setContentSlot`; si no, actualizar `widget.data.text`. Pasa por `pushHistory` para que
  el inline entre en el ciclo de deshacer.
- Mientras se edita inline, suspender la selección por clic normal y el clic derecho para
  no interferir; reactivar al salir.

### Consideraciones
- Sanitizar: solo texto plano. El render ya escapa con `escapeHtml`, así que el valor
  guardado nunca contiene HTML.
- Debounce del preview (250ms) ya existe; el inline escribe en el DOM del iframe en vivo y
  solo confirma al salir, así que no hay parpadeo.
- No romper `prefers-reduced-motion` ni el sandbox del iframe.

### Archivos
- `lib/site/v2-render.ts` (script del editor + marcado).
- `components/builder/SiteEditorV2.tsx` (manejo de `edit-text`).

### Criterios de aceptación
- Doble clic en un título lo vuelve editable, el cursor aparece y se puede escribir.
- Al salir, el texto persiste en el estado y aparece en el panel de ajustes.
- Ctrl+Z revierte la edición inline como un solo paso.
- El texto guardado nunca contiene etiquetas HTML.
- Funciona en `heading`, `text` y `button`; los demás bloques ignoran el doble clic.

### Esfuerzo: 2 días

---

## Entregable 2 — Copiar/pegar bloque y copiar/pegar estilo

Extiende el menú contextual (`CanvasContextMenu`) ya existente. Dos operaciones:
copiar un bloque completo y pegarlo en otra columna, y copiar solo el estilo de un
bloque para aplicarlo a otro del mismo tipo.

### Enfoque técnico
- Portapapeles interno en `localStorage` (clave `cluster:v2-clipboard`) para que funcione
  entre secciones e incluso entre sitios del mismo usuario en pestañas distintas.
- Estructura del portapapeles:
  `{ mode: "widget" | "style", widget: WidgetV2 }`. Validar al pegar con el esquema Zod
  antes de insertar (nunca confiar en el contenido del localStorage).
- Copiar bloque: guarda `structuredClone(widget)`. Pegar bloque: clona con id nuevo y lo
  inserta después del bloque destino (o al final de la columna si se pega sobre una columna).
- Copiar estilo: guarda solo `{ style, variant }`. Pegar estilo: aplica `style` y `variant`
  al widget destino, sin tocar su contenido. Habilitado solo si el portapapeles tiene
  `mode: "style"`.
- Nuevas entradas del menú contextual, agrupadas: "Copiar widget", "Pegar aquí"
  (visible si hay algo copiado), "Copiar estilo", "Pegar estilo".

### Consideraciones
- El "Pegar estilo" debería avisar si el widget origen y destino son de tipos distintos
  (el estilo es genérico y se aplica igual, pero la variante puede no tener sentido);
  aplicar solo `style` cuando los tipos difieren, y `style` + `variant` cuando coinciden.
- Todo pasa por `mutateSections` / `pushHistory`.

### Archivos
- `components/builder/SiteEditorV2.tsx` (acciones + entradas de menú + estado del portapapeles).

### Criterios de aceptación
- Copiar un widget y pegarlo en otra columna crea una copia con id nuevo.
- Copiar estilo de un botón y pegarlo en otro botón replica alineación, espaciado y variante.
- Pegar estilo entre tipos distintos aplica solo el estilo genérico, no la variante.
- El portapapeles sobrevive a recargar la página.
- Contenido inválido en localStorage no rompe el editor (se ignora).

### Esfuerzo: 1.5 días

---

## Entregable 3 — Pestaña Diseño completa

Hoy la pestaña Diseño solo expone los seis colores. El esquema `ThemeTokensV2` ya soporta
`headingFont`, `bodyFont`, `radius` y `motion`, pero no hay UI. Trabajo barato, alto retorno.

### Enfoque técnico
- En la pestaña Diseño de `SiteEditorV2.tsx`, agregar tres controles nuevos bajo los colores:
  - **Tipografía**: selector de pares de fuentes predefinidos (título + cuerpo). Definir
    una lista corta y curada (p. ej. 6 a 8 combinaciones) en una constante, cada una con su
    `headingFont` y `bodyFont`. Aplicar ambos a la vez con `applyDesign`.
  - **Esquinas**: selector de `radius` (`none`, `sm`, `md`, `lg`, `pill`) con etiquetas en
    español ("Rectas", "Suaves", "Redondeadas", "Muy redondeadas", "Píldora").
  - **Animación**: selector de `motion` (`none`, `subtle`, `stagger`, `cinematic`) con
    etiquetas claras ("Sin animación", "Sutil", "Escalonada", "Cinemática").
- El render ya consume estos tokens (`baseCss` usa `--heading`, `--body`, `--radius` y
  las clases `v2-motion-*`), así que no hay cambios en `v2-render.ts`.

### Consideraciones
- Las fuentes deben cargarse en el sitio publicado. Verificar cómo se sirven hoy
  (system-ui como fallback ya está). Si se eligen fuentes web, incluir el `@font-face` o el
  enlace correspondiente en el `<head>` del render; si no es viable en este ciclo, limitar
  la lista a familias con buen fallback de sistema y dejar las fuentes web para después.
- Cambiar tipografía o radio pasa por `pushHistory` (ya cubierto por `applyDesign`).

### Archivos
- `components/builder/SiteEditorV2.tsx` (controles nuevos + lista de pares tipográficos).
- `lib/site/v2-render.ts` solo si se agregan fuentes web (carga en `<head>`).

### Criterios de aceptación
- Cambiar el par tipográfico actualiza títulos y cuerpo en el preview.
- Cambiar las esquinas afecta botones, tarjetas e imágenes de forma consistente.
- Cambiar la animación se refleja al recargar el preview y respeta `prefers-reduced-motion`.
- Todo entra en el historial (Ctrl+Z revierte).

### Esfuerzo: 1.5 días (3 si se incluyen fuentes web con carga propia)

---

## Entregable 4 — Estilos de sección

Fondo (color o imagen), espaciado y ancho por sección desde el panel. El esquema ya lo
soporta (`CanvasSectionV2.style` es `ResponsiveStyleV2`; el render aplica
`section.style` en `dynamicCss`). Falta la UI.

### Enfoque técnico
- Cuando la selección es una sección (`selection.kind === "section"`), el `SelectionPanel`
  hoy solo ofrece agregar filas. Añadir controles de estilo de sección:
  - **Fondo**: color (input `color`) o imagen (reutilizar `EditorMediaField tone="light"`,
    guardar la URL en `section.style.desktop.background`). Definir si se usa `background`
    con color o con `url(...)`; el token `background` del render acepta un color hex hoy, así
    que para imagen puede requerirse extender `StyleTokensV2` con un campo `backgroundImage`
    y ajustar `tokensCss`.
  - **Espaciado vertical**: selector de `padding` (`none`..`xl`).
  - **Ancho del contenido**: selector de `width` (`content`, `wide`, `full`).
- Escribir con una variante de `mutateSections` que actualice `section.style.desktop`.

### Consideraciones
- Extender el esquema con cuidado: si se agrega `backgroundImage` a `StyleTokensV2`,
  actualizar `styleSchema` (Zod), `tokensCss` en `v2-render.ts` y el tipo TS. Cambio pequeño
  pero toca esquema, así que revisar `normalizeCanvasSectionsV2` y los 45 tests de esquema.
- Respetar el bloqueo de tema (una sección con fondo claro dentro de un sitio oscuro rompe
  la coherencia; documentarlo, no bloquearlo).
- Contraste: si el fondo de la sección cambia, el texto puede quedar ilegible. Considerar un
  aviso suave, no obligatorio en este ciclo.

### Archivos
- `components/builder/SiteEditorV2.tsx` (`SelectionPanel`, rama de sección).
- `lib/site/v2-schema.ts` (si se agrega `backgroundImage`).
- `lib/site/v2-render.ts` (`tokensCss` si se agrega imagen de fondo).
- `tests/` (actualizar si cambia el esquema).

### Criterios de aceptación
- Seleccionar una sección permite cambiar su color de fondo y verlo en el preview.
- Se puede poner una imagen de fondo a una sección.
- El espaciado y el ancho de la sección se pueden ajustar.
- El esquema sigue validando y los tests unitarios pasan.

### Esfuerzo: 2 días

---

## Secuencia sugerida (por días)

| Día | Trabajo |
|---|---|
| 1-2 | Entregable 1: edición de texto inline |
| 3-4 | Entregable 2: copiar/pegar bloque y estilo |
| 5-6 | Entregable 3: pestaña Diseño (tipografía, esquinas, animación) |
| 7-8 | Entregable 4: estilos de sección (incluye cambio de esquema) |
| 9 | Pasada de pulido: consistencia visual del panel, textos en español sin jerga |
| 10 | Verificación integral: tipos, lint, 45 tests, prueba manual del flujo completo |

## Riesgos y mitigaciones

- **Fuentes web** (Entregable 3): si cargarlas en el render es más costoso de lo previsto,
  limitar la primera versión a familias con buen fallback de sistema. No bloquea el resto.
- **Cambio de esquema** (Entregable 4): tocar `StyleTokensV2` afecta Zod, render y tests.
  Hacerlo aditivo (campo opcional nuevo), nunca renombrar los existentes.
- **contentEditable** (Entregable 1): manejar bien el foco y evitar que el clic derecho o la
  selección normal interfieran mientras se edita. Probar en Chrome, Firefox y Safari.

## Definición de terminado (todo el ciclo)

- `npx tsc --noEmit` sin errores.
- `npx eslint` limpio en los archivos tocados.
- `npm run test:unit` con 45/45 (o más, si se agregan pruebas de esquema).
- Prueba manual: crear un sitio, editar texto inline, copiar/pegar un bloque, cambiar
  tipografía y esquinas, poner fondo a una sección, deshacer con Ctrl+Z, guardar y publicar.
- El sitio publicado no incluye nada del código del modo editor.

## Siguiente ciclo (referencia, fuera de este plan)

Auditoría de diseño del render con la skill design-taste-frontend, SEO por sitio, bandeja de
leads en el dashboard, edición por dispositivo real y tests E2E del editor.
