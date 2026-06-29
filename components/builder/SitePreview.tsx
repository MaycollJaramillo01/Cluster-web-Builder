import type { SiteTheme } from "@/lib/site/blueprint";
import type { RenderSection } from "@/lib/site/section";
import { SiteBlockRenderer } from "@/components/site-blocks/SiteBlockRenderer";
import type { SocialLinks } from "@/lib/site/social-links";

export type SitePreviewProps = {
  businessName: string;
  businessType: string;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  publicSlug?: string | null;
  showBranding?: boolean;
  theme: SiteTheme;
  visualStyle?: string | null;
  sections: RenderSection[];
  editable?: boolean;
  socialLinks?: SocialLinks;
};

/**
 * Renders a full site preview from sections + theme using the controlled
 * block renderer. Shared by the editor (editable) and the public preview.
 */
export function SitePreview({
  businessName,
  businessType,
  phone,
  email,
  location,
  publicSlug,
  showBranding,
  theme,
  visualStyle,
  sections,
  editable = false,
  socialLinks,
}: SitePreviewProps) {
  return (
    <SiteBlockRenderer
      sections={sections}
      theme={theme}
      visualStyle={visualStyle}
      editable={editable}
      site={{ businessName, businessType, phone, email, location, publicSlug, showBranding, socialLinks }}
    />
  );
}
