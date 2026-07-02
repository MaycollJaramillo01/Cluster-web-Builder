export const DESIGN_STYLE_IDS = [
  "Service", "Editorial", "Immersive", "Catalog", "Local", "Minimal",
  "StudioSplit", "Manifesto", "Statement", "Gridline", "Overlap", "Panorama",
  "Collage", "Portrait", "Reverse", "Masthead", "Framed", "Metrics", "Quote",
  "Timeline", "Columns", "Accent", "Numbered", "BigType", "SplitStats", "Badges",
  "Folio", "Journal", "Atelier", "Noir", "Velocity", "Pulse", "Horizon",
  "Market", "Showcase", "Boutique", "Stack", "Corner", "Neighbor", "Homestead",
  "Storefront", "Ledger", "Blank", "Serif", "Mono", "Blueprint",
] as const;

export type DesignStyleId = (typeof DESIGN_STYLE_IDS)[number];
export type TemplateFamily = "service" | "editorial" | "immersive" | "catalog" | "local" | "minimal";

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
export type HeroMedia = "image" | "video";
export type NavStyle = "bar" | "floating" | "minimal" | "bordered" | "dark";
export type ServicesStyle = "cards" | "list" | "bento" | "editorial" | "bordered" | "split";
export type SectionStyle = "centered" | "asymmetric" | "contained" | "fullBleed" | "grid";
export type ImageStyle = "rounded" | "square" | "arch" | "fullBleed" | "monochrome" | "offset";
export type SurfaceStyle = "plain" | "soft" | "outlined" | "glass" | "brutal" | "tonal" | "dark";
export type MotionStyle = "subtle" | "stagger" | "kinetic" | "editorial" | "cinematic" | "minimal";
export type CtaStyle = "solid" | "outline" | "pill" | "offset" | "link";
export type FooterStyle = "minimal" | "columns" | "editorial" | "brutal" | "darkBand" | "centered";
export const CONTACT_STYLES = [
  "split", "editorial", "spotlight", "glass", "floating", "minimalLine",
  "reverse", "brutal", "centered", "bordered", "offset", "dark",
  "asymmetric", "quote", "sidebar", "banner", "framed", "steps",
  "stacked", "compact",
] as const;
export type ContactStyle = (typeof CONTACT_STYLES)[number];
/** All About-Us variant ids. */
export const ABOUT_US_STYLES = [
  "split", "editorial", "manifesto", "statement", "grid", "immersive",
  "overlap", "polaroid", "banner", "collage", "portrait", "reverse",
  "masthead", "framed", "stats", "checklist", "quote", "timeline",
  "columns", "accent", "numbered", "bigtype", "splitstats", "minimalline",
  "badges", "mosaic",
] as const;
export type AboutUsStyle = (typeof ABOUT_US_STYLES)[number];

export const FAQ_STYLES = ["accordion", "split", "grid", "minimal", "magazine", "columns"] as const;
export type FaqStyle = (typeof FAQ_STYLES)[number];

export const BENEFITS_STYLES = ["cards", "columns", "grid", "brutal", "checklist", "numbered", "pills"] as const;
export type BenefitsStyle = (typeof BENEFITS_STYLES)[number];

export const PROCESS_STYLES = ["timeline", "split", "cards", "numbered", "vertical", "dark"] as const;
export type ProcessStyle = (typeof PROCESS_STYLES)[number];

export const GALLERY_STYLES = ["grid", "masonry", "editorial", "bento", "filmstrip", "mosaic"] as const;
export type GalleryStyle = (typeof GALLERY_STYLES)[number];

export const TESTIMONIALS_STYLES = ["cards", "quotes", "minimal", "wall", "list", "featured"] as const;
export type TestimonialsStyle = (typeof TESTIMONIALS_STYLES)[number];

export const LOCATION_STYLES = ["map", "split", "banner", "card", "minimal", "pins"] as const;
export type LocationStyle = (typeof LOCATION_STYLES)[number];

export const PRICING_STYLES = ["cards", "table", "list", "featured", "minimal", "tiers"] as const;
export type PricingStyle = (typeof PRICING_STYLES)[number];

export type DesignPreset = {
  id: DesignStyleId;
  family: TemplateFamily;
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
  /** Primary media used by image-capable hero compositions. */
  heroMedia: HeroMedia;
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
  contactStyle: ContactStyle;
  aboutUsStyle: AboutUsStyle;
  faqStyle: FaqStyle;
  benefitsStyle: BenefitsStyle;
  processStyle: ProcessStyle;
  galleryStyle: GalleryStyle;
  testimonialsStyle: TestimonialsStyle;
  locationStyle: LocationStyle;
  pricingStyle: PricingStyle;
  paletteId: string;
  sectionPlan: string[];
};

const CONTACT_STYLE_BY_ID: Record<DesignStyleId, ContactStyle> = {
  Service: "split",
  Editorial: "editorial",
  Immersive: "spotlight",
  Catalog: "glass",
  Local: "floating",
  Minimal: "minimalLine",
  StudioSplit: "reverse",
  Manifesto: "brutal",
  Statement: "centered",
  Gridline: "bordered",
  Overlap: "offset",
  Panorama: "dark",
  Collage: "asymmetric",
  Portrait: "quote",
  Reverse: "sidebar",
  Masthead: "banner",
  Framed: "framed",
  Metrics: "steps",
  Quote: "stacked",
  Timeline: "compact",
  Columns: "bordered",
  Accent: "brutal",
  Numbered: "steps",
  BigType: "spotlight",
  SplitStats: "asymmetric",
  Badges: "floating",
  Folio: "offset",
  Journal: "editorial",
  Atelier: "quote",
  Noir: "dark",
  Velocity: "spotlight",
  Pulse: "steps",
  Horizon: "banner",
  Market: "glass",
  Showcase: "asymmetric",
  Boutique: "framed",
  Stack: "bordered",
  Corner: "floating",
  Neighbor: "centered",
  Homestead: "split",
  Storefront: "sidebar",
  Ledger: "minimalLine",
  Blank: "minimalLine",
  Serif: "stacked",
  Mono: "compact",
  Blueprint: "reverse",
};

