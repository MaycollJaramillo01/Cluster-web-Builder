import { DESIGN_STYLE_IDS } from "@/lib/site/design";

export type TemplateCandidate = {
  style: (typeof DESIGN_STYLE_IDS)[number];
  label: string;
  description: string;
};

const TEMPLATES: TemplateCandidate[] = [
  { style: "Service", label: "Servicios", description: "Portada dividida, oferta, beneficios y proceso orientado a convertir." },
  { style: "Editorial", label: "Editorial", description: "Tipografía protagonista, fotografía amplia y lectura narrativa." },
  { style: "Immersive", label: "Inmersivo", description: "Apertura cinematográfica, alto contraste y bloques visuales." },
  { style: "Catalog", label: "Catálogo", description: "Retícula para explorar productos, servicios o colecciones." },
  { style: "Local", label: "Negocio local", description: "Confianza, ubicación y contacto con una presencia cercana." },
  { style: "Minimal", label: "Minimal", description: "Contenido esencial, mucho espacio y una acción dominante." },
];

export function isDesignStyle(value: string): value is TemplateCandidate["style"] {
  return (DESIGN_STYLE_IDS as readonly string[]).includes(value);
}

export function getTemplateCandidates(currentStyle: string | null | undefined): TemplateCandidate[] {
  const current = currentStyle && isDesignStyle(currentStyle) ? currentStyle : null;
  if (!current) return [...TEMPLATES];
  return [...TEMPLATES].sort((item) => item.style === current ? -1 : 0);
}
