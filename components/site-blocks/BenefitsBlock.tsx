import { getItems } from "@/lib/site/section";
import { getThemeSurface } from "@/lib/site/theme-surface";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function BenefitsBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  const surface = getThemeSurface(theme);

  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-5xl">
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
              className={`border p-5 ${preset.cardShadow}`}
              style={{ borderRadius: "var(--site-radius)", backgroundColor: surface.panel, borderColor: `${theme.text}1f` }}
            >
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: theme.primary }}>
                {String(i + 1).padStart(2, "0")}
              </p>
              <h3
                className="mt-4 font-semibold"
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
