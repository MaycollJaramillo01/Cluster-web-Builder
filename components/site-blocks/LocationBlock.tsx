import { ensureReadable, getThemeSurface } from "@/lib/site/theme-surface";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function LocationBlock({ section, theme, preset, site }: BlockProps) {
  const surface = getThemeSurface(theme);
  const style = preset.locationStyle ?? "map";
  const place = site.location || section.subtitle || "Zona de servicio";
  const mapSrc = `https://maps.google.com/maps?q=${encodeURIComponent(place)}&z=12&output=embed`;
  const phone = site.phone || null;
  const email = site.email || null;

  // ── SPLIT: info card left, map right ─────────────────────────────────────
  if (style === "split") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.body} theme={theme} preset={preset} />
          <div className="mt-12 grid overflow-hidden border lg:grid-cols-[0.9fr_1.1fr]" style={{ borderColor: `${theme.primary}22`, borderRadius: "var(--site-radius)" }}>
            <div className="flex flex-col justify-center gap-6 p-8 sm:p-10" style={{ backgroundColor: surface.panel }}>
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>Ubicacion</p>
                <p className="mt-2 text-xl font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>{place}</p>
              </div>
              {phone && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>Telefono</p>
                  <a href={`tel:${phone}`} className="mt-2 block text-lg hover:underline" style={{ color: theme.text }}>{phone}</a>
                </div>
              )}
              {email && (
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>Email</p>
                  <a href={`mailto:${email}`} className="mt-2 block text-sm hover:underline" style={{ color: theme.text }}>{email}</a>
                </div>
              )}
              {section.body && !phone && !email && (
                <p className="leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>
              )}
            </div>
            <div className="min-h-64 overflow-hidden">
              <iframe title="Mapa" className="h-full w-full min-h-64" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={mapSrc} />
            </div>
          </div>
        </div>
      </section>
    );
  }

  // ── BANNER: full-width taller map with gradient overlay + info ────────────
  if (style === "banner") {
    return (
      <section className="relative overflow-hidden" style={{ height: "28rem" }}>
        <iframe title="Mapa" className="absolute inset-0 h-full w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={mapSrc} style={{ filter: "grayscale(0.2) contrast(1.05)" }} />
        <div className="absolute inset-0 pointer-events-none" style={{ background: `linear-gradient(to right, ${theme.secondary}f0 0%, ${theme.secondary}a0 45%, transparent 75%)` }} />
        <div className="relative flex h-full items-center px-8 sm:px-16">
          <div className="max-w-sm text-white">
            <p className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ensureReadable(theme.accent, theme.background) }}>{section.subtitle || "Ubicacion"}</p>
            <h2 className="mt-3 text-3xl font-bold leading-tight" style={{ fontFamily: "var(--site-heading)" }}>
              {section.title || site.businessName}
            </h2>
            <p className="mt-3 text-lg opacity-90">{place}</p>
            {phone && <p className="mt-4 text-sm opacity-80">{phone}</p>}
          </div>
        </div>
      </section>
    );
  }

  // ── CARD: no map, styled address/contact card ─────────────────────────────
  if (style === "card") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-4xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className={`mt-12 grid gap-5 border p-8 sm:grid-cols-3 sm:p-10 ${preset.cardShadow}`} style={{ backgroundColor: surface.panel, borderColor: `${theme.primary}22`, borderRadius: "var(--site-radius)" }}>
            <div className="flex flex-col gap-2">
              <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>Direccion</p>
              <p className="text-lg font-semibold" style={{ color: theme.text }}>{place}</p>
            </div>
            {phone && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>Telefono</p>
                <a href={`tel:${phone}`} className="text-lg font-semibold hover:underline" style={{ color: theme.text }}>{phone}</a>
              </div>
            )}
            {email && (
              <div className="flex flex-col gap-2">
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>Email</p>
                <a href={`mailto:${email}`} className="text-sm font-semibold hover:underline break-all" style={{ color: theme.text }}>{email}</a>
              </div>
            )}
            {!phone && !email && section.body && (
              <div className="sm:col-span-2">
                <p className="leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ── MINIMAL: clean typography, no map ─────────────────────────────────────
  if (style === "minimal") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-3xl text-center">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-10 flex flex-col items-center gap-2">
            <p className="text-2xl font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>{place}</p>
            {phone && <a href={`tel:${phone}`} className="text-lg hover:underline" style={{ color: ensureReadable(theme.primary, theme.background) }}>{phone}</a>}
            {email && <a href={`mailto:${email}`} className="text-sm hover:underline" style={{ color: surface.muted }}>{email}</a>}
          </div>
        </div>
      </section>
    );
  }

  // ── PINS: two service-area cards (uses body text for secondary area) ───────
  if (style === "pins") {
    const secondPlace = section.body || place;
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {[
              { label: "Sede principal", loc: place },
              { label: "Area de servicio", loc: secondPlace },
            ].map(({ label, loc }, i) => (
              <div key={i} data-motion-item className={`border p-7 ${preset.cardShadow}`} style={{ backgroundColor: surface.panel, borderColor: `${theme.primary}22`, borderRadius: "var(--site-radius)" }}>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>{label}</p>
                <p className="mt-3 text-xl font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>{loc}</p>
                {i === 0 && phone && <p className="mt-4 text-sm" style={{ color: surface.muted }}>{phone}</p>}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── MAP (default): iframe embed ───────────────────────────────────────────
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-4xl">
        <SectionHeading title={section.title} subtitle={section.body} theme={theme} preset={preset} />
        <div className="mt-12 overflow-hidden border" style={{ borderColor: `${theme.primary}33`, borderRadius: "var(--site-radius)" }}>
          <iframe title="Mapa" className="h-72 w-full" loading="lazy" referrerPolicy="no-referrer-when-downgrade" src={mapSrc} />
        </div>
      </div>
    </section>
  );
}
