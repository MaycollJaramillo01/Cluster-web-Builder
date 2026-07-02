import type { CSSProperties } from "react";

import type { SiteTheme } from "@/lib/site/blueprint";
import type { RenderSection } from "@/lib/site/section";
import { getDesignPreset } from "@/lib/site/design";
import { getStyleOverride, resolveElementStyle } from "@/lib/site/element-style";
import { normalizeSectionLayout } from "@/lib/site/section-layout";
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
import { PricingBlock } from "./PricingBlock";
import { TextBlock } from "./TextBlock";
import { ImageBlock } from "./ImageBlock";
import { VideoBlock } from "./VideoBlock";
import { WidgetBlock } from "./WidgetBlock";
import { Reveal } from "./Reveal";
import { SiteNav } from "./SiteNav";
import { SocialDock } from "./SocialDock";
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
  pricing: PricingBlock,
  text: TextBlock,
  image: ImageBlock,
  video: VideoBlock,
  freeform: WidgetBlock,
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

  // La galería etiqueta sus celdas con los servicios reales cuando no trae items propios.
  const servicesItems = (() => {
    const services = sections.find((s) => s.type === "services");
    const raw = services?.settings?.items;
    return Array.isArray(raw) ? raw : [];
  })();

  // IDs unicos por seccion: el primero de cada tipo conserva el ancla clasica
  // (#section-contact) y los repetidos llevan sufijo para no romper accesibilidad.
  const idCounts = new Map<string, number>();
  const sectionDomId = (type: string) => {
    const count = (idCounts.get(type) ?? 0) + 1;
    idCounts.set(type, count);
    return count === 1 ? `section-${type}` : `section-${type}-${count}`;
  };

  const renderSection = (rawSection: RenderSection) => {
    const section =
      rawSection.type === "gallery" && !Array.isArray(rawSection.settings?.items) && servicesItems.length
        ? { ...rawSection, settings: { ...rawSection.settings, items: servicesItems } }
        : rawSection;
    if (!section.isVisible && !editable) return null;
    const domId = sectionDomId(section.type);
    const Block = BLOCK_MAP[section.type] ?? GenericBlock;
    const content = (
      <Block section={section} theme={theme} preset={preset} site={site} index={section.order} />
    );
    const layout = normalizeSectionLayout(section.settings?.layout);
    const sectionStyle = resolveElementStyle("section", getStyleOverride(section.settings, "section"));
    const laidOutContent = (
      <div
        className="site-section-layout"
        data-width={layout.width}
        data-align={layout.align}
        data-background={layout.background}
        data-spacing={layout.spacing}
        style={{
          "--section-tonal": `color-mix(in srgb, ${theme.primary} 8%, ${theme.background})`,
          ...sectionStyle,
        } as CSSProperties}
      >
        {content}
      </div>
    );

    if (editable && !section.isVisible) {
      return (
        <div id={domId} key={section.id} className="relative opacity-40 scroll-mt-16">
          <div className="pointer-events-none absolute right-3 top-3 z-10 rounded bg-slate-900/80 px-2 py-1 text-xs text-white">
            Oculta
          </div>
          {laidOutContent}
        </div>
      );
    }
    const animate = !editable;
    return (
      <div id={domId} key={section.id} className={`scroll-mt-16 design-reveal design-reveal-${preset.motionStyle}`}>
        <Reveal disabled={!animate} motion={preset.motionStyle} delay={Math.min(section.order, 6) * 40}>{laidOutContent}</Reveal>
      </div>
    );
  };

  return (
    <div id="top" data-design-style={preset.id} data-site-template={preset.id.toLowerCase()} data-design-motion={preset.motionStyle} style={rootStyle}>
      <SiteNav
        businessName={site.businessName}
        logoUrl={site.logoUrl}
        navItems={landingNav}
        theme={theme}
        preset={preset}
        ctaText={hero?.ctaText || "Contacto"}
        ctaHref={hero?.ctaLink || "#contact"}
      />

      {renderTemplateFlow(preset.family, pageSections.map(renderSection))}

      {footer && (
        <>
          <FooterBlock section={footer} theme={theme} preset={preset} site={site} index={footer.order} />
          <div className="py-2 text-center text-[10px]" style={{ backgroundColor: theme.secondary, color: getContrastText(theme.secondary) }}>
            Fotos y videos provistos por <a href="https://www.pexels.com" target="_blank" rel="noreferrer" className="underline underline-offset-2">Pexels</a>
            {site.showBranding !== false && <> · Creado con Cluster</>}
          </div>
        </>
      )}
      <SocialDock businessName={site.businessName} phone={site.phone} links={site.socialLinks} />
    </div>
  );
}

function renderTemplateFlow(template: string, sections: React.ReactNode[]) {
  const [hero, ...rest] = sections;
  if (template === "editorial") return <main className="site-flow site-flow-editorial">{hero}<div className="site-editorial-body">{rest}</div></main>;
  if (template === "immersive") return <main className="site-flow site-flow-immersive">{sections}</main>;
  if (template === "catalog") return <main className="site-flow site-flow-catalog">{hero}<div className="site-catalog-body">{rest}</div></main>;
  if (template === "local") return <main className="site-flow site-flow-local">{sections}</main>;
  if (template === "minimal") return <main className="site-flow site-flow-minimal">{sections}</main>;
  return <main className="site-flow site-flow-service">{sections}</main>;
}
