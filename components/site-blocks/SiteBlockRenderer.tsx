import type { CSSProperties } from "react";

import type { SiteTheme } from "@/lib/site/blueprint";
import type { RenderSection } from "@/lib/site/section";
import type { NavPage } from "@/lib/site/structure";
import { getDesignPreset } from "@/lib/site/design";

import { HeroBlock } from "./HeroBlock";
import { ServicesBlock } from "./ServicesBlock";
import { AboutBlock } from "./AboutBlock";
import { BenefitsBlock } from "./BenefitsBlock";
import { TestimonialsBlock } from "./TestimonialsBlock";
import { FaqBlock } from "./FaqBlock";
import { ContactBlock } from "./ContactBlock";
import { CtaBlock } from "./CtaBlock";
import { FooterBlock } from "./FooterBlock";
import { TrustBadgesBlock } from "./TrustBadgesBlock";
import { LocationBlock } from "./LocationBlock";
import { GalleryBlock } from "./GalleryBlock";
import { GenericBlock } from "./GenericBlock";
import { Reveal } from "./Reveal";
import { SiteNav } from "./SiteNav";
import type { BlockProps, BlockSiteInfo } from "./types";

type BlockComponent = (props: BlockProps) => React.ReactNode;

const BLOCK_MAP: Record<string, BlockComponent> = {
  hero: HeroBlock,
  services: ServicesBlock,
  about: AboutBlock,
  benefits: BenefitsBlock,
  testimonials: TestimonialsBlock,
  faq: FaqBlock,
  contact: ContactBlock,
  cta: CtaBlock,
  footer: FooterBlock,
  trust_badges: TrustBadgesBlock,
  location: LocationBlock,
  gallery: GalleryBlock,
  process: GenericBlock,
  pricing: GenericBlock,
};

export type SiteBlockRendererProps = {
  sections: RenderSection[];
  theme: SiteTheme;
  site: BlockSiteInfo;
  visualStyle?: string | null;
  /** Nav pages for the menu. Empty/single = no multipage chrome. */
  navPages?: NavPage[];
  /** The page currently being shown. */
  currentPageSlug?: string;
  /** Public link base, e.g. /preview/<id>. */
  baseHref?: string;
  /** Editor: switch previewed page without navigating. */
  onSelectPage?: (slug: string) => void;
  editable?: boolean;
};

export function SiteBlockRenderer({
  sections,
  theme,
  site,
  visualStyle,
  navPages = [],
  currentPageSlug = "home",
  baseHref,
  onSelectPage,
  editable = false,
}: SiteBlockRendererProps) {
  const preset = getDesignPreset(visualStyle);
  const isMultipage = navPages.length > 1;

  const rootStyle = {
    backgroundColor: theme.background,
    color: theme.text,
    fontFamily: preset.bodyFont,
    "--site-heading": preset.headingFont,
    "--site-body": preset.bodyFont,
    "--site-radius": preset.radius,
    "--site-btn-radius": preset.buttonRadius,
    "--site-tracking": preset.headingTracking,
  } as CSSProperties;

  // Footer renders on every page (page-independent).
  const footer = sections.find((s) => s.type === "footer");

  // Sections for the active page, excluding the footer.
  const pageSections = sections
    .filter((s) => s.type !== "footer")
    .filter((s) => (isMultipage ? s.pageSlug === currentPageSlug : true))
    .sort((a, b) => a.order - b.order);

  const currentPage = navPages.find((p) => p.slug === currentPageSlug);
  const showPageHeader = isMultipage && currentPageSlug !== "home";

  const renderSection = (section: RenderSection) => {
    if (!section.isVisible && !editable) return null;
    const Block = BLOCK_MAP[section.type] ?? GenericBlock;
    const content = (
      <Block section={section} theme={theme} preset={preset} site={site} index={section.order} />
    );

    if (editable && !section.isVisible) {
      return (
        <div key={section.id} className="relative opacity-40">
          <div className="pointer-events-none absolute right-3 top-3 z-10 rounded bg-slate-900/80 px-2 py-1 text-xs text-white">
            Oculta
          </div>
          {content}
        </div>
      );
    }
    const animate = !editable;
    return (
      <Reveal key={section.id} disabled={!animate}>
        {content}
      </Reveal>
    );
  };

  return (
    <div style={rootStyle}>
      {isMultipage && (
        <SiteNav
          businessName={site.businessName}
          navPages={navPages}
          currentSlug={currentPageSlug}
          theme={theme}
          baseHref={baseHref}
          onSelect={onSelectPage}
        />
      )}

      {showPageHeader && (
        <section
          className="px-6 py-16 text-center"
          style={{ backgroundColor: theme.secondary, color: "#fff" }}
        >
          <h1
            className="text-3xl font-bold sm:text-5xl"
            style={{ fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight, textTransform: preset.uppercaseHeadings ? "uppercase" : "none" }}
          >
            {currentPage?.name ?? ""}
          </h1>
        </section>
      )}

      {pageSections.map(renderSection)}

      {footer && (
        <FooterBlock section={footer} theme={theme} preset={preset} site={site} index={footer.order} />
      )}
    </div>
  );
}
