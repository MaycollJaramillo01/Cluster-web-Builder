import { sectionImageUrl } from "@/lib/site/images";
import type { BlockProps } from "./types";

export function HeroBlock({ section, theme, preset, site }: BlockProps) {
  const heroImg = (w: number, h: number, seed: string) =>
    sectionImageUrl({
      prompt: section.imagePrompt,
      businessType: site.businessType,
      seed,
      width: w,
      height: h,
    });

  const heading = (
    <h1
      className="text-4xl font-bold leading-[1.05] sm:text-6xl"
      style={{
        fontFamily: "var(--site-heading)",
        letterSpacing: "var(--site-tracking)",
        fontWeight: preset.headingWeight,
        textTransform: preset.uppercaseHeadings ? "uppercase" : "none",
      }}
    >
      {section.title}
    </h1>
  );

  const ctaButton = section.ctaText ? (
    <a
      href={section.ctaLink || "#contact"}
      className="inline-flex items-center justify-center px-8 py-3.5 text-base font-semibold shadow-sm transition-[filter] duration-200 hover:brightness-95"
      style={{
        backgroundColor: theme.accent,
        color: "#0f172a",
        borderRadius: "var(--site-btn-radius)",
      }}
    >
      {section.ctaText}
    </a>
  ) : null;

  // --- Minimal: no image, generous whitespace, accent rule ---
  if (preset.heroStyle === "minimal") {
    return (
      <section className="px-6 py-28 sm:py-40" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 h-1 w-16" style={{ backgroundColor: theme.accent }} />
          <div style={{ color: theme.text }}>{heading}</div>
          {section.subtitle && (
            <p className="mt-6 max-w-2xl text-lg sm:text-xl" style={{ color: theme.text, opacity: 0.7 }}>
              {section.subtitle}
            </p>
          )}
          {section.body && (
            <p className="mt-4 max-w-xl text-base" style={{ color: theme.text, opacity: 0.6 }}>
              {section.body}
            </p>
          )}
          {ctaButton && <div className="mt-10">{ctaButton}</div>}
        </div>
      </section>
    );
  }

  // --- Split: text left, image right, light background ---
  if (preset.heroStyle === "split") {
    return (
      <section className="overflow-hidden px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto grid max-w-6xl items-center gap-12 lg:grid-cols-2">
          <div style={{ color: theme.text }}>
            {heading}
            {section.subtitle && (
              <p className="mt-5 text-lg" style={{ color: theme.text, opacity: 0.75 }}>
                {section.subtitle}
              </p>
            )}
            {section.body && (
              <p className="mt-3 text-base" style={{ color: theme.text, opacity: 0.6 }}>
                {section.body}
              </p>
            )}
            {ctaButton && <div className="mt-8">{ctaButton}</div>}
          </div>
          <div className="relative">
            <div
              role="img"
              aria-label={site.businessName}
              className="h-[420px] w-full border border-black/5 bg-cover bg-center shadow-sm"
              style={{
                backgroundImage: `url("${heroImg(900, 700, "hero-split")}")`,
                borderRadius: "var(--site-radius)",
              }}
            />
          </div>
        </div>
      </section>
    );
  }

  // --- Solid: bold color without decorative gradients ---
  if (preset.heroStyle === "gradient" || !preset.useImages) {
    return (
      <section
        className="px-6 py-28 sm:py-36"
        style={{
          backgroundColor: theme.secondary,
          color: "#ffffff",
        }}
      >
        <div className="mx-auto max-w-4xl text-center">
          {heading}
          {section.subtitle && <p className="mt-6 text-xl opacity-95 sm:text-2xl">{section.subtitle}</p>}
          {section.body && <p className="mx-auto mt-4 max-w-2xl text-base opacity-85">{section.body}</p>}
          {ctaButton && <div className="mt-10">{ctaButton}</div>}
        </div>
      </section>
    );
  }

  // --- Default: full-bleed background image with overlay ---
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        <div
          aria-hidden
          className="h-full w-full bg-cover bg-center"
          style={{ backgroundImage: `url("${heroImg(1600, 1000, "hero-bg")}")` }}
        />
        <div
          className="absolute inset-0"
          style={{
            backgroundColor: `${theme.secondary}D9`,
          }}
        />
      </div>
      <div className="relative px-6 py-32 sm:py-44">
        <div className="mx-auto max-w-4xl text-center text-white">
          {section.subtitle && (
            <span className="mb-5 inline-block rounded-md border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium">
              {section.subtitle}
            </span>
          )}
          {heading}
          {section.body && (
            <p className="mx-auto mt-6 max-w-2xl text-lg opacity-90">{section.body}</p>
          )}
          {ctaButton && <div className="mt-10">{ctaButton}</div>}
        </div>
      </div>
    </section>
  );
}
