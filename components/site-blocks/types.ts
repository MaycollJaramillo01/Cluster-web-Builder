import type { SiteTheme } from "@/lib/site/blueprint";
import type { RenderSection } from "@/lib/site/section";
import type { DesignPreset } from "@/lib/site/design";
import type { SocialLinks } from "@/lib/site/social-links";

export type BlockSiteInfo = {
  businessName: string;
  businessType: string;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  publicSlug?: string | null;
  showBranding?: boolean;
  logoUrl?: string | null;
  coverUrl?: string | null;
  socialLinks?: SocialLinks;
};

export type BlockProps = {
  section: RenderSection;
  theme: SiteTheme;
  preset: DesignPreset;
  site: BlockSiteInfo;
  /** Stable index used to derive deterministic placeholder images. */
  index: number;
};
