# ADR 0002: plantillas como documentos de bloques V2

## Estado

Aceptado — 2026-07-02.

## Decisión

Las plantillas V2 son semillas JSON inmutables. Aplicarlas crea UUID nuevos y copia header, secciones y footer al sitio. Después de esa copia, `SiteSection.order` y el documento persistido son la única autoridad; `templateId` es metadato.

El contenido reutilizable vive en `Site.contentJson`, los tokens globales en `Site.designJson` y cada sección usa `type = canvas`. Los widgets con `slot` leen `SiteContent`; los widgets sin slot guardan datos locales. No se admite HTML, JavaScript ni CSS escrito por el usuario.

La IA produce únicamente contenido, SEO y consultas de medios. Las seis composiciones válidas (`conversion`, `editorial`, `catalog`, `local`, `immersive`, `minimal`) viven en código controlado y validado.

Preview, publicación y ZIP llaman a `renderSiteV2()`. El editor no mantiene un renderer paralelo.

## Compatibilidad

Los publicados V1 permanecen congelados. Al editar se crea una copia V2 relacionada mediante `replacesSiteId`. Publicar esa copia crea una revisión, reemplaza el documento sobre el sitio original y conserva URL, dominio, propietario, leads y métricas.

Los borradores V1 solo se eliminan mediante `scripts/delete-generated-v1.mjs`, que exige un respaldo comprimido, checksum, prueba de lectura y un conteo exacto de 73.

## Consecuencias

- Cambiar de plantilla conserva `SiteContent` y las secciones personalizadas sin slots.
- El editor puede reordenar secciones, filas y widgets sin lógica específica por preset.
- V1 y V2 pueden convivir hasta que el último publicado haya migrado.
- Añadir una variante visual ya no requiere otro motor global: se añade una sección reutilizable o una plantilla completa solo si la estructura es realmente distinta.
