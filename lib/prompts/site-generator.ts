import {
  GOAL_LABELS,
  LANGUAGE_LABELS,
  STRUCTURE_TYPE_LABELS,
  VISUAL_STYLE_LABELS,
  resolveBusinessTypeLabel,
  type OnboardingInput,
} from "@/lib/validators/site-onboarding";

/**
 * Builds the system + user prompts for the site generator model.
 * The model must return ONLY valid JSON matching the blueprint schema.
 */
export function buildSiteGenerationPrompt(input: OnboardingInput): {
  system: string;
  user: string;
} {
  const businessType = resolveBusinessTypeLabel(input);
  const goal = GOAL_LABELS[input.goal] ?? input.goal;
  const visualStyle = VISUAL_STYLE_LABELS[input.visualStyle] ?? input.visualStyle;
  const structure = STRUCTURE_TYPE_LABELS[input.structureType] ?? input.structureType;
  const language = LANGUAGE_LABELS[input.language] ?? input.language;

  const system = `Eres un generador profesional de sitios web para pequeñas y medianas empresas.
Tu trabajo es crear estructuras web listas para renderizar en React.
No devuelvas explicación.
Devuelve únicamente JSON válido siguiendo el schema pedido.
El sitio debe estar optimizado para conversión, SEO local, claridad comercial y confianza.
Usa textos naturales, profesionales y específicos al tipo de negocio.
No inventes datos sensibles.
Si falta información, usa placeholders razonables.
No incluyas HTML inseguro.
No incluyas JavaScript.
No uses markdown.
No uses comentarios.
Solo JSON válido.
El JSON debe ser compatible con un renderer de bloques React.

Tipos de sección permitidos (campo "type"): hero, services, about, benefits, testimonials, gallery, faq, contact, cta, trust_badges, process, pricing, location, footer.

Reglas de estructura (IMPORTANTE):
- Genera SIEMPRE un conjunto RICO y COMPLETO de secciones con contenido real y específico, en una sola página (slug "/"). El sistema decidirá luego cuáles mostrar según la estructura elegida, así que tú genera todas estas:
  1. "hero" (título potente, subtítulo, body breve, ctaText, imagePrompt descriptivo en inglés)
  2. "services" con 4 a 6 items en settings.items: { "name": "", "description": "" }
  3. "benefits" con 3 a 4 items en settings.items: { "title": "", "description": "" }
  4. "about" (title, subtitle, body de 2-3 frases, imagePrompt en inglés)
  5. "testimonials" con 2 a 3 items en settings.items: { "name": "", "quote": "", "role": "" }
  6. "faq" con 3 a 5 items en settings.items: { "question": "", "answer": "" }
  7. "gallery" (title + subtitle)
  8. "location" (title + body con la zona de servicio)
  9. "cta" (title, subtitle, ctaText)
  10. "contact" (title, body breve, ctaText)
  11. "footer" (title con el nombre del negocio, subtitle corto)
- "imagePrompt" debe describir en INGLÉS una foto profesional realista y específica al negocio (ej: "modern roof installation on a suburban house, sunny day").
- El texto debe sonar profesional y específico al tipo de negocio, NO genérico.
- El idioma del contenido (títulos, textos) debe respetar la selección del usuario.

Schema EXACTO de salida (devuelve exactamente esta forma):
{
  "site": {
    "businessName": "",
    "businessType": "",
    "language": "",
    "goal": "",
    "tone": "",
    "visualStyle": {
      "name": "",
      "colors": { "primary": "", "secondary": "", "accent": "", "background": "", "text": "" },
      "fontStyle": "",
      "designNotes": ""
    },
    "seo": {
      "title": "",
      "metaDescription": "",
      "mainKeyword": "",
      "secondaryKeywords": []
    },
    "pages": [
      {
        "slug": "",
        "title": "",
        "description": "",
        "sections": [
          {
            "type": "hero",
            "title": "",
            "subtitle": "",
            "body": "",
            "ctaText": "",
            "ctaLink": "",
            "imagePrompt": "",
            "settings": {}
          }
        ]
      }
    ]
  }
}

Notas de contenido por sección:
- "services": en "settings" incluye un arreglo "items" con objetos { "name": "", "description": "" } (3 a 6 servicios).
- "benefits": en "settings" incluye "items" con objetos { "title": "", "description": "" } (3 a 4).
- "testimonials": en "settings" incluye "items" con objetos { "name": "", "quote": "", "role": "" } (2 a 3).
- "faq": en "settings" incluye "items" con objetos { "question": "", "answer": "" } (3 a 5).
- "trust_badges": en "settings" incluye "items" con strings cortos (ej: "Licenciado y asegurado").
- "contact": usa body para una invitación breve; los datos de contacto vienen del negocio.
- Los colores deben ser hex válidos (ej: "#1d4ed8") y coherentes con el estilo visual elegido.`;

  const user = `Genera el sitio web con estos datos del negocio:

- Nombre del negocio: ${input.businessName}
- Tipo de negocio: ${businessType}
- Objetivo principal del sitio: ${goal}
- Estilo visual deseado: ${visualStyle}
- Estructura solicitada: ${structure}
- Idioma del contenido: ${language}
- Ubicación / zona de servicio: ${input.location || "(no especificada, usa un placeholder local razonable)"}
- Teléfono: ${input.phone || "(no especificado)"}
- Email: ${input.email || "(no especificado)"}
- Dominio: ${input.domain || "(no especificado)"}

Devuelve únicamente el JSON del sitio siguiendo el schema. Nada más.`;

  return { system, user };
}
