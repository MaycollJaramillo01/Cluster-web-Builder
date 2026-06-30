# Control interno de calidad del copy

Fecha: 2026-06-29

## Flujo implementado

1. El prompt exige que la IA se autoevalúe y reescriba silenciosamente antes de devolver JSON.
2. El servidor audita el JSON antes de persistirlo.
3. Si alguna métrica falla, el servidor mejora el texto usando exclusivamente los datos verificados del onboarding.
4. No se muestran puntuaciones, errores editoriales ni solicitudes adicionales al cliente.

## Métricas

- SEO title: 25-65 caracteres.
- Meta description: 80-165 caracteres.
- Hero title: 8-72 caracteres.
- Hero subtitle: 12-110 caracteres.
- Hero body: 45-240 caracteres.
- CTA del hero: 1-5 palabras.
- Títulos de sección: 4-80 caracteres.
- Copy de About, contacto y CTA: 35-360 caracteres.
- Descripciones y respuestas: 25-200 caracteres.
- Sin párrafos repetidos ni frases genéricas prohibidas.

## Seguridad editorial

La mejora no puede inventar servicios, precios, ubicaciones, experiencia, licencias, garantías, clientes, testimonios ni resultados. Los textos de respaldo se construyen con nombre, actividad, servicios, audiencia, ubicación y objetivo ya confirmados.

## Pruebas

- `npm run test:fast-prompt`: correcto.
- Proyecto de pesca generado en 2.76 segundos.
- SEO, hero, CTA y frases prohibidas verificados sobre el registro persistido.
- `npm run lint`: correcto, con una advertencia preexistente en `OnboardingWizard.tsx`.
- `npm run build`: correcto.
