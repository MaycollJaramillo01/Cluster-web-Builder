# Lenguajes visuales V2

El constructor ya no parte de plantillas completas. Parte de contenido estructurado, un lenguaje visual y una biblioteca de bloques independientes.

## Los tres lenguajes iniciales

- Bauhaus UI: geometría directa, contraste fuerte, jerarquías de cartel, bordes duros y composición más expresiva.
- Swiss Design: retícula rigurosa, tipografía neutral, reglas finas y prioridad absoluta a la claridad.
- Editorial UI: tipografía expresiva, ritmo amplio, imágenes protagonistas y lectura narrativa.

Cada paquete define cinco cosas distintas:

1. Tipografía, forma, capitalización y movimiento predeterminados.
2. Variables de gramática para ancho, reglas, interlineado y tracking.
3. Candidatos de bloque compatibles para cada etapa de la página.
4. Principios descriptivos que permiten explicar la decisión.
5. Diales de varianza, movimiento y densidad para evolución futura.

## Separación de responsabilidades

```text
Contenido del negocio
        |
Señales de estilo y actividad
        |
Ranking de receta funcional
        |
Ranking de lenguajes
        |
Grafo acíclico de etapas
        |
Bloques Tailwind compatibles
        |
Tokens variables del cliente
        |
Renderer V2
```

La paleta es ortogonal al lenguaje. Cambiar de Bauhaus a Editorial conserva `primary`, `secondary`, `accent`, `background`, `text` y `muted`. El lenguaje modifica la gramática y el conjunto de composiciones compatibles.

La fuente también es editable. Al seleccionar un lenguaje se aplica su par recomendado; después el usuario puede escoger otro par sin perder el lenguaje ni la paleta.

## Selección actual

La selección de lenguaje usa un ranking determinista de costo constante porque solo existen tres opciones. Evalúa el estilo solicitado, el tipo de negocio, el objetivo, la longitud narrativa y la cantidad de medios. El resultado incluye puntaje y razones.

El compositor representa la página como etapas ordenadas con varios nodos candidatos por lenguaje. Un recorrido exacto elige la ruta global con mejor puntuación y penaliza bloques consecutivos con la misma densidad, composición o contraste. Esos perfiles se declaran en el registro canónico; no se deducen del nombre del bloque. El grafo es pequeño, por lo que no necesita dependencias ni búsqueda aproximada.

## Recetas funcionales

Las recetas `local-leads`, `appointments`, `catalog` y `portfolio` definen el orden narrativo y una afinidad de lenguaje. Se seleccionan mediante un ranking explicable basado en objetivo y actividad. No contienen HTML, colores ni fuentes: una misma receta puede resolverse en Bauhaus, Swiss o Editorial y siempre conserva las variables del cliente.

La decisión completa queda fijada en el plan de generación y llega a persistencia. Así, el prompt, el compositor, el editor y el sitio publicado trabajan con la misma receta y el mismo lenguaje visual.

## Regla de extensión

Un bloque nuevo debe funcionar de forma independiente, usar contenido por slots y declarar en qué etapas y lenguajes es compatible. No debe duplicar una página completa ni fijar la paleta del cliente.
