"use client";

import type { SiteTheme } from "@/lib/site/blueprint";
import type { NavPage } from "@/lib/site/structure";
import type { DesignPreset } from "@/lib/site/design";
import { getContrastText } from "@/lib/site/theme-surface";

export function SiteNav({
  businessName,
  navPages,
  currentSlug,
  theme,
  preset,
  baseHref,
  onSelect,
  onePage = false,
  ctaText,
  ctaHref,
}: {
  businessName: string;
  navPages: NavPage[];
  currentSlug: string;
  theme: SiteTheme;
  preset: DesignPreset;
  /** Public mode: links route to `${baseHref}` (home) / `${baseHref}/${slug}`. */
  baseHref?: string;
  /** Editor mode: clicking a page calls this instead of navigating. */
  onSelect?: (slug: string) => void;
  onePage?: boolean;
  ctaText?: string;
  ctaHref?: string;
}) {
  const hrefFor = (slug: string) =>
    onePage
      ? `#section-${slug}`
      : slug === "home" ? baseHref || "#" : `${baseHref || ""}/${slug}`;

  const darkNav = preset.navStyle === "dark";
  const navBackground = darkNav ? theme.secondary : theme.background;
  const navText = darkNav ? getContrastText(theme.secondary) : theme.text;
  const links = (
    <>
      {navPages.map((p) => {
        const active = !onePage && p.slug === currentSlug;
        const className =
          "flex min-h-11 items-center rounded-md px-3 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2";
        const style = active
          ? { color: darkNav ? theme.accent : theme.primary, backgroundColor: `${theme.primary}22` }
          : { color: navText, opacity: 0.82 };

        if (onSelect && !onePage) {
          return (
            <li key={p.slug}>
              <button type="button" onClick={() => onSelect(p.slug)} className={className} style={style}>
                {p.name}
              </button>
            </li>
          );
        }
        return (
          <li key={p.slug}>
            <a href={hrefFor(p.slug)} className={className} style={style}>{p.name}</a>
          </li>
        );
      })}
    </>
  );

  const ctaClassName = "inline-flex min-h-11 items-center justify-center px-4 text-sm font-semibold text-white transition-[filter] hover:brightness-95 focus-visible:outline-none focus-visible:ring-2";
  const ctaStyle = { backgroundColor: theme.primary, color: getContrastText(theme.primary), borderRadius: "var(--site-btn-radius)" };
  const cta = !ctaText ? null : onSelect && !onePage ? (
    <button type="button" onClick={() => onSelect("contacto")} className={ctaClassName} style={ctaStyle}>
      {ctaText}
    </button>
  ) : (
    <a href={ctaHref || (onePage ? "#contact" : `${baseHref || ""}/contacto`)} className={ctaClassName} style={ctaStyle}>
      {ctaText}
    </a>
  );

  const floating = preset.navStyle === "floating";
  const bordered = preset.navStyle === "bordered";
  const minimal = preset.navStyle === "minimal";

  return (
    <header
      className={`sticky z-30 ${floating ? "top-3 px-2 sm:px-4" : "top-0"} ${minimal ? "" : "backdrop-blur"}`}
      style={{ backgroundColor: floating ? "transparent" : `${navBackground}f5` }}
    >
      <nav
        className={`mx-auto flex min-h-16 min-w-0 max-w-6xl items-center justify-between gap-2 px-4 sm:gap-4 sm:px-6 ${floating ? "shadow-xl" : ""}`}
        style={{
          backgroundColor: floating ? `${navBackground}f2` : "transparent",
          border: bordered ? `2px solid ${navText}` : floating ? `1px solid ${navText}1f` : "none",
          borderBottom: !floating && !minimal && !bordered ? `1px solid ${navText}14` : undefined,
          borderRadius: floating ? "var(--site-radius)" : undefined,
        }}
      >
        <a
          href={baseHref || "#top"}
          className="min-w-0 max-w-[calc(100vw-8rem)] truncate text-lg font-bold"
          style={{ color: navText, fontFamily: "var(--site-heading)", textTransform: preset.uppercaseHeadings ? "uppercase" : "none" }}
        >
          {businessName}
        </a>

        <div className="hidden items-center gap-3 md:flex">
          <ul className="flex items-center gap-1">{links}</ul>
          {cta}
        </div>

        <details className="group relative shrink-0 md:hidden">
          <summary
            className="flex min-h-11 cursor-pointer list-none items-center rounded-md border px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2"
            style={{ color: navText, borderColor: `${navText}3d` }}
          >
            Menú
          </summary>
          <div
            className="absolute right-0 top-12 z-40 w-64 border p-3 shadow-xl"
            style={{ backgroundColor: navBackground, borderColor: `${navText}1f`, borderRadius: "var(--site-radius)" }}
          >
            <ul className="flex flex-col">{links}</ul>
            {cta && <div className="mt-2 [&>a]:w-full">{cta}</div>}
          </div>
        </details>
      </nav>
    </header>
  );
}
