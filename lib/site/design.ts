export const DESIGN_STYLE_IDS = [
  "Neobrutalist", "Swiss/International", "Editorial", "Glassmorphism", "Retro-futuristic",
  "Bauhaus", "Art Deco", "Minimal", "Flat", "Material", "Neumorphic", "Monochromatic",
  "Scandinavian", "Japandi", "Dark Mode First", "Modernist", "Organic/Fluid",
  "Corporate Professional", "Tech Forward", "Luxury Minimal", "Neo-Geo", "Kinetic",
  "Gradient Modern", "Typography First", "Metropolitan", "Artisan",
] as const;

/**
 * Design presets mapped from the onboarding `visualStyle` choice.
 * These give each generated site a distinct look (typography, radius, button
 * shape, hero treatment, motion) instead of one flat template for everyone.
 */

export type HeroStyle =
  | "image"
  | "gradient"
  | "minimal"
  | "split"
  | "editorial"
  | "poster"
  | "framed"
  | "immersive"
  | "cinematic";
export type NavStyle = "bar" | "floating" | "minimal" | "bordered" | "dark";
export type ServicesStyle = "cards" | "list" | "bento" | "editorial" | "bordered" | "split";
export type SectionStyle = "centered" | "asymmetric" | "contained" | "fullBleed" | "grid";
export type ImageStyle = "rounded" | "square" | "arch" | "fullBleed" | "monochrome" | "offset";
export type SurfaceStyle = "plain" | "soft" | "outlined" | "glass" | "brutal" | "tonal" | "dark";
export type MotionStyle = "none" | "subtle" | "stagger" | "kinetic";
export type CtaStyle = "solid" | "outline" | "pill" | "offset" | "link";
export type FooterStyle = "minimal" | "columns" | "editorial" | "brutal" | "darkBand" | "centered";
/** All About-Us variant ids. */
export const ABOUT_US_STYLES = [
  "split", "editorial", "manifesto", "statement", "grid", "immersive",
  "overlap", "polaroid", "banner", "collage", "portrait", "reverse",
  "masthead", "framed", "stats", "checklist", "quote", "timeline",
  "columns", "accent", "numbered", "bigtype", "splitstats", "minimalline",
  "badges", "mosaic",
] as const;
export type AboutUsStyle = (typeof ABOUT_US_STYLES)[number];

/** Each design style gets a deliberate About design (the AI picks the style). */
const ABOUT_BY_STYLE: Record<string, AboutUsStyle> = {
  Neobrutalist: "manifesto",
  "Swiss/International": "grid",
  Editorial: "editorial",
  Glassmorphism: "framed",
  "Retro-futuristic": "immersive",
  Bauhaus: "collage",
  "Art Deco": "portrait",
  Minimal: "minimalline",
  Flat: "split",
  Material: "overlap",
  Neumorphic: "stats",
  Monochromatic: "columns",
  Scandinavian: "polaroid",
  Japandi: "reverse",
  "Dark Mode First": "immersive",
  Modernist: "numbered",
  "Organic/Fluid": "masthead",
  "Corporate Professional": "checklist",
  "Tech Forward": "splitstats",
  "Luxury Minimal": "banner",
  "Neo-Geo": "mosaic",
  Kinetic: "bigtype",
  "Gradient Modern": "framed",
  "Typography First": "bigtype",
  Metropolitan: "quote",
};

export type DesignPreset = {
  id: string;
  /** CSS font-family for headings (must be loaded in layout). */
  headingFont: string;
  /** CSS font-family for body text. */
  bodyFont: string;
  /** Border radius for cards/containers. */
  radius: string;
  /** Border radius for buttons. */
  buttonRadius: string;
  /** Tailwind shadow class applied to cards. */
  cardShadow: string;
  /** Uppercase + tracking on section headings. */
  uppercaseHeadings: boolean;
  /** Hero layout treatment. */
  heroStyle: HeroStyle;
  /** Whether sections should use a real background/feature image. */
  useImages: boolean;
  /** Extra letter-spacing for headings. */
  headingTracking: string;
  /** Font weight for big headings. */
  headingWeight: number;
  navStyle: NavStyle;
  servicesStyle: ServicesStyle;
  sectionStyle: SectionStyle;
  imageStyle: ImageStyle;
  surfaceStyle: SurfaceStyle;
  motionStyle: MotionStyle;
  ctaStyle: CtaStyle;
  footerStyle: FooterStyle;
  aboutUsStyle: AboutUsStyle;
  paletteId: string;
  sectionPlan: string[];
};

type RecipeInput = Omit<DesignPreset, "bodyFont" | "useImages" | "footerStyle" | "aboutUsStyle"> &
  Partial<Pick<DesignPreset, "bodyFont" | "useImages" | "footerStyle" | "aboutUsStyle">>;

