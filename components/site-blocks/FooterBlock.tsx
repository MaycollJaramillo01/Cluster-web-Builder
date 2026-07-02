import { ensureReadable, getContrastText } from "@/lib/site/theme-surface";
import type { BlockProps, BlockSiteInfo } from "./types";

type ContactListProps = {
  site: BlockSiteInfo;
  className?: string;
};

function ContactList({ site, className = "" }: ContactListProps) {
  return (
    <div className={className}>
      {site.phone && <a href={`tel:${site.phone}`}>{site.phone}</a>}
      {site.email && <a href={`mailto:${site.email}`}>{site.email}</a>}
      {site.location && <span>{site.location}</span>}
    </div>
  );
}

function Copyright({ site, year }: { site: BlockSiteInfo; year: number }) {
  return <span>© {year} {site.businessName}. Todos los derechos reservados.</span>;
}

export function FooterBlock({ section, theme, site, preset }: BlockProps) {
  const year = new Date().getFullYear();
  const title = section.title || site.businessName;
  const darkText = getContrastText(theme.secondary);

  if (preset.footerStyle === "minimal") {
    return (
      <footer
        id="site-footer"
        data-footer-style="minimal"
        className="border-t px-6 py-8"
        style={{ backgroundColor: theme.background, borderColor: theme.primary, color: theme.text }}
      >
        <div className="mx-auto grid max-w-6xl gap-6 md:grid-cols-[1fr_auto] md:items-end">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.16em]" style={{ fontFamily: "var(--site-heading)" }}>
              {title}
            </p>
            {section.subtitle && <p className="mt-2 max-w-md text-sm opacity-65">{section.subtitle}</p>}
          </div>
          <ContactList site={site} className="flex flex-col gap-1 text-sm md:items-end" />
        </div>
        <div className="mx-auto mt-8 max-w-6xl text-xs opacity-55"><Copyright site={site} year={year} /></div>
      </footer>
    );
  }

  if (preset.footerStyle === "editorial") {
    return (
      <footer
        id="site-footer"
        data-footer-style="editorial"
        className="border-t px-6 py-16"
        style={{ backgroundColor: theme.background, borderColor: theme.accent, color: theme.text }}
      >
        <div className="mx-auto max-w-6xl">
          <p className="max-w-4xl text-4xl leading-none sm:text-6xl" style={{ fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
            {title}
          </p>
          <div className="my-10 h-px w-full" style={{ backgroundColor: theme.text, opacity: 0.28 }} />
          <div className="grid gap-8 text-sm md:grid-cols-[1.5fr_1fr_auto] md:items-end">
            <p className="max-w-lg text-base leading-relaxed opacity-70">{section.subtitle}</p>
            <ContactList site={site} className="flex flex-col gap-2" />
            <p className="text-xs opacity-55 md:text-right"><Copyright site={site} year={year} /></p>
          </div>
        </div>
      </footer>
    );
  }

  if (preset.footerStyle === "brutal") {
    const brutalText = getContrastText(theme.accent);
    return (
      <footer
        id="site-footer"
        data-footer-style="brutal"
        className="border-y-[3px] px-6 py-12"
        style={{ backgroundColor: theme.accent, borderColor: brutalText, color: brutalText }}
      >
        <div className="mx-auto max-w-6xl">
          <div className="grid gap-8 lg:grid-cols-[1.4fr_1fr] lg:items-start">
            <div>
              <p className="text-4xl font-black uppercase leading-[0.9] tracking-[-0.05em] sm:text-6xl" style={{ fontFamily: "var(--site-heading)" }}>
                {title}
              </p>
              {section.subtitle && <p className="mt-5 max-w-xl font-bold uppercase">{section.subtitle}</p>}
            </div>
            <ContactList
              site={site}
              className="flex flex-col border-[3px] p-5 text-base font-bold uppercase shadow-[6px_6px_0_currentColor] [&>*+*]:mt-3"
            />
          </div>
          <div className="mt-10 border-t-[3px] pt-4 text-xs font-bold uppercase"><Copyright site={site} year={year} /></div>
        </div>
      </footer>
    );
  }

  if (preset.footerStyle === "darkBand") {
    return (
      <footer id="site-footer" data-footer-style="dark-band" className="px-6 py-16 text-center" style={{ backgroundColor: theme.secondary, color: darkText }}>
        <div className="mx-auto max-w-5xl">
          <div className="mx-auto mb-7 h-1 w-16" style={{ backgroundColor: theme.accent }} />
          <p className="text-3xl font-bold uppercase tracking-[0.12em] sm:text-5xl" style={{ fontFamily: "var(--site-heading)" }}>{title}</p>
          {section.subtitle && <p className="mx-auto mt-4 max-w-xl opacity-65">{section.subtitle}</p>}
          <ContactList site={site} className="mt-9 flex flex-wrap justify-center gap-3 text-sm [&>*]:border [&>*]:border-current [&>*]:px-4 [&>*]:py-2 [&>*]:opacity-75" />
          <div className="mt-12 text-xs opacity-50"><Copyright site={site} year={year} /></div>
        </div>
      </footer>
    );
  }

  if (preset.footerStyle === "centered") {
    const primaryText = getContrastText(theme.primary);
    return (
      <footer id="site-footer" data-footer-style="centered" className="px-6 py-14 text-center" style={{ backgroundColor: theme.primary, color: primaryText }}>
        <div className="mx-auto max-w-3xl">
          <p className="text-2xl font-semibold sm:text-3xl" style={{ fontFamily: "var(--site-heading)" }}>{title}</p>
          {section.subtitle && <p className="mx-auto mt-3 max-w-xl text-sm opacity-70">{section.subtitle}</p>}
          <ContactList site={site} className="mt-7 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm" />
          <div className="mx-auto mt-10 h-px max-w-md bg-current opacity-20" />
          <div className="mt-5 text-xs opacity-55"><Copyright site={site} year={year} /></div>
        </div>
      </footer>
    );
  }

  return (
    <footer
      id="site-footer"
      data-footer-style="columns"
      className="border-t-4 px-6 py-14"
      style={{ backgroundColor: theme.secondary, borderColor: theme.accent, color: darkText }}
    >
      <div className="mx-auto grid max-w-6xl gap-10 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr]">
        <div>
          <p className="text-2xl font-bold" style={{ fontFamily: "var(--site-heading)" }}>{title}</p>
          {section.subtitle && <p className="mt-3 max-w-sm text-sm leading-relaxed opacity-65">{section.subtitle}</p>}
        </div>
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: ensureReadable(theme.accent, theme.secondary) }}>Contacto</p>
          <ContactList site={{ ...site, location: null }} className="flex flex-col gap-2 text-sm" />
        </div>
        <div>
          <p className="mb-4 text-xs font-bold uppercase tracking-[0.16em]" style={{ color: ensureReadable(theme.accent, theme.secondary) }}>Ubicación</p>
          <p className="text-sm opacity-70">{site.location || "Atención disponible en línea"}</p>
        </div>
      </div>
      <div className="mx-auto mt-12 max-w-6xl border-t border-current pt-5 text-xs opacity-45"><Copyright site={site} year={year} /></div>
    </footer>
  );
}
