/* eslint-disable react/no-unescaped-entities */
import { BadgeCheck, Star } from "lucide-react";

import { getItems } from "@/lib/site/section";
import { ensureReadable, getContrastText, getThemeSurface } from "@/lib/site/theme-surface";
import { getStyleOverride, resolveElementStyle } from "@/lib/site/element-style";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

/**
 * Bloque de reseñas: estrellas, autor, rol y chip de verificación cuando la
 * reseña trae plataforma de origen. Seis variantes según testimonialsStyle.
 */

type Review = { name: string; role: string; quote: string; rating: number; source: string };

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

function readReviews(section: BlockProps["section"]): Review[] {
  return getItems(section).map((item) => ({
    name: String(item.name ?? "Cliente"),
    role: String(item.role ?? ""),
    quote: String(item.quote ?? item.text ?? ""),
    rating: Math.min(5, Math.max(1, Math.round(Number(item.rating) || 5))),
    source: String(item.source ?? ""),
  })).filter((review) => review.quote);
}

function Stars({ rating, color }: { rating: number; color: string }) {
  return (
    <span className="flex items-center gap-0.5" role="img" aria-label={`${rating} de 5 estrellas`}>
      {Array.from({ length: 5 }, (_, i) => (
        <Star
          key={i}
          aria-hidden
          className="h-4 w-4"
          style={{ color, fill: i < rating ? color : "transparent", opacity: i < rating ? 1 : 0.35 }}
        />
      ))}
    </span>
  );
}

function VerifiedChip({ source, color }: { source: string; color: string }) {
  if (!source) return null;
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-semibold"
      style={{ borderColor: `${color}55`, color }}
    >
      <BadgeCheck className="h-3.5 w-3.5" aria-hidden />
      Reseña verificada · {source}
    </span>
  );
}