const VIDEO_HERO_STYLES = new Set<DesignStyleId>([
  "Immersive",
  "Local",
  "Panorama",
  "Framed",
  "Timeline",
  "Badges",
]);

type RecipeInput = Omit<DesignPreset, "bodyFont" | "useImages" | "contactStyle" | "heroMedia" | "faqStyle" | "benefitsStyle" | "processStyle" | "galleryStyle" | "testimonialsStyle" | "locationStyle" | "pricingStyle"> &
  Partial<Pick<DesignPreset, "bodyFont" | "useImages" | "contactStyle" | "heroMedia" | "faqStyle" | "benefitsStyle" | "processStyle" | "galleryStyle" | "testimonialsStyle" | "locationStyle" | "pricingStyle">>;

function recipe(input: RecipeInput): DesignPreset {
  return {
    bodyFont: '"Inter", system-ui, sans-serif',
    useImages: true,
    contactStyle: CONTACT_STYLE_BY_ID[input.id],
    heroMedia: VIDEO_HERO_STYLES.has(input.id) ? "video" : "image",
    faqStyle: "accordion",
    benefitsStyle: "cards",
    processStyle: "timeline",
    galleryStyle: "grid",
    testimonialsStyle: "cards",
    locationStyle: "map",
    pricingStyle: "cards",
    ...input,
    sectionPlan: input.sectionPlan.map((type) => type === "about" ? "about_us" : type),
  };
}

