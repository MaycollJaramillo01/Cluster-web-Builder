import { sectionImageUrl } from "@/lib/site/images";
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
      <div className="relative mx-auto flex max-w-4xl flex-col items-center gap-6 text-center text-white">
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
            className="inline-flex items-center px-8 py-3.5 text-base font-semibold shadow-sm transition-[filter] duration-200 hover:brightness-95"
            style={{
              backgroundColor: theme.accent,
              color: "#0f172a",
              borderRadius: "var(--site-btn-radius)",
            }}
          >
            {section.ctaText}
          </a>
        )}
      </div>
    </section>
  );
}
