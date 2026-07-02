/* eslint-disable @next/next/no-img-element */
import { stockImageUrl } from "@/lib/site/images";
import { getContrastText } from "@/lib/site/theme-surface";
import { getStyleOverride, resolveElementStyle } from "@/lib/site/element-style";
import { SectionHeading } from "./shared";
import type { BlockProps } from "./types";

/**
 * Galería tipo showcase: cada celda es una tarjeta compuesta — número, título
 * en grande, fila de metadatos, flecha y SIEMPRE una imagen. Nunca imágenes
 * sueltas con formas decorativas.
 */

type CellItem = { label: string; meta: string };
type Tone = "image" | "accent" | "primary";
type CellSpec = { span: string; tone: Tone; aspect?: string; wide?: boolean };

const FALLBACK_LABELS = ["El espacio", "El equipo", "En detalle", "El proceso", "Resultados", "Tras bambalinas"];

function readItems(section: BlockProps["section"], businessType: string): CellItem[] {
  const raw = Array.isArray(section.settings?.items) ? (section.settings.items as Array<Record<string, unknown>>) : [];
  const items = raw
    .map((item) => ({
      label: String(item.name ?? item.title ?? "").trim(),
      meta: String(item.description ?? "").trim(),
    }))
    .filter((item) => item.label);
  if (items.length) return items;
  return FALLBACK_LABELS.map((label) => ({ label, meta: businessType }));
}

function truncateAtWord(value: string, max: number): string {
  if (value.length <= max) return value;
  const cut = value.slice(0, max + 1);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[,;:.]$/, "") || value.slice(0, max);
}

