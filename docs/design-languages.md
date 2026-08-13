# Lenguajes visuales V2

El constructor ya no parte de plantillas completas. Parte de contenido estructurado, un lenguaje visual y una biblioteca de bloques independientes.

## Los lenguajes disponibles

- Bauhaus UI: geometría directa, contraste fuerte, jerarquías de cartel, bordes duros y composición más expresiva.
- Swiss Design: retícula rigurosa, tipografía neutral, reglas finas y prioridad absoluta a la claridad.
- Editorial UI: tipografía expresiva, ritmo amplio, imágenes protagonistas y lectura narrativa.
- Industrial Utility: jerarquía de obra, evidencia verificable y ruta corta hacia llamada o cotización.
- Storm Response: lectura de despacho para roofing, restauración, plomería y HVAC. Emergencia visible, disponibilidad declarada y reclamo de seguro explicado.
- Before & After: para pintura, limpieza, pisos y lavado a presión. La prueba es la transformación, con comparación arrastrable y contraste de dos tonos.

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

La selección de lenguaje usa un ranking determinista de costo constante. Evalúa el estilo solicitado, el tipo de negocio, el objetivo, la longitud narrativa y la cantidad de medios. El resultado incluye puntaje y razones.

Industrial y Storm comparten el terreno de los oficios de obra y se separan por la urgencia: un contratista de techos cae en Industrial, y pasa a Storm cuando el negocio se describe con tormenta, granizo, daño por agua, filtración, restauración, plomería, HVAC o emergencia. Storm también gana cuando el objetivo depende de contestar la llamada en el momento.

El compositor representa la página como etapas ordenadas con varios nodos candidatos por lenguaje. Un recorrido exacto elige la ruta global con mejor puntuación y penaliza bloques consecutivos con la misma densidad, composición o contraste. Esos perfiles se declaran en el registro canónico; no se deducen del nombre del bloque. El grafo es pequeño, por lo que no necesita dependencias ni búsqueda aproximada.

## Recetas funcionales

Las recetas `storm-response`, `before-after`, `contractor-pro`, `local-leads`, `appointments`, `catalog` y `portfolio` definen el orden narrativo y una afinidad de lenguaje. Se seleccionan mediante un ranking explicable basado en objetivo y actividad. No contienen HTML, colores ni fuentes: una misma receta puede resolverse en cualquier lenguaje y siempre conserva las variables del cliente.

Los oficios se reparten por cómo se decide la contratación, no por su gremio: obra y mantenimiento técnico van a `contractor-pro`, la emergencia a `storm-response`, y los que se juzgan por el resultado sobre la superficie (pintura, limpieza, pisos, lavado a presión) a `before-after`.

`contractor-pro` y `storm-response` reciben la misma puntuación base por oficio de obra, así que la urgencia declarada en el listado de servicios es lo único que decide entre ellas. `storm-response` invierte el orden habitual: la disponibilidad va antes que el catálogo de servicios, porque durante una emergencia el visitante primero necesita saber que alguien contesta.

La decisión completa queda fijada en el plan de generación y llega a persistencia. Así, el prompt, el compositor, el editor y el sitio publicado trabajan con la misma receta y el mismo lenguaje visual.

## Regla de extensión

Un bloque nuevo debe funcionar de forma independiente, usar contenido por slots y declarar en qué etapas y lenguajes es compatible. No debe duplicar una página completa ni fijar la paleta del cliente.
