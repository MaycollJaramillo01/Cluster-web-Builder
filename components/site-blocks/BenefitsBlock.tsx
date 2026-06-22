import { getItems } from "@/lib/site/section";
import { getThemeSurface } from "@/lib/site/theme-surface";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function BenefitsBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  const surface = getThemeSurface(theme);

  // Brutalist / Neobrutalist: high-contrast grid with thick borders
  if (preset.surfaceStyle === "brutal") {
    return (
      <section
        className="px-6 py-20 sm:py-24"
        style={{ backgroundColor: theme.background }}
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            title={section.title}
            subtitle={section.subtitle}
            theme={theme}
            preset={preset}
          />
          <div className="mt-12 grid border-l-[3px] border-t-[3px] sm:grid-cols-2 lg:grid-cols-4" style={{ borderColor: theme.text }}>
            {items.map((item, i) => (
              <div
                key={i}
                className="min-h-44 border-b-[3px] border-r-[3px] p-6"
                style={{ borderColor: theme.text, backgroundColor: i % 2 ? `${theme.primary}10` : "transparent" }}
              >
                <p
                  className="text-4xl font-black leading-none"
                  style={{ color: theme.primary, fontFamily: "var(--site-heading)" }}
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3
                  className="mt-4 font-bold uppercase tracking-wide"
                  style={{ color: theme.text, fontFamily: "var(--site-heading)" }}
                >
                  {String(item.title ?? item.name ?? "Beneficio")}
                </h3>
                {item.description ? (
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: surface.muted }}>
                    {String(item.description)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Dark / Glass: cards with glow accent
  if (preset.surfaceStyle === "dark" || preset.surfaceStyle === "glass") {
    return (
      <section
        className="px-6 py-20 sm:py-24"
        style={{ backgroundColor: theme.background }}
      >
        <div className="mx-auto max-w-6xl">
          <SectionHeading
            title={section.title}
            subtitle={section.subtitle}
            theme={theme}
            preset={preset}
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {items.map((item, i) => (
              <div
                key={i}
                className={`relative overflow-hidden border p-6 ${preset.cardShadow}`}
                style={{
                  borderRadius: "var(--site-radius)",
                  backgroundColor: surface.panel,
                  borderColor: `${theme.primary}28`,
                }}
              >
                {/* Subtle glow */}
                <div
                  className="pointer-events-none absolute -right-6 -top-6 h-20 w-20 rounded-full blur-2xl"
                  style={{ backgroundColor: `${theme.accent}18` }}
                />
                <p
                  className="relative text-xs font-bold uppercase tracking-widest"
                  style={{ color: theme.primary }}
                >
                  {String(i + 1).padStart(2, "0")}
                </p>
                <h3
                  className="relative mt-4 font-semibold"
                  style={{ color: theme.text, fontFamily: "var(--site-heading)" }}
                >
                  {String(item.title ?? item.name ?? "Beneficio")}
                </h3>
                {item.description ? (
                  <p className="relative mt-2 text-sm leading-relaxed" style={{ color: surface.muted }}>
                    {String(item.description)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Outlined / Tonal: left-accent bar cards
  if (preset.surfaceStyle === "outlined" || preset.surfaceStyle === "tonal") {
    return (
      <section
        className="px-6 py-20 sm:py-24"
        style={{ backgroundColor: surface.section }}
      >
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            title={section.title}
            subtitle={section.subtitle}
            theme={theme}
            preset={preset}
          />
          <div className="mt-12 grid gap-4 sm:grid-cols-2">
            {items.map((item, i) => (
              <div
                key={i}
                className="flex gap-5 border-l-4 py-5 pl-5 pr-4"
                style={{
                  borderColor: i % 2 === 0 ? theme.primary : theme.accent,
                  backgroundColor: surface.panel,
                  borderRadius: `0 var(--site-radius) var(--site-radius) 0`,
                }}
              >
                <div className="flex-1">
                  <h3
                    className="font-semibold"
                    style={{ color: theme.text, fontFamily: "var(--site-heading)" }}
                  >
                    {String(item.title ?? item.name ?? "Beneficio")}
                  </h3>
                  {item.description ? (
                    <p className="mt-1.5 text-sm leading-relaxed" style={{ color: surface.muted }}>
                      {String(item.description)}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // Default: clean numbered cards with top accent line
  return (
    <section
      className="px-6 py-20 sm:py-24"
      style={{ backgroundColor: theme.background }}
    >
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title={section.title}
          subtitle={section.subtitle}
          theme={theme}
          preset={preset}
        />
        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <div
              key={i}
              className={`relative border-t-2 pt-5 ${preset.cardShadow}`}
              style={{
                borderColor: i === 0 ? theme.primary : `${theme.primary}55`,
              }}
            >
              <p
                className="text-xs font-bold uppercase tracking-widest"
                style={{ color: theme.primary }}
              >
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3
                className="mt-3 font-semibold"
                style={{
                  color: theme.text,
                  fontFamily: "var(--site-heading)",
                  fontWeight: preset.headingWeight,
                }}
              >
                {String(item.title ?? item.name ?? "Beneficio")}
              </h3>
              {item.description ? (
                <p className="mt-2 text-sm leading-relaxed" style={{ color: surface.muted }}>
                  {String(item.description)}
                </p>
              ) : null}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
