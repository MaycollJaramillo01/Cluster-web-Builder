import { MessageCircle, Phone } from "lucide-react";

import { sectionImageUrl } from "@/lib/site/images";
import { getContrastText } from "@/lib/site/theme-surface";
import type { BlockProps } from "./types";

/**
 * Banda de CTA con varios diseños y acciones múltiples: además del CTA
 * principal, ofrece WhatsApp y llamada directa cuando el sitio tiene teléfono.
 */

type CtaVariant = "band" | "dark" | "minimal" | "panel";

function resolveVariant(preset: BlockProps["preset"]): CtaVariant {
  if (preset.surfaceStyle === "dark" || preset.surfaceStyle === "brutal") return "dark";
  if (preset.motionStyle === "minimal") return "minimal";
  if (preset.surfaceStyle === "soft" || preset.surfaceStyle === "tonal" || preset.surfaceStyle === "glass") return "band";
  return "panel";
}

export function CtaBlock({ section, theme, preset, site }: BlockProps) {
  const variant = resolveVariant(preset);
  const phoneDigits = (site.phone ?? "").replace(/[^\d]/g, "");

  const buttonBase = "inline-flex min-h-12 items-center justify-center gap-2 px-6 py-3 text-base font-semibold transition-all duration-200 hover:brightness-95 focus-visible:outline-none focus-visible:ring-4";
  const radius = preset.ctaStyle === "pill" ? "9999px" : "var(--site-btn-radius)";

  const actions = (primaryBg: string, onColor: string) => (
    <div className="flex flex-wrap items-center gap-3">
      {section.ctaText && (
        <a
          href={section.ctaLink || "#contact"}
          className={buttonBase}
          style={{
            backgroundColor: primaryBg,
            color: getContrastText(primaryBg),
            borderRadius: radius,
            boxShadow: preset.ctaStyle === "offset" ? `5px 5px 0 ${onColor}55` : undefined,
          }}
        >
          {section.ctaText}
        </a>
      )}
      {phoneDigits && (
        <a
          href={`https://wa.me/${phoneDigits}`}
          target="_blank"
          rel="noopener noreferrer"
          className={buttonBase}
          style={{ backgroundColor: "transparent", color: onColor, border: `2px solid ${onColor}55`, borderRadius: radius }}
        >
          <MessageCircle className="h-4 w-4" aria-hidden /> WhatsApp
        </a>
      )}
      {site.phone && (
        <a
          href={`tel:${site.phone.replace(/[^\d+]/g, "")}`}
          className={buttonBase}
          style={{ backgroundColor: "transparent", color: onColor, border: `2px solid ${onColor}55`, borderRadius: radius }}
        >
          <Phone className="h-4 w-4" aria-hidden /> Llamar
        </a>
      )}
    </div>
  );

  const heading = (color: string) => (
    <h2
      className="text-3xl font-bold sm:text-4xl"
      style={{
        fontFamily: "var(--site-heading)",
        fontWeight: preset.headingWeight,
        letterSpacing: preset.headingTracking,
        textTransform: preset.uppercaseHeadings ? "uppercase" : "none",
        color,
      }}
    >
      {section.title}
    </h2>
  );

  // ── BAND: banda de acento a sangre, texto a la izquierda y acciones a la derecha ──
  if (variant === "band") {
    const text = getContrastText(theme.accent);
    return (
      <section className="px-6 py-16 sm:py-20" style={{ backgroundColor: theme.accent }}>
        <div className="mx-auto flex max-w-6xl flex-col gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-xl">
            {section.title && heading(text)}
            {section.subtitle && <p className="mt-3 text-lg" style={{ color: text, opacity: 0.85 }}>{section.subtitle}</p>}
            {section.body && <p className="mt-2 text-base leading-7" style={{ color: text, opacity: 0.75 }}>{section.body}</p>}
          </div>
          {actions(theme.secondary, text)}
        </div>
      </section>
    );
  }

  // ── MINIMAL: fondo plano, centrado, sin decoración ──
  if (variant === "minimal") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto flex max-w-3xl flex-col items-center gap-6 text-center">
          {section.title && heading(theme.text)}
          {section.subtitle && <p className="max-w-xl text-lg" style={{ color: theme.text, opacity: 0.7 }}>{section.subtitle}</p>}
          {actions(theme.primary, theme.text)}
        </div>
      </section>
    );
  }

  // ── PANEL: tarjeta contenida sobre el fondo, con color secundario ──
  if (variant === "panel") {
    const text = getContrastText(theme.secondary);
    return (
      <section className="px-6 py-16 sm:py-20" style={{ backgroundColor: theme.background }}>
        <div
          className="mx-auto flex max-w-6xl flex-col gap-8 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between"
          style={{ backgroundColor: theme.secondary, borderRadius: "var(--site-radius)" }}
        >
          <div className="max-w-xl">
            {section.title && heading(text)}
            {section.subtitle && <p className="mt-3 text-lg" style={{ color: text, opacity: 0.85 }}>{section.subtitle}</p>}
          </div>
          {actions(theme.accent, text)}
        </div>
      </section>
    );
  }

  // ── DARK: panel oscuro a sangre con imagen de fondo ──
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
          <div aria-hidden className="h-full w-full bg-cover bg-center" style={{ backgroundImage: `url("${backgroundImage}")` }} />
        </div>
      )}
      <div className="absolute inset-0" style={{ backgroundColor: useImage ? `${theme.secondary}F2` : theme.secondary }} />
      <div className={`relative mx-auto flex max-w-4xl flex-col gap-6 ${preset.sectionStyle === "asymmetric" || preset.sectionStyle === "grid" ? "items-start text-left" : "items-center text-center"}`}>
        {section.title && heading("#ffffff")}
        {section.subtitle && <p className="max-w-2xl text-lg text-white opacity-90">{section.subtitle}</p>}
        {actions(theme.accent, "#ffffff")}
      </div>
    </section>
  );
}
