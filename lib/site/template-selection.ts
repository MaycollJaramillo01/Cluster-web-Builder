import { DESIGN_STYLE_IDS } from "@/lib/site/design";

export type TemplateCandidate = {
  style: (typeof DESIGN_STYLE_IDS)[number];
  label: string;
  description: string;
};

const GROUPS: Array<Omit<TemplateCandidate, "style"> & { styles: Array<TemplateCandidate["style"]> }> = [
  { label: "Audaz", description: "Bloques fuertes y una presencia visual memorable.", styles: ["Neobrutalist", "Bauhaus", "Neo-Geo", "Kinetic"] },
  { label: "Editorial", description: "Tipografía protagonista y ritmo sofisticado.", styles: ["Editorial", "Art Deco", "Luxury Minimal", "Typography First", "Metropolitan"] },
  { label: "Profesional", description: "Orden, claridad y confianza para servicios.", styles: ["Swiss/International", "Minimal", "Monochromatic", "Japandi", "Modernist", "Corporate Professional"] },
  { label: "Cercano", description: "Formas amables y una experiencia más humana.", styles: ["Material", "Neumorphic", "Scandinavian", "Organic/Fluid"] },
  { label: "Tecnológico", description: "Capas, contraste y una estética contemporánea.", styles: ["Glassmorphism", "Retro-futuristic", "Dark Mode First", "Tech Forward", "Gradient Modern"] },
  { label: "Directo", description: "Lectura rápida, color claro y llamadas visibles.", styles: ["Flat"] },
];

export function isDesignStyle(value: string): value is TemplateCandidate["style"] {
  return (DESIGN_STYLE_IDS as readonly string[]).includes(value);
}

export function getTemplateCandidates(currentStyle: string | null | undefined, seed: string): TemplateCandidate[] {
  const candidates = GROUPS.map((group, index) => {
    const current = currentStyle && isDesignStyle(currentStyle) && group.styles.includes(currentStyle) ? currentStyle : null;
    const style = current ?? group.styles[hash(`${seed}:${index}`) % group.styles.length];
    return { style, label: group.label, description: group.description };
  });
  const currentIndex = candidates.findIndex((candidate) => candidate.style === currentStyle);
  if (currentIndex > 0) candidates.unshift(...candidates.splice(currentIndex, 1));
  return candidates;
}

function hash(value: string) {
  let result = 2166136261;
  for (let index = 0; index < value.length; index++) result = Math.imul(result ^ value.charCodeAt(index), 16777619);
  return result >>> 0;
}
