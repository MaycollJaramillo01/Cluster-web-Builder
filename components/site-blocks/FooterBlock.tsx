import type { BlockProps } from "./types";

export function FooterBlock({ section, theme, site }: BlockProps) {
  const year = new Date().getFullYear();
  return (
    <footer className="px-6 py-14" style={{ backgroundColor: theme.secondary, color: "#e2e8f0" }}>
      <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
        <div>
          <p
            className="text-lg font-semibold text-white"
            style={{ fontFamily: "var(--site-heading)" }}
          >
            {section.title || site.businessName}
          </p>
          {section.subtitle && <p className="text-sm opacity-70">{section.subtitle}</p>}
        </div>
        <div className="flex flex-wrap items-center gap-x-6 gap-y-1 text-sm opacity-75">
          {site.phone && <span>{site.phone}</span>}
          {site.email && <span>{site.email}</span>}
          {site.location && <span>{site.location}</span>}
        </div>
      </div>
      <div className="mx-auto mt-10 max-w-6xl border-t border-white/10 pt-6 text-center text-xs opacity-60">
        © {year} {site.businessName}. Todos los derechos reservados.
      </div>
    </footer>
  );
}
