/**
 * Visual primitives used only to render sites created with the retired editor.
 * This is a single compatibility style, not a selectable template catalog.
 */

export type HeroStyle = "image" | "gradient" | "minimal" | "split" | "editorial" | "poster" | "framed" | "immersive" | "cinematic";
export type HeroMedia = "image" | "video";
export type NavStyle = "bar" | "floating" | "minimal" | "bordered" | "dark";
export type ServicesStyle = "cards" | "list" | "bento" | "editorial" | "bordered" | "split";
export type SectionStyle = "centered" | "asymmetric" | "contained" | "fullBleed" | "grid";
export type ImageStyle = "rounded" | "square" | "arch" | "fullBleed" | "monochrome" | "offset";
export type SurfaceStyle = "plain" | "soft" | "outlined" | "glass" | "brutal" | "tonal" | "dark";
export type MotionStyle = "subtle" | "stagger" | "kinetic" | "editorial" | "cinematic" | "minimal";
export type CtaStyle = "solid" | "outline" | "pill" | "offset" | "link";
export type FooterStyle = "minimal" | "columns" | "editorial" | "brutal" | "darkBand" | "centered";
export type ContactStyle = "split" | "editorial" | "spotlight" | "glass" | "floating" | "minimalLine" | "reverse" | "brutal" | "centered" | "bordered" | "offset" | "dark" | "asymmetric" | "quote" | "sidebar" | "banner" | "framed" | "steps" | "stacked" | "compact";
export type AboutUsStyle = "split" | "editorial" | "manifesto" | "statement" | "grid" | "immersive" | "overlap" | "polaroid" | "banner" | "collage" | "portrait" | "reverse" | "masthead" | "framed" | "stats" | "checklist" | "quote" | "timeline" | "columns" | "accent" | "numbered" | "bigtype" | "splitstats" | "minimalline" | "badges" | "mosaic";
export type FaqStyle = "accordion" | "split" | "grid" | "minimal" | "magazine" | "columns";
export type BenefitsStyle = "cards" | "columns" | "grid" | "brutal" | "checklist" | "numbered" | "pills";
export type ProcessStyle = "timeline" | "split" | "cards" | "numbered" | "vertical" | "dark";
export type GalleryStyle = "grid" | "masonry" | "editorial" | "bento" | "filmstrip" | "mosaic";
export type TestimonialsStyle = "cards" | "quotes" | "minimal" | "wall" | "list" | "featured";
export type LocationStyle = "map" | "split" | "banner" | "card" | "minimal" | "pins";
export type PricingStyle = "cards" | "table" | "list" | "featured" | "minimal" | "tiers";

export type DesignPreset = {
  id: string;
  headingFont: string;
  bodyFont: string;
  radius: string;
  buttonRadius: string;
  cardShadow: string;
  uppercaseHeadings: boolean;
  heroStyle: HeroStyle;
  useImages: boolean;
  heroMedia: HeroMedia;
  headingTracking: string;
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
};

const LEGACY_COMPATIBILITY_STYLE: DesignPreset = {
  id: "legacy-compatibility",
  headingFont: '"Inter", system-ui, sans-serif',
  bodyFont: '"Inter", system-ui, sans-serif',
  radius: "0.75rem",
  buttonRadius: "0.5rem",
  cardShadow: "shadow-sm",
  uppercaseHeadings: false,
  heroStyle: "split",
  useImages: true,
  heroMedia: "image",
  headingTracking: "-0.025em",
  headingWeight: 750,
  navStyle: "bar",
  servicesStyle: "cards",
  sectionStyle: "contained",
  imageStyle: "rounded",
  surfaceStyle: "plain",
  motionStyle: "subtle",
  ctaStyle: "solid",
  footerStyle: "minimal",
  contactStyle: "split",
  aboutUsStyle: "split",
  faqStyle: "accordion",
  benefitsStyle: "cards",
  processStyle: "timeline",
  galleryStyle: "grid",
  testimonialsStyle: "cards",
  locationStyle: "map",
  pricingStyle: "cards",
};

export function getDesignPreset(visualStyle?: string | null): DesignPreset {
  void visualStyle;
  return LEGACY_COMPATIBILITY_STYLE;
}

export type Palette = {
  primary: string;
  secondary: string;
  accent: string;
  background: string;
  text: string;
};

const DEFAULT_PALETTE: Palette = {
  primary: "#2563eb",
  secondary: "#0f172a",
  accent: "#14b8a6",
  background: "#ffffff",
  text: "#0f172a",
};

export function resolvePalette(
  selected: Palette | null | undefined,
  visualDirection?: string | null,
  seed?: string,
): Palette {
  void visualDirection;
  void seed;
  return selected ? { ...selected } : { ...DEFAULT_PALETTE };
}
