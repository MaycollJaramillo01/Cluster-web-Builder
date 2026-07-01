/* eslint-disable @next/next/no-img-element */
import { stockImageUrl } from "@/lib/site/images";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

export function GalleryBlock({ section, theme, preset, site }: BlockProps) {
  const style = preset.galleryStyle ?? "grid";
  const img = (seed: string, w: number, h: number, className?: string) => (
    <img
      src={stockImageUrl(site.businessType, seed, w, h)}
      alt={`${site.businessName}`}
      loading="lazy"
      className={`h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03] ${className ?? ""}`}
      style={{ filter: preset.imageStyle === "monochrome" ? "grayscale(1) contrast(1.08)" : undefined }}
    />
  );
  const tileRadius = preset.imageStyle === "arch" ? "999px 999px 0 0" : preset.imageStyle === "square" || preset.imageStyle === "fullBleed" ? "0" : "var(--site-radius)";

  // ── MASONRY: 3 cols, alternating vertical offset ──────────────────────────
  if (style === "masonry") {
    const tiles = Array.from({ length: 6 });
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title || "Galeria"} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-12 grid grid-cols-3 gap-4">
            {tiles.map((_, i) => (
              <div key={i} data-motion-item className="relative overflow-hidden border border-black/5" style={{ borderRadius: tileRadius, transform: i % 2 === 1 ? "translateY(1.5rem)" : undefined, aspectRatio: i % 3 === 0 ? "3/4" : "4/5" }}>
                {img(`gallery-${i}`, 600, 750)}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── EDITORIAL: large feature tile + 4 smaller tiles ─────────────────────
  if (style === "editorial") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title || "Galeria"} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
            <div data-motion-item className="relative col-span-2 row-span-2 overflow-hidden border border-black/5 sm:col-span-2" style={{ borderRadius: tileRadius, aspectRatio: "4/3" }}>
              {img("gallery-0", 900, 675)}
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} data-motion-item className="relative overflow-hidden border border-black/5" style={{ borderRadius: tileRadius, aspectRatio: "1/1" }}>
                {img(`gallery-${i}`, 450, 450)}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── BENTO: varied sizes — feature tile takes more space ──────────────────
  if (style === "bento") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title || "Galeria"} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-12 grid auto-rows-[16rem] grid-cols-2 gap-3 sm:grid-cols-3">
            <div data-motion-item className="relative col-span-2 row-span-2 overflow-hidden border border-black/5" style={{ borderRadius: tileRadius }}>
              {img("gallery-0", 900, 650, "aspect-auto")}
            </div>
            {[1, 2, 3, 4].map((i) => (
              <div key={i} data-motion-item className="relative overflow-hidden border border-black/5" style={{ borderRadius: tileRadius }}>
                {img(`gallery-${i}`, 450, 320, "aspect-auto")}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── FILMSTRIP: landscape images, full-width row ───────────────────────────
  if (style === "filmstrip") {
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title || "Galeria"} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} data-motion-item className="relative overflow-hidden border border-black/5" style={{ borderRadius: tileRadius, aspectRatio: "16/9" }}>
                {img(`gallery-${i}`, 800, 450)}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── MOSAIC: mixed portrait and landscape in 3 cols ───────────────────────
  if (style === "mosaic") {
    const mosaic: Array<{ seed: string; aspect: string; w: number; h: number }> = [
      { seed: "gallery-0", aspect: "3/4", w: 450, h: 600 },
      { seed: "gallery-1", aspect: "4/3", w: 600, h: 450 },
      { seed: "gallery-2", aspect: "1/1", w: 500, h: 500 },
      { seed: "gallery-3", aspect: "4/3", w: 600, h: 450 },
      { seed: "gallery-4", aspect: "3/4", w: 450, h: 600 },
      { seed: "gallery-5", aspect: "1/1", w: 500, h: 500 },
    ];
    return (
      <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
        <div className="mx-auto max-w-6xl">
          <SectionHeading title={section.title || "Galeria"} subtitle={section.subtitle} theme={theme} preset={preset} />
          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-3">
            {mosaic.map((tile, i) => (
              <div key={i} data-motion-item className="relative overflow-hidden border border-black/5" style={{ borderRadius: tileRadius, aspectRatio: tile.aspect }}>
                {img(tile.seed, tile.w, tile.h)}
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  // ── GRID (default): uniform squares ──────────────────────────────────────
  const tiles = Array.from({ length: 6 });
  return (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={section.title || "Galeria"} subtitle={section.subtitle} theme={theme} preset={preset} />
        <div className={`mt-12 grid grid-cols-2 ${preset.sectionStyle === "grid" ? "gap-1 sm:grid-cols-4" : "gap-4 sm:grid-cols-3"}`}>
          {tiles.map((_, i) => (
            <div key={i} data-motion-item className={`relative overflow-hidden border border-black/5 ${preset.sectionStyle === "grid" && i === 0 ? "col-span-2 row-span-2" : ""}`} style={{ borderRadius: tileRadius, aspectRatio: "1/1" }}>
              {img(`gallery-${i}`, 600, 600)}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
