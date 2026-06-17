import type { SiteTheme } from "@/lib/site/blueprint";
import type { RenderSection } from "@/lib/site/section";
import type { NavPage } from "@/lib/site/structure";
import { SiteBlockRenderer } from "@/components/site-blocks/SiteBlockRenderer";

export type SitePreviewProps = {
  businessName: string;
  businessType: string;
  phone?: string | null;
  email?: string | null;
  location?: string | null;
  theme: SiteTheme;
  visualStyle?: string | null;
  sections: RenderSection[];
  navPages?: NavPage[];
  currentPageSlug?: string;
  baseHref?: string;
  onSelectPage?: (slug: string) => void;
  editable?: boolean;
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
  theme,
  visualStyle,
  sections,
  navPages = [],
  currentPageSlug = "home",
  baseHref,
  onSelectPage,
  editable = false,
}: SitePreviewProps) {
  return (
    <SiteBlockRenderer
      sections={sections}
      theme={theme}
      visualStyle={visualStyle}
      navPages={navPages}
      currentPageSlug={currentPageSlug}
      baseHref={baseHref}
      onSelectPage={onSelectPage}
      editable={editable}
      site={{ businessName, businessType, phone, email, location }}
    />
  );
}
