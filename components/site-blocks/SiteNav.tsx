"use client";

import type { SiteTheme } from "@/lib/site/blueprint";
import type { NavPage } from "@/lib/site/structure";

export function SiteNav({
  businessName,
  navPages,
  currentSlug,
  theme,
  baseHref,
  onSelect,
}: {
  businessName: string;
  navPages: NavPage[];
  currentSlug: string;
  theme: SiteTheme;
  /** Public mode: links route to `${baseHref}` (home) / `${baseHref}/${slug}`. */
  baseHref?: string;
  /** Editor mode: clicking a page calls this instead of navigating. */
  onSelect?: (slug: string) => void;
}) {
  const hrefFor = (slug: string) =>
    slug === "home" ? baseHref || "#" : `${baseHref || ""}/${slug}`;

  return (
    <header
      className="sticky top-0 z-30 border-b backdrop-blur"
      style={{ backgroundColor: `${theme.background}ee`, borderColor: `${theme.text}14` }}
    >
      <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-6 py-4">
        <span
          className="text-lg font-bold"
          style={{ color: theme.primary, fontFamily: "var(--site-heading)" }}
        >
          {businessName}
        </span>
        <ul className="flex flex-wrap items-center gap-1 sm:gap-2">
          {navPages.map((p) => {
            const active = p.slug === currentSlug;
            const className =
              "rounded-md px-3 py-1.5 text-sm font-medium transition-colors";
            const style = active
              ? { color: theme.primary, backgroundColor: `${theme.primary}14` }
              : { color: theme.text, opacity: 0.75 };

            if (onSelect) {
              return (
                <li key={p.slug}>
                  <button
                    type="button"
                    onClick={() => onSelect(p.slug)}
                    className={className}
                    style={style}
                  >
                    {p.name}
                  </button>
                </li>
              );
            }
            return (
              <li key={p.slug}>
                <a href={hrefFor(p.slug)} className={className} style={style}>
                  {p.name}
                </a>
              </li>
            );
          })}
        </ul>
      </nav>
    </header>
  );
}
