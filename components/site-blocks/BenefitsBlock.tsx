import { getItems } from "@/lib/site/section";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function BenefitsBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          title={section.title}
          subtitle={section.subtitle}
          theme={theme}
          preset={preset}
        />
        <div className="mt-14 grid gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((item, i) => (
            <div key={i} className="group text-center">
              <div
                className="mx-auto flex h-14 w-14 items-center justify-center text-xl text-white shadow-md transition-transform duration-300 group-hover:scale-110"
                style={{ backgroundColor: theme.accent, borderRadius: "var(--site-radius)" }}
              >
                ✓
              </div>
              <h3
                className="mt-5 font-semibold"
                style={{ color: theme.text, fontFamily: "var(--site-heading)" }}
              >
                {String(item.title ?? item.name ?? "Beneficio")}
              </h3>
              {item.description ? (
                <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
