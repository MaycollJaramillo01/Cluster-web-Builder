import { getItems } from "@/lib/site/section";
import { ensureReadable, getThemeSurface } from "@/lib/site/theme-surface";
import { getStyleOverride, resolveElementStyle } from "@/lib/site/element-style";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function BenefitsBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  const surface = getThemeSurface(theme);
  const style = preset.benefitsStyle ?? "cards";
  const titleStyle = resolveElementStyle("title", getStyleOverride(section.settings, "title"));
  const subtitleStyle = resolveElementStyle("subtitle", getStyleOverride(section.settings, "subtitle"));

  // ── COLUMNS: sticky heading left + card grid right ───────────────────────
  if (style === "columns") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.65fr_1.35fr] lg:gap-16">
          <div>
            <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} align="left" />
            {section.body ? <p className="mt-6 max-w-md leading-relaxed" style={{ color: surface.muted }}>{section.body}</p> : null}
            <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>
              {items.length} razones concretas
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item, i) => (
              <div key={i} data-motion-item className={`group relative overflow-hidden border p-6 transition-transform duration-200 hover:-translate-y-1 motion-reduce:transform-none ${items.length % 2 === 1 && i === items.length - 1 ? "sm:col-span-2" : ""} ${preset.cardShadow}`} style={{ borderColor: `${i % 2 === 0 ? theme.primary : theme.accent}38`, backgroundColor: surface.panel, borderRadius: "var(--site-radius)" }}>
                <span className="text-4xl font-black leading-none opacity-15" style={{ color: i % 2 === 0 ? theme.primary : theme.accent, fontFamily: "var(--site-heading)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="mt-8">
                  <h3 className="text-lg font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>
                    {String(item.title ?? item.name ?? "Beneficio")}
                  </h3>
                  {item.description ? <p className="mt-3 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── GRID: glow cards, dark/glass feel ────────────────────────────────────
  if (style === "grid") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => (
              <div key={i} data-motion-item className={`relative overflow-hidden border p-6 ${preset.cardShadow}`} style={{ borderRadius: "var(--site-radius)", backgroundColor: surface.panel, borderColor: `${theme.primary}28` }}>
                <div className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl" style={{ backgroundColor: `${theme.accent}18` }} />
                <p className="relative text-xs font-bold uppercase tracking-widest" style={{ color: ensureReadable(theme.primary, theme.background) }}>{String(i + 1).padStart(2, "0")}</p>
                <h3 className="relative mt-4 font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>
                  {String(item.title ?? item.name ?? "Beneficio")}
                </h3>
                {item.description ? <p className="relative mt-2 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── BRUTAL: thick borders, neobrutalist ──────────────────────────────────
  if (style === "brutal") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          <div className="mt-12 grid border-l-[3px] border-t-[3px] sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: theme.text }}>
            {items.map((item, i) => (
              <div key={i} data-motion-item className="min-h-44 border-b-[3px] border-r-[3px] p-6" style={{ borderColor: theme.text, backgroundColor: i % 2 ? `${theme.primary}10` : "transparent" }}>
                <p className="text-4xl font-black leading-none" style={{ color: ensureReadable(theme.primary, theme.background, 3), fontFamily: "var(--site-heading)" }}>
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3 className="mt-4 font-bold uppercase tracking-wide" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>
                  {String(item.title ?? item.name ?? "Beneficio")}
                </h3>
                {item.description ? <p className="mt-2 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── CHECKLIST: checkmark + title + description ───────────────────────────
  if (style === "checklist") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2">
            {items.map((item, i) => (
              <div key={i} data-motion-item className="flex items-start gap-4">
                <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center text-white text-sm font-bold" style={{ backgroundColor: theme.primary, borderRadius: "var(--site-radius)" }}>
                  ✓
                </span>
                <div>
                  <h3 className="font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>
                    {String(item.title ?? item.name ?? "Beneficio")}
                  </h3>
                  {item.description ? <p className="mt-1 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── NUMBERED: large dominant number + text ───────────────────────────────
  if (style === "numbered") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          <div className="mt-14 grid gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => (
              <div key={i} data-motion-item className="flex flex-col gap-4 border-t-2 pt-6" style={{ borderColor: i === 0 ? theme.primary : `${theme.primary}44` }}>
                <span className="text-6xl font-black leading-none" style={{ color: theme.primary, fontFamily: "var(--site-heading)", opacity: 0.18 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="text-lg font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                  {String(item.title ?? item.name ?? "Beneficio")}
                </h3>
                {item.description ? <p className="text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── PILLS: rounded pill chips in a wrapping layout ───────────────────────
  if (style === "pills") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {items.map((item, i) => (
              <div key={i} data-motion-item className={`flex items-start gap-4 border p-5 ${preset.cardShadow}`} style={{ backgroundColor: surface.panel, borderColor: `${theme.text}14`, borderRadius: "9999px" }}>
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-sm font-bold text-white" style={{ backgroundColor: i % 2 === 0 ? theme.primary : theme.accent }}>
                  {i + 1}
                </span>
                <div className="min-w-0 py-1">
                  <h3 className="font-semibold leading-tight" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>
                    {String(item.title ?? item.name ?? "Beneficio")}
                  </h3>
                  {item.description ? <p className="mt-1 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── CARDS (default): numbered top-border cards ───────────────────────────
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <div key={i} data-motion-item className={`relative border-t-2 pt-5 ${preset.cardShadow}`} style={{ borderColor: i === 0 ? theme.primary : `${theme.primary}55` }}>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: ensureReadable(theme.primary, theme.background) }}>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3 className="mt-3 font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                {String(item.title ?? item.name ?? "Beneficio")}
              </h3>
              {item.description ? <p className="mt-2 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