export function GalleryBlock({ section, theme, preset, site }: BlockProps) {
  const style = preset.galleryStyle ?? "grid";
  const items = readItems(section, site.businessType);
  const radius = preset.imageStyle === "square" || preset.imageStyle === "fullBleed" ? "0" : "var(--site-radius)";
  const monochrome = preset.imageStyle === "monochrome";
  const titleStyle = resolveElementStyle("title", getStyleOverride(section.settings, "title"));
  const subtitleStyle = resolveElementStyle("subtitle", getStyleOverride(section.settings, "subtitle"));

  const cell = (i: number, spec: CellSpec) => {
    const item = items[i % items.length];
    const number = String(i + 1).padStart(2, "0");
    const meta = truncateAtWord(item.meta || site.businessType, 52);
    const image = (
      <img
        src={stockImageUrl(site.businessType, `gallery-${i}`, spec.wide ? 900 : 640, spec.wide ? 500 : 640)}
        alt={`${site.businessName} — ${item.label}`}
        loading="lazy"
        className="h-full w-full object-cover transition-transform duration-300 hover:scale-[1.03]"
        style={{ filter: monochrome ? "grayscale(1) contrast(1.08)" : undefined }}
      />
    );
    const heading = (color: string) => (
      <h3
        className="uppercase leading-[1.05]"
        style={{
          fontFamily: "var(--site-heading)",
          fontWeight: Math.max(680, preset.headingWeight),
          letterSpacing: preset.headingTracking,
          color,
          fontSize: spec.wide ? "clamp(1.5rem, 3.2vw, 2.4rem)" : "clamp(1.15rem, 2.2vw, 1.7rem)",
        }}
      >
        {item.label}
      </h3>
    );
    const metaRow = (color: string) => (
      <div className="mt-2 flex items-end justify-between gap-3">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em]" style={{ color }}>{meta}</p>
        <span aria-hidden className="text-lg leading-none" style={{ color }}>→</span>
      </div>
    );

    if (spec.tone !== "image") {
      const bg = spec.tone === "accent" ? theme.accent : theme.primary;
      const text = getContrastText(bg);
      return (
        <article key={i} data-motion-item className={`relative flex overflow-hidden ${spec.span} ${spec.wide ? "flex-row items-stretch" : "flex-col"}`} style={{ borderRadius: radius, backgroundColor: bg }}>
          <div className={`flex flex-col justify-between p-5 sm:p-6 ${spec.wide ? "w-1/2" : "flex-1"}`}>
            <span className="text-xs font-bold tracking-[0.2em]" style={{ color: text, opacity: 0.75 }}>{number}</span>
            <div>
              {heading(text)}
              {metaRow(text)}
            </div>
          </div>
          <div className={spec.wide ? "w-1/2" : "h-32 sm:h-40"} style={{ borderRadius: spec.wide ? `0 ${radius} ${radius} 0` : `0 0 ${radius} ${radius}` }}>
            {image}
          </div>
        </article>
      );
    }

    return (
      <article key={i} data-motion-item className={`relative overflow-hidden ${spec.span}`} style={{ borderRadius: radius, aspectRatio: spec.aspect }}>
        <div className="absolute inset-0">{image}</div>
        <div className="absolute inset-0" style={{ background: "linear-gradient(180deg, rgba(2,6,23,0.28) 0%, rgba(2,6,23,0.02) 32%, rgba(2,6,23,0.78) 100%)" }} />
        <div className="absolute inset-0 flex flex-col justify-between p-5 sm:p-6">
          <span className="text-xs font-bold tracking-[0.2em] text-white/85">{number}</span>
          <div>
            {heading("#ffffff")}
            {metaRow("rgba(255,255,255,0.85)")}
          </div>
        </div>
      </article>
    );
  };

  const layout = (specs: CellSpec[], grid: string, rows?: string) => (
    <section className="px-6 py-20 sm:py-24" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto max-w-6xl">
        <SectionHeading title={section.title || "Galeria"} subtitle={section.subtitle} theme={theme} preset={preset} titleStyle={titleStyle} subtitleStyle={subtitleStyle} />
        <div className={`mt-12 grid gap-3 ${grid}`} style={rows ? { gridAutoRows: rows } : undefined}>
          {specs.map((spec, i) => cell(i, spec))}
        </div>
      </div>
    </section>
  );

  // ── BENTO: la retícula de referencia — tarjeta de color alta, celdas de imagen y barra final ──
  if (style === "bento") {
    return layout([
      { span: "sm:row-span-2", tone: "accent" },
      { span: "", tone: "image" },
      { span: "", tone: "image" },
      { span: "sm:col-span-2", tone: "image" },
      { span: "", tone: "image" },
      { span: "sm:col-span-2", tone: "primary", wide: true },
    ], "grid-cols-1 sm:grid-cols-3", "minmax(15rem, auto)");
  }

  // ── EDITORIAL: celda protagonista + cuatro de apoyo, todas etiquetadas ──
  if (style === "editorial") {
    return layout([
      { span: "col-span-2 sm:col-span-2 sm:row-span-2", tone: "image", aspect: "4/3" },
      { span: "", tone: "image", aspect: "1/1" },
      { span: "", tone: "accent" },
      { span: "", tone: "image", aspect: "1/1" },
      { span: "", tone: "image", aspect: "1/1" },
    ], "grid-cols-2 sm:grid-cols-4");
  }

  // ── MASONRY: tres columnas con ritmo vertical ──
  if (style === "masonry") {
    return layout([
      { span: "", tone: "image", aspect: "3/4" },
      { span: "sm:translate-y-6", tone: "accent" },
      { span: "", tone: "image", aspect: "3/4" },
      { span: "sm:translate-y-6", tone: "image", aspect: "4/5" },
      { span: "", tone: "image", aspect: "4/5" },
      { span: "sm:translate-y-6", tone: "image", aspect: "4/5" },
    ], "grid-cols-2 sm:grid-cols-3");
  }

  // ── FILMSTRIP: tarjetas panorámicas apaisadas ──
  if (style === "filmstrip") {
    return layout([
      { span: "", tone: "image", aspect: "16/9", wide: true },
      { span: "", tone: "image", aspect: "16/9", wide: true },
      { span: "", tone: "image", aspect: "16/9", wide: true },
      { span: "", tone: "image", aspect: "16/9", wide: true },
    ], "grid-cols-1 sm:grid-cols-2");
  }

  // ── MOSAIC: proporciones mixtas con un bloque de color ──
  if (style === "mosaic") {
    return layout([
      { span: "", tone: "image", aspect: "3/4" },
      { span: "", tone: "image", aspect: "4/3" },
      { span: "", tone: "accent" },
      { span: "", tone: "image", aspect: "4/3" },
      { span: "", tone: "image", aspect: "3/4" },
      { span: "", tone: "image", aspect: "1/1" },
    ], "grid-cols-2 sm:grid-cols-3");
  }

  // ── GRID (default): seis tarjetas uniformes ──
  return layout(
    Array.from({ length: 6 }, () => ({ span: "", tone: "image" as Tone, aspect: "1/1" })),
    preset.sectionStyle === "grid" ? "grid-cols-2 gap-1 sm:grid-cols-3" : "grid-cols-2 sm:grid-cols-3",
  );
}
