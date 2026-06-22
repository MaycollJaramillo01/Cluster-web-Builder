import { getItems } from "@/lib/site/section";
import { getThemeSurface } from "@/lib/site/theme-surface";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function ProcessBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  const surface = getThemeSurface(theme);
  const bg =
    preset.surfaceStyle === "plain" || preset.surfaceStyle === "outlined"
      ? theme.background
      : surface.section;
  const stepRadius =
    preset.buttonRadius === "9999px" ? "9999px" : "var(--site-radius)";

  if (items.length === 0) {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: bg }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            title={section.title}
            subtitle={section.subtitle}
            theme={theme}
            preset={preset}
          />
          {section.body && (
            <p
              className="mx-auto mt-6 max-w-2xl text-center"
              style={{ color: surface.muted }}
            >
              {section.body}
            </p>
          )}
        </div>
      </section>
    );
  }

  const isAsymmetric =
    preset.sectionStyle === "asymmetric" ||
    preset.sectionStyle === "fullBleed";

  // Vertical left-side timeline for asymmetric / full-bleed presets
  if (isAsymmetric) {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: bg }}>
        <div className="mx-auto max-w-5xl">
          <SectionHeading
            title={section.title}
            subtitle={section.subtitle}
            theme={theme}
            preset={preset}
            align="left"
          />
          {section.body && (
            <p className="mt-4 max-w-2xl" style={{ color: surface.muted }}>
              {section.body}
            </p>
          )}
          <ol
            className="relative mt-14 space-y-10 border-l-2 pl-12"
            style={{ borderColor: `${theme.primary}28` }}
          >
            {items.map((item, i) => (
              <li key={i} className="relative">
                <span
                  className="absolute -left-[3.25rem] flex h-11 w-11 items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: theme.primary, borderRadius: stepRadius }}
                >
                  {i + 1}
                </span>
                <h3
                  className="text-xl font-semibold"
                  style={{
                    color: theme.text,
                    fontFamily: "var(--site-heading)",
                    fontWeight: preset.headingWeight,
                  }}
                >
                  {String(item.title ?? item.name ?? `Paso ${i + 1}`)}
                </h3>
                {item.description ? (
                  <p
                    className="mt-2 max-w-xl leading-relaxed"
                    style={{ color: surface.muted }}
                  >
                    {String(item.description)}
                  </p>
                ) : null}
              </li>
            ))}
          </ol>
        </div>
      </section>
    );
  }

  // Horizontal numbered steps (centered / grid / contained presets)
  const lineLeft = `${100 / (items.length * 2)}%`;

  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: bg }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title={section.title}
          subtitle={section.subtitle}
          theme={theme}
          preset={preset}
        />
        {section.body && (
          <p
            className="mx-auto mt-4 max-w-2xl text-center"
            style={{ color: surface.muted }}
          >
            {section.body}
          </p>
        )}

        {/* Mobile: vertical list */}
        <ol className="mt-12 space-y-6 md:hidden">
          {items.map((item, i) => (
            <li key={i} className="flex items-start gap-4">
              <span
                className="flex h-10 w-10 shrink-0 items-center justify-center text-sm font-bold text-white"
                style={{ backgroundColor: theme.primary, borderRadius: stepRadius }}
              >
                {i + 1}
              </span>
              <div className="pt-0.5">
                <h3
                  className="font-semibold"
                  style={{
                    color: theme.text,
                    fontFamily: "var(--site-heading)",
                    fontWeight: preset.headingWeight,
                  }}
                >
                  {String(item.title ?? item.name ?? `Paso ${i + 1}`)}
                </h3>
                {item.description ? (
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: surface.muted }}
                  >
                    {String(item.description)}
                  </p>
                ) : null}
              </div>
            </li>
          ))}
        </ol>

        {/* Desktop: horizontal row with connecting line */}
        <div className="relative mt-14 hidden md:block">
          {/* Connecting line from center of first circle to center of last */}
          <div
            className="absolute top-[1.375rem] h-px"
            style={{
              left: lineLeft,
              right: lineLeft,
              backgroundColor: `${theme.primary}28`,
            }}
          />
          <div
            className="grid"
            style={{
              gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))`,
            }}
          >
            {items.map((item, i) => (
              <div
                key={i}
                className="flex flex-col items-center px-3 text-center"
              >
                <span
                  className="relative z-10 flex h-11 w-11 items-center justify-center text-sm font-bold text-white"
                  style={{
                    backgroundColor: theme.primary,
                    borderRadius: stepRadius,
                    boxShadow: `0 0 0 5px ${bg}`,
                  }}
                >
                  {i + 1}
                </span>
                <h3
                  className="mt-5 text-sm font-semibold sm:text-base"
                  style={{
                    color: theme.text,
                    fontFamily: "var(--site-heading)",
                    fontWeight: preset.headingWeight,
                  }}
                >
                  {String(item.title ?? item.name ?? `Paso ${i + 1}`)}
                </h3>
                {item.description ? (
                  <p
                    className="mt-2 text-xs leading-relaxed sm:text-sm"
                    style={{ color: surface.muted }}
                  >
                    {String(item.description)}
                  </p>
                ) : null}
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
