import { getItems } from "@/lib/site/section";
import { stockImageUrl } from "@/lib/site/images";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function ServicesBlock({ section, theme, preset, site }: BlockProps) {
  const items = getItems(section);
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title={section.title}
          subtitle={section.subtitle}
          theme={theme}
          preset={preset}
        />
        <div className="mt-14 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {items.map((item, i) => (
            <div
              key={i}
              className={`overflow-hidden border bg-white transition-colors duration-200 hover:border-slate-300 ${preset.cardShadow}`}
              style={{ borderRadius: "var(--site-radius)" }}
            >
              <div className="relative h-40 overflow-hidden">
                <img
                  src={stockImageUrl(site.businessType, `service-${i}`, 500, 320)}
                  alt={String(item.name ?? item.title ?? "Servicio")}
                  loading="lazy"
                  className="h-full w-full object-cover"
                />
                <span
                  className="absolute left-3 top-3 flex h-8 w-8 items-center justify-center text-sm font-bold text-white"
                  style={{ backgroundColor: theme.primary, borderRadius: "var(--site-radius)" }}
                >
                  {i + 1}
                </span>
              </div>
              <div className="p-6">
                <h3
                  className="text-lg font-semibold"
                  style={{ color: theme.text, fontFamily: "var(--site-heading)" }}
                >
                  {String(item.name ?? item.title ?? "Servicio")}
                </h3>
                {item.description ? (
                  <p className="mt-2 text-sm leading-relaxed text-slate-600">
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
