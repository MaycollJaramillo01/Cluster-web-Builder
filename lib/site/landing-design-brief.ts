import { randomInt } from "node:crypto";

import type { OnboardingInput } from "@/lib/validators/site-onboarding";

export const LANDING_DESIGN_STYLES = [
  "Neobrutalist",
  "Swiss/International",
  "Editorial",
  "Glassmorphism",
  "Retro-futuristic",
  "Bauhaus",
  "Art Deco",
  "Minimal",
  "Flat",
  "Material",
  "Neumorphic",
  "Monochromatic",
  "Scandinavian",
  "Japandi",
  "Dark Mode First",
  "Modernist",
  "Organic/Fluid",
  "Corporate Professional",
  "Tech Forward",
  "Luxury Minimal",
  "Neo-Geo",
  "Kinetic",
  "Gradient Modern",
  "Typography First",
  "Metropolitan",
] as const;

export type LandingDesignStyle = (typeof LANDING_DESIGN_STYLES)[number];

type VisualStyle = OnboardingInput["visualStyle"];

type StyleProfile = {
  mood: string;
  hierarchy: string;
  typography: string;
  interaction: string;
  references: string;
  visualStyle: VisualStyle;
};

const PROFILES: Record<LandingDesignStyle, StyleProfile> = {
  Neobrutalist: profile("directa, audaz y deliberadamente cruda", "bloques contundentes y contrastes francos", "grande, densa y desafiante", "rápida, seca y precisa", "carteles urbanos, imprenta experimental y arquitectura de hormigón", "bold"),
  "Swiss/International": profile("serena, racional y confiable", "una retícula rigurosa con ritmo editorial", "objetiva, nítida y altamente legible", "precisa, discreta y funcional", "señalética pública, retículas tipográficas y arquitectura funcional", "modern_clean"),
  Editorial: profile("sofisticada, curiosa y cultural", "titulares expresivos, pausas y composición narrativa", "elegante, humana y con contraste de escala", "fluida y pausada como pasar páginas", "revistas independientes, bibliotecas contemporáneas y fotografía de autor", "premium_elegant"),
  Glassmorphism: profile("etérea, tecnológica y envolvente", "capas translúcidas con profundidad controlada", "limpia, luminosa y contemporánea", "suave, líquida y con transiciones atmosféricas", "vidrio arquitectónico, luz refractada y espacios digitales inmersivos", "creative"),
  "Retro-futuristic": profile("optimista, nostálgica y visionaria", "composición cinematográfica con acentos luminosos", "geométrica, expresiva y ligeramente técnica", "dinámica, brillante y controlada", "ciencia ficción analógica, paneles espaciales y carteles de futuros imaginados", "bold"),
  Bauhaus: profile("clara, enérgica y universal", "formas primarias y equilibrio asimétrico", "funcional, geométrica y segura", "mecánica, alegre y exacta", "talleres modernistas, geometría elemental y diseño como función", "creative"),
  "Art Deco": profile("lujosa, teatral y refinada", "simetría, líneas verticales y detalles ornamentales medidos", "elegante, estilizada y ceremoniosa", "pulida, pausada y precisa", "vestíbulos monumentales, artes decorativas y geometría de entreguerras", "premium_elegant"),
  Minimal: profile("calmada, esencial y segura", "máximo espacio, pocas decisiones y foco absoluto", "sobria, silenciosa y de escala generosa", "casi invisible, suave y deliberada", "galerías blancas, objetos esenciales y arquitectura reductiva", "minimalist"),
  Flat: profile("amable, clara y accesible", "formas simples, color sólido y lectura inmediata", "directa, redonda y acogedora", "ágil, simple y predecible", "sistemas gráficos públicos, ilustración geométrica y señalética amistosa", "modern_clean"),
  Material: profile("familiar, ordenada y táctil", "superficies jerárquicas y profundidad sutil", "clara, equilibrada y funcional", "natural, receptiva y basada en causa y efecto", "papel, tinta, luz suave y objetos físicos bien construidos", "modern_clean"),
  Neumorphic: profile("suave, íntima y táctil", "controles moldeados dentro de superficies continuas", "serena, redondeada y contenida", "gentil, elástica y sensorial", "objetos moldeados, interiores silenciosos y materiales satinados", "minimalist"),
  Monochromatic: profile("cohesiva, segura y contemplativa", "profundidad creada por tono, escala y contraste", "disciplinada, elegante y consistente", "sutil, tonal y continua", "fotografía en duotono, grabado y espacios de una sola materia", "premium_elegant"),
  Scandinavian: profile("cálida, honesta y luminosa", "orden relajado, aire y detalles humanos", "amable, funcional y sin pretensión", "gentil, orgánica y reconfortante", "interiores nórdicos, madera clara, textiles naturales y luz de invierno", "local_trustworthy"),
  Japandi: profile("serena, artesanal y equilibrada", "asimetría tranquila y espacio con propósito", "discreta, cálida y muy legible", "lenta, orgánica y respetuosa", "casas de té, carpintería precisa, cerámica y calma nórdica", "premium_elegant"),
  "Dark Mode First": profile("inmersiva, premium y concentrada", "contraste luminoso sobre profundidad oscura", "nítida, moderna y de alto impacto", "sedosa, luminosa y cinematográfica", "salas de proyección, iluminación nocturna y controles de precisión", "bold"),
  Modernist: profile("atemporal, confiada y funcional", "líneas limpias, proporción y orden visible", "sobria, autoritativa y honesta", "precisa, silenciosa y útil", "arquitectura del siglo XX, mobiliario racional y claridad estructural", "modern_clean"),
  "Organic/Fluid": profile("vital, cercana y natural", "curvas que conducen la mirada sin rigidez", "humana, suave y expresiva", "líquida, continua y respirada", "paisajes erosionados, botánica, agua y arquitectura biomórfica", "creative"),
  "Corporate Professional": profile("estable, competente y confiable", "jerarquía ejecutiva, evidencia y llamadas claras", "autoritaria, sobria y accesible", "rápida, discreta y predecible", "salas de consejo contemporáneas, informes bien editados y arquitectura institucional", "corporate"),
  "Tech Forward": profile("innovadora, precisa y optimista", "datos, producto y beneficios en una secuencia clara", "cortante, contemporánea y segura", "rápida, fluida y ligeramente futurista", "laboratorios limpios, interfaces instrumentales y prototipos de ingeniería", "creative"),
  "Luxury Minimal": profile("exclusiva, silenciosa y segura de sí", "pocos elementos con proporciones impecables", "refinada, espaciosa y editorial", "lenta, pulida y casi imperceptible", "galerías privadas, sastrería, piedra natural y artesanía de precisión", "premium_elegant"),
  "Neo-Geo": profile("intelectual, rítmica y contemporánea", "patrones matemáticos y geometría modular", "estructural, limpia y de fuerte personalidad", "snappy, repetitiva y armoniosa", "arte geométrico, mosaicos, cartografía y sistemas modulares", "creative"),
  Kinetic: profile("enérgica, progresiva y viva", "dirección visual que siempre impulsa hacia adelante", "dinámica, condensada y expresiva", "rápida, elástica y coreografiada", "títulos de cine, danza contemporánea y escultura cinética", "bold"),
  "Gradient Modern": profile("luminosa, optimista y envolvente", "transiciones de color que separan momentos del relato", "amable, moderna y de alto contraste", "suave, continua y atmosférica", "luz al amanecer, vidrio coloreado y espacios inmersivos", "creative"),
  "Typography First": profile("expresiva, inteligente y memorable", "la letra como imagen, ritmo y navegación", "protagonista, distintiva y cuidadosamente compuesta", "precisa, editorial y guiada por el texto", "carteles culturales, composición tipográfica y poesía visual", "bold"),
  Metropolitan: profile("cosmopolita, culta y segura", "capas editoriales con ritmo urbano", "sofisticada, compacta y contemporánea", "fluida, veloz y elegante", "vestíbulos urbanos, mapas, piedra, metal y cultura de gran ciudad", "premium_elegant"),
};