function recipe(input: RecipeInput): DesignPreset {
  const footerStyle: FooterStyle = input.footerStyle
    ?? (input.surfaceStyle === "brutal" ? "brutal"
      : input.heroStyle === "editorial" || input.servicesStyle === "editorial" ? "editorial"
        : input.surfaceStyle === "dark" ? "darkBand"
          : input.navStyle === "floating" ? "columns"
            : input.sectionStyle === "centered" ? "centered"
              : "minimal");
  const aboutUsStyle: AboutUsStyle = input.aboutUsStyle
    ?? ABOUT_BY_STYLE[input.id]
    ?? (input.surfaceStyle === "brutal" ? "manifesto"
      : input.heroStyle === "editorial" || input.servicesStyle === "editorial" ? "editorial"
        : input.sectionStyle === "fullBleed" ? "immersive"
          : input.sectionStyle === "grid" ? "grid"
            : input.sectionStyle === "centered" ? "statement"
              : "split");

  return {
    bodyFont: '"Inter", system-ui, sans-serif',
    useImages: true,
    ...input,
    footerStyle,
    aboutUsStyle,
    sectionPlan: input.sectionPlan.map((type) => type === "about" ? "about_us" : type),
  };
}

const PRESETS: Record<string, DesignPreset> = {
  Neobrutalist: recipe({ id: "Neobrutalist", headingFont: '"Montserrat", system-ui, sans-serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-[6px_6px_0_#000]", uppercaseHeadings: true, heroStyle: "poster", headingTracking: "-0.03em", headingWeight: 900, navStyle: "bordered", servicesStyle: "bordered", sectionStyle: "grid", imageStyle: "square", surfaceStyle: "brutal", motionStyle: "kinetic", ctaStyle: "offset", paletteId: "bold", sectionPlan: ["hero", "benefits", "services", "process", "gallery", "cta", "contact", "footer"] }),
  "Swiss/International": recipe({ id: "Swiss/International", headingFont: '"Inter", system-ui, sans-serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "split", headingTracking: "0.06em", headingWeight: 700, navStyle: "minimal", servicesStyle: "list", sectionStyle: "grid", imageStyle: "square", surfaceStyle: "plain", motionStyle: "none", ctaStyle: "solid", paletteId: "corporate", sectionPlan: ["hero", "services", "about", "benefits", "faq", "contact", "cta", "footer"] }),
  Editorial: recipe({ id: "Editorial", headingFont: '"Playfair Display", Georgia, serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "editorial", headingTracking: "-0.02em", headingWeight: 700, navStyle: "minimal", servicesStyle: "editorial", sectionStyle: "asymmetric", imageStyle: "offset", surfaceStyle: "plain", motionStyle: "subtle", ctaStyle: "link", paletteId: "luxury_light", sectionPlan: ["hero", "about", "gallery", "services", "faq", "cta", "contact", "footer"] }),
  Glassmorphism: recipe({ id: "Glassmorphism", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "1.5rem", buttonRadius: "9999px", cardShadow: "shadow-xl", uppercaseHeadings: false, heroStyle: "immersive", headingTracking: "-0.03em", headingWeight: 700, navStyle: "floating", servicesStyle: "bento", sectionStyle: "contained", imageStyle: "rounded", surfaceStyle: "glass", motionStyle: "stagger", ctaStyle: "pill", paletteId: "tech_saas", sectionPlan: ["hero", "benefits", "services", "gallery", "process", "cta", "contact", "footer"] }),
  "Retro-futuristic": recipe({ id: "Retro-futuristic", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "0.4rem", buttonRadius: "0.25rem", cardShadow: "shadow-[0_0_24px_rgba(34,211,238,.22)]", uppercaseHeadings: true, heroStyle: "framed", headingTracking: "0.08em", headingWeight: 700, navStyle: "dark", servicesStyle: "bordered", sectionStyle: "contained", imageStyle: "monochrome", surfaceStyle: "dark", motionStyle: "kinetic", ctaStyle: "outline", paletteId: "cybersecurity", sectionPlan: ["hero", "benefits", "process", "services", "gallery", "cta", "contact", "footer"] }),
  Bauhaus: recipe({ id: "Bauhaus", headingFont: '"Montserrat", system-ui, sans-serif', radius: "0rem", buttonRadius: "9999px", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "poster", headingTracking: "-0.04em", headingWeight: 800, navStyle: "bar", servicesStyle: "bento", sectionStyle: "asymmetric", imageStyle: "square", surfaceStyle: "tonal", motionStyle: "subtle", ctaStyle: "pill", paletteId: "creative", sectionPlan: ["hero", "services", "benefits", "gallery", "about", "cta", "contact", "footer"] }),
  "Art Deco": recipe({ id: "Art Deco", headingFont: '"Playfair Display", Georgia, serif', radius: "0.15rem", buttonRadius: "0.15rem", cardShadow: "shadow-lg", uppercaseHeadings: true, heroStyle: "framed", headingTracking: "0.12em", headingWeight: 700, navStyle: "dark", servicesStyle: "editorial", sectionStyle: "centered", imageStyle: "arch", surfaceStyle: "outlined", motionStyle: "subtle", ctaStyle: "outline", paletteId: "luxury_dark", sectionPlan: ["hero", "about", "services", "benefits", "gallery", "cta", "footer"] }),
  Minimal: recipe({ id: "Minimal", headingFont: '"Inter", system-ui, sans-serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "minimal", useImages: false, headingTracking: "0.08em", headingWeight: 600, navStyle: "minimal", servicesStyle: "list", sectionStyle: "centered", imageStyle: "square", surfaceStyle: "plain", motionStyle: "none", ctaStyle: "link", paletteId: "minimalist", sectionPlan: ["hero", "services", "about", "cta", "footer"] }),
  Flat: recipe({ id: "Flat", headingFont: '"Poppins", system-ui, sans-serif', radius: "0.75rem", buttonRadius: "0.5rem", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "gradient", headingTracking: "-0.02em", headingWeight: 700, navStyle: "bar", servicesStyle: "cards", sectionStyle: "centered", imageStyle: "rounded", surfaceStyle: "tonal", motionStyle: "subtle", ctaStyle: "solid", paletteId: "modern_clean", sectionPlan: ["hero", "services", "benefits", "about", "faq", "cta", "contact", "footer"] }),
  Material: recipe({ id: "Material", headingFont: '"Poppins", system-ui, sans-serif', radius: "1.25rem", buttonRadius: "9999px", cardShadow: "shadow-md hover:shadow-xl", uppercaseHeadings: false, heroStyle: "split", headingTracking: "-0.02em", headingWeight: 700, navStyle: "floating", servicesStyle: "cards", sectionStyle: "contained", imageStyle: "rounded", surfaceStyle: "soft", motionStyle: "stagger", ctaStyle: "pill", paletteId: "modern_clean", sectionPlan: ["hero", "services", "process", "benefits", "faq", "cta", "contact", "footer"] }),
  Neumorphic: recipe({ id: "Neumorphic", headingFont: '"Poppins", system-ui, sans-serif', radius: "1.75rem", buttonRadius: "1rem", cardShadow: "shadow-[10px_10px_24px_rgba(15,23,42,.12),-8px_-8px_20px_rgba(255,255,255,.8)]", uppercaseHeadings: false, heroStyle: "framed", headingTracking: "-0.01em", headingWeight: 600, navStyle: "floating", servicesStyle: "bento", sectionStyle: "contained", imageStyle: "rounded", surfaceStyle: "soft", motionStyle: "subtle", ctaStyle: "solid", paletteId: "spa_natural", sectionPlan: ["hero", "benefits", "services", "about", "cta", "contact", "footer"] }),
  Monochromatic: recipe({ id: "Monochromatic", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "0.25rem", buttonRadius: "0.25rem", cardShadow: "shadow-sm", uppercaseHeadings: true, heroStyle: "image", headingTracking: "0.04em", headingWeight: 700, navStyle: "bar", servicesStyle: "editorial", sectionStyle: "asymmetric", imageStyle: "monochrome", surfaceStyle: "outlined", motionStyle: "subtle", ctaStyle: "outline", paletteId: "minimalist", sectionPlan: ["hero", "about", "services", "faq", "cta", "footer"] }),
  Scandinavian: recipe({ id: "Scandinavian", headingFont: '"Poppins", system-ui, sans-serif', radius: "1rem", buttonRadius: "9999px", cardShadow: "shadow-sm", uppercaseHeadings: false, heroStyle: "split", headingTracking: "-0.01em", headingWeight: 600, navStyle: "minimal", servicesStyle: "cards", sectionStyle: "asymmetric", imageStyle: "rounded", surfaceStyle: "soft", motionStyle: "subtle", ctaStyle: "pill", paletteId: "spa_natural", sectionPlan: ["hero", "about", "services", "benefits", "gallery", "cta", "contact", "footer"] }),
  Japandi: recipe({ id: "Japandi", headingFont: '"Playfair Display", Georgia, serif', radius: "0.15rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "minimal", headingTracking: "0.01em", headingWeight: 600, navStyle: "minimal", servicesStyle: "list", sectionStyle: "asymmetric", imageStyle: "offset", surfaceStyle: "plain", motionStyle: "none", ctaStyle: "solid", paletteId: "spa_natural", sectionPlan: ["hero", "about", "services", "gallery", "cta", "footer"] }),
  "Dark Mode First": recipe({ id: "Dark Mode First", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "0.8rem", buttonRadius: "0.5rem", cardShadow: "shadow-[0_0_28px_rgba(56,189,248,.16)]", uppercaseHeadings: false, heroStyle: "immersive", headingTracking: "-0.04em", headingWeight: 800, navStyle: "dark", servicesStyle: "bento", sectionStyle: "fullBleed", imageStyle: "fullBleed", surfaceStyle: "dark", motionStyle: "stagger", ctaStyle: "solid", paletteId: "cybersecurity", sectionPlan: ["hero", "benefits", "services", "process", "gallery", "faq", "cta", "contact", "footer"] }),
  Modernist: recipe({ id: "Modernist", headingFont: '"Inter", system-ui, sans-serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "editorial", headingTracking: "-0.05em", headingWeight: 700, navStyle: "bordered", servicesStyle: "list", sectionStyle: "grid", imageStyle: "square", surfaceStyle: "outlined", motionStyle: "none", ctaStyle: "solid", paletteId: "corporate", sectionPlan: ["hero", "services", "about", "process", "benefits", "cta", "contact", "footer"] }),
  "Organic/Fluid": recipe({ id: "Organic/Fluid", headingFont: '"Poppins", system-ui, sans-serif', radius: "2.5rem", buttonRadius: "9999px", cardShadow: "shadow-lg", uppercaseHeadings: false, heroStyle: "framed", headingTracking: "-0.03em", headingWeight: 700, navStyle: "floating", servicesStyle: "split", sectionStyle: "fullBleed", imageStyle: "arch", surfaceStyle: "tonal", motionStyle: "stagger", ctaStyle: "pill", paletteId: "spa_natural", sectionPlan: ["hero", "about", "benefits", "services", "gallery", "cta", "contact", "footer"] }),
  "Corporate Professional": recipe({ id: "Corporate Professional", headingFont: '"Inter", system-ui, sans-serif', radius: "0.4rem", buttonRadius: "0.3rem", cardShadow: "shadow-sm", uppercaseHeadings: false, heroStyle: "split", headingTracking: "-0.02em", headingWeight: 700, navStyle: "bar", servicesStyle: "bordered", sectionStyle: "contained", imageStyle: "square", surfaceStyle: "plain", motionStyle: "subtle", ctaStyle: "solid", paletteId: "corporate", sectionPlan: ["hero", "services", "benefits", "process", "about", "faq", "cta", "contact", "footer"] }),
  "Tech Forward": recipe({ id: "Tech Forward", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "1rem", buttonRadius: "9999px", cardShadow: "shadow-lg", uppercaseHeadings: false, heroStyle: "framed", headingTracking: "-0.04em", headingWeight: 700, navStyle: "floating", servicesStyle: "bento", sectionStyle: "grid", imageStyle: "offset", surfaceStyle: "glass", motionStyle: "stagger", ctaStyle: "pill", paletteId: "tech_saas", sectionPlan: ["hero", "benefits", "process", "services", "faq", "cta", "contact", "footer"] }),
  "Luxury Minimal": recipe({ id: "Luxury Minimal", headingFont: '"Playfair Display", Georgia, serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "editorial", headingTracking: "0", headingWeight: 500, navStyle: "minimal", servicesStyle: "editorial", sectionStyle: "fullBleed", imageStyle: "arch", surfaceStyle: "plain", motionStyle: "subtle", ctaStyle: "link", paletteId: "luxury_light", sectionPlan: ["hero", "about", "gallery", "services", "cta", "contact", "footer"] }),
  "Neo-Geo": recipe({ id: "Neo-Geo", headingFont: '"Montserrat", system-ui, sans-serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-[4px_4px_0_rgba(15,23,42,.3)]", uppercaseHeadings: true, heroStyle: "poster", headingTracking: "0.02em", headingWeight: 800, navStyle: "bordered", servicesStyle: "bento", sectionStyle: "grid", imageStyle: "offset", surfaceStyle: "outlined", motionStyle: "kinetic", ctaStyle: "offset", paletteId: "startup_modern", sectionPlan: ["hero", "benefits", "gallery", "services", "process", "cta", "contact", "footer"] }),
  Kinetic: recipe({ id: "Kinetic", headingFont: '"Montserrat", system-ui, sans-serif', radius: "0.35rem", buttonRadius: "9999px", cardShadow: "shadow-md", uppercaseHeadings: true, heroStyle: "immersive", headingTracking: "-0.05em", headingWeight: 900, navStyle: "dark", servicesStyle: "split", sectionStyle: "asymmetric", imageStyle: "fullBleed", surfaceStyle: "brutal", motionStyle: "kinetic", ctaStyle: "pill", paletteId: "bold", sectionPlan: ["hero", "process", "benefits", "services", "gallery", "cta", "contact", "footer"] }),
  "Gradient Modern": recipe({ id: "Gradient Modern", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "1.25rem", buttonRadius: "9999px", cardShadow: "shadow-xl", uppercaseHeadings: false, heroStyle: "gradient", headingTracking: "-0.04em", headingWeight: 800, navStyle: "floating", servicesStyle: "cards", sectionStyle: "fullBleed", imageStyle: "rounded", surfaceStyle: "glass", motionStyle: "stagger", ctaStyle: "pill", paletteId: "startup_modern", sectionPlan: ["hero", "services", "benefits", "process", "gallery", "faq", "cta", "contact", "footer"] }),
  "Typography First": recipe({ id: "Typography First", headingFont: '"Montserrat", system-ui, sans-serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "poster", useImages: false, headingTracking: "-0.06em", headingWeight: 900, navStyle: "minimal", servicesStyle: "editorial", sectionStyle: "asymmetric", imageStyle: "square", surfaceStyle: "plain", motionStyle: "kinetic", ctaStyle: "link", paletteId: "bold", sectionPlan: ["hero", "about", "benefits", "services", "faq", "cta", "contact", "footer"] }),
  Metropolitan: recipe({ id: "Metropolitan", headingFont: '"Playfair Display", Georgia, serif', radius: "0.25rem", buttonRadius: "0.25rem", cardShadow: "shadow-lg", uppercaseHeadings: false, heroStyle: "editorial", headingTracking: "-0.02em", headingWeight: 700, navStyle: "dark", servicesStyle: "split", sectionStyle: "grid", imageStyle: "monochrome", surfaceStyle: "outlined", motionStyle: "subtle", ctaStyle: "outline", paletteId: "corporate", sectionPlan: ["hero", "about", "services", "process", "gallery", "faq", "cta", "contact", "footer"] }),
  Artisan: recipe({ id: "Artisan", headingFont: '"Playfair Display", Georgia, serif', radius: "0.2rem", buttonRadius: "9999px", cardShadow: "shadow-md", uppercaseHeadings: false, heroStyle: "cinematic", headingTracking: "-0.02em", headingWeight: 700, navStyle: "dark", servicesStyle: "editorial", sectionStyle: "asymmetric", imageStyle: "fullBleed", surfaceStyle: "tonal", motionStyle: "subtle", ctaStyle: "pill", paletteId: "artisan_nature", sectionPlan: ["hero", "about", "services", "gallery", "benefits", "testimonials", "cta", "contact", "footer"] }),
};

const LEGACY_STYLE_MAP: Record<string, string> = {
  modern_clean: "Flat", premium_elegant: "Luxury Minimal", local_trustworthy: "Scandinavian",
  corporate: "Corporate Professional", creative: "Tech Forward", minimalist: "Minimal", bold: "Neobrutalist",
};

const DEFAULT_PRESET = PRESETS.Flat;

export function getDesignPreset(visualStyle?: string | null): DesignPreset {
  if (!visualStyle) return DEFAULT_PRESET;
  return PRESETS[visualStyle] ?? PRESETS[LEGACY_STYLE_MAP[visualStyle]] ?? DEFAULT_PRESET;
}

export function getDesignRecipeFingerprint(preset: DesignPreset): string {
  return [preset.heroStyle, preset.navStyle, preset.servicesStyle, preset.sectionStyle,
    preset.imageStyle, preset.surfaceStyle, preset.motionStyle, preset.ctaStyle,
    preset.footerStyle, preset.aboutUsStyle, preset.radius, preset.buttonRadius, preset.headingFont, preset.headingTracking,
    preset.sectionPlan.join(">")].join("|");
}

export function getAllDesignPresets(): DesignPreset[] {
  return Object.values(PRESETS);
}

/* ------------------------------------------------------------------ */
/* Curated color palettes per visual style.                           */
/* We DO NOT trust the LLM for colors (free models always return the  */
/* same blue/amber). Instead each style has several on-brand palettes */
/* and we pick one deterministically from the business name, so       */
/* different styles AND different businesses get distinct palettes.   */
/* ------------------------------------------------------------------ */

export type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
};

const PALETTES: Record<string, Palette[]> = {
  modern_clean: [
    { primary: "#2563eb", secondary: "#0f172a", accent: "#0ea5e9", background: "#ffffff", text: "#0f172a" },
    { primary: "#0d9488", secondary: "#134e4a", accent: "#f59e0b", background: "#ffffff", text: "#0f172a" },
    { primary: "#0284c7", secondary: "#0c4a6e", accent: "#f97316", background: "#ffffff", text: "#0f172a" },
  ],
  premium_elegant: [
    { primary: "#1e293b", secondary: "#0f172a", accent: "#c2a14d", background: "#faf9f6", text: "#1a1a1a" },
    { primary: "#292524", secondary: "#1c1917", accent: "#b08d57", background: "#f5f5f4", text: "#1c1917" },
    { primary: "#064e3b", secondary: "#022c22", accent: "#d4af37", background: "#f8faf9", text: "#14201b" },
  ],
  local_trustworthy: [
    { primary: "#2563eb", secondary: "#1e40af", accent: "#16a34a", background: "#ffffff", text: "#1e293b" },
    { primary: "#15803d", secondary: "#14532d", accent: "#f59e0b", background: "#fffdf7", text: "#1c2a1f" },
    { primary: "#ea580c", secondary: "#9a3412", accent: "#2563eb", background: "#fffaf5", text: "#292524" },
  ],
  corporate: [
    { primary: "#1e3a8a", secondary: "#0f172a", accent: "#3b82f6", background: "#ffffff", text: "#111827" },
    { primary: "#334155", secondary: "#0f172a", accent: "#0ea5e9", background: "#f8fafc", text: "#0f172a" },
    { primary: "#115e59", secondary: "#134e4a", accent: "#14b8a6", background: "#ffffff", text: "#0f172a" },
  ],
  creative: [
    { primary: "#334155", secondary: "#0f172a", accent: "#14b8a6", background: "#ffffff", text: "#0f172a" },
    { primary: "#115e59", secondary: "#134e4a", accent: "#d97706", background: "#f8fafc", text: "#0f172a" },
    { primary: "#1e40af", secondary: "#172554", accent: "#0ea5e9", background: "#ffffff", text: "#0f172a" },
  ],
  minimalist: [
    { primary: "#111827", secondary: "#000000", accent: "#111827", background: "#ffffff", text: "#111827" },
    { primary: "#18181b", secondary: "#09090b", accent: "#ef4444", background: "#fafafa", text: "#18181b" },
    { primary: "#292524", secondary: "#1c1917", accent: "#57534e", background: "#fafaf9", text: "#1c1917" },
  ],
  bold: [
    { primary: "#dc2626", secondary: "#111827", accent: "#fbbf24", background: "#ffffff", text: "#111827" },
    { primary: "#2563eb", secondary: "#111827", accent: "#facc15", background: "#ffffff", text: "#0b1220" },
    { primary: "#db2777", secondary: "#18181b", accent: "#22d3ee", background: "#ffffff", text: "#18181b" },
  ],
};
const EXTRA_PALETTES: Record<string, Palette[]> = {
  tech_saas: [
    { primary: "#2563eb", secondary: "#0f172a", accent: "#38bdf8", background: "#f8fafc", text: "#0f172a" },
    { primary: "#7c3aed", secondary: "#1e1b4b", accent: "#22d3ee", background: "#ffffff", text: "#111827" },
    { primary: "#0891b2", secondary: "#164e63", accent: "#a3e635", background: "#f0fdfa", text: "#0f172a" },
  ],

  startup_modern: [
    { primary: "#6366f1", secondary: "#312e81", accent: "#f97316", background: "#ffffff", text: "#1e1b4b" },
    { primary: "#0ea5e9", secondary: "#075985", accent: "#84cc16", background: "#f8fafc", text: "#082f49" },
    { primary: "#14b8a6", secondary: "#134e4a", accent: "#eab308", background: "#ffffff", text: "#0f172a" },
  ],

  luxury_dark: [
    { primary: "#0f172a", secondary: "#020617", accent: "#d4af37", background: "#0b1120", text: "#f8fafc" },
    { primary: "#1c1917", secondary: "#0c0a09", accent: "#c08457", background: "#120f0d", text: "#fafaf9" },
    { primary: "#111827", secondary: "#030712", accent: "#eab308", background: "#0a0a0a", text: "#f9fafb" },
  ],

  luxury_light: [
    { primary: "#3f3f46", secondary: "#18181b", accent: "#b08d57", background: "#faf7f2", text: "#1c1917" },
    { primary: "#44403c", secondary: "#292524", accent: "#c2a14d", background: "#f8f5ef", text: "#1f2937" },
    { primary: "#57534e", secondary: "#292524", accent: "#a16207", background: "#fffdf7", text: "#1c1917" },
  ],

  real_estate: [
    { primary: "#1e40af", secondary: "#172554", accent: "#d97706", background: "#ffffff", text: "#111827" },
    { primary: "#0f766e", secondary: "#134e4a", accent: "#f59e0b", background: "#f8fafc", text: "#0f172a" },
    { primary: "#374151", secondary: "#111827", accent: "#ca8a04", background: "#fafaf9", text: "#1f2937" },
  ],

  construction: [
    { primary: "#ea580c", secondary: "#1f2937", accent: "#facc15", background: "#fff7ed", text: "#111827" },
    { primary: "#ca8a04", secondary: "#292524", accent: "#f97316", background: "#ffffff", text: "#1c1917" },
    { primary: "#b45309", secondary: "#111827", accent: "#ef4444", background: "#fffbeb", text: "#1f2937" },
  ],

  roofing_painting: [
    { primary: "#dc2626", secondary: "#1f2937", accent: "#f59e0b", background: "#ffffff", text: "#111827" },
    { primary: "#2563eb", secondary: "#1e3a8a", accent: "#f97316", background: "#f8fafc", text: "#0f172a" },
    { primary: "#475569", secondary: "#0f172a", accent: "#eab308", background: "#ffffff", text: "#111827" },
  ],

  landscaping: [
    { primary: "#15803d", secondary: "#14532d", accent: "#84cc16", background: "#f7fee7", text: "#1c2a1f" },
    { primary: "#166534", secondary: "#052e16", accent: "#f59e0b", background: "#ffffff", text: "#172b1a" },
    { primary: "#4d7c0f", secondary: "#365314", accent: "#22c55e", background: "#fbfff4", text: "#1a2e05" },
  ],

  restaurant: [
    { primary: "#b91c1c", secondary: "#450a0a", accent: "#f59e0b", background: "#fff7ed", text: "#1c1917" },
    { primary: "#ea580c", secondary: "#7c2d12", accent: "#16a34a", background: "#fffaf5", text: "#292524" },
    { primary: "#7f1d1d", secondary: "#1c1917", accent: "#d97706", background: "#fffbeb", text: "#1c1917" },
  ],

  cafe_bakery: [
    { primary: "#92400e", secondary: "#451a03", accent: "#f59e0b", background: "#fff7ed", text: "#2f1b0c" },
    { primary: "#7c2d12", secondary: "#431407", accent: "#facc15", background: "#fef3c7", text: "#2a1708" },
    { primary: "#a16207", secondary: "#713f12", accent: "#ec4899", background: "#fffaf5", text: "#292524" },
  ],

  beauty_wellness: [
    { primary: "#be185d", secondary: "#831843", accent: "#f9a8d4", background: "#fdf2f8", text: "#3b0a24" },
    { primary: "#a855f7", secondary: "#581c87", accent: "#f0abfc", background: "#faf5ff", text: "#2e1065" },
    { primary: "#0f766e", secondary: "#134e4a", accent: "#f4a261", background: "#f8faf9", text: "#14201b" },
  ],

  spa_natural: [
    { primary: "#6b8f71", secondary: "#344e41", accent: "#d8a48f", background: "#faf7f2", text: "#283618" },
    { primary: "#7c9082", secondary: "#3a5a40", accent: "#e9c46a", background: "#f6f4ec", text: "#1f2d1f" },
    { primary: "#4f772d", secondary: "#31572c", accent: "#adc178", background: "#f8f7f0", text: "#1b2a16" },
  ],

  medical_healthcare: [
    { primary: "#0284c7", secondary: "#075985", accent: "#22c55e", background: "#f8fafc", text: "#0f172a" },
    { primary: "#0d9488", secondary: "#134e4a", accent: "#38bdf8", background: "#ffffff", text: "#0f172a" },
    { primary: "#2563eb", secondary: "#1e40af", accent: "#14b8a6", background: "#f0f9ff", text: "#172554" },
  ],

  dental_clinic: [
    { primary: "#0ea5e9", secondary: "#075985", accent: "#ffffff", background: "#f0f9ff", text: "#0f172a" },
    { primary: "#06b6d4", secondary: "#164e63", accent: "#a7f3d0", background: "#ecfeff", text: "#083344" },
    { primary: "#2563eb", secondary: "#1d4ed8", accent: "#67e8f9", background: "#ffffff", text: "#111827" },
  ],

  legal_professional: [
    { primary: "#1e3a8a", secondary: "#0f172a", accent: "#c2a14d", background: "#ffffff", text: "#111827" },
    { primary: "#374151", secondary: "#111827", accent: "#d97706", background: "#f9fafb", text: "#111827" },
    { primary: "#312e81", secondary: "#1e1b4b", accent: "#fbbf24", background: "#f8fafc", text: "#1f2937" },
  ],

  financial_trust: [
    { primary: "#065f46", secondary: "#022c22", accent: "#d4af37", background: "#f8faf9", text: "#10251c" },
    { primary: "#1e40af", secondary: "#172554", accent: "#22c55e", background: "#ffffff", text: "#0f172a" },
    { primary: "#334155", secondary: "#0f172a", accent: "#10b981", background: "#f8fafc", text: "#0f172a" },
  ],

  education: [
    { primary: "#2563eb", secondary: "#1e3a8a", accent: "#f59e0b", background: "#ffffff", text: "#111827" },
    { primary: "#7c3aed", secondary: "#4c1d95", accent: "#22c55e", background: "#faf5ff", text: "#1e1b4b" },
    { primary: "#0891b2", secondary: "#164e63", accent: "#eab308", background: "#f8fafc", text: "#0f172a" },
  ],

  fitness_gym: [
    { primary: "#dc2626", secondary: "#111827", accent: "#facc15", background: "#ffffff", text: "#111827" },
    { primary: "#16a34a", secondary: "#052e16", accent: "#f97316", background: "#f7fee7", text: "#111827" },
    { primary: "#7c3aed", secondary: "#18181b", accent: "#22d3ee", background: "#ffffff", text: "#18181b" },
  ],

  ecommerce_fashion: [
    { primary: "#be123c", secondary: "#4c0519", accent: "#f9a8d4", background: "#fff1f2", text: "#1f2937" },
    { primary: "#111827", secondary: "#000000", accent: "#d4af37", background: "#ffffff", text: "#111827" },
    { primary: "#c026d3", secondary: "#701a75", accent: "#fb7185", background: "#fdf4ff", text: "#2a0a3a" },
  ],

  automotive: [
    { primary: "#dc2626", secondary: "#111827", accent: "#facc15", background: "#f9fafb", text: "#111827" },
    { primary: "#1e3a8a", secondary: "#020617", accent: "#38bdf8", background: "#ffffff", text: "#0f172a" },
    { primary: "#374151", secondary: "#0f172a", accent: "#ef4444", background: "#f8fafc", text: "#111827" },
  ],

  cleaning_services: [
    { primary: "#0ea5e9", secondary: "#075985", accent: "#22c55e", background: "#f0f9ff", text: "#0f172a" },
    { primary: "#14b8a6", secondary: "#0f766e", accent: "#38bdf8", background: "#ffffff", text: "#134e4a" },
    { primary: "#2563eb", secondary: "#1e40af", accent: "#a3e635", background: "#f8fafc", text: "#111827" },
  ],

  nonprofit_community: [
    { primary: "#16a34a", secondary: "#14532d", accent: "#f59e0b", background: "#fffdf7", text: "#1c2a1f" },
    { primary: "#2563eb", secondary: "#1e3a8a", accent: "#f97316", background: "#ffffff", text: "#0f172a" },
    { primary: "#9333ea", secondary: "#581c87", accent: "#22c55e", background: "#faf5ff", text: "#2e1065" },
  ],

  kids_fun: [
    { primary: "#f97316", secondary: "#7c2d12", accent: "#22c55e", background: "#fff7ed", text: "#1f2937" },
    { primary: "#db2777", secondary: "#831843", accent: "#38bdf8", background: "#fdf2f8", text: "#3b0a24" },
    { primary: "#eab308", secondary: "#854d0e", accent: "#7c3aed", background: "#fefce8", text: "#292524" },
  ],

  cybersecurity: [
    { primary: "#22c55e", secondary: "#020617", accent: "#38bdf8", background: "#020617", text: "#e5e7eb" },
    { primary: "#0ea5e9", secondary: "#0f172a", accent: "#a3e635", background: "#030712", text: "#f8fafc" },
    { primary: "#7c3aed", secondary: "#111827", accent: "#22d3ee", background: "#0b1120", text: "#f9fafb" },
  ],

  artisan_nature: [
    { primary: "#2c4a2c", secondary: "#0d1a0d", accent: "#8fa870", background: "#f8f5ee", text: "#1c2018" },
    { primary: "#4a3c28", secondary: "#1a130a", accent: "#c8a878", background: "#f5f0e8", text: "#1a1510" },
    { primary: "#2c3c4a", secondary: "#0d1520", accent: "#7ab0c8", background: "#f0f4f8", text: "#151e28" },
  ],
};

const ALL_PALETTES: Record<string, Palette[]> = {
  ...PALETTES,
  ...EXTRA_PALETTES,
};

/** Deterministic palette for a given style + seed (business name). */
export function getPalette(
  visualStyle: string | null | undefined,
  seed: string
): Palette {
  const list = ALL_PALETTES[visualStyle ?? "modern_clean"] ?? PALETTES.modern_clean;
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return list[hash % list.length];
}

/** Keeps a user-selected palette authoritative through generation. */
export function resolvePalette(
  selected: Palette | null | undefined,
  visualStyle: string | null | undefined,
  seed: string
): Palette {
  return selected ? { ...selected } : getPalette(visualStyle, seed);
}
