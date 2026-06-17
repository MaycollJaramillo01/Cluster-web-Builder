import { getItems } from "@/lib/site/section";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? "")
    .join("");
}

export function TestimonialsBlock({ section, theme, preset }: BlockProps) {
  const items = getItems(section);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: "#f8fafc" }}>
      <div className="mx-auto max-w-5xl">
        <SectionHeading
          title={section.title}
          subtitle={section.subtitle}
          theme={theme}
          preset={preset}
        />
        <div className="mt-14 grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => {
            const name = String(item.name ?? "Cliente");
            return (
              <figure
                key={i}
                className={`flex flex-col border bg-white p-7 transition-all duration-300 hover:-translate-y-1 ${preset.cardShadow}`}
                style={{ borderRadius: "var(--site-radius)" }}
              >
                <div className="mb-3 text-lg" style={{ color: theme.accent }}>
                  ★★★★★
                </div>
                <blockquote className="flex-1 text-slate-700">
                  “{String(item.quote ?? item.text ?? "")}”
                </blockquote>
                <figcaption className="mt-5 flex items-center gap-3">
                  <span
                    className="flex h-10 w-10 items-center justify-center rounded-full text-sm font-bold text-white"
                    style={{ backgroundColor: theme.primary }}
                  >
                    {initials(name)}
                  </span>
                  <span className="text-sm">
                    <span className="block font-semibold" style={{ color: theme.text }}>
                      {name}
                    </span>
                    {item.role ? (
                      <span className="text-slate-500">{String(item.role)}</span>
                    ) : null}
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
