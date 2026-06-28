import type { CSSProperties } from "react";

import type { SiteTheme } from "@/lib/site/blueprint";
import type { RenderSection } from "@/lib/site/section";
import { getDesignPreset } from "@/lib/site/design";
import { getContrastText } from "@/lib/site/theme-surface";

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
import { ProcessBlock } from "./ProcessBlock";
import { Reveal } from "./Reveal";
import { SiteNav } from "./SiteNav";
import type { BlockProps, BlockSiteInfo } from "./types";

type BlockComponent = (props: BlockProps) => React.ReactNode;

const BLOCK_MAP: Record<string, BlockComponent> = {
  hero: HeroBlock,
  services: ServicesBlock,
  about: AboutBlock,
  about_us: AboutBlock,
  benefits: BenefitsBlock,
  testimonials: TestimonialsBlock,
  faq: FaqBlock,
  contact: ContactBlock,
  cta: CtaBlock,
  footer: FooterBlock,
  trust_badges: TrustBadgesBlock,
  location: LocationBlock,
  gallery: GalleryBlock,
  process: ProcessBlock,
  pricing: GenericBlock,
};

export type SiteBlockRendererProps = {
  sections: RenderSection[];
  theme: SiteTheme;
  site: BlockSiteInfo;
  visualStyle?: string | null;
  editable?: boolean;
};

export function SiteBlockRenderer({
  sections,
  theme,
  site,
  visualStyle,
  editable = false,
}: SiteBlockRendererProps) {
  const preset = getDesignPreset(visualStyle);
  const whatsapp = site.phone?.replace(/\D/g, "");

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
    .sort((a, b) => a.order - b.order);

  const sectionNames: Record<string, string> = {
    services: "Servicios",
    about: "Nosotros",
    about_us: "Nosotros",
    benefits: "Beneficios",
    gallery: "Galería",
    process: "Proceso",
    pricing: "Precios",
    faq: "Preguntas",
    location: "Ubicación",
    contact: "Contacto",
  };
  const landingNav = pageSections
    .filter((section) => section.isVisible && sectionNames[section.type])
    .slice(0, 5)
    .map((section) => ({ slug: section.type, name: sectionNames[section.type] }));
  const hero = pageSections.find((section) => section.type === "hero");

  const renderSection = (section: RenderSection) => {
    if (!section.isVisible && !editable) return null;
    const Block = BLOCK_MAP[section.type] ?? GenericBlock;
    const content = (
      <Block section={section} theme={theme} preset={preset} site={site} index={section.order} />
    );

    if (editable && !section.isVisible) {
      return (
        <div id={`section-${section.type}`} key={section.id} className="relative opacity-40 scroll-mt-16">
          <div className="pointer-events-none absolute right-3 top-3 z-10 rounded bg-slate-900/80 px-2 py-1 text-xs text-white">
            Oculta
          </div>
          {content}
        </div>
      );
    }
    const animate = !editable;
    return (
      <div id={`section-${section.type}`} key={section.id} className={`scroll-mt-16 design-reveal design-reveal-${preset.motionStyle}`}>
        <Reveal disabled={!animate}>{content}</Reveal>
      </div>
    );
  };

  return (
    <div id="top" data-design-style={preset.id} data-design-motion={preset.motionStyle} style={rootStyle}>
      <SiteNav
        businessName={site.businessName}
        navItems={landingNav}
        theme={theme}
        preset={preset}
        ctaText={hero?.ctaText || "Contacto"}
        ctaHref={hero?.ctaLink || "#contact"}
      />

      {pageSections.map(renderSection)}

      {footer && (
        <>
          <FooterBlock section={footer} theme={theme} preset={preset} site={site} index={footer.order} />
          <div className="py-2 text-center text-[10px]" style={{ backgroundColor: theme.secondary, color: getContrastText(theme.secondary) }}>
            Fotos provistas por <a href="https://www.pexels.com" target="_blank" rel="noreferrer" className="underline underline-offset-2">Pexels</a>
            {site.showBranding !== false && <> · Creado con Cluster</>}
          </div>
        </>
      )}
      {whatsapp && whatsapp.length >= 8 && (
        <a
          href={`https://wa.me/${whatsapp}`}
          target="_blank"
          rel="noreferrer"
          aria-label={`Contactar a ${site.businessName} por WhatsApp`}
          className="fixed bottom-5 right-5 z-40 inline-flex min-h-12 items-center rounded-full bg-[#25d366] px-5 text-sm font-bold text-[#062b13] shadow-xl transition-transform hover:scale-105"
        >
          WhatsApp
        </a>
      )}
    </div>
  );
}
