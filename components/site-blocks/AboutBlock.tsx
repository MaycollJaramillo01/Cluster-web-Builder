import { sectionImageUrl } from "@/lib/site/images";
import { getThemeSurface } from "@/lib/site/theme-surface";
import type { BlockProps } from "./types";

export function AboutBlock({ section, theme, preset, site }: BlockProps) {
  const surface = getThemeSurface(theme);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
      <div className="mx-auto grid max-w-6xl items-center gap-12 md:grid-cols-2">
        <div>
          {section.title && (
            <h2
              className="text-3xl font-bold sm:text-4xl"
              style={{
                color: theme.text,
                fontFamily: "var(--site-heading)",
                fontWeight: preset.headingWeight,
                letterSpacing: "var(--site-tracking)",
                textTransform: preset.uppercaseHeadings ? "uppercase" : "none",
              }}
            >
              {section.title}
            </h2>
          )}
          {section.subtitle && (
            <p className="mt-3 text-lg font-medium" style={{ color: theme.primary }}>
              {section.subtitle}
            </p>
          )}
          {section.body && (
            <p className="mt-5 leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>
          )}
        </div>
        {preset.useImages ? (
          <img
            src={sectionImageUrl({
              prompt: section.imagePrompt,
              businessType: site.businessType,
              seed: "about",
              width: 800,
              height: 640,
            })}
            alt={site.businessName}
            loading="lazy"
            className="h-72 w-full object-cover shadow-lg md:h-80"
            style={{ borderRadius: "var(--site-radius)" }}
          />
        ) : (
          <div
            className="flex h-72 items-center justify-center border md:h-80"
            style={{ borderColor: theme.primary, color: theme.text, borderRadius: "var(--site-radius)" }}
          >
            <span className="px-6 text-center opacity-70">
              {section.imagePrompt || site.businessName}
            </span>
          </div>
        )}
      </div>
    </section>
  );
}
