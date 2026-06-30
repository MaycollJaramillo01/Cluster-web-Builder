import { DESIGN_STYLE_IDS, getDesignPreset, type TemplateFamily } from "@/lib/site/design";

export { selectLandingTemplate } from "@/lib/site/template-intent";

export const LANDING_DESIGN_STYLES = DESIGN_STYLE_IDS;
export type LandingDesignStyle = (typeof LANDING_DESIGN_STYLES)[number];

const PROFILES: Record<TemplateFamily, { direction: string; voice: string }> = {
  service: {
    direction: "jerarquía muy clara, portada dividida, evidencia, proceso y contacto visibles",
    voice: "Directo y profesional. Beneficios concretos, frases breves y llamadas a la acción claras.",
  },
  editorial: {
    direction: "ritmo de revista, tipografía protagonista, fotografía con aire y narrativa por contraste",
    voice: "Narrativo y preciso. Titulares expresivos, pausas y muy pocos lugares comunes.",
  },
  immersive: {
    direction: "fotografía a sangre, contraste alto, capas profundas y una apertura cinematográfica",
    voice: "Enérgico y evocador. Verbos activos, titulares memorables y cuerpo conciso.",
  },
  catalog: {
    direction: "retícula visual, oferta escaneable, tarjetas asimétricas y descubrimiento por imágenes",
    voice: "Comercial y fácil de escanear. Nombres claros, detalles útiles y cero relleno.",
  },
  local: {
    direction: "cercanía, ubicación y contacto prioritarios, superficies cálidas y fotografía humana",
    voice: "Cálido y confiable. Lenguaje cotidiano, específico y orientado a una conversación real.",
  },
  minimal: {
    direction: "máximo espacio, una idea por pantalla, tipografía sobria y elementos estrictamente necesarios",
    voice: "Esencial. Cada palabra debe aportar información; omite antes de repetir.",
  },
};

export function getStyleCopyVoice(style: LandingDesignStyle): string {
  return PROFILES[getDesignPreset(style).family].voice;
}

export function buildLandingDesignBrief(style: LandingDesignStyle, originalRequest: string): string {
  const profile = PROFILES[getDesignPreset(style).family];
  return `Composición ${style}: ${profile.direction}. Interpreta la solicitud “${originalRequest.trim().replace(/\s+/g, " ")}” sin inventar datos. La paleta proporcionada es obligatoria y el contenido debe conducir a una sola acción principal.`;
}
