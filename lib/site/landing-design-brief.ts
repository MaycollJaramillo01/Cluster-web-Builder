import { randomInt } from "node:crypto";

import { DESIGN_STYLE_IDS } from "@/lib/site/design";

export const LANDING_DESIGN_STYLES = DESIGN_STYLE_IDS;

export type LandingDesignStyle = (typeof LANDING_DESIGN_STYLES)[number];

type StyleProfile = {
  mood: string;
  hierarchy: string;
  typography: string;
  interaction: string;
  references: string;
};

const PROFILES: Record<LandingDesignStyle, StyleProfile> = {
  Neobrutalist: profile("directa, audaz y deliberadamente cruda", "bloques contundentes y contrastes francos", "grande, densa y desafiante", "rápida, seca y precisa", "carteles urbanos, imprenta experimental y arquitectura de hormigón"),
  "Swiss/International": profile("serena, racional y confiable", "una retícula rigurosa con ritmo editorial", "objetiva, nítida y altamente legible", "precisa, discreta y funcional", "señalética pública, retículas tipográficas y arquitectura funcional"),
  Editorial: profile("sofisticada, curiosa y cultural", "titulares expresivos, pausas y composición narrativa", "elegante, humana y con contraste de escala", "fluida y pausada como pasar páginas", "revistas independientes, bibliotecas contemporáneas y fotografía de autor"),
  Glassmorphism: profile("etérea, tecnológica y envolvente", "capas translúcidas con profundidad controlada", "limpia, luminosa y contemporánea", "suave, líquida y con transiciones atmosféricas", "vidrio arquitectónico, luz refractada y espacios digitales inmersivos"),
  "Retro-futuristic": profile("optimista, nostálgica y visionaria", "composición cinematográfica con acentos luminosos", "geométrica, expresiva y ligeramente técnica", "dinámica, brillante y controlada", "ciencia ficción analógica, paneles espaciales y carteles de futuros imaginados"),
  Bauhaus: profile("clara, enérgica y universal", "formas primarias y equilibrio asimétrico", "funcional, geométrica y segura", "mecánica, alegre y exacta", "talleres modernistas, geometría elemental y diseño como función"),
  "Art Deco": profile("lujosa, teatral y refinada", "simetría, líneas verticales y detalles ornamentales medidos", "elegante, estilizada y ceremoniosa", "pulida, pausada y precisa", "vestíbulos monumentales, artes decorativas y geometría de entreguerras"),
  Minimal: profile("calmada, esencial y segura", "máximo espacio, pocas decisiones y foco absoluto", "sobria, silenciosa y de escala generosa", "casi invisible, suave y deliberada", "galerías blancas, objetos esenciales y arquitectura reductiva"),
  Flat: profile("amable, clara y accesible", "formas simples, color sólido y lectura inmediata", "directa, redonda y acogedora", "ágil, simple y predecible", "sistemas gráficos públicos, ilustración geométrica y señalética amistosa"),
  Material: profile("familiar, ordenada y táctil", "superficies jerárquicas y profundidad sutil", "clara, equilibrada y funcional", "natural, receptiva y basada en causa y efecto", "papel, tinta, luz suave y objetos físicos bien construidos"),
  Neumorphic: profile("suave, íntima y táctil", "controles moldeados dentro de superficies continuas", "serena, redondeada y contenida", "gentil, elástica y sensorial", "objetos moldeados, interiores silenciosos y materiales satinados"),
  Monochromatic: profile("cohesiva, segura y contemplativa", "profundidad creada por tono, escala y contraste", "disciplinada, elegante y consistente", "sutil, tonal y continua", "fotografía en duotono, grabado y espacios de una sola materia"),
  Scandinavian: profile("cálida, honesta y luminosa", "orden relajado, aire y detalles humanos", "amable, funcional y sin pretensión", "gentil, orgánica y reconfortante", "interiores nórdicos, madera clara, textiles naturales y luz de invierno"),
  Japandi: profile("serena, artesanal y equilibrada", "asimetría tranquila y espacio con propósito", "discreta, cálida y muy legible", "lenta, orgánica y respetuosa", "casas de té, carpintería precisa, cerámica y calma nórdica"),
  "Dark Mode First": profile("inmersiva, premium y concentrada", "contraste luminoso sobre profundidad oscura", "nítida, moderna y de alto impacto", "sedosa, luminosa y cinematográfica", "salas de proyección, iluminación nocturna y controles de precisión"),
  Modernist: profile("atemporal, confiada y funcional", "líneas limpias, proporción y orden visible", "sobria, autoritativa y honesta", "precisa, silenciosa y útil", "arquitectura del siglo XX, mobiliario racional y claridad estructural"),
  "Organic/Fluid": profile("vital, cercana y natural", "curvas que conducen la mirada sin rigidez", "humana, suave y expresiva", "líquida, continua y respirada", "paisajes erosionados, botánica, agua y arquitectura biomórfica"),
  "Corporate Professional": profile("estable, competente y confiable", "jerarquía ejecutiva, evidencia y llamadas claras", "autoritaria, sobria y accesible", "rápida, discreta y predecible", "salas de consejo contemporáneas, informes bien editados y arquitectura institucional"),
  "Tech Forward": profile("innovadora, precisa y optimista", "datos, producto y beneficios en una secuencia clara", "cortante, contemporánea y segura", "rápida, fluida y ligeramente futurista", "laboratorios limpios, interfaces instrumentales y prototipos de ingeniería"),
  "Luxury Minimal": profile("exclusiva, silenciosa y segura de sí", "pocos elementos con proporciones impecables", "refinada, espaciosa y editorial", "lenta, pulida y casi imperceptible", "galerías privadas, sastrería, piedra natural y artesanía de precisión"),
  "Neo-Geo": profile("intelectual, rítmica y contemporánea", "patrones matemáticos y geometría modular", "estructural, limpia y de fuerte personalidad", "snappy, repetitiva y armoniosa", "arte geométrico, mosaicos, cartografía y sistemas modulares"),
  Kinetic: profile("enérgica, progresiva y viva", "dirección visual que siempre impulsa hacia adelante", "dinámica, condensada y expresiva", "rápida, elástica y coreografiada", "títulos de cine, danza contemporánea y escultura cinética"),
  "Gradient Modern": profile("luminosa, optimista y envolvente", "transiciones de color que separan momentos del relato", "amable, moderna y de alto contraste", "suave, continua y atmosférica", "luz al amanecer, vidrio coloreado y espacios inmersivos"),
  "Typography First": profile("expresiva, inteligente y memorable", "la letra como imagen, ritmo y navegación", "protagonista, distintiva y cuidadosamente compuesta", "precisa, editorial y guiada por el texto", "carteles culturales, composición tipográfica y poesía visual"),
  Metropolitan: profile("cosmopolita, culta y segura", "capas editoriales con ritmo urbano", "sofisticada, compacta y contemporánea", "fluida, veloz y elegante", "vestíbulos urbanos, mapas, piedra, metal y cultura de gran ciudad"),
  Artisan: profile("auténtica, arraigada y evocadora", "fotografía cinematográfica con texto poderoso a la izquierda y estadísticas ancla al fondo", "serif elegante con línea de acento en itálica y color", "pausada, táctil y atmosférica", "talleres de oficio, naturaleza densa, materiales en estado puro y fotografía de reportaje"),
};

