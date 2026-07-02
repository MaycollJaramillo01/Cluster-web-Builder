import { getItems } from "@/lib/site/section";
import { ensureReadable, getThemeSurface } from "@/lib/site/theme-surface";
import { getStyleOverride, resolveElementStyle } from "@/lib/site/element-style";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function ProcessBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  const surface = getThemeSurface(theme);
  const style = preset.processStyle ?? "timeline";
  const titleStyle = resolveElementStyle("title", getStyleOverride(section.settings, "title"));
  const subtitleStyle = resolveElementStyle("subtitle", getStyleOverride(section.settings, "subtitle"));

  const stepRadius = preset.buttonRadius === "9999px" ? "9999px" : "var(--site-radius)";

  if (items.length === 0) {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          {section.body && <p className="mx-auto mt-6 max-w-2xl text-center" style={{ color: surface.muted }}>{section.body}</p>}
        </div>
      </section>
    );
  }

  // ── SPLIT: sticky heading left, numbered cards right ─────────────────────
  if (style === "split") {
    const averageCopyLength = items.reduce((t, item) => t + String(item.description ?? "").length, 0) / items.length;
    const needsRoom = items.length > 4 || averageCopyLength > 150;
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.72fr_1.28fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} align="left" />
            {section.body && <p className="mt-6 max-w-xl text-base leading-relaxed" style={{ color: surface.muted }}>{section.body}</p>}
            <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>
              {items.length} {items.length === 1 ? "etapa" : "etapas"}
            </p>
          </div>
          <ol className={`grid gap-4 ${needsRoom ? "md:grid-cols-1" : "sm:grid-cols-2"}`}>
            {items.map((item, i) => (
              <li key={i} data-motion-item className={`relative flex min-h-52 flex-col justify-between overflow-hidden border p-6 sm:p-7 ${!needsRoom && items.length % 2 === 1 && i === items.length - 1 ? "sm:col-span-2" : ""} ${preset.cardShadow}`} style={{ borderColor: `${theme.primary}2e`, backgroundColor: i === 0 ? surface.panel : `${surface.panel}d9`, borderRadius: "var(--site-radius)" }}>
                <span className="text-5xl font-black leading-none opacity-15" style={{ color: theme.primary, fontFamily: "var(--site-heading)" }}>{String(i + 1).padStart(2, "0")}</span>
                <div className="mt-10">
                  <h3 className="text-xl font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                    {String(item.title ?? item.name ?? `Paso ${i + 1}`)}
                  </h3>
                  {item.description ? <p className="mt-3 max-w-xl text-sm leading-relaxed sm:text-base" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  // ── CARDS: grid of uniform step cards ────────────────────────────────────
  if (style === "cards") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          {section.body && <p className="mx-auto mt-4 max-w-2xl text-center" style={{ color: surface.muted }}>{section.body}</p>}
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => (
              <li key={i} data-motion-item className={`min-h-52 border p-6 ${preset.cardShadow}`} style={{ borderColor: `${theme.primary}2e`, backgroundColor: surface.panel, borderRadius: "var(--site-radius)" }}>
                <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>Paso {String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-8 text-xl" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                  {String(item.title ?? item.name ?? `Paso ${i + 1}`)}
                </h3>
                {item.description ? <p className="mt-3 leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  // ── NUMBERED: dominant large numbers, minimal indicators ─────────────────
  if (style === "numbered") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          {section.body && <p className="mx-auto mt-4 max-w-2xl text-center" style={{ color: surface.muted }}>{section.body}</p>}
          <ol className="mt-14 grid gap-x-8 gap-y-12 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => (
              <li key={i} data-motion-item>
                <span className="block text-7xl font-black leading-none" style={{ color: theme.primary, fontFamily: "var(--site-heading)", opacity: 0.22, letterSpacing: "-0.05em" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-xl font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                  {String(item.title ?? item.name ?? `Paso ${i + 1}`)}
                </h3>
                {item.description ? <p className="mt-3 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  // ── VERTICAL: vertical connector line on the left ────────────────────────
  if (style === "vertical") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-4xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          {section.body && <p className="mx-auto mt-4 max-w-2xl text-center" style={{ color: surface.muted }}>{section.body}</p>}
          <ol className="relative mt-14 space-y-0 border-l-2" style={{ borderColor: `${theme.primary}28` }}>
            {items.map((item, i) => (
              <li key={i} data-motion-item className="relative pb-12 pl-10 last:pb-0">
                <span className="absolute -left-[1.125rem] flex h-9 w-9 items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: theme.primary, borderRadius: stepRadius }}>
                  {i + 1}
                </span>
                <h3 className="text-xl font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                  {String(item.title ?? item.name ?? `Paso ${i + 1}`)}
                </h3>
                {item.description ? <p className="mt-3 max-w-xl leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  // ── DARK: dark background, high contrast numbered steps ──────────────────
  if (style === "dark") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: theme.secondary, color: "#fff" }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={{ ...theme, text: "#fff" }} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
          {section.body && <p className="mx-auto mt-4 max-w-2xl text-center opacity-70">{section.body}</p>}
          <ol className="mt-14 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => (
              <li key={i} data-motion-item className="border p-7" style={{ borderColor: "rgba(255,255,255,0.12)", borderRadius: "var(--site-radius)", backgroundColor: "rgba(255,255,255,0.06)" }}>
                <span className="block text-5xl font-black leading-none" style={{ color: ensureReadable(theme.accent, theme.secondary, 3), fontFamily: "var(--site-heading)", opacity: 0.9 }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-8 text-xl font-semibold text-white" style={{ fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                  {String(item.title ?? item.name ?? `Paso ${i + 1}`)}
                </h3>
                {item.description ? <p className="mt-3 text-sm leading-relaxed opacity-65">{String(item.description)}</p> : null}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  // ── TIMELINE (default): horizontal dots with connecting line ─────────────
  const lineLeft = `${100 / (items.length * 2)}%`;
  const averageCopyLengthDefault = items.reduce((t, item) => t + String(item.description ?? "").length, 0) / items.length;
  const needsRoomDefault = items.length > 4 || averageCopyLengthDefault > 150;

  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
        {section.body && <p className="mx-auto mt-4 max-w-2xl text-center" style={{ color: surface.muted }}>{section.body}</p>}

        {/* Mobile: vertical list */}
        <ol className="mt-12 space-y-6 md:hidden">
          {items.map((item, i) => (
            <li key={i} data-motion-item className="flex items-start gap-4">
              <span className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: theme.primary, borderRadius: stepRadius }}>
                {i + 1}
              </span>
              <div className="pt-0.5">
                <h3 className="font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                  {String(item.title ?? item.name ?? `Paso ${i + 1}`)}
                </h3>
                {item.description ? <p className="mt-1 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
              </div>
            </li>
          ))}
        </ol>

        {/* Desktop */}
        {needsRoomDefault ? (
          <ol className="mt-14 hidden gap-5 md:grid md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <li key={i} data-motion-item className={`min-h-52 border p-6 ${preset.cardShadow}`} style={{ borderColor: `${theme.primary}2e`, backgroundColor: surface.panel, borderRadius: "var(--site-radius)" }}>
                <span className="text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>Paso {String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-8 text-xl" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                  {String(item.title ?? item.name ?? `Paso ${i + 1}`)}
                </h3>
                {item.description ? <p className="mt-3 leading-relaxed" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
              </li>
            ))}
          </ol>
        ) : (
          <div className="relative mt-14 hidden md:block">
            <div className="absolute top-[1.375rem] h-px" style={{ left: lineLeft, right: lineLeft, backgroundColor: `${theme.primary}28` }} />
            <div className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
              {items.map((item, i) => (
                <div key={i} data-motion-item className="flex flex-col items-center px-3 text-center">
                  <span className="relative z-10 flex h-11 w-11 items-center justify-center text-sm font-bold text-white" style={{ backgroundColor: theme.primary, borderRadius: stepRadius, boxShadow: `0 0 0 5px ${surface.section}` }}>
                    {i + 1}
                  </span>
                  <h3 className="mt-5 text-sm font-semibold sm:text-base" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                    {String(item.title ?? item.name ?? `Paso ${i + 1}`)}
                  </h3>
                  {item.description ? <p className="mt-2 text-xs leading-relaxed sm:text-sm" style={{ color: surface.muted }}>{String(item.description)}</p> : null}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