function profile(
  mood: string,
  hierarchy: string,
  typography: string,
  interaction: string,
  references: string,
  visualStyle: VisualStyle
): StyleProfile {
  return { mood, hierarchy, typography, interaction, references, visualStyle };
}

export function selectRandomLandingStyle(): LandingDesignStyle {
  return LANDING_DESIGN_STYLES[randomInt(LANDING_DESIGN_STYLES.length)];
}

export function mapLandingStyleToVisualStyle(style: LandingDesignStyle): VisualStyle {
  return PROFILES[style].visualStyle;
}

export function mapLandingStyleToPaletteId(style: LandingDesignStyle): string {
  const paletteByStyle: Partial<Record<LandingDesignStyle, string>> = {
    Editorial: "luxury_light",
    "Art Deco": "luxury_light",
    Scandinavian: "spa_natural",
    Japandi: "spa_natural",
    "Dark Mode First": "cybersecurity",
    "Organic/Fluid": "spa_natural",
    "Tech Forward": "tech_saas",
    "Luxury Minimal": "luxury_light",
    "Retro-futuristic": "cybersecurity",
    "Gradient Modern": "startup_modern",
  };
  return paletteByStyle[style] ?? PROFILES[style].visualStyle;
}

/** Creates the exact three-paragraph art-direction prompt requested by the builder. */
export function buildLandingDesignBrief(
  style: LandingDesignStyle,
  originalRequest: string
): string {
  const p = PROFILES[style];
  const request = originalRequest.trim().replace(/\s+/g, " ");

  return [
    `Usa el estilo ${style} para concebir un concepto de negocio o servicio innovador a partir de esta intención: “${request}”. Diseña UNA SOLA LANDING PAGE COHESIVA, nunca un conjunto de páginas, con una única experiencia de scroll. La llegada debe sentirse ${p.mood}; organiza la jerarquía mediante ${p.hierarchy} para que cada bloque despierte curiosidad y lleve naturalmente al siguiente. Incorpora elementos coloridos solo donde refuercen el impacto emocional y la claridad del concepto.`,
    `La filosofía de diseño debe convertir cada decisión en una emoción útil. Haz que la tipografía se sienta ${p.typography} y que las interacciones sean ${p.interaction}, siempre con propósito y sin distraer. Construye un arco narrativo completo dentro de la misma página: una primera impresión memorable, una explicación clara del valor, una progresión que reduzca dudas y un llamado final que se sienta inevitable, confiable y coherente con todo lo anterior.`,
    `Toma como referencias abstractas ${p.references}; busca la atención al detalle de una experiencia premium, la calma de un entorno bien proporcionado y la honestidad de una pieza artesanal refinada. Traduce esas cualidades en ritmo, espacio, contraste, color y composición, sin copiar ni mencionar marcas o plataformas. El resultado debe conservar máxima libertad creativa, pero sentirse visualmente sofisticado, emocionalmente consistente y resuelto como UNA SOLA LANDING PAGE en un recorrido continuo.`,
  ].join("\n\n");
}
