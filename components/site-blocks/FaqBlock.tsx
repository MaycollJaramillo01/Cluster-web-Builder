import { getItems } from "@/lib/site/section";
import { ensureReadable, getThemeSurface } from "@/lib/site/theme-surface";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function FaqBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  const surface = getThemeSurface(theme);
  const style = preset.faqStyle ?? "accordion";

  // ── SPLIT: sticky heading left, accordion right ──────────────────────────
  if (style === "split") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.68fr_1.32fr] lg:gap-16">
          <div className="lg:sticky lg:top-28 lg:self-start">
            <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} align="left" />
            {section.body ? <p className="mt-6 max-w-xl leading-relaxed" style={{ color: surface.muted }}>{section.body}</p> : null}
            <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>
              {items.length} {items.length === 1 ? "respuesta" : "respuestas"}
            </p>
          </div>
          <div className="divide-y border" style={{ backgroundColor: surface.panel, borderColor: `${theme.text}1f`, borderRadius: "var(--site-radius)" }}>
            {items.map((item, i) => (
              <details key={i} data-motion-item className="group px-5 sm:px-7" open={i === 0}>
                <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 py-5 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" style={{ color: theme.text }}>
                  <span className="flex items-center gap-4">
                    <span className="text-xs font-bold tabular-nums opacity-55">{String(i + 1).padStart(2, "0")}</span>
                    <span>{String(item.question ?? item.title ?? "Pregunta")}</span>
                  </span>
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg transition-transform duration-200 group-open:rotate-45" aria-hidden="true" style={{ color: ensureReadable(theme.accent, theme.background, 3) }}>+</span>
                </summary>
                {item.answer ? <p className="pb-6 pl-10 pr-12 text-sm leading-relaxed sm:text-base" style={{ color: surface.muted }}>{String(item.answer)}</p> : null}
              </details>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── GRID: visible Q&A cards, no accordion ────────────────────────────────
  if (style === "grid") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <article key={i} data-motion-item className={`flex flex-col gap-4 border p-6 ${preset.cardShadow}`} style={{ backgroundColor: surface.panel, borderColor: `${theme.primary}28`, borderRadius: "var(--site-radius)" }}>
                <p className="text-xs font-bold uppercase tracking-[0.18em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>{String(i + 1).padStart(2, "0")}</p>
                <h3 className="font-semibold leading-snug" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>
                  {String(item.question ?? item.title ?? "Pregunta")}
                </h3>
                {item.answer ? <p className="flex-1 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.answer)}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── MINIMAL: borderless typographic list ─────────────────────────────────
  if (style === "minimal") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-3xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-14 space-y-10">
            {items.map((item, i) => (
              <div key={i} data-motion-item className="border-t pt-8" style={{ borderColor: `${theme.text}18` }}>
                <p className="font-semibold leading-snug" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                  {String(item.question ?? item.title ?? "Pregunta")}
                </p>
                {item.answer ? <p className="mt-4 leading-relaxed" style={{ color: surface.muted }}>{String(item.answer)}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── MAGAZINE: decorative number background, editorial ────────────────────
  if (style === "magazine") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-14 grid gap-8 md:grid-cols-2">
            {items.map((item, i) => (
              <article key={i} data-motion-item className="relative overflow-hidden border-t-2 pt-6" style={{ borderColor: i % 2 === 0 ? theme.primary : theme.accent }}>
                <span className="pointer-events-none absolute -right-2 -top-4 select-none text-8xl font-black leading-none opacity-[0.07]" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h3 className="relative text-xl font-semibold leading-snug" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                  {String(item.question ?? item.title ?? "Pregunta")}
                </h3>
                {item.answer ? <p className="relative mt-4 leading-relaxed" style={{ color: surface.muted }}>{String(item.answer)}</p> : null}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── COLUMNS: 2-col side-by-side visible Q&A ──────────────────────────────
  if (style === "columns") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-14 grid gap-x-10 gap-y-0 border-t md:grid-cols-2" style={{ borderColor: `${theme.text}18` }}>
            {items.map((item, i) => (
              <div key={i} data-motion-item className="border-b py-8" style={{ borderColor: `${theme.text}18` }}>
                <p className="font-semibold leading-snug" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>
                  {String(item.question ?? item.title ?? "Pregunta")}
                </p>
                {item.answer ? <p className="mt-3 text-sm leading-relaxed" style={{ color: surface.muted }}>{String(item.answer)}</p> : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── ACCORDION (default) ───────────────────────────────────────────────────
  const useSplitLayout = items.length >= 4;
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className={`mx-auto ${useSplitLayout ? "max-w-6xl grid gap-12 lg:grid-cols-[0.68fr_1.32fr] lg:gap-16" : "max-w-4xl"}`}>
        <div className={useSplitLayout ? "lg:sticky lg:top-28 lg:self-start" : ""}>
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} align={useSplitLayout ? "left" : undefined} />
          {section.body ? <p className={`mt-6 max-w-xl leading-relaxed ${useSplitLayout ? "" : "mx-auto text-center"}`} style={{ color: surface.muted }}>{section.body}</p> : null}
          {useSplitLayout ? <p className="mt-10 text-xs font-bold uppercase tracking-[0.2em]" style={{ color: ensureReadable(theme.primary, theme.background) }}>Respuestas directas</p> : null}
        </div>
        <div className={`${useSplitLayout ? "" : "mt-12"} divide-y border`} style={{ backgroundColor: surface.panel, borderColor: `${theme.text}1f`, borderRadius: "var(--site-radius)" }}>
          {items.map((item, i) => (
            <details key={i} data-motion-item className="group px-5 sm:px-7" open={i === 0}>
              <summary className="flex min-h-20 cursor-pointer list-none items-center justify-between gap-5 py-5 font-medium focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-4" style={{ color: theme.text }}>
                <span className="flex items-center gap-4">
                  <span className="text-xs font-bold tabular-nums opacity-55">{String(i + 1).padStart(2, "0")}</span>
                  <span>{String(item.question ?? item.title ?? "Pregunta")}</span>
                </span>
                <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border text-lg transition-transform duration-200 group-open:rotate-45" aria-hidden="true" style={{ color: ensureReadable(theme.accent, theme.background, 3) }}>+</span>
              </summary>
              {item.answer ? <p className="pb-6 pl-10 pr-12 text-sm leading-relaxed sm:text-base" style={{ color: surface.muted }}>{String(item.answer)}</p> : null}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
