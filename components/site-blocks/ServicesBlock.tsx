import { getItems } from "@/lib/site/section";
import { stockImageUrl } from "@/lib/site/images";
import { getThemeSurface } from "@/lib/site/theme-surface";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function ServicesBlock({ section, theme, preset, site }: BlockProps) {
  const items = getItems(section);
  const surface = getThemeSurface(theme);
  const titleFor = (item: (typeof items)[number]) => String(item.name ?? item.title ?? "Servicio");
  const descriptionFor = (item: (typeof items)[number]) => item.description ? String(item.description) : "";

  if (preset.servicesStyle === "list") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} align="left" />
          <div className="mt-12 border-t" style={{ borderColor: `${theme.text}4d` }}>
            {items.map((item, i) => (
              <article key={i} className="grid gap-4 border-b py-7 md:grid-cols-[5rem_1fr_1.2fr] md:items-start" style={{ borderColor: `${theme.text}33` }}>
                <span className="text-sm font-semibold" style={{ color: theme.primary }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="text-xl font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>{titleFor(item)}</h3>
                {descriptionFor(item) && <p className="leading-relaxed" style={{ color: surface.muted }}>{descriptionFor(item)}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (preset.servicesStyle === "editorial") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} align="left" />
          <div className="mt-14 grid gap-x-12 gap-y-10 md:grid-cols-2">
            {items.map((item, i) => (
              <article key={i} className="border-t pt-5" style={{ borderColor: theme.primary }}>
                <span className="text-5xl font-light opacity-25" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-4 text-2xl" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>{titleFor(item)}</h3>
                {descriptionFor(item) && <p className="mt-3 max-w-md leading-relaxed" style={{ color: surface.muted }}>{descriptionFor(item)}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (preset.servicesStyle === "bordered") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-12 grid border-l border-t md:grid-cols-2 lg:grid-cols-3" style={{ borderColor: theme.text }}>
            {items.map((item, i) => (
              <article key={i} className="min-h-64 border-b border-r p-7" style={{ borderColor: theme.text, backgroundColor: i % 2 ? surface.panel : "transparent" }}>
                <span className="text-sm font-bold" style={{ color: theme.primary }}>{String(i + 1).padStart(2, "0")}</span>
                <h3 className="mt-12 text-2xl font-bold" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>{titleFor(item)}</h3>
                {descriptionFor(item) && <p className="mt-4 text-sm leading-relaxed" style={{ color: surface.muted }}>{descriptionFor(item)}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (preset.servicesStyle === "split") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: surface.section }}>
        <div className="mx-auto grid max-w-6xl gap-12 lg:grid-cols-[0.7fr_1.3fr]">
          <div><SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} align="left" /></div>
          <div className="grid gap-4 sm:grid-cols-2">
            {items.map((item, i) => (
              <article key={i} className={`p-7 ${preset.cardShadow}`} style={{ backgroundColor: surface.panel, borderRadius: "var(--site-radius)" }}>
                <span className="text-xs font-bold uppercase tracking-widest" style={{ color: theme.primary }}>Servicio {i + 1}</span>
                <h3 className="mt-6 text-xl font-semibold" style={{ color: theme.text, fontFamily: "var(--site-heading)" }}>{titleFor(item)}</h3>
                {descriptionFor(item) && <p className="mt-3 text-sm leading-relaxed" style={{ color: surface.muted }}>{descriptionFor(item)}</p>}
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (preset.servicesStyle === "bento") {
    return (
      <section className="px-6 py-20 sm:py-28" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-12 grid auto-rows-[14rem] gap-4 md:grid-cols-2 lg:grid-cols-3">
            {items.map((item, i) => (
              <article key={i} className={`relative overflow-hidden p-7 ${i === 0 ? "md:col-span-2 lg:row-span-2 lg:min-h-[29rem]" : ""} ${preset.cardShadow}`} style={{ backgroundColor: i === 0 ? theme.secondary : surface.panel, color: i === 0 ? "#fff" : theme.text, borderRadius: "var(--site-radius)" }}>
                {i === 0 && <div className="absolute inset-0 bg-cover bg-center opacity-25" style={{ backgroundImage: `url("${stockImageUrl(site.businessType, "service-feature", 900, 700)}")` }} />}
                <div className="relative flex h-full flex-col justify-end">
                  <span className="text-xs font-bold uppercase tracking-widest" style={{ color: i === 0 ? theme.accent : theme.primary }}>{String(i + 1).padStart(2, "0")}</span>
                  <h3 className={`${i === 0 ? "text-3xl sm:text-4xl" : "text-xl"} mt-3 font-semibold`} style={{ fontFamily: "var(--site-heading)" }}>{titleFor(item)}</h3>
                  {descriptionFor(item) && <p className="mt-2 text-sm leading-relaxed opacity-75">{descriptionFor(item)}</p>}
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>
    );
  }

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
              className={`overflow-hidden border transition-colors duration-200 ${preset.cardShadow}`}
              style={{ backgroundColor: surface.panel, borderColor: `${theme.text}1f`, borderRadius: "var(--site-radius)" }}
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
                  <p className="mt-2 text-sm leading-relaxed" style={{ color: surface.muted }}>
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
