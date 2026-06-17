import { stockImageUrl } from "@/lib/site/images";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function GalleryBlock({ section, theme, preset, site }: BlockProps) {
  // 6-tile gallery using free stock photos (keeps ImageKit quota for the hero).
  const tiles = Array.from({ length: 6 });
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading
          title={section.title || "Galería"}
          subtitle={section.subtitle}
          theme={theme}
          preset={preset}
        />
        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-3">
          {tiles.map((_, i) => (
            <div
              key={i}
              className="group relative overflow-hidden"
              style={{ borderRadius: "var(--site-radius)" }}
            >
              <img
                src={stockImageUrl(site.businessType, `gallery-${i}`, 600, 600)}
                alt={`${site.businessName} ${i + 1}`}
                loading="lazy"
                className="aspect-square h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
