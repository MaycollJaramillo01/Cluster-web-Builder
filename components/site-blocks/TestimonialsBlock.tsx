import { getItems } from "@/lib/site/section";
import { getThemeSurface } from "@/lib/site/theme-surface";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

function initials(name: string): string {
  return name.split(/\s+/).slice(0, 2).map((w) => w[0]?.toUpperCase() ?? "").join("");
}

export function TestimonialsBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  const surface = getThemeSurface(theme);
  const style = preset.testimonialsStyle ?? "cards";
  if (items.length === 0) return null;

  // ── QUOTES: large decorative quote mark, editorial ────────────────────────
  if (style === "quotes") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-14 grid gap-10 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const name = String(item.name ?? "Cliente");
              const quote = String(item.quote ?? item.text ?? "Excelente servicio.");
              return (
                <figure key={i} data-motion-item className="flex flex-col gap-6">
                  <span className="block text-7xl font-black leading-none" style={{ color: theme.primary, fontFamily: "var(--site-heading)", opacity: 0.25 }}>"</span>
                  <blockquote className="flex-1 text-xl leading-relaxed" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontStyle: "italic" }}>
                    {quote}
                  </blockquote>
                  <figcaption className="flex items-center gap-3 border-t pt-5" style={{ borderColor: `${theme.text}18` }}>
                    <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: theme.primary }}>
                      {initials(name)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold" style={{ color: theme.text }}>{name}</span>
                      {item.role ? <span className="text-xs" style={{ color: surface.muted }}>{String(item.role)}</span> : null}
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── MINIMAL: borderless, horizontal dividers only ────────────────────────
  if (style === "minimal") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-4xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-14 divide-y" style={{ borderColor: `${theme.text}14` }}>
            {items.map((item, i) => {
              const name = String(item.name ?? "Cliente");
              const quote = String(item.quote ?? item.text ?? "Excelente servicio.");
              return (
                <figure key={i} data-motion-item className="py-8">
                  <blockquote className="text-lg leading-relaxed" style={{ color: theme.text }}>"{quote}"</blockquote>
                  <figcaption className="mt-4 flex items-center gap-3">
                    <span className="h-px flex-1" style={{ backgroundColor: `${theme.primary}33` }} />
                    <span className="text-sm font-semibold" style={{ color: theme.primary }}>{name}</span>
                    {item.role ? <span className="text-xs" style={{ color: surface.muted }}>{String(item.role)}</span> : null}
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── WALL: dense grid with tonal backgrounds ───────────────────────────────
  if (style === "wall") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-12 grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => {
              const name = String(item.name ?? "Cliente");
              const quote = String(item.quote ?? item.text ?? "Excelente servicio.");
              const bg = i % 3 === 0 ? theme.primary : i % 3 === 1 ? surface.panel : theme.background;
              const textColor = i % 3 === 0 ? "#fff" : theme.text;
              const mutedColor = i % 3 === 0 ? "rgba(255,255,255,0.72)" : surface.muted;
              return (
                <figure key={i} data-motion-item className="flex flex-col gap-4 p-6" style={{ backgroundColor: bg, borderRadius: "var(--site-radius)" }}>
                  <blockquote className="flex-1 text-sm leading-relaxed" style={{ color: textColor }}>"{quote}"</blockquote>
                  <figcaption className="flex items-center gap-3">
                    <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-xs font-bold" style={{ backgroundColor: i % 3 === 0 ? "rgba(255,255,255,0.2)" : `${theme.primary}22`, color: i % 3 === 0 ? "#fff" : theme.primary }}>
                      {initials(name)}
                    </span>
                    <span>
                      <span className="block text-sm font-semibold" style={{ color: textColor }}>{name}</span>
                      {item.role ? <span className="text-xs" style={{ color: mutedColor }}>{String(item.role)}</span> : null}
                    </span>
                  </figcaption>
                </figure>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── LIST: horizontal card per row with large avatar ───────────────────────
  if (style === "list") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-4xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-12 space-y-4">
            {items.map((item, i) => {
              const name = String(item.name ?? "Cliente");
              const quote = String(item.quote ?? item.text ?? "Excelente servicio.");
              return (
                <figure key={i} data-motion-item className={`flex items-start gap-5 border p-6 ${preset.cardShadow}`} style={{ backgroundColor: surface.panel, borderColor: `${theme.text}14`, borderRadius: "var(--site-radius)" }}>
                  <span className="flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-lg font-bold text-white" style={{ backgroundColor: theme.primary }}>
                    {initials(name)}
                  </span>
                  <div className="flex-1">
                    <blockquote className="leading-relaxed" style={{ color: theme.text }}>"{quote}"</blockquote>
                    <figcaption className="mt-3 flex items-center gap-2">
                      <span className="text-sm font-semibold" style={{ color: theme.text }}>{name}</span>
                      {item.role ? <><span style={{ color: surface.muted }}>·</span><span className="text-xs" style={{ color: surface.muted }}>{String(item.role)}</span></> : null}
                    </figcaption>
                  </div>
                </figure>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  // ── FEATURED: first testimonial full-width, rest smaller ─────────────────
  if (style === "featured") {
    const [first, ...rest] = items;
    const firstName = String(first?.name ?? "Cliente");
    const firstQuote = String(first?.quote ?? first?.text ?? "Excelente servicio.");
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-14 space-y-6">
            {first && (
              <figure data-motion-item className={`border p-8 sm:p-10 ${preset.cardShadow}`} style={{ backgroundColor: surface.panel, borderColor: `${theme.primary}22`, borderRadius: "var(--site-radius)" }}>
                <span className="block text-6xl font-black leading-none" style={{ color: theme.primary, opacity: 0.18, fontFamily: "var(--site-heading)" }}>"</span>
                <blockquote className="mt-2 text-2xl font-semibold leading-snug sm:text-3xl" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>
                  {firstQuote}
                </blockquote>
                <figcaption className="mt-8 flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-full text-base font-bold text-white" style={{ backgroundColor: theme.primary }}>
                    {initials(firstName)}
                  </span>
                  <span>
                    <span className="block font-semibold" style={{ color: theme.text }}>{firstName}</span>
                    {first.role ? <span className="text-sm" style={{ color: surface.muted }}>{String(first.role)}</span> : null}
                  </span>
                </figcaption>
              </figure>
            )}
            {rest.length > 0 && (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {rest.map((item, i) => {
                  const name = String(item.name ?? "Cliente");
                  const quote = String(item.quote ?? item.text ?? "Excelente servicio.");
                  return (
                    <figure key={i} data-motion-item className={`flex flex-col border bg-white p-6 ${preset.cardShadow}`} style={{ borderRadius: "var(--site-radius)", borderColor: `${theme.text}14` }}>
                      <blockquote className="flex-1 text-sm leading-relaxed" style={{ color: surface.muted }}>"{quote}"</blockquote>
                      <figcaption className="mt-5 flex items-center gap-3">
                        <span className="flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold text-white" style={{ backgroundColor: theme.primary }}>
                          {initials(name)}
                        </span>
                        <span className="text-sm font-semibold" style={{ color: theme.text }}>{name}</span>
                      </figcaption>
                    </figure>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </section>
    );
  }

  // ── CARDS (default): 3-col card grid ─────────────────────────────────────
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: "#f8fafc" }}>
      <div className="mx-auto max-w-5xl">
        <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const name = String(item.name ?? "Resena pendiente");
            const quote = String(item.quote ?? item.text ?? "Agrega aqui una resena real de tu cliente.");
            return (
              <figure key={i} data-motion-item className={`flex flex-col border bg-white p-7 ${preset.cardShadow}`} style={{ borderRadius: "var(--site-radius)" }}>
                <blockquote className="flex-1 text-slate-700">"{quote}"</blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: theme.primary }}>
                    {initials(name)}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold" style={{ color: theme.text }}>{name}</span>
                    {item.role ? <span className="text-slate-500">{String(item.role)}</span> : null}
                  </span>
                </figcaption>
              </figure>
            );
          })}
        </div>
      </div>
    </section>
  );
}
