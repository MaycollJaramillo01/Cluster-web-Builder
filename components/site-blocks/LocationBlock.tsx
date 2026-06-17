import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function LocationBlock({ section, theme, preset, site }: BlockProps) {
  const place = site.location || section.subtitle || "Zona de servicio";
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-4xl">
        <SectionHeading
          title={section.title}
          subtitle={section.body}
          theme={theme}
          preset={preset}
        />
        <div
          className="mt-12 overflow-hidden border"
          style={{ borderColor: `${theme.primary}33`, borderRadius: "var(--site-radius)" }}
        >
          <iframe
            title="Mapa"
            className="h-72 w-full"
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            src={`https://maps.google.com/maps?q=${encodeURIComponent(place)}&z=12&output=embed`}
          />
        </div>
      </div>
    </section>
  );
}
