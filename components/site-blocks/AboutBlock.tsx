import { sectionImageUrl } from "@/lib/site/images";
import { getThemeSurface } from "@/lib/site/theme-surface";
import type { BlockProps } from "./types";

export function AboutBlock({ section, theme, preset, site }: BlockProps) {
  const surface = getThemeSurface(theme);
  const imageFirst = preset.sectionStyle === "asymmetric" || preset.imageStyle === "offset";
  const imageStyle = {
    borderRadius: preset.imageStyle === "arch" ? "999px 999px 0 0" : preset.imageStyle === "square" ? "0" : "var(--site-radius)",
    filter: preset.imageStyle === "monochrome" ? "grayscale(1) contrast(1.08)" : undefined,
    transform: preset.imageStyle === "offset" ? "translate(12px, -12px)" : undefined,
  };
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: preset.surfaceStyle === "plain" ? theme.background : surface.section }}>
      <div className={`mx-auto grid max-w-6xl items-center gap-12 ${preset.sectionStyle === "fullBleed" ? "md:grid-cols-[0.8fr_1.2fr]" : "md:grid-cols-2"}`}>
        <div className={imageFirst ? "md:order-2" : ""}>
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
            className={`h-72 w-full object-cover shadow-lg md:h-80 ${imageFirst ? "md:order-1" : ""}`}
            style={imageStyle}
          />
        ) : (
          <div
            className={`flex h-72 items-center justify-center border md:h-80 ${imageFirst ? "md:order-1" : ""}`}
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
