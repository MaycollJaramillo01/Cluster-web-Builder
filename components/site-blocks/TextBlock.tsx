import { getThemeSurface } from "@/lib/site/theme-surface";
import { getStyleOverride, resolveElementStyle } from "@/lib/site/element-style";
import type { BlockProps } from "./types";

export function TextBlock({ section, theme, preset }: BlockProps) {
  const surface = getThemeSurface(theme);
  return <section className="px-6 py-16 sm:py-24" style={{ backgroundColor: theme.background }}>
    <div className="mx-auto max-w-3xl">
      {section.subtitle && <p className="text-sm font-semibold uppercase tracking-[0.16em]" style={{ color: theme.primary, ...resolveElementStyle("subtitle", getStyleOverride(section.settings, "subtitle")) }}>{section.subtitle}</p>}
      {section.title && <h2 className="mt-3 text-3xl sm:text-5xl" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight, ...resolveElementStyle("title", getStyleOverride(section.settings, "title")) }}>{section.title}</h2>}
      {section.body && <p className="mt-6 whitespace-pre-line text-lg leading-8" style={{ color: surface.muted, ...resolveElementStyle("body", getStyleOverride(section.settings, "body")) }}>{section.body}</p>}
      {section.ctaText && <a href={section.ctaLink || "#contact"} className="mt-8 inline-flex min-h-11 items-center font-semibold underline underline-offset-4" style={{ color: theme.primary, ...resolveElementStyle("ctaText", getStyleOverride(section.settings, "ctaText")) }}>{section.ctaText}</a>}
    </div>
  </section>;
}
