import type { SiteTheme } from "@/lib/site/blueprint";
import type { RenderSection } from "@/lib/site/section";
import type { DesignPreset } from "@/lib/site/design";

export type BlockSiteInfo = {
  businessName: string;
  businessType: string;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
};

export type BlockProps = {
  section: RenderSection;
  theme: SiteTheme;
  preset: DesignPreset;
  site: BlockSiteInfo;
  /** Stable index used to derive deterministic placeholder images. */
  index: number;
};
