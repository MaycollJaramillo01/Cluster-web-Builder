import { DESIGN_STYLE_IDS, getDesignPreset, resolveDesignStyleId, type DesignStyleId, type TemplateFamily } from "@/lib/site/design";
import { getFamilyAffinity } from "@/lib/site/template-intent";

export type TemplateCandidate = {
  style: DesignStyleId;
  family: TemplateFamily;
  label: string;
  description: string;
};

const TEMPLATES: TemplateCandidate[] = [
  template("Service", "Servicios directo", "Portada dividida, oferta jerárquica, beneficios y proceso."),
  template("Editorial", "Revista editorial", "Tipografía protagonista, fotografía amplia y lectura narrativa."),
  template("Immersive", "Inmersivo", "Apertura cinematográfica, alto contraste y bloques visuales."),
  template("Catalog", "Catálogo", "Retícula visual para explorar productos, servicios o colecciones."),
  template("Local", "Negocio local", "Confianza, ubicación y contacto con una presencia cercana."),
  template("Minimal", "Minimal", "Contenido esencial, mucho espacio y una acción dominante."),
  template("StudioSplit", "Estudio dividido", "Composición asimétrica con imagen desplazada y servicios partidos."),
  template("Manifesto", "Manifiesto", "Tipografía contundente, geometría cruda y llamadas con carácter."),
  template("Statement", "Declaración", "Una idea central, ritmo sereno y contenido estrictamente necesario."),
  template("Gridline", "Retícula técnica", "Líneas, módulos precisos y lectura de producto organizada."),
  template("Overlap", "Capas editoriales", "Fotografía y texto superpuestos con profundidad de revista."),
  template("Panorama", "Panorámico", "Imágenes a sangre, relato horizontal y movimiento cinematográfico."),
  template("Collage", "Collage creativo", "Composición visual irregular para marcas expresivas y portafolios."),
  template("Portrait", "Retrato", "Fotografía vertical, tipografía elegante y narrativa personal."),
  template("Reverse", "Servicios inversos", "Jerarquía comercial alternada para consultorías y profesionales."),
  template("Masthead", "Cabecera de autor", "Gran titular editorial, galería temprana y estructura de publicación."),
  template("Framed", "Escenario enmarcado", "Paneles flotantes, cristal sutil y fotografía contenida."),
  template("Metrics", "Resultados", "Métricas protagonistas, proceso claro y evidencia antes del contacto."),
  template("Quote", "Cita esencial", "Voz de marca, lectura pausada y una composición sin ruido."),
  template("Timeline", "Historia guiada", "Proceso cronológico, narrativa progresiva y servicios cercanos."),
  template("Columns", "Columnas", "Información modular, comparación rápida y ritmo de catálogo."),
  template("Accent", "Acento geométrico", "Bloques fuertes, contraste alto y una presencia comercial audaz."),
  template("Numbered", "Proceso numerado", "Pasos protagonistas para explicar servicios complejos con claridad."),
  template("BigType", "Tipografía gigante", "Titulares de escala extrema y fotografía monocromática."),
  template("SplitStats", "Datos divididos", "Estadísticas, servicios e imágenes en una retícula dinámica."),
  template("Badges", "Confianza cercana", "Pruebas, beneficios y ubicación para negocios comunitarios."),
  template("Folio", "Folio impreso", "Galería primero, serif clásica y lectura de portafolio editorial."),
  template("Journal", "Diario personal", "Narrativa cálida, fotografía en arco y ritmo de publicación íntima."),
  template("Atelier", "Taller de autor", "Servicios como piezas de exposición y retícula de estudio creativo."),
  template("Noir", "Nocturno", "Fondo oscuro, dorados sutiles y una atmósfera de lujo contenida."),
  template("Velocity", "Velocidad", "Diagonales enérgicas, datos duros y un recorrido directo a la acción."),
  template("Pulse", "Pulso", "Ritmo deportivo, bloques contundentes y contraste de alta energía."),
  template("Horizon", "Horizonte", "Apertura panorámica serena, naturaleza y recorrido pausado."),
  template("Market", "Mercado", "Oferta gastronómica en retícula con ubicación y contacto a mano."),
  template("Showcase", "Vitrina moderna", "Producto al frente, módulos bento y acabado de startup."),
  template("Boutique", "Boutique", "Colección en galería, elegancia de moda y detalle artesanal."),
  template("Stack", "Módulos apilados", "Bloques técnicos ordenados para explicar una oferta compleja."),
  template("Corner", "Esquina del barrio", "Calidez de cafetería, historia cercana y visita fácil."),
  template("Neighbor", "Vecinal", "Beneficios claros, comunidad y confianza de puerta a puerta."),
  template("Homestead", "Campo y oficio", "Verdes naturales, trabajo artesanal y presencia de campo."),
  template("Storefront", "Fachada comercial", "Oficio directo, ubicación visible y presupuesto sin vueltas."),
  template("Ledger", "Libro mayor", "Sobriedad financiera, jerarquía estricta y cero decoración."),
  template("Blank", "Lienzo blanco", "Lo mínimo indispensable: una idea, una acción, nada más."),
  template("Serif", "Serif esencial", "Elegancia tipográfica silenciosa para marcas personales."),
  template("Mono", "Monoespaciado", "Precisión técnica, retícula estricta y detalle de terminal."),
  template("Blueprint", "Plano de obra", "Proceso constructivo por etapas con evidencia y presupuesto."),
];

function template(style: DesignStyleId, label: string, description: string): TemplateCandidate {
  return { style, family: getDesignPreset(style).family, label, description };
}

export function isDesignStyle(value: string): value is DesignStyleId {
  return (DESIGN_STYLE_IDS as readonly string[]).includes(value);
}

export function getAllTemplateCandidates(): TemplateCandidate[] {
  return [...TEMPLATES];
}

export type TemplateContext = {
  /** Entropía por proyecto: dos sitios con el mismo estilo ven representantes distintos. */
  siteId?: string | null;
  /** Enum del onboarding ("restaurant") o etiqueta guardada en la base ("Restaurante"). */
  businessType?: string | null;
};

const ALL_FAMILIES: TemplateFamily[] = ["service", "editorial", "immersive", "catalog", "local", "minimal"];

/**
 * Six contrasting options: the selected design first, then one representative per family.
 * Industry-affine families lead the list (they fill the first visible row) and each
 * representative is seeded per site, so proposals vary between projects.
 */
export function getTemplateCandidates(currentStyle: string | null | undefined, context: TemplateContext = {}): TemplateCandidate[] {
  const current = resolveDesignStyleId(currentStyle);
  const selected = current ? TEMPLATES.find((item) => item.style === current) ?? null : null;
  const affinity = getFamilyAffinity(context.businessType);
  const seedBase = context.siteId?.trim() || current || affinity.join("-");

  const orderedFamilies = [...affinity, ...ALL_FAMILIES.filter((family) => !affinity.includes(family))]
    .filter((family) => family !== selected?.family);

  const candidates: TemplateCandidate[] = selected ? [selected] : [];
  for (const family of orderedFamilies) {
    const familyTemplates = TEMPLATES.filter((item) => item.family === family);
    candidates.push(familyTemplates[stableHash(`${seedBase}:${family}`) % familyTemplates.length]);
  }
  return candidates.slice(0, 6);
}

// FNV-1a con mezcla final: distribuye bien incluso módulo 3 o 4 con ids muy parecidos.
function stableHash(seed: string): number {
  let hash = 2166136261;
  for (let index = 0; index < seed.length; index++) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619) >>> 0;
  }
  hash ^= hash >>> 15;
  return hash >>> 0;
}