export function TestimonialsBlock({ section, theme, preset }: BlockProps) {
  const reviews = readReviews(section);
  const surface = getThemeSurface(theme);
  const style = preset.testimonialsStyle ?? "cards";
  const titleStyle = resolveElementStyle("title", getStyleOverride(section.settings, "title"));
  const subtitleStyle = resolveElementStyle("subtitle", getStyleOverride(section.settings, "subtitle"));
  if (reviews.length === 0) return null;

  const author = (review: Review, textColor: string, mutedColor: string, avatarBg: string) => (
    <figcaption className="flex items-center gap-3">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold" style={{ backgroundColor: avatarBg, color: getContrastText(avatarBg) }}>
        {initials(review.name)}
      </span>
      <span>
        <span className="block text-sm font-semibold" style={{ color: textColor }}>{review.name}</span>
        {review.role && <span className="text-xs" style={{ color: mutedColor }}>{review.role}</span>}
      </span>
    </figcaption>
  );

  // ── QUOTES: comilla decorativa, ritmo editorial ────────────────────────────
  if (style === "quotes") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, i) => (
              <figure key={i} data-motion-item className="flex flex-col gap-5">
                <span className="block text-7xl font-black leading-none" style={{ color: theme.primary, fontFamily: "var(--site-heading)", opacity: 0.25 }}>"</span>
                <Stars rating={review.rating} color={ensureReadable(theme.accent, theme.background, 3)} />
                <blockquote className="flex-1 text-xl leading-relaxed" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontStyle: "italic" }}>
                  {review.quote}
                </blockquote>
                <div className="flex flex-col gap-3 border-t pt-5" style={{ borderColor: `${theme.text}18` }}>
                  {author(review, theme.text, surface.muted, theme.primary)}
                  <VerifiedChip source={review.source} color={ensureReadable(theme.primary, theme.background)} />
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── MINIMAL: divisores horizontales, sin tarjetas ─────────────────────────
  if (style === "minimal") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-4xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          <div className="mt-14 divide-y" style={{ borderColor: `${theme.text}14` }}>
            {reviews.map((review, i) => (
              <figure key={i} data-motion-item className="py-8">
                <Stars rating={review.rating} color={theme.text} />
                <blockquote className="mt-3 text-lg leading-relaxed" style={{ color: theme.text }}>"{review.quote}"</blockquote>
                <figcaption className="mt-4 flex flex-wrap items-center gap-3">
                  <span className="h-px flex-1" style={{ backgroundColor: `${theme.primary}33` }} />
                  <span className="text-sm font-semibold" style={{ color: ensureReadable(theme.primary, theme.background) }}>{review.name}</span>
                  {review.role && <span className="text-xs" style={{ color: surface.muted }}>{review.role}</span>}
                  <VerifiedChip source={review.source} color={ensureReadable(theme.primary, theme.background)} />
                </figcaption>
              </figure>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── WALL: retícula densa con fondos tonales ────────────────────────────────
  if (style === "wall") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {reviews.map((review, i) => {
              const bg = i % 3 === 0 ? theme.primary : i % 3 === 1 ? surface.panel : theme.background;
              const textColor = i % 3 === 0 ? getContrastText(theme.primary) : theme.text;
              const mutedColor = i % 3 === 0 ? `${textColor}b8` : surface.muted;
              return (
                <figure key={i} data-motion-item className="flex flex-col gap-4 p-6" style={{ backgroundColor: bg, borderRadius: "var(--site-radius)" }}>
                  <Stars rating={review.rating} color={i % 3 === 0 ? textColor : ensureReadable(theme.accent, theme.background, 3)} />
                  <blockquote className="flex-1 text-sm leading-relaxed" style={{ color: textColor }}>"{review.quote}"</blockquote>
                  {author(review, textColor, mutedColor, i % 3 === 0 ? theme.accent : theme.primary)}
                  <VerifiedChip source={review.source} color={i % 3 === 0 ? textColor : ensureReadable(theme.primary, theme.background)} />
                </figure>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── LIST: una fila por reseña con avatar grande ────────────────────────────
  if (style === "list") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-4xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          <div className="mt-12 space-y-4">
            {reviews.map((review, i) => (
              <figure key={i} data-motion-item className={`flex items-start gap-5 border p-6 ${preset.cardShadow}`} style={{ backgroundColor: surface.panel, borderColor: `${theme.text}14`, borderRadius: "var(--site-radius)" }}>
                <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold" style={{ backgroundColor: theme.primary, color: getContrastText(theme.primary) }}>
                  {initials(review.name)}
                </span>
                <div className="flex-1">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <Stars rating={review.rating} color={ensureReadable(theme.accent, theme.background, 3)} />
                    <VerifiedChip source={review.source} color={ensureReadable(theme.primary, theme.background)} />
                  </div>
                  <blockquote className="mt-3 leading-relaxed" style={{ color: theme.text }}>"{review.quote}"</blockquote>
                  <figcaption className="mt-3 flex items-center gap-2">
                    <span className="text-sm font-semibold" style={{ color: theme.text }}>{review.name}</span>
                    {review.role && <><span style={{ color: surface.muted }}>·</span><span className="text-xs" style={{ color: surface.muted }}>{review.role}</span></>}
                  </figcaption>
                </div>
              </figure>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── FEATURED: primera reseña protagonista, resto en tarjetas ──────────────
  if (style === "featured") {
    const [first, ...rest] = reviews;
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          <div className="mt-14 space-y-6">
            <figure data-motion-item className={`border p-8 sm:p-10 ${preset.cardShadow}`} style={{ backgroundColor: surface.panel, borderColor: `${theme.primary}22`, borderRadius: "var(--site-radius)" }}>
              <div className="flex items-center justify-between gap-3">
                <Stars rating={first.rating} color={ensureReadable(theme.accent, theme.background, 3)} />
                <VerifiedChip source={first.source} color={ensureReadable(theme.primary, theme.background)} />
              </div>
              <blockquote className="mt-6 text-2xl font-semibold leading-snug sm:text-3xl" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>
                {first.quote}
              </blockquote>
              <div className="mt-8">{author(first, theme.text, surface.muted, theme.primary)}</div>
            </figure>
            {rest.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((review, i) => (
                  <figure key={i} data-motion-item className={`flex flex-col gap-4 border p-6 ${preset.cardShadow}`} style={{ backgroundColor: surface.panel, borderRadius: "var(--site-radius)", borderColor: `${theme.text}14` }}>
                    <Stars rating={review.rating} color={ensureReadable(theme.accent, theme.background, 3)} />
                    <blockquote className="flex-1 text-sm leading-relaxed" style={{ color: surface.muted }}>"{review.quote}"</blockquote>
                    {author(review, theme.text, surface.muted, theme.primary)}
                  </figure>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ── CARDS (default): banda oscura con tarjetas, estrellas y verificación ──
  const bandText = getContrastText(theme.secondary);
  const cardBg = bandText === "#ffffff" ? "rgba(255,255,255,0.06)" : "rgba(15,23,42,0.05)";
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.secondary }}>
      <div className="mx-auto max-w-6xl">
        <div className="mx-auto max-w-2xl text-center">
          {section.subtitle && (
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ensureReadable(theme.accent, theme.secondary), ...subtitleStyle }}>{section.subtitle}</p>
          )}
          {section.title && (
            <h2
              className="mt-3 text-3xl font-bold sm:text-4xl"
              style={{ fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight, letterSpacing: preset.headingTracking, textTransform: preset.uppercaseHeadings ? "uppercase" : "none", color: bandText, ...titleStyle }}
            >
              {section.title}
            </h2>
          )}
          {section.body && <p className="mt-4 text-base leading-7" style={{ color: bandText, opacity: 0.75 }}>{section.body}</p>}
        </div>
        <div className="mt-12 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
          {reviews.map((review, i) => (
            <figure key={i} data-motion-item className="flex flex-col gap-4 border p-7" style={{ backgroundColor: cardBg, borderColor: `${bandText}1f`, borderRadius: "var(--site-radius)" }}>
              <Stars rating={review.rating} color={ensureReadable(theme.accent, theme.secondary, 3)} />
              <blockquote className="flex-1 leading-relaxed" style={{ color: bandText, opacity: 0.92 }}>"{review.quote}"</blockquote>
              <figcaption>
                <span className="block font-semibold" style={{ color: bandText }}>{review.name}</span>
                {review.role && <span className="text-sm" style={{ color: bandText, opacity: 0.65 }}>{review.role}</span>}
              </figcaption>
              <VerifiedChip source={review.source} color={ensureReadable(theme.accent, theme.secondary)} />
            </figure>
          ))}
        </div>
      </div>
    </section>
  );
}
