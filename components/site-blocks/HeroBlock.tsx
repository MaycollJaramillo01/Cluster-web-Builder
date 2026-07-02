/* eslint-disable @next/next/no-img-element */
import { sectionImageUrl } from "@/lib/site/images";
import { sectionVideoUrl } from "@/lib/site/videos";
import { ensureReadable, getContrastText } from "@/lib/site/theme-surface";
import { getStyleOverride, resolveElementStyle } from "@/lib/site/element-style";
import type { BlockProps } from "./types";
import { HeroVideo } from "./HeroVideo";

export function HeroBlock({ section, theme, preset, site }: BlockProps) {
  const titleStyle = resolveElementStyle("title", getStyleOverride(section.settings, "title"));
  const subtitleStyle = resolveElementStyle("subtitle", getStyleOverride(section.settings, "subtitle"));
  const bodyStyle = resolveElementStyle("body", getStyleOverride(section.settings, "body"));
  const ctaTextStyle = resolveElementStyle("ctaText", getStyleOverride(section.settings, "ctaText"));
  const heroImg = (w: number, h: number, seed: string) =>
    site.coverUrl || sectionImageUrl({
      prompt: section.imagePrompt,
      businessType: site.businessType,
      seed,
      width: w,
      height: h,
    });
  const useVideo = preset.heroMedia === "video" && !site.coverUrl;
  const heroVideo = (seed: string) => sectionVideoUrl({
    prompt: section.imagePrompt,
    businessType: site.businessType,
    seed: `${preset.id}-${seed}`,
  });

  const heading = (
    <h1
      className="text-4xl font-bold leading-[1.05] sm:text-6xl"
      style={{
        fontFamily: "var(--site-heading)",
        letterSpacing: "var(--site-tracking)",
        fontWeight: preset.headingWeight,
        textTransform: preset.uppercaseHeadings ? "uppercase" : "none",
        ...titleStyle,
      }}
    >
      {section.title}
    </h1>
  );

  const ctaButton = section.ctaText ? (
    <a
      href={section.ctaLink || "#contact"}
      className="inline-flex min-h-12 items-center justify-center px-8 py-3.5 text-base font-semibold transition-all duration-200 hover:brightness-95 focus-visible:outline-none focus-visible:ring-4"
      style={{
        backgroundColor: preset.ctaStyle === "outline" || preset.ctaStyle === "link" ? "transparent" : theme.accent,
        color: preset.ctaStyle === "outline" || preset.ctaStyle === "link" ? theme.accent : getContrastText(theme.accent),
        border: preset.ctaStyle === "outline" ? `2px solid ${theme.accent}` : "2px solid transparent",
        borderRadius: preset.ctaStyle === "pill" ? "9999px" : "var(--site-btn-radius)",
        boxShadow: preset.ctaStyle === "offset" ? `5px 5px 0 ${theme.text}` : undefined,
        textDecoration: preset.ctaStyle === "link" ? "underline" : "none",
        ...ctaTextStyle,
      }}
    >
      {section.ctaText}
    </a>
  ) : null;

  if (preset.heroStyle === "poster") {
    return (
      <section className="relative overflow-hidden border-b-4 px-6 py-20 sm:py-28" style={{ backgroundColor: theme.accent, borderColor: theme.text }}>
        <div className="pointer-events-none absolute -right-16 -top-20 h-72 w-72 rounded-full border-[28px] opacity-30" style={{ borderColor: theme.text }} />
        <div className="relative mx-auto grid max-w-6xl gap-12 lg:grid-cols-[1fr_auto] lg:items-end">
          <div style={{ color: getContrastText(theme.accent) }}>
            <p className="mb-8 border-b-2 pb-3 text-sm font-bold uppercase tracking-[0.2em]" style={{ borderColor: "currentColor", ...subtitleStyle }}>{section.subtitle || site.businessType}</p>
            <div className="max-w-5xl [&_h1]:text-5xl [&_h1]:sm:text-8xl">{heading}</div>
            {section.body && <p className="mt-8 max-w-2xl text-lg font-medium" style={bodyStyle}>{section.body}</p>}
          </div>
          {ctaButton && <div className="pb-2">{ctaButton}</div>}
        </div>
      </section>
    );
  }

  if (preset.heroStyle === "editorial") {
    return (
      <section className="px-6 py-16 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto grid max-w-6xl gap-8 border-y py-10 lg:grid-cols-12" style={{ borderColor: `${theme.text}33` }}>
          <div className="lg:col-span-7" style={{ color: theme.text }}>
            <p className="mb-10 text-xs font-semibold uppercase tracking-[0.25em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>{site.businessType}</p>
            <div className="[&_h1]:text-5xl [&_h1]:sm:text-7xl">{heading}</div>
            {section.subtitle && <p className="mt-7 max-w-xl text-xl italic" style={{ opacity: 0.85, ...subtitleStyle }}>{section.subtitle}</p>}
            {section.body && <p className="mt-5 max-w-xl leading-relaxed" style={{ opacity: 0.75, ...bodyStyle }}>{section.body}</p>}
            {ctaButton && <div className="mt-10">{ctaButton}</div>}
          </div>
          <div className="lg:col-span-5">
            <img src={heroImg(760, 940, "hero-editorial")} alt={site.businessName} className="h-[34rem] w-full object-cover" style={{ filter: preset.imageStyle === "monochrome" ? "grayscale(1)" : undefined }} />
          </div>
        </div>
      </section>
    );
  }

  if (preset.heroStyle === "framed") {
    const poster = heroImg(1500, 900, "hero-framed");
    return (
      <section className="px-6 py-16 sm:py-24" style={{ backgroundColor: theme.secondary }}>
        <div className="relative mx-auto min-h-[34rem] max-w-6xl overflow-hidden border" style={{ borderColor: `${theme.accent}80`, borderRadius: "var(--site-radius)" }}>
          {useVideo ? (
            <HeroVideo src={heroVideo("hero-framed")} poster={poster} className="absolute inset-0 opacity-60" style={{ filter: preset.imageStyle === "monochrome" ? "grayscale(1)" : undefined }} />
          ) : (
            <div className="absolute inset-0 bg-cover bg-center opacity-60" style={{ backgroundImage: `url("${poster}")`, filter: preset.imageStyle === "monochrome" ? "grayscale(1)" : undefined }} />
          )}
          <div className="absolute inset-0" style={{ background: `linear-gradient(90deg, ${theme.secondary} 0%, ${theme.secondary}E8 45%, ${theme.secondary}22 100%)` }} />
          <div className="relative flex min-h-[34rem] max-w-3xl flex-col justify-center p-8 text-white sm:p-14">
            {section.subtitle && <p className="mb-5 text-sm font-semibold uppercase tracking-[0.18em]" style={{ color: ensureReadable(theme.accent, theme.secondary), ...subtitleStyle }}>{section.subtitle}</p>}
            {heading}
            {section.body && <p className="mt-6 max-w-xl text-lg opacity-85" style={bodyStyle}>{section.body}</p>}
            {ctaButton && <div className="mt-9">{ctaButton}</div>}
          </div>
        </div>
      </section>
    );
  }

  if (preset.heroStyle === "immersive") {
    const poster = heroImg(1800, 1100, "hero-immersive");
    return (
      <section className="relative flex min-h-[78vh] items-end overflow-hidden">
        {useVideo ? (
          <HeroVideo src={heroVideo("hero-immersive")} poster={poster} className="absolute inset-0" />
        ) : (
          <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${poster}")` }} />
        )}
        <div className="absolute inset-0" style={{ background: `linear-gradient(180deg, ${theme.secondary}22 0%, ${theme.secondary}F5 92%)` }} />
        <div className="relative mx-auto w-full max-w-6xl px-6 pb-20 text-white sm:pb-28">
          <div className="max-w-4xl [&_h1]:text-5xl [&_h1]:sm:text-8xl">{heading}</div>
          <div className="mt-8 flex flex-col gap-7 border-t border-white/30 pt-7 md:flex-row md:items-end md:justify-between">
            <p className="max-w-2xl text-lg opacity-90" style={bodyStyle}>{section.body || section.subtitle}</p>
            {ctaButton}
          </div>
        </div>
      </section>
    );
  }

  // --- Minimal: no image, generous whitespace, accent rule ---
  if (preset.heroStyle === "minimal") {
    return (
      <section className="px-6 py-28 sm:py-40" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-4xl">
          <div className="mb-6 h-1 w-16" style={{ backgroundColor: theme.accent }} />
          <div style={{ color: theme.text }}>{heading}</div>
          {section.subtitle && (
            <p className="mt-6 max-w-2xl text-lg sm:text-xl" style={{ color: theme.text, opacity: 0.7, ...subtitleStyle }}>
              {section.subtitle}
            </p>
          )}
          {section.body && (
            <p className="mt-4 max-w-xl text-base" style={{ color: theme.text, opacity: 0.6, ...bodyStyle }}>
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
              <p className="mt-5 text-lg" style={{ color: theme.text, opacity: 0.75, ...subtitleStyle }}>
                {section.subtitle}
              </p>
            )}
            {section.body && (
              <p className="mt-3 text-base" style={{ color: theme.text, opacity: 0.6, ...bodyStyle }}>
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

  // --- Cinematic: full-bleed image, left-biased overlay, serif headline + italic accent line, stats bar ---
  if (preset.heroStyle === "cinematic") {
    const accentLine = section.settings?.accentLine as string | undefined;
    const stats = section.settings?.stats as Array<{ value: string; label: string }> | undefined;
    const cta2Text = section.settings?.cta2Text as string | undefined;
    const cta2Link = section.settings?.cta2Link as string | undefined;
    const poster = heroImg(1900, 1200, "hero-cinematic");

    return (
      <section className="relative flex min-h-[88vh] flex-col overflow-hidden">
        {/* Full-bleed background image */}
        <div className="absolute inset-0">
          {useVideo ? (
            <HeroVideo src={heroVideo("hero-cinematic")} poster={poster} className="absolute inset-0" style={{ filter: preset.imageStyle === "monochrome" ? "grayscale(1)" : undefined }} />
          ) : (
            <div className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${poster}")`, filter: preset.imageStyle === "monochrome" ? "grayscale(1)" : undefined }} />
          )}
          {/* Left-biased gradient overlay — dark on left, reveals photo on right */}
          <div
            className="absolute inset-0"
            style={{
              background: `linear-gradient(100deg, ${theme.secondary}F2 0%, ${theme.secondary}CC 38%, ${theme.secondary}66 65%, ${theme.secondary}1A 100%)`,
            }}
          />
        </div>

        {/* Content */}
        <div className="relative flex flex-1 flex-col justify-between px-8 py-16 sm:px-16 sm:py-20 lg:px-24">
          {/* Upper block: headline + body + CTAs */}
          <div className="max-w-2xl">
            {section.subtitle && (
              <p
                className="mb-6 text-[11px] font-bold uppercase tracking-[0.22em]"
                style={{ color: ensureReadable(theme.accent, theme.secondary), ...subtitleStyle }}
              >
                {section.subtitle}
              </p>
            )}

            <h1
              className="text-5xl font-bold leading-[1.06] text-white sm:text-6xl lg:text-[4.5rem]"
              style={{
                fontFamily: "var(--site-heading)",
                fontWeight: preset.headingWeight,
                letterSpacing: preset.headingTracking,
                ...titleStyle,
              }}
            >
              {section.title}
            </h1>

            {accentLine && (
              <p
                className="mt-0.5 text-5xl font-bold italic leading-[1.06] sm:text-6xl lg:text-[4.5rem]"
                style={{
                  fontFamily: "var(--site-heading)",
                  color: ensureReadable(theme.accent, theme.secondary, 3),
                  fontWeight: preset.headingWeight,
                  letterSpacing: preset.headingTracking,
                }}
              >
                {accentLine}
              </p>
            )}

            {section.body && (
              <p className="mt-7 max-w-md text-sm leading-relaxed text-white/75 sm:text-[15px]" style={bodyStyle}>
                {section.body}
              </p>
            )}

            <div className="mt-10 flex flex-wrap gap-3">
              {ctaButton}
              {cta2Text && (
                <a
                  href={cta2Link || "#"}
                  className="inline-flex min-h-12 items-center justify-center px-8 py-3.5 text-sm font-semibold text-white transition-all hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2"
                  style={{
                    border: "2px solid rgba(255,255,255,0.40)",
                    borderRadius: preset.buttonRadius,
                  }}
                >
                  {cta2Text}
                </a>
              )}
            </div>
          </div>

          {/* Stats row anchored at the bottom */}
          {stats && stats.length > 0 && (
            <div className="mt-16 flex flex-wrap gap-10 border-t border-white/15 pt-7">
              {stats.map((stat) => (
                <div key={stat.label}>
                  <p
                    className="text-3xl font-bold sm:text-4xl"
                    style={{
                      color: ensureReadable(theme.accent, theme.secondary, 3),
                      fontFamily: "var(--site-heading)",
                      fontWeight: preset.headingWeight,
                    }}
                  >
                    {stat.value}
                  </p>
                  <p className="mt-0.5 text-xs text-white/55">{stat.label}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>
    );
  }

  // --- Gradient treatment with a real cover image underneath. ---
  if (preset.heroStyle === "gradient") {
    return (
      <section className="relative overflow-hidden px-6 py-28 text-white sm:py-36" style={{ backgroundColor: theme.secondary }}>
        <div className="absolute inset-0 bg-cover bg-center" style={{ backgroundImage: `url("${heroImg(1600, 1000, "hero-gradient")}")` }} />
        <div className="absolute inset-0" style={{ background: `linear-gradient(135deg, ${theme.secondary}F2, ${theme.primary}C9 58%, ${theme.accent}99)` }} />
        <div className="relative mx-auto max-w-4xl text-center">
          {heading}
          {section.subtitle && <p className="mt-6 text-xl opacity-95 sm:text-2xl" style={subtitleStyle}>{section.subtitle}</p>}
          {section.body && <p className="mx-auto mt-4 max-w-2xl text-base opacity-85" style={bodyStyle}>{section.body}</p>}
          {ctaButton && <div className="mt-10">{ctaButton}</div>}
        </div>
      </section>
    );
  }

  // --- Default: full-bleed background image with overlay ---
  const defaultPoster = heroImg(1600, 1000, "hero-bg");
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 overflow-hidden">
        {useVideo ? (
          <HeroVideo src={heroVideo("hero-bg")} poster={defaultPoster} className="absolute inset-0" />
        ) : (
          <div aria-hidden className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${defaultPoster}")` }} />
        )}
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
            <span className="mb-5 inline-block rounded-md border border-white/20 bg-white/10 px-4 py-1.5 text-sm font-medium" style={subtitleStyle}>
              {section.subtitle}
            </span>
          )}
          {heading}
          {section.body && (
            <p className="mx-auto mt-6 max-w-2xl text-lg opacity-90" style={bodyStyle}>{section.body}</p>
          )}
          {ctaButton && <div className="mt-10">{ctaButton}</div>}
        </div>
      </div>
    </section>
  );
}
