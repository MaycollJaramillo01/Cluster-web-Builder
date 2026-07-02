import { getItems } from "@/lib/site/section";
import { getThemeSurface } from "@/lib/site/theme-surface";
import { getStyleOverride, resolveElementStyle } from "@/lib/site/element-style";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

/**
 * Elegant fallback for section types without a dedicated component
 * (gallery, process, pricing, and any unknown type).
 */
export function GenericBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  const surface = getThemeSurface(theme);
  const titleStyle = resolveElementStyle("title", getStyleOverride(section.settings, "title"));
  const subtitleStyle = resolveElementStyle("subtitle", getStyleOverride(section.settings, "subtitle"));
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          title={section.title}
          subtitle={section.subtitle}
          theme={theme}
          preset={preset}
          titleStyle={titleStyle}
          subtitleStyle={subtitleStyle}
        />
        {section.body && (
          <p className="mx-auto mt-6 max-w-2xl text-center" style={{ color: surface.muted }}>
            {section.body}
          </p>
        )}
        {items.length > 0 && (
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <div
                key={i}
                className={`border p-7 transition-all duration-300 hover:-translate-y-1 ${preset.cardShadow}`}
                style={{ borderRadius: "var(--site-radius)", backgroundColor: surface.panel, borderColor: `${theme.text}1f` }}
              >
                <h3
                  className="font-semibold"
                  style={{ color: theme.text, fontFamily: "var(--site-heading)" }}
                >
                  {String(item.name ?? item.title ?? item.value ?? `Item ${i + 1}`)}
                </h3>
                {item.description ? (
                  <p className="mt-2 text-sm" style={{ color: surface.muted }}>{String(item.description)}</p>
                ) : null}
                {item.price ? (
                  <p className="mt-4 text-2xl font-bold" style={{ color: theme.primary }}>
                    {String(item.price)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
