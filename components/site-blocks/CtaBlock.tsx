import { sectionImageUrl } from "@/lib/site/images";
import { getContrastText } from "@/lib/site/theme-surface";
import type { BlockProps } from "./types";

export function CtaBlock({ section, theme, preset, site }: BlockProps) {
  const useImage = preset.useImages;
  const backgroundImage = useImage
    ? sectionImageUrl({
        prompt: section.imagePrompt,
        businessType: site.businessType,
        seed: "cta-bg",
        width: 1600,
        height: 600,
      })
    : "";

  return (
    <section className="relative overflow-hidden px-6 py-20">
      {useImage && (
        <div className="absolute inset-0">
          <div
            aria-hidden
            className="h-full w-full bg-cover bg-center"
            style={{ backgroundImage: `url("${backgroundImage}")` }}
          />
        </div>
      )}
      <div
        className="absolute inset-0"
        style={{
          backgroundColor: useImage ? `${theme.secondary}F2` : theme.secondary,
        }}
      />
      <div className={`relative mx-auto flex max-w-4xl flex-col gap-6 text-white ${preset.sectionStyle === "asymmetric" || preset.sectionStyle === "grid" ? "items-start text-left" : "items-center text-center"}`}>
        {section.title && (
          <h2
            className="text-3xl font-bold sm:text-4xl"
            style={{
              fontFamily: "var(--site-heading)",
              fontWeight: preset.headingWeight,
              textTransform: preset.uppercaseHeadings ? "uppercase" : "none",
            }}
          >
            {section.title}
          </h2>
        )}
        {section.subtitle && <p className="max-w-2xl text-lg opacity-90">{section.subtitle}</p>}
        {section.ctaText && (
          <a
            href={section.ctaLink || "#contact"}
            className="inline-flex min-h-12 items-center px-8 py-3.5 text-base font-semibold transition-all duration-200 hover:brightness-95 focus-visible:outline-none focus-visible:ring-4"
            style={{
              backgroundColor: preset.ctaStyle === "outline" || preset.ctaStyle === "link" ? "transparent" : theme.accent,
              color: preset.ctaStyle === "outline" || preset.ctaStyle === "link" ? theme.accent : getContrastText(theme.accent),
              border: preset.ctaStyle === "outline" ? `2px solid ${theme.accent}` : "2px solid transparent",
              borderRadius: preset.ctaStyle === "pill" ? "9999px" : "var(--site-btn-radius)",
              boxShadow: preset.ctaStyle === "offset" ? `5px 5px 0 ${theme.accent}66` : undefined,
              textDecoration: preset.ctaStyle === "link" ? "underline" : "none",
            }}
          >
            {section.ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
