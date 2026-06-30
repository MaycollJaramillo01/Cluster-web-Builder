import { DESIGN_STYLE_IDS, getDesignPreset, type DesignStyleId, type TemplateFamily } from "@/lib/site/design";

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

/** Six contrasting options: the selected design plus one from every other family. */
export function getTemplateCandidates(currentStyle: string | null | undefined): TemplateCandidate[] {
  const current = currentStyle && isDesignStyle(currentStyle) ? currentStyle : null;
  if (!current) return TEMPLATES.slice(0, 6);

  const selected = TEMPLATES.find((item) => item.style === current)!;
  const candidates = [selected];
  const seed = DESIGN_STYLE_IDS.indexOf(current);
  const families: TemplateFamily[] = ["service", "editorial", "immersive", "catalog", "local", "minimal"];
  for (const family of families) {
    if (family === selected.family) continue;
    const familyTemplates = TEMPLATES.filter((item) => item.family === family);
    candidates.push(familyTemplates[seed % familyTemplates.length]);
  }
  return candidates;
}