const PRESETS: Record<DesignStyleId, DesignPreset> = {
  Service: recipe({ id: "Service", family: "service", headingFont: '"Inter", system-ui, sans-serif', radius: "0.5rem", buttonRadius: "0.35rem", cardShadow: "shadow-sm", uppercaseHeadings: false, heroStyle: "split", headingTracking: "-0.025em", headingWeight: 750, navStyle: "bar", servicesStyle: "bordered", sectionStyle: "contained", imageStyle: "square", surfaceStyle: "plain", motionStyle: "subtle", ctaStyle: "solid", footerStyle: "minimal", contactStyle: "split", aboutUsStyle: "checklist", faqStyle: "accordion", benefitsStyle: "cards", processStyle: "timeline", galleryStyle: "grid", testimonialsStyle: "cards", locationStyle: "map", paletteId: "corporate", sectionPlan: ["hero", "services", "benefits", "process", "about_us", "testimonials", "faq", "contact", "cta", "footer"] }),
  Editorial: recipe({ id: "Editorial", family: "editorial", headingFont: '"Playfair Display", Georgia, serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "editorial", headingTracking: "-0.03em", headingWeight: 700, navStyle: "minimal", servicesStyle: "editorial", sectionStyle: "asymmetric", imageStyle: "offset", surfaceStyle: "plain", motionStyle: "editorial", ctaStyle: "link", footerStyle: "editorial", aboutUsStyle: "editorial", faqStyle: "magazine", benefitsStyle: "columns", processStyle: "numbered", galleryStyle: "masonry", testimonialsStyle: "quotes", locationStyle: "split", paletteId: "luxury_light", pricingStyle: "featured", sectionPlan: ["hero", "about_us", "gallery", "services", "faq", "cta", "contact", "footer"] }),
  Immersive: recipe({ id: "Immersive", family: "immersive", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "0.75rem", buttonRadius: "0.5rem", cardShadow: "shadow-xl", uppercaseHeadings: false, heroStyle: "immersive", headingTracking: "-0.045em", headingWeight: 800, navStyle: "dark", servicesStyle: "bento", sectionStyle: "fullBleed", imageStyle: "fullBleed", surfaceStyle: "dark", motionStyle: "cinematic", ctaStyle: "solid", footerStyle: "darkBand", aboutUsStyle: "immersive", faqStyle: "grid", benefitsStyle: "grid", processStyle: "dark", galleryStyle: "bento", testimonialsStyle: "wall", locationStyle: "banner", paletteId: "cybersecurity", pricingStyle: "tiers", sectionPlan: ["hero", "benefits", "gallery", "services", "about_us", "process", "cta", "contact", "footer"] }),
  Catalog: recipe({ id: "Catalog", family: "catalog", headingFont: '"Poppins", system-ui, sans-serif', radius: "1rem", buttonRadius: "9999px", cardShadow: "shadow-md", uppercaseHeadings: false, heroStyle: "gradient", headingTracking: "-0.03em", headingWeight: 750, navStyle: "floating", servicesStyle: "bento", sectionStyle: "grid", imageStyle: "rounded", surfaceStyle: "tonal", motionStyle: "stagger", ctaStyle: "pill", footerStyle: "columns", aboutUsStyle: "mosaic", faqStyle: "grid", benefitsStyle: "pills", processStyle: "cards", galleryStyle: "grid", testimonialsStyle: "cards", locationStyle: "card", paletteId: "ecommerce_fashion", pricingStyle: "table", sectionPlan: ["hero", "services", "gallery", "about_us", "benefits", "faq", "contact", "cta", "footer"] }),
  Local: recipe({ id: "Local", family: "local", headingFont: '"Poppins", system-ui, sans-serif', radius: "1.25rem", buttonRadius: "9999px", cardShadow: "shadow-lg", uppercaseHeadings: false, heroStyle: "framed", headingTracking: "-0.02em", headingWeight: 700, navStyle: "floating", servicesStyle: "cards", sectionStyle: "contained", imageStyle: "rounded", surfaceStyle: "soft", motionStyle: "subtle", ctaStyle: "pill", footerStyle: "columns", aboutUsStyle: "polaroid", faqStyle: "accordion", benefitsStyle: "checklist", processStyle: "timeline", galleryStyle: "grid", testimonialsStyle: "list", locationStyle: "split", paletteId: "local_trustworthy", pricingStyle: "list", sectionPlan: ["hero", "services", "benefits", "about_us", "testimonials", "location", "contact", "cta", "footer"] }),
  Minimal: recipe({ id: "Minimal", family: "minimal", headingFont: '"Inter", system-ui, sans-serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "minimal", useImages: false, headingTracking: "0.06em", headingWeight: 650, navStyle: "minimal", servicesStyle: "list", sectionStyle: "centered", imageStyle: "square", surfaceStyle: "plain", motionStyle: "minimal", ctaStyle: "link", footerStyle: "centered", aboutUsStyle: "minimalline", faqStyle: "minimal", benefitsStyle: "numbered", processStyle: "numbered", galleryStyle: "filmstrip", testimonialsStyle: "minimal", locationStyle: "minimal", paletteId: "minimalist", pricingStyle: "minimal", sectionPlan: ["hero", "services", "about_us", "contact", "cta", "footer"] }),
  StudioSplit: recipe({ id: "StudioSplit", family: "service", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "0.25rem", buttonRadius: "0.25rem", cardShadow: "shadow-md", uppercaseHeadings: false, heroStyle: "split", headingTracking: "-0.04em", headingWeight: 780, navStyle: "bordered", servicesStyle: "split", sectionStyle: "asymmetric", imageStyle: "offset", surfaceStyle: "outlined", motionStyle: "stagger", ctaStyle: "outline", footerStyle: "columns", aboutUsStyle: "split", faqStyle: "split", benefitsStyle: "columns", processStyle: "split", galleryStyle: "editorial", testimonialsStyle: "cards", locationStyle: "split", paletteId: "modern_clean", pricingStyle: "featured", sectionPlan: ["hero", "about_us", "services", "process", "gallery", "contact", "cta", "footer"] }),
  Manifesto: recipe({ id: "Manifesto", family: "immersive", headingFont: '"Arial Black", Impact, sans-serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "poster", headingTracking: "-0.055em", headingWeight: 900, navStyle: "dark", servicesStyle: "list", sectionStyle: "fullBleed", imageStyle: "square", surfaceStyle: "brutal", motionStyle: "kinetic", ctaStyle: "offset", footerStyle: "brutal", aboutUsStyle: "manifesto", faqStyle: "columns", benefitsStyle: "brutal", processStyle: "numbered", galleryStyle: "mosaic", testimonialsStyle: "wall", locationStyle: "banner", paletteId: "bold", pricingStyle: "list", sectionPlan: ["hero", "about_us", "services", "benefits", "cta", "contact", "footer"] }),
  Statement: recipe({ id: "Statement", family: "minimal", headingFont: '"Helvetica Neue", Arial, sans-serif', radius: "0rem", buttonRadius: "9999px", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "minimal", useImages: false, headingTracking: "-0.045em", headingWeight: 500, navStyle: "minimal", servicesStyle: "list", sectionStyle: "centered", imageStyle: "square", surfaceStyle: "plain", motionStyle: "minimal", ctaStyle: "pill", footerStyle: "centered", aboutUsStyle: "statement", faqStyle: "minimal", benefitsStyle: "checklist", processStyle: "numbered", galleryStyle: "filmstrip", testimonialsStyle: "quotes", locationStyle: "minimal", paletteId: "minimalist", pricingStyle: "minimal", sectionPlan: ["hero", "about_us", "benefits", "services", "cta", "contact", "footer"] }),
  Gridline: recipe({ id: "Gridline", family: "catalog", headingFont: '"Space Mono", monospace', bodyFont: '"Space Mono", monospace', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "gradient", headingTracking: "0.02em", headingWeight: 700, navStyle: "bordered", servicesStyle: "bento", sectionStyle: "grid", imageStyle: "square", surfaceStyle: "outlined", motionStyle: "stagger", ctaStyle: "solid", footerStyle: "columns", aboutUsStyle: "grid", faqStyle: "grid", benefitsStyle: "grid", processStyle: "cards", galleryStyle: "grid", testimonialsStyle: "cards", locationStyle: "card", paletteId: "tech_saas", pricingStyle: "table", sectionPlan: ["hero", "services", "gallery", "about_us", "process", "contact", "cta", "footer"] }),
  Overlap: recipe({ id: "Overlap", family: "editorial", headingFont: '"Playfair Display", Georgia, serif', radius: "1.5rem", buttonRadius: "9999px", cardShadow: "shadow-xl", uppercaseHeadings: false, heroStyle: "split", headingTracking: "-0.035em", headingWeight: 700, navStyle: "floating", servicesStyle: "editorial", sectionStyle: "asymmetric", imageStyle: "offset", surfaceStyle: "soft", motionStyle: "editorial", ctaStyle: "pill", footerStyle: "editorial", aboutUsStyle: "overlap", faqStyle: "accordion", benefitsStyle: "cards", processStyle: "cards", galleryStyle: "masonry", testimonialsStyle: "featured", locationStyle: "split", paletteId: "luxury_light", sectionPlan: ["hero", "gallery", "about_us", "services", "benefits", "contact", "cta", "footer"] }),
  Panorama: recipe({ id: "Panorama", family: "immersive", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-lg", uppercaseHeadings: true, heroStyle: "cinematic", headingTracking: "0.04em", headingWeight: 800, navStyle: "dark", servicesStyle: "bordered", sectionStyle: "fullBleed", imageStyle: "fullBleed", surfaceStyle: "dark", motionStyle: "cinematic", ctaStyle: "outline", footerStyle: "darkBand", aboutUsStyle: "banner", faqStyle: "split", benefitsStyle: "grid", processStyle: "dark", galleryStyle: "editorial", testimonialsStyle: "wall", locationStyle: "banner", paletteId: "artisan_nature", pricingStyle: "tiers", sectionPlan: ["hero", "gallery", "services", "about_us", "process", "cta", "contact", "footer"] }),
  Collage: recipe({ id: "Collage", family: "editorial", headingFont: '"Poppins", system-ui, sans-serif', radius: "0.75rem", buttonRadius: "0.5rem", cardShadow: "shadow-lg", uppercaseHeadings: false, heroStyle: "editorial", headingTracking: "-0.04em", headingWeight: 800, navStyle: "minimal", servicesStyle: "cards", sectionStyle: "asymmetric", imageStyle: "offset", surfaceStyle: "tonal", motionStyle: "stagger", ctaStyle: "solid", footerStyle: "editorial", aboutUsStyle: "collage", faqStyle: "grid", benefitsStyle: "pills", processStyle: "cards", galleryStyle: "mosaic", testimonialsStyle: "quotes", locationStyle: "map", paletteId: "creative", pricingStyle: "featured", sectionPlan: ["hero", "about_us", "services", "gallery", "benefits", "cta", "contact", "footer"] }),
  Portrait: recipe({ id: "Portrait", family: "editorial", headingFont: '"Cormorant Garamond", Georgia, serif', radius: "9999px", buttonRadius: "9999px", cardShadow: "shadow-md", uppercaseHeadings: false, heroStyle: "editorial", headingTracking: "-0.025em", headingWeight: 650, navStyle: "minimal", servicesStyle: "editorial", sectionStyle: "contained", imageStyle: "arch", surfaceStyle: "plain", motionStyle: "editorial", ctaStyle: "link", footerStyle: "editorial", aboutUsStyle: "portrait", faqStyle: "magazine", benefitsStyle: "checklist", processStyle: "numbered", galleryStyle: "masonry", testimonialsStyle: "quotes", locationStyle: "split", paletteId: "premium_elegant", pricingStyle: "featured", sectionPlan: ["hero", "about_us", "benefits", "services", "gallery", "contact", "footer"] }),
  Reverse: recipe({ id: "Reverse", family: "service", headingFont: '"Inter", system-ui, sans-serif', radius: "0.75rem", buttonRadius: "0.5rem", cardShadow: "shadow-sm", uppercaseHeadings: false, heroStyle: "split", headingTracking: "-0.03em", headingWeight: 750, navStyle: "bar", servicesStyle: "bordered", sectionStyle: "asymmetric", imageStyle: "rounded", surfaceStyle: "outlined", motionStyle: "subtle", ctaStyle: "solid", footerStyle: "minimal", aboutUsStyle: "reverse", faqStyle: "accordion", benefitsStyle: "columns", processStyle: "split", galleryStyle: "grid", testimonialsStyle: "list", locationStyle: "map", paletteId: "legal_professional", sectionPlan: ["hero", "services", "about_us", "process", "benefits", "faq", "contact", "footer"] }),
  Masthead: recipe({ id: "Masthead", family: "editorial", headingFont: '"Playfair Display", Georgia, serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "editorial", headingTracking: "0.01em", headingWeight: 800, navStyle: "bordered", servicesStyle: "editorial", sectionStyle: "centered", imageStyle: "fullBleed", surfaceStyle: "plain", motionStyle: "editorial", ctaStyle: "link", footerStyle: "editorial", aboutUsStyle: "masthead", faqStyle: "magazine", benefitsStyle: "cards", processStyle: "numbered", galleryStyle: "editorial", testimonialsStyle: "quotes", locationStyle: "split", paletteId: "luxury_light", pricingStyle: "featured", sectionPlan: ["hero", "gallery", "about_us", "services", "faq", "contact", "cta", "footer"] }),
  Framed: recipe({ id: "Framed", family: "local", headingFont: '"Poppins", system-ui, sans-serif', radius: "1rem", buttonRadius: "0.75rem", cardShadow: "shadow-xl", uppercaseHeadings: false, heroStyle: "framed", headingTracking: "-0.025em", headingWeight: 700, navStyle: "floating", servicesStyle: "cards", sectionStyle: "contained", imageStyle: "rounded", surfaceStyle: "glass", motionStyle: "stagger", ctaStyle: "solid", footerStyle: "columns", aboutUsStyle: "framed", faqStyle: "accordion", benefitsStyle: "checklist", processStyle: "timeline", galleryStyle: "bento", testimonialsStyle: "cards", locationStyle: "split", paletteId: "real_estate", sectionPlan: ["hero", "services", "gallery", "about_us", "location", "benefits", "contact", "footer"] }),
  Metrics: recipe({ id: "Metrics", family: "service", headingFont: '"Inter", system-ui, sans-serif', radius: "0.5rem", buttonRadius: "0.35rem", cardShadow: "shadow-sm", uppercaseHeadings: true, heroStyle: "gradient", headingTracking: "0.025em", headingWeight: 800, navStyle: "bar", servicesStyle: "split", sectionStyle: "grid", imageStyle: "square", surfaceStyle: "outlined", motionStyle: "stagger", ctaStyle: "solid", footerStyle: "minimal", aboutUsStyle: "stats", faqStyle: "grid", benefitsStyle: "grid", processStyle: "cards", galleryStyle: "grid", testimonialsStyle: "list", locationStyle: "card", paletteId: "financial_trust", pricingStyle: "table", sectionPlan: ["hero", "about_us", "benefits", "services", "process", "testimonials", "faq", "cta", "contact", "footer"] }),
  Quote: recipe({ id: "Quote", family: "minimal", headingFont: '"Playfair Display", Georgia, serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "minimal", useImages: false, headingTracking: "-0.03em", headingWeight: 500, navStyle: "minimal", servicesStyle: "list", sectionStyle: "centered", imageStyle: "monochrome", surfaceStyle: "plain", motionStyle: "minimal", ctaStyle: "link", footerStyle: "centered", aboutUsStyle: "quote", faqStyle: "minimal", benefitsStyle: "numbered", processStyle: "numbered", galleryStyle: "filmstrip", testimonialsStyle: "quotes", locationStyle: "minimal", paletteId: "minimalist", pricingStyle: "minimal", sectionPlan: ["hero", "about_us", "services", "faq", "contact", "footer"] }),
  Timeline: recipe({ id: "Timeline", family: "service", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "0.75rem", buttonRadius: "9999px", cardShadow: "shadow-md", uppercaseHeadings: false, heroStyle: "image", headingTracking: "-0.035em", headingWeight: 750, navStyle: "bar", servicesStyle: "cards", sectionStyle: "contained", imageStyle: "rounded", surfaceStyle: "soft", motionStyle: "stagger", ctaStyle: "pill", footerStyle: "columns", aboutUsStyle: "timeline", faqStyle: "accordion", benefitsStyle: "numbered", processStyle: "vertical", galleryStyle: "masonry", testimonialsStyle: "cards", locationStyle: "split", paletteId: "startup_modern", pricingStyle: "list", sectionPlan: ["hero", "process", "about_us", "services", "benefits", "testimonials", "contact", "cta", "footer"] }),
  Columns: recipe({ id: "Columns", family: "catalog", headingFont: '"Poppins", system-ui, sans-serif', radius: "0.25rem", buttonRadius: "0.25rem", cardShadow: "shadow-sm", uppercaseHeadings: false, heroStyle: "split", headingTracking: "-0.03em", headingWeight: 700, navStyle: "bordered", servicesStyle: "bordered", sectionStyle: "grid", imageStyle: "square", surfaceStyle: "tonal", motionStyle: "subtle", ctaStyle: "outline", footerStyle: "columns", aboutUsStyle: "columns", faqStyle: "accordion", benefitsStyle: "columns", processStyle: "timeline", galleryStyle: "grid", testimonialsStyle: "cards", locationStyle: "map", paletteId: "education", pricingStyle: "table", sectionPlan: ["hero", "services", "about_us", "benefits", "gallery", "faq", "contact", "footer"] }),
  Accent: recipe({ id: "Accent", family: "catalog", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "poster", headingTracking: "-0.04em", headingWeight: 850, navStyle: "bordered", servicesStyle: "bento", sectionStyle: "asymmetric", imageStyle: "square", surfaceStyle: "brutal", motionStyle: "kinetic", ctaStyle: "offset", footerStyle: "brutal", aboutUsStyle: "accent", faqStyle: "columns", benefitsStyle: "brutal", processStyle: "numbered", galleryStyle: "mosaic", testimonialsStyle: "wall", locationStyle: "banner", paletteId: "bold", pricingStyle: "list", sectionPlan: ["hero", "services", "benefits", "about_us", "gallery", "cta", "contact", "footer"] }),
  Numbered: recipe({ id: "Numbered", family: "service", headingFont: '"Inter", system-ui, sans-serif', radius: "0.5rem", buttonRadius: "0.5rem", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "gradient", headingTracking: "-0.03em", headingWeight: 800, navStyle: "bar", servicesStyle: "list", sectionStyle: "contained", imageStyle: "square", surfaceStyle: "outlined", motionStyle: "stagger", ctaStyle: "solid", footerStyle: "minimal", aboutUsStyle: "numbered", faqStyle: "columns", benefitsStyle: "numbered", processStyle: "numbered", galleryStyle: "grid", testimonialsStyle: "list", locationStyle: "map", paletteId: "corporate", pricingStyle: "list", sectionPlan: ["hero", "process", "services", "about_us", "benefits", "faq", "contact", "cta", "footer"] }),
  BigType: recipe({ id: "BigType", family: "immersive", headingFont: '"Arial Black", Impact, sans-serif', radius: "0rem", buttonRadius: "9999px", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "poster", headingTracking: "-0.065em", headingWeight: 900, navStyle: "minimal", servicesStyle: "list", sectionStyle: "fullBleed", imageStyle: "monochrome", surfaceStyle: "plain", motionStyle: "kinetic", ctaStyle: "pill", footerStyle: "centered", aboutUsStyle: "bigtype", faqStyle: "grid", benefitsStyle: "cards", processStyle: "dark", galleryStyle: "editorial", testimonialsStyle: "quotes", locationStyle: "banner", paletteId: "creative", pricingStyle: "tiers", sectionPlan: ["hero", "about_us", "gallery", "services", "cta", "contact", "footer"] }),
  SplitStats: recipe({ id: "SplitStats", family: "service", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "1rem", buttonRadius: "0.5rem", cardShadow: "shadow-lg", uppercaseHeadings: false, heroStyle: "split", headingTracking: "-0.04em", headingWeight: 800, navStyle: "floating", servicesStyle: "split", sectionStyle: "grid", imageStyle: "rounded", surfaceStyle: "tonal", motionStyle: "stagger", ctaStyle: "solid", footerStyle: "columns", aboutUsStyle: "splitstats", faqStyle: "split", benefitsStyle: "grid", processStyle: "split", galleryStyle: "bento", testimonialsStyle: "list", locationStyle: "map", paletteId: "tech_saas", pricingStyle: "table", sectionPlan: ["hero", "about_us", "services", "process", "gallery", "benefits", "contact", "footer"] }),
  Badges: recipe({ id: "Badges", family: "local", headingFont: '"Poppins", system-ui, sans-serif', radius: "1.5rem", buttonRadius: "9999px", cardShadow: "shadow-md", uppercaseHeadings: false, heroStyle: "framed", headingTracking: "-0.02em", headingWeight: 700, navStyle: "floating", servicesStyle: "cards", sectionStyle: "centered", imageStyle: "rounded", surfaceStyle: "soft", motionStyle: "subtle", ctaStyle: "pill", footerStyle: "centered", aboutUsStyle: "badges", faqStyle: "grid", benefitsStyle: "checklist", processStyle: "timeline", galleryStyle: "grid", testimonialsStyle: "cards", locationStyle: "split", paletteId: "nonprofit_community", sectionPlan: ["hero", "benefits", "about_us", "services", "testimonials", "location", "faq", "contact", "cta", "footer"] }),
  Folio: recipe({ id: "Folio", family: "editorial", headingFont: '"Playfair Display", Georgia, serif', radius: "0.25rem", buttonRadius: "0rem", cardShadow: "shadow-sm", uppercaseHeadings: false, heroStyle: "image", headingTracking: "-0.03em", headingWeight: 600, navStyle: "minimal", servicesStyle: "editorial", sectionStyle: "asymmetric", imageStyle: "square", surfaceStyle: "plain", motionStyle: "editorial", ctaStyle: "outline", footerStyle: "editorial", aboutUsStyle: "overlap", faqStyle: "magazine", benefitsStyle: "columns", processStyle: "numbered", galleryStyle: "masonry", testimonialsStyle: "featured", locationStyle: "minimal", paletteId: "premium_elegant", pricingStyle: "featured", sectionPlan: ["hero", "gallery", "about_us", "benefits", "services", "contact", "footer"] }),
  Journal: recipe({ id: "Journal", family: "editorial", headingFont: '"Cormorant Garamond", Georgia, serif', radius: "0.5rem", buttonRadius: "9999px", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "editorial", headingTracking: "-0.02em", headingWeight: 600, navStyle: "bar", servicesStyle: "list", sectionStyle: "centered", imageStyle: "arch", surfaceStyle: "soft", motionStyle: "editorial", ctaStyle: "link", footerStyle: "centered", aboutUsStyle: "editorial", faqStyle: "minimal", benefitsStyle: "checklist", processStyle: "vertical", galleryStyle: "masonry", testimonialsStyle: "quotes", locationStyle: "split", paletteId: "luxury_light", pricingStyle: "list", sectionPlan: ["hero", "about_us", "gallery", "benefits", "services", "faq", "contact", "footer"] }),
  Atelier: recipe({ id: "Atelier", family: "editorial", headingFont: '"Montserrat", system-ui, sans-serif', radius: "0rem", buttonRadius: "0.25rem", cardShadow: "shadow-md", uppercaseHeadings: true, heroStyle: "split", headingTracking: "0.03em", headingWeight: 600, navStyle: "bordered", servicesStyle: "editorial", sectionStyle: "grid", imageStyle: "offset", surfaceStyle: "outlined", motionStyle: "editorial", ctaStyle: "offset", footerStyle: "editorial", aboutUsStyle: "masthead", faqStyle: "magazine", benefitsStyle: "pills", processStyle: "cards", galleryStyle: "editorial", testimonialsStyle: "featured", locationStyle: "card", paletteId: "creative", pricingStyle: "featured", sectionPlan: ["hero", "services", "gallery", "faq", "about_us", "contact", "cta", "footer"] }),
  Noir: recipe({ id: "Noir", family: "immersive", headingFont: '"Playfair Display", Georgia, serif', radius: "0.25rem", buttonRadius: "0rem", cardShadow: "shadow-2xl", uppercaseHeadings: true, heroStyle: "cinematic", headingTracking: "0.06em", headingWeight: 600, navStyle: "dark", servicesStyle: "editorial", sectionStyle: "fullBleed", imageStyle: "monochrome", surfaceStyle: "dark", motionStyle: "cinematic", ctaStyle: "outline", footerStyle: "darkBand", aboutUsStyle: "immersive", faqStyle: "minimal", benefitsStyle: "columns", processStyle: "dark", galleryStyle: "filmstrip", testimonialsStyle: "featured", locationStyle: "banner", paletteId: "luxury_dark", pricingStyle: "featured", sectionPlan: ["hero", "gallery", "benefits", "services", "about_us", "cta", "contact", "footer"] }),
  Velocity: recipe({ id: "Velocity", family: "immersive", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "0.5rem", buttonRadius: "0.25rem", cardShadow: "shadow-xl", uppercaseHeadings: true, heroStyle: "image", headingTracking: "-0.05em", headingWeight: 850, navStyle: "dark", servicesStyle: "split", sectionStyle: "asymmetric", imageStyle: "fullBleed", surfaceStyle: "dark", motionStyle: "kinetic", ctaStyle: "solid", footerStyle: "darkBand", aboutUsStyle: "stats", faqStyle: "columns", benefitsStyle: "grid", processStyle: "split", galleryStyle: "bento", testimonialsStyle: "wall", locationStyle: "card", paletteId: "automotive", pricingStyle: "table", sectionPlan: ["hero", "services", "process", "about_us", "gallery", "benefits", "cta", "contact", "footer"] }),
  Pulse: recipe({ id: "Pulse", family: "immersive", headingFont: '"Montserrat", system-ui, sans-serif', radius: "0.75rem", buttonRadius: "9999px", cardShadow: "shadow-lg", uppercaseHeadings: true, heroStyle: "poster", headingTracking: "-0.03em", headingWeight: 900, navStyle: "bar", servicesStyle: "bento", sectionStyle: "grid", imageStyle: "rounded", surfaceStyle: "tonal", motionStyle: "kinetic", ctaStyle: "pill", footerStyle: "columns", aboutUsStyle: "grid", faqStyle: "grid", benefitsStyle: "brutal", processStyle: "numbered", galleryStyle: "mosaic", testimonialsStyle: "wall", locationStyle: "banner", paletteId: "fitness_gym", pricingStyle: "tiers", sectionPlan: ["hero", "benefits", "services", "about_us", "gallery", "testimonials", "faq", "cta", "contact", "footer"] }),
  Horizon: recipe({ id: "Horizon", family: "immersive", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "1rem", buttonRadius: "9999px", cardShadow: "shadow-md", uppercaseHeadings: false, heroStyle: "cinematic", headingTracking: "-0.02em", headingWeight: 650, navStyle: "minimal", servicesStyle: "cards", sectionStyle: "fullBleed", imageStyle: "fullBleed", surfaceStyle: "soft", motionStyle: "cinematic", ctaStyle: "pill", footerStyle: "centered", aboutUsStyle: "banner", faqStyle: "accordion", benefitsStyle: "pills", processStyle: "timeline", galleryStyle: "editorial", testimonialsStyle: "quotes", locationStyle: "pins", paletteId: "spa_natural", pricingStyle: "list", sectionPlan: ["hero", "gallery", "about_us", "services", "benefits", "location", "cta", "contact", "footer"] }),
  Market: recipe({ id: "Market", family: "catalog", headingFont: '"Poppins", system-ui, sans-serif', radius: "0.75rem", buttonRadius: "0.5rem", cardShadow: "shadow-md", uppercaseHeadings: false, heroStyle: "image", headingTracking: "-0.025em", headingWeight: 750, navStyle: "bar", servicesStyle: "cards", sectionStyle: "grid", imageStyle: "rounded", surfaceStyle: "soft", motionStyle: "stagger", ctaStyle: "solid", footerStyle: "columns", aboutUsStyle: "mosaic", faqStyle: "accordion", benefitsStyle: "pills", processStyle: "cards", galleryStyle: "mosaic", testimonialsStyle: "cards", locationStyle: "split", paletteId: "restaurant", pricingStyle: "list", sectionPlan: ["hero", "services", "benefits", "gallery", "about_us", "testimonials", "location", "contact", "footer"] }),
  Showcase: recipe({ id: "Showcase", family: "catalog", headingFont: '"Space Grotesk", system-ui, sans-serif', radius: "1.25rem", buttonRadius: "0.75rem", cardShadow: "shadow-xl", uppercaseHeadings: false, heroStyle: "gradient", headingTracking: "-0.04em", headingWeight: 800, navStyle: "floating", servicesStyle: "bento", sectionStyle: "asymmetric", imageStyle: "rounded", surfaceStyle: "glass", motionStyle: "stagger", ctaStyle: "solid", footerStyle: "columns", aboutUsStyle: "splitstats", faqStyle: "split", benefitsStyle: "grid", processStyle: "cards", galleryStyle: "bento", testimonialsStyle: "featured", locationStyle: "card", paletteId: "startup_modern", pricingStyle: "tiers", sectionPlan: ["hero", "services", "about_us", "gallery", "process", "cta", "contact", "footer"] }),
  Boutique: recipe({ id: "Boutique", family: "catalog", headingFont: '"Playfair Display", Georgia, serif', radius: "0.5rem", buttonRadius: "9999px", cardShadow: "shadow-sm", uppercaseHeadings: true, heroStyle: "editorial", headingTracking: "0.08em", headingWeight: 600, navStyle: "minimal", servicesStyle: "editorial", sectionStyle: "centered", imageStyle: "arch", surfaceStyle: "plain", motionStyle: "editorial", ctaStyle: "outline", footerStyle: "editorial", aboutUsStyle: "polaroid", faqStyle: "minimal", benefitsStyle: "checklist", processStyle: "numbered", galleryStyle: "masonry", testimonialsStyle: "quotes", locationStyle: "minimal", paletteId: "ecommerce_fashion", pricingStyle: "featured", sectionPlan: ["hero", "gallery", "services", "about_us", "benefits", "faq", "contact", "footer"] }),
  Stack: recipe({ id: "Stack", family: "catalog", headingFont: '"Inter", system-ui, sans-serif', radius: "0.35rem", buttonRadius: "0.35rem", cardShadow: "shadow-sm", uppercaseHeadings: false, heroStyle: "split", headingTracking: "-0.02em", headingWeight: 700, navStyle: "bordered", servicesStyle: "bordered", sectionStyle: "contained", imageStyle: "square", surfaceStyle: "outlined", motionStyle: "subtle", ctaStyle: "solid", footerStyle: "minimal", aboutUsStyle: "columns", faqStyle: "columns", benefitsStyle: "numbered", processStyle: "vertical", galleryStyle: "grid", testimonialsStyle: "list", locationStyle: "map", paletteId: "tech_saas", pricingStyle: "table", sectionPlan: ["hero", "services", "process", "benefits", "about_us", "gallery", "faq", "contact", "cta", "footer"] }),
  Corner: recipe({ id: "Corner", family: "local", headingFont: '"Poppins", system-ui, sans-serif', radius: "1rem", buttonRadius: "9999px", cardShadow: "shadow-md", uppercaseHeadings: false, heroStyle: "framed", headingTracking: "-0.015em", headingWeight: 650, navStyle: "bar", servicesStyle: "cards", sectionStyle: "centered", imageStyle: "arch", surfaceStyle: "soft", motionStyle: "subtle", ctaStyle: "pill", footerStyle: "centered", aboutUsStyle: "framed", faqStyle: "accordion", benefitsStyle: "pills", processStyle: "timeline", galleryStyle: "masonry", testimonialsStyle: "quotes", locationStyle: "split", paletteId: "cafe_bakery", pricingStyle: "list", sectionPlan: ["hero", "about_us", "services", "location", "benefits", "testimonials", "contact", "cta", "footer"] }),
  Neighbor: recipe({ id: "Neighbor", family: "local", headingFont: '"Inter", system-ui, sans-serif', radius: "0.75rem", buttonRadius: "0.5rem", cardShadow: "shadow-sm", uppercaseHeadings: false, heroStyle: "split", headingTracking: "-0.02em", headingWeight: 700, navStyle: "bar", servicesStyle: "list", sectionStyle: "contained", imageStyle: "rounded", surfaceStyle: "plain", motionStyle: "subtle", ctaStyle: "solid", footerStyle: "columns", aboutUsStyle: "badges", faqStyle: "accordion", benefitsStyle: "checklist", processStyle: "timeline", galleryStyle: "grid", testimonialsStyle: "list", locationStyle: "pins", paletteId: "nonprofit_community", pricingStyle: "list", sectionPlan: ["hero", "benefits", "services", "about_us", "gallery", "location", "contact", "footer"] }),
  Homestead: recipe({ id: "Homestead", family: "local", headingFont: '"Cormorant Garamond", Georgia, serif', radius: "0.5rem", buttonRadius: "0.5rem", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "image", headingTracking: "-0.01em", headingWeight: 650, navStyle: "minimal", servicesStyle: "editorial", sectionStyle: "contained", imageStyle: "square", surfaceStyle: "tonal", motionStyle: "editorial", ctaStyle: "outline", footerStyle: "columns", aboutUsStyle: "timeline", faqStyle: "split", benefitsStyle: "columns", processStyle: "vertical", galleryStyle: "masonry", testimonialsStyle: "quotes", locationStyle: "map", paletteId: "landscaping", pricingStyle: "list", sectionPlan: ["hero", "services", "about_us", "gallery", "location", "faq", "contact", "cta", "footer"] }),
  Storefront: recipe({ id: "Storefront", family: "local", headingFont: '"Montserrat", system-ui, sans-serif', radius: "0.35rem", buttonRadius: "0.35rem", cardShadow: "shadow-md", uppercaseHeadings: true, heroStyle: "split", headingTracking: "0.01em", headingWeight: 800, navStyle: "bordered", servicesStyle: "bordered", sectionStyle: "contained", imageStyle: "square", surfaceStyle: "outlined", motionStyle: "stagger", ctaStyle: "solid", footerStyle: "minimal", aboutUsStyle: "checklist", faqStyle: "accordion", benefitsStyle: "cards", processStyle: "cards", galleryStyle: "grid", testimonialsStyle: "cards", locationStyle: "banner", paletteId: "roofing_painting", pricingStyle: "cards", sectionPlan: ["hero", "services", "location", "about_us", "benefits", "testimonials", "faq", "contact", "footer"] }),
  Ledger: recipe({ id: "Ledger", family: "minimal", headingFont: '"Inter", system-ui, sans-serif', radius: "0.25rem", buttonRadius: "0.25rem", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "minimal", useImages: false, headingTracking: "0.1em", headingWeight: 600, navStyle: "bordered", servicesStyle: "list", sectionStyle: "contained", imageStyle: "square", surfaceStyle: "outlined", motionStyle: "minimal", ctaStyle: "solid", footerStyle: "minimal", aboutUsStyle: "statement", faqStyle: "minimal", benefitsStyle: "numbered", processStyle: "numbered", galleryStyle: "grid", testimonialsStyle: "minimal", locationStyle: "minimal", paletteId: "financial_trust", pricingStyle: "table", sectionPlan: ["hero", "about_us", "services", "benefits", "faq", "contact", "footer"] }),
  Blank: recipe({ id: "Blank", family: "minimal", headingFont: '"Helvetica Neue", Arial, sans-serif', radius: "0rem", buttonRadius: "0.35rem", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "minimal", useImages: false, headingTracking: "-0.05em", headingWeight: 700, navStyle: "minimal", servicesStyle: "list", sectionStyle: "centered", imageStyle: "square", surfaceStyle: "plain", motionStyle: "minimal", ctaStyle: "solid", footerStyle: "minimal", aboutUsStyle: "minimalline", faqStyle: "minimal", benefitsStyle: "checklist", processStyle: "numbered", galleryStyle: "filmstrip", testimonialsStyle: "minimal", locationStyle: "minimal", paletteId: "minimalist", pricingStyle: "minimal", sectionPlan: ["hero", "about_us", "services", "benefits", "contact", "footer"] }),
  Serif: recipe({ id: "Serif", family: "minimal", headingFont: '"Cormorant Garamond", Georgia, serif', radius: "0rem", buttonRadius: "9999px", cardShadow: "shadow-none", uppercaseHeadings: false, heroStyle: "minimal", headingTracking: "-0.02em", headingWeight: 550, navStyle: "minimal", servicesStyle: "editorial", sectionStyle: "centered", imageStyle: "arch", surfaceStyle: "plain", motionStyle: "minimal", ctaStyle: "link", footerStyle: "centered", aboutUsStyle: "quote", faqStyle: "minimal", benefitsStyle: "checklist", processStyle: "vertical", galleryStyle: "filmstrip", testimonialsStyle: "quotes", locationStyle: "minimal", paletteId: "premium_elegant", pricingStyle: "minimal", sectionPlan: ["hero", "about_us", "services", "gallery", "contact", "footer"] }),
  Mono: recipe({ id: "Mono", family: "minimal", headingFont: '"Space Mono", monospace', bodyFont: '"Space Mono", monospace', radius: "0rem", buttonRadius: "0rem", cardShadow: "shadow-none", uppercaseHeadings: true, heroStyle: "minimal", useImages: false, headingTracking: "0.04em", headingWeight: 700, navStyle: "bordered", servicesStyle: "list", sectionStyle: "grid", imageStyle: "monochrome", surfaceStyle: "outlined", motionStyle: "minimal", ctaStyle: "outline", footerStyle: "minimal", aboutUsStyle: "numbered", faqStyle: "columns", benefitsStyle: "numbered", processStyle: "numbered", galleryStyle: "grid", testimonialsStyle: "list", locationStyle: "minimal", paletteId: "minimalist", pricingStyle: "table", sectionPlan: ["hero", "services", "faq", "about_us", "contact", "cta", "footer"] }),
  Blueprint: recipe({ id: "Blueprint", family: "service", headingFont: '"Montserrat", system-ui, sans-serif', radius: "0.5rem", buttonRadius: "0.35rem", cardShadow: "shadow-md", uppercaseHeadings: true, heroStyle: "split", headingTracking: "0.02em", headingWeight: 800, navStyle: "bar", servicesStyle: "split", sectionStyle: "contained", imageStyle: "square", surfaceStyle: "tonal", motionStyle: "stagger", ctaStyle: "solid", footerStyle: "columns", aboutUsStyle: "split", faqStyle: "split", benefitsStyle: "cards", processStyle: "split", galleryStyle: "grid", testimonialsStyle: "cards", locationStyle: "map", paletteId: "construction", pricingStyle: "cards", sectionPlan: ["hero", "process", "benefits", "services", "about_us", "faq", "contact", "cta", "footer"] }),
};

const LEGACY_STYLE_MAP: Record<string, DesignStyleId> = {
  modern_clean: "Service", premium_elegant: "Editorial", local_trustworthy: "Local",
  corporate: "Service", creative: "Catalog", minimalist: "Minimal", bold: "Immersive",
  Neobrutalist: "Immersive", "Swiss/International": "Service", Glassmorphism: "Immersive",
  "Retro-futuristic": "Immersive", Bauhaus: "Catalog", "Art Deco": "Editorial", Flat: "Service",
  Material: "Local", Neumorphic: "Local", Monochromatic: "Minimal", Scandinavian: "Local",
  Japandi: "Minimal", "Dark Mode First": "Immersive", Modernist: "Service", "Organic/Fluid": "Local",
  "Corporate Professional": "Service", "Tech Forward": "Catalog", "Luxury Minimal": "Editorial",
  "Neo-Geo": "Catalog", Kinetic: "Immersive", "Gradient Modern": "Catalog",
  "Typography First": "Editorial", Metropolitan: "Editorial", Artisan: "Local",
};

const DEFAULT_PRESET = PRESETS.Service;

export function getDesignPreset(visualStyle?: string | null): DesignPreset {
  if (!visualStyle) return DEFAULT_PRESET;
  return PRESETS[visualStyle as DesignStyleId] ?? PRESETS[LEGACY_STYLE_MAP[visualStyle]] ?? DEFAULT_PRESET;
}

/** Normaliza un visualStyle guardado (actual o legado del onboarding) a un DesignStyleId, o null si no existe. */
export function resolveDesignStyleId(visualStyle?: string | null): DesignStyleId | null {
  if (!visualStyle) return null;
  if (visualStyle in PRESETS) return visualStyle as DesignStyleId;
  return LEGACY_STYLE_MAP[visualStyle] ?? null;
}

export function getDesignRecipeFingerprint(preset: DesignPreset): string {
  return [preset.family, preset.heroStyle, preset.heroMedia, preset.navStyle, preset.servicesStyle, preset.sectionStyle,
    preset.imageStyle, preset.surfaceStyle, preset.motionStyle, preset.ctaStyle,
    preset.footerStyle, preset.contactStyle, preset.aboutUsStyle, preset.radius, preset.buttonRadius, preset.headingFont, preset.headingTracking,
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