function profile(
  mood: string,
  hierarchy: string,
  typography: string,
  interaction: string,
  references: string
): StyleProfile {
  return { mood, hierarchy, typography, interaction, references };
}

const COPY_VOICES: Record<LandingDesignStyle, string> = {
  Neobrutalist: "Titulares de 3-5 palabras. Directo, sin adjetivos vacíos, con punch. Verbos de acción. Nada de 'experiencia premium' ni 'soluciones innovadoras'.",
  "Swiss/International": "Preciso y objetivo. Frases cortas. Hechos sobre adjetivos. Jerarquía tipográfica visible en el copy.",
  Editorial: "Voz narrativa, culta. Usa contraste de escala en titulares. Permite pausas y frases algo más largas con ritmo.",
  Glassmorphism: "Moderno y aspiracional. Frases fluidas. Vocabulario tecnológico accesible, nunca técnico por el solo hecho de serlo.",
  "Retro-futuristic": "Optimista y visionario. Metáforas de progreso. Titulares con energía y ligeramente cinematográficos.",
  Bauhaus: "Funcional y directo. Nada ornamental. 'Forma sigue función' en cada palabra. Sin adjetivos decorativos.",
  "Art Deco": "Ceremoniosa y refinada. Vocabulario elegante. Cadencia medida, nunca apresurada. Evita coloquialismos.",
  Minimal: "Lo menos posible. Cada palabra debe ganarse su lugar. Sin redundancias. Preferir omitir a explicar de más.",
  Flat: "Amable y accesible. Tono conversacional. Frases que cualquiera entiende a la primera lectura.",
  Material: "Clara y funcional. Orientada a la acción. Verbos concretos. Estructura predecible y reconfortante.",
  Neumorphic: "Suave e íntima. Tono cálido, casi susurrado. Evita el exceso de mayúsculas y la urgencia.",
  Monochromatic: "Contemplativa y disciplinada. Frases que construyen sin prisa. Equilibrio entre lo dicho y lo omitido.",
  Scandinavian: "Cálida y honesta. Sin exageraciones. Tono de conversación entre personas reales, no de publicidad.",
  Japandi: "Serena. Muy pocas palabras. Cada frase tiene peso. El silencio entre frases también comunica.",
  "Dark Mode First": "Cinematográfica y premium. Titulares de alto impacto. Frases que crean tensión y resolución.",
  Modernist: "Sobria y autorizada. Sin adornos. Proporciona evidencia y claridad, no promesas vacías.",
  "Organic/Fluid": "Cercana y vital. Tono humano, sin tecnicismos. Fluye como una conversación natural sin forzar.",
  "Corporate Professional": "Orientada a resultados y competencia. Lenguaje ejecutivo claro. Sin jerga pero con autoridad real.",
  "Tech Forward": "Cortante y optimista. Beneficios antes que características. Ritmo rápido. Verbos en segunda persona.",
  "Luxury Minimal": "Muy pocas palabras. Peso en cada frase. Nunca grites — susurra con confianza absoluta.",
  "Neo-Geo": "Estructurada y rítmica. Titulares que parecen patrones. Muy concisa. Repetición deliberada como recurso.",
  Kinetic: "Enérgica y condensada. Usa verbos de acción. Cada línea impulsa hacia la siguiente sin pausa.",
  "Gradient Modern": "Optimista y envolvente. Tono positivo y accesible. Frases que fluyen con suavidad y calor.",
  "Typography First": "El texto ES el diseño. Titulares como imágenes. Muy poco body, mucho impacto por línea.",
  Metropolitan: "Cosmopolita y culta. Sofisticado sin ser pedante. Capas de significado en pocas palabras.",
  Artisan: "Auténtica y evocadora. Vocabulario de oficio. Nada corporativo. Cada frase suena hecha a mano.",
};

export function getStyleCopyVoice(style: LandingDesignStyle): string {
  return COPY_VOICES[style] ?? "Directo, claro y específico. Evita frases vacías.";
}

export function selectRandomLandingStyle(
  excluded: readonly string[] = []
): LandingDesignStyle {
  const excludedSet = new Set(excluded);
  const available = LANDING_DESIGN_STYLES.filter((style) => !excludedSet.has(style));
  const pool = available.length > 0 ? available : LANDING_DESIGN_STYLES;
  return pool[randomInt(pool.length)];
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
