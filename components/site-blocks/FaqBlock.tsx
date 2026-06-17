import { getItems } from "@/lib/site/section";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function FaqBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-3xl">
        <SectionHeading
          title={section.title}
          subtitle={section.subtitle}
          theme={theme}
          preset={preset}
        />
        <div
          className="mt-12 divide-y border bg-white"
          style={{ borderRadius: "var(--site-radius)" }}
        >
          {items.map((item, i) => (
            <details key={i} className="group p-5">
              <summary
                className="flex cursor-pointer list-none items-center justify-between font-medium"
                style={{ color: theme.text }}
              >
                {String(item.question ?? item.title ?? "Pregunta")}
                <span
                  className="ml-4 transition-transform duration-200 group-open:rotate-45"
                  style={{ color: theme.accent }}
                >
                  +
                </span>
              </summary>
              {item.answer ? (
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {String(item.answer)}
                </p>
              ) : null}
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
