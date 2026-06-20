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
        <div className={`mt-12 grid grid-cols-2 ${preset.sectionStyle === "grid" ? "gap-1 sm:grid-cols-4" : "gap-4 sm:grid-cols-3"}`}>
          {tiles.map((_, i) => (
            <div
              key={i}
              className={`relative overflow-hidden border border-black/5 ${preset.sectionStyle === "grid" && i === 0 ? "col-span-2 row-span-2" : ""}`}
              style={{
                borderRadius: preset.imageStyle === "arch" ? "999px 999px 0 0" : preset.imageStyle === "square" || preset.imageStyle === "fullBleed" ? "0" : "var(--site-radius)",
                transform: preset.imageStyle === "offset" && i % 2 ? "translateY(1.5rem)" : undefined,
              }}
            >
              <img
                src={stockImageUrl(site.businessType, `gallery-${i}`, 600, 600)}
                alt={`${site.businessName} ${i + 1}`}
                loading="lazy"
                className="aspect-square h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
                style={{ filter: preset.imageStyle === "monochrome" ? "grayscale(1) contrast(1.08)" : undefined }}
              />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
