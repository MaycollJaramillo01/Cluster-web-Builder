import { sanitizeLink } from "@/lib/site/links";
import { getDesignLanguagePack } from "@/lib/site/design-languages";
import {
  normalizeCanvasSectionsV2, normalizeSiteContentV2, normalizeThemeV2, resolveContentSlot,
  type CanvasColumnV2, type CanvasSectionV2, type ResponsiveStyleV2, type SiteContentV2, type StyleTokensV2, type ThemeTokensV2, type WidgetV2,
} from "@/lib/site/v2-schema";
import { V2_TAILWIND_CSS } from "@/lib/site/v2-tailwind.generated";

export type RenderSiteV2Input = {
  content: unknown;
  design: unknown;
  sections: unknown;
  leadEndpoint: string;
  showBranding?: boolean;
  /** URL canónica del sitio publicado. En preview se omite. */
  publicUrl?: string;
  /** Solo los sitios publicados deben ser indexables. */
  indexable?: boolean;
  /** Imagen explícita para tarjetas sociales. */
  socialImage?: string;
  /** Modo editor: resalta elementos al pasar el cursor y reporta clics al padre via postMessage. */
  editable?: boolean;
};

export type RenderedSiteV2 = { html: string; head: string; body: string; css: string; script: string };

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const safeUrl = (value: unknown) => {
  const clean = sanitizeLink(typeof value === "string" ? value : "");
  return clean.startsWith("http://") ? "" : clean;
};

function relativeLuminance(hex: string) {
  const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  return .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
}
function contrastRatio(l1: number, l2: number) {
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return (lighter + .05) / (darker + .05);
}
// Elige negro o blanco comparando el contraste real contra el fondo, en vez
// de un umbral de luminancia fijo — evita quedarse corto de WCAG AA en el
// rango medio donde un umbral arbitrario elegía mal.
function readableText(background: string) {
  const hex = background.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "#ffffff";
  const bgLuminance = relativeLuminance(hex);
  const withBlack = contrastRatio(bgLuminance, relativeLuminance("111827"));
  const withWhite = contrastRatio(bgLuminance, relativeLuminance("ffffff"));
  return withBlack >= withWhite ? "#111827" : "#ffffff";
}

function socialImageFor(content: SiteContentV2, explicit?: string) {
  const candidates = [explicit, content.hero.media, content.business.logo];
  return candidates.map(safeUrl).find((url) => url && !/(?:youtu\.be|youtube\.com|\.mp4(?:$|[?#])|\.webm(?:$|[?#]))/i.test(url)) || "";
}

// Webfonts con pesos disponibles reales; los nombres fuera de la lista son
// fuentes del sistema y no generan petición.
const GOOGLE_FONT_AXES: Record<string, string> = {
  Anton: "400", Inter: "400;600;700;900", Sora: "400;600;700;800", Outfit: "400;600;700;900",
  "Playfair Display": "400;600;700;900", Nunito: "400;600;700;900", Poppins: "400;500;600;700",
  "Space Grotesk": "400;500;600;700", "Cormorant Garamond": "400;500;600;700", Karla: "400;500;700",
};

function fontLinksFor(theme: ThemeTokensV2) {
  const names = [...new Set([theme.headingFont, theme.bodyFont]
    .map((stack) => stack.split(",")[0].trim().replace(/^['"]|['"]$/g, "")))]
    .filter((name) => GOOGLE_FONT_AXES[name]);
  if (!names.length) return "";
  const families = names.map((name) => `family=${name.replace(/ /g, "+")}:wght@${GOOGLE_FONT_AXES[name]}`).join("&");
  return `<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin><link rel="stylesheet" href="https://fonts.googleapis.com/css2?${families}&display=swap">`;
}

// ---------------------------------------------------------------------------
// Sistema de estilo DINÁMICO (lo que el usuario ajusta en el editor por
// widget/columna/sección: color, fondo, tipografía, padding por breakpoint).
// Son valores arbitrarios elegidos en el momento — Tailwind no puede
// precompilarlos, así que se quedan como CSS generado por instancia, igual
// que antes de la migración. Todo lo DEMÁS (el sistema de diseño base de
// cada widget/variante) ahora se expresa con clases Tailwind reales, ver
// más abajo y lib/site/v2-tailwind.generated.ts (compilado por
// scripts/build-v2-tailwind.mjs a partir de tailwind.v2.config.ts).
// ---------------------------------------------------------------------------

const FONT_SIZE: Record<NonNullable<StyleTokensV2["fontSize"]>, string> = { xs: ".75rem", sm: ".875rem", md: "1rem", lg: "1.25rem", xl: "1.75rem", "2xl": "2.5rem", display: "clamp(2.8rem,7vw,6rem)" };
const FONT_WEIGHT = { normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 } as const;
const SPACE = { none: "0", sm: ".75rem", md: "1.5rem", lg: "3rem", xl: "5rem" } as const;
const RADIUS = { none: "0", sm: ".25rem", md: ".75rem", lg: "1.5rem", pill: "999px" } as const;
const SHADOW = { none: "none", sm: "0 2px 8px #0001", md: "0 16px 40px #0002", lg: "0 30px 80px #0004" } as const;
const WIDTH = { content: "760px", wide: "1200px", full: "none" } as const;

const THEME_COLOR_VARS: Record<string, string> = { primary: "--primary", secondary: "--secondary", accent: "--accent", background: "--bg", text: "--text", muted: "--muted" };
const resolveStyleColor = (value: string) => THEME_COLOR_VARS[value] ? `var(${THEME_COLOR_VARS[value]})` : value;

function tokensCss(style?: StyleTokensV2) {
  if (!style) return "";
  const backgroundImage = safeUrl(style.backgroundImage);
  const cssBackgroundImage = backgroundImage.replace(/["'()\\\s]/g, (character) => encodeURIComponent(character));
  const backgroundIsToken = Boolean(style.background && THEME_COLOR_VARS[style.background]);
  return [
    style.color && `color:${resolveStyleColor(style.color)}`, style.background && `background:${resolveStyleColor(style.background)}`,
    backgroundIsToken && !style.color && `color:var(--on-${style.background})`,
    backgroundImage && !style.background && "background-color:#111827", backgroundImage && !style.color && "color:#ffffff",
    backgroundImage && `background-image:url("${cssBackgroundImage}")`, backgroundImage && "background-size:cover", backgroundImage && "background-position:center", backgroundImage && "background-blend-mode:multiply",
    style.align && `text-align:${style.align}`, style.fontSize && `font-size:${FONT_SIZE[style.fontSize]}`,
    style.fontWeight && `font-weight:${FONT_WEIGHT[style.fontWeight]}`, style.padding && `padding:${SPACE[style.padding]}`,
    style.gap && `gap:${SPACE[style.gap]}`, style.radius && `border-radius:${RADIUS[style.radius]}`,
    style.shadow && `box-shadow:${SHADOW[style.shadow]}`, style.width && `max-width:${WIDTH[style.width]}`,
    // width:100% evita que un item flex con margin-inline:auto se encoja a su contenido.
    style.width && "width:100%", style.width && style.width !== "full" && "margin-inline:auto",
  ].filter(Boolean).join(";");
}

function responsiveCss(selector: string, style?: ResponsiveStyleV2) {
  if (!style) return "";
  const desktop = tokensCss(style.desktop);
  const tablet = tokensCss(style.tablet);
  const mobile = tokensCss(style.mobile);
  return `${desktop ? `${selector}{${desktop}}` : ""}${tablet ? `@media(max-width:1024px){${selector}{${tablet}}}` : ""}${mobile ? `@media(max-width:640px){${selector}{${mobile}}}` : ""}`;
}

function valueFor(widget: WidgetV2, content: SiteContentV2) { return widget.slot ? resolveContentSlot(content, widget.slot) : widget.data?.value ?? widget.data?.src ?? widget.data?.text; }
function widgetSelector(widget: WidgetV2) { return `[data-widget-id="${widget.id.replace(/[^a-zA-Z0-9_-]/g, "")}"]`; }

// ---------------------------------------------------------------------------
// Sistema de diseño ESTÁTICO — Tailwind. Cada widget/variante compone clases
// reales (compiladas por scripts/build-v2-tailwind.mjs). Colores y radio de
// esquina siguen el tema vía var(--token) con sintaxis de valor arbitrario
// de Tailwind (bg-[var(--accent)]) para conservar la paleta del sitio sin
// que el CSS deje de ser Tailwind.
// ---------------------------------------------------------------------------

const HEADING_FONT = "font-[var(--heading)]";
const BODY_FONT = "font-[var(--body)]";
// Sin color propio: heredan el color de su sección para que un fondo oscuro
// (background:"primary"/"secondary" u otro override dinámico) siga siendo
// legible sin tener que repetir la lógica de contraste en cada widget.
const H1 = `${HEADING_FONT} max-w-[18ch] text-[clamp(2.6rem,6vw,5.5rem)] font-bold leading-[1.05] tracking-[-0.03em]`;
const H2 = `${HEADING_FONT} max-w-[24ch] text-[clamp(2rem,4vw,3.75rem)] font-bold leading-[1.06] tracking-[-0.02em]`;
const H3 = `${HEADING_FONT} text-[clamp(1.1rem,2vw,1.35rem)] font-semibold leading-snug`;
const BODY_P = `${BODY_FONT} max-w-[65ch] leading-relaxed opacity-80`;
// Texto secundario/atenuado: opacidad sobre el color heredado, nunca un color
// fijo — así se atenúa de forma correcta sobre cualquier fondo de sección.
const MUTED = "opacity-65";

function headingClasses(level: "h1" | "h2" | "h3", theme: ThemeTokensV2) {
  const base = level === "h1" ? H1 : level === "h3" ? H3 : H2;
  return theme.headingCase === "uppercase" ? `${base} uppercase tracking-[0.01em]` : base;
}

const BUTTON_BASE = "inline-flex w-max min-h-[46px] max-w-full items-center justify-center whitespace-normal rounded-[var(--radius)] px-6 py-3 text-center font-bold leading-tight no-underline transition duration-200 active:translate-y-px focus-visible:outline focus-visible:outline-[3px] focus-visible:outline-offset-[3px] focus-visible:outline-[var(--accent)]";
const BUTTON_VARIANT: Record<string, string> = {
  solid: "bg-[var(--accent)] text-[var(--on-accent)] hover:brightness-95",
  outline: "border border-current bg-transparent text-current hover:bg-current/5",
  dark: "bg-[var(--secondary)] text-[var(--footer-text)] hover:brightness-110",
};

function buttonHtml(attr: string, variant: string, href: string, label: string) {
  const classes = `${BUTTON_BASE} ${BUTTON_VARIANT[variant] ?? BUTTON_VARIANT.solid}`;
  return `<a ${attr} class="${classes}" href="${escapeHtml(href)}">${escapeHtml(label || "Contactar")}</a>`;
}

const IMAGE_BASE = "block w-full min-h-[220px] object-cover";
const IMAGE_VARIANT: Record<string, string> = {
  cover: `${IMAGE_BASE} aspect-[4/3] rounded-[var(--radius)]`,
  portrait: `${IMAGE_BASE} aspect-[4/5] rounded-[var(--radius)]`,
  wide: `${IMAGE_BASE} aspect-[16/8] rounded-[var(--radius)]`,
  monochrome: `${IMAGE_BASE} aspect-[4/3] rounded-[var(--radius)] grayscale`,
  framed: `${IMAGE_BASE} aspect-[4/3] rounded-[var(--radius)] shadow-2xl ring-8 ring-[var(--bg)]`,
  product: `${IMAGE_BASE} aspect-square rounded-[var(--radius)] bg-current/[0.04] object-contain p-8 ring-1 ring-current/10`,
  rounded: `${IMAGE_BASE} aspect-[4/3] rounded-[2rem]`,
  offset: `${IMAGE_BASE} aspect-[4/3] rounded-[var(--radius)] shadow-[16px_16px_0_var(--accent)]`,
  tilt: `${IMAGE_BASE} aspect-[4/3] w-[calc(100%-2.5rem)] -rotate-3 rounded-[1.4rem] shadow-[18px_-18px_0_-2px_var(--bg),0_24px_50px_rgba(0,0,0,0.18)] mx-auto my-4`,
};

// ---------------------------------------------------------------------------
// Listas (services / benefits / highlights)
// ---------------------------------------------------------------------------

const LIST_WRAP: Record<string, string> = {
  cards: "grid gap-6 sm:grid-cols-2 lg:grid-cols-3",
  minimal: "flex flex-col divide-y divide-current/10",
  editorial: "grid gap-x-10 gap-y-14 sm:grid-cols-2",
  catalog: "grid gap-4 sm:grid-cols-2 lg:grid-cols-3",
  pills: "flex flex-wrap gap-3",
  badges: "flex flex-wrap gap-3",
  metrics: "grid gap-8 text-center sm:grid-cols-2 lg:grid-cols-4",
  numbered: "flex flex-col divide-y divide-current/10",
  bento: "grid grid-cols-2 gap-4 sm:grid-cols-6",
};

function listItemHtml(variant: string, item: Record<string, unknown>, index: number) {
  const title = escapeHtml(item.title);
  const desc = escapeHtml(item.description);
  const meta = item.meta ? escapeHtml(item.meta) : "";
  const img = safeUrl(item.image as string);
  const idx = String(index + 1).padStart(2, "0");
  const cardBase = "flex flex-col rounded-[var(--radius)] border border-current/10 bg-current/[0.04] p-6";
  const cardImg = img ? `<img src="${img}" alt="" loading="lazy" class="mb-4 aspect-[4/3] w-full rounded-[calc(var(--radius)/1.4)] object-cover">` : "";
  switch (variant) {
    case "minimal":
      return `<article class="flex items-start justify-between gap-6 py-5 first:pt-0 last:pb-0"><div class="min-w-0"><h3 class="${H3}">${title}</h3>${desc ? `<p class="mt-1 max-w-[55ch] text-sm ${MUTED}">${desc}</p>` : ""}</div>${meta ? `<span class="shrink-0 ${HEADING_FONT} text-sm font-semibold ${MUTED}">${meta}</span>` : ""}</article>`;
    case "numbered":
      return `<article class="flex items-start gap-5 py-5 first:pt-0 last:pb-0"><span class="font-mono text-sm font-bold text-[var(--accent)]">${idx}</span><div class="min-w-0"><h3 class="${H3}">${title}</h3>${desc ? `<p class="mt-1 max-w-[55ch] text-sm ${MUTED}">${desc}</p>` : ""}</div></article>`;
    case "pills":
    case "badges":
      return `<article class="inline-flex max-w-full items-center gap-2 rounded-[var(--radius)] border border-current/15 bg-current/[0.05] px-4 py-2.5"><span class="${HEADING_FONT} text-sm font-semibold">${title}</span>${desc ? `<span class="text-xs ${MUTED}">${desc}</span>` : ""}</article>`;
    case "metrics":
      // Rango de tamaño moderado: pensado para números cortos, pero no rompe
      // si el contenido real trae una frase más larga en vez de un dato.
      return `<article><h3 class="${HEADING_FONT} text-[clamp(1.35rem,2.6vw,2.1rem)] font-bold leading-tight text-balance">${title}</h3><p class="mt-2 text-sm ${MUTED}">${desc}</p></article>`;
    case "editorial":
      return `<article class="${index % 2 === 1 ? "sm:mt-10" : ""}">${img ? `<img src="${img}" alt="" loading="lazy" class="mb-5 aspect-[4/3] w-full rounded-[var(--radius)] object-cover">` : ""}<h3 class="${H3} text-xl">${title}</h3>${desc ? `<p class="mt-2 max-w-[45ch] ${MUTED}">${desc}</p>` : ""}</article>`;
    case "catalog":
      return `<article class="${cardBase}"><div class="flex items-baseline justify-between gap-3">${cardImg ? "" : ""}<h3 class="${H3}">${title}</h3>${meta ? `<span class="shrink-0 ${HEADING_FONT} text-lg font-bold text-[var(--accent)]">${meta}</span>` : ""}</div>${cardImg}${desc ? `<p class="mt-2 text-sm ${MUTED}">${desc}</p>` : ""}</article>`;
    case "bento":
      return `<article class="${index % 3 === 0 ? "col-span-2 sm:col-span-4" : "col-span-2 sm:col-span-2"} ${cardBase}">${cardImg || `<span class="font-mono text-xs font-bold text-[var(--accent)]">${idx}</span>`}<h3 class="mt-2 ${H3}">${title}</h3>${desc ? `<p class="mt-2 text-sm ${MUTED}">${desc}</p>` : ""}</article>`;
    default:
      return `<article class="${cardBase}">${cardImg || `<span class="font-mono text-xs font-bold text-[var(--accent)]">${idx}</span>`}<h3 class="mt-2 ${H3}">${title}</h3>${desc ? `<p class="mt-2 text-sm ${MUTED}">${desc}</p>` : ""}${meta ? `<span class="mt-3 text-xs font-semibold uppercase tracking-wide ${MUTED}">${meta}</span>` : ""}</article>`;
  }
}

// ---------------------------------------------------------------------------
// Galerías
// ---------------------------------------------------------------------------

function galleryHtml(variant: string, items: Record<string, unknown>[], attr: string) {
  const figures = items.map((item, i) => {
    const source = safeUrl(item.url as string);
    if (!source) return "";
    const alt = String(item.alt ?? "").trim();
    return { source, alt, i };
  }).filter((figure): figure is { source: string; alt: string; i: number } => Boolean(figure));
  if (!figures.length) return "";

  if (variant === "filmstrip") {
    const cells = figures.map(({ source, alt }) => `<figure class="min-w-[78%] shrink-0 snap-start overflow-hidden rounded-[var(--radius)] sm:min-w-[46%] lg:min-w-[31%]"><img src="${source}" alt="${escapeHtml(alt)}" loading="lazy" class="h-[clamp(220px,26vw,360px)] w-full object-cover"></figure>`).join("");
    return `<div ${attr} class="v2-gallery-filmstrip v2-scroll-hide v2-scroll-fade flex cursor-grab snap-x snap-mandatory gap-4 overflow-x-auto">${cells}</div>`;
  }
  if (variant === "mosaic") {
    const cells = figures.map(({ source, alt, i }) => {
      const cls = i === 0 ? "col-span-2 row-span-2 sm:col-span-4" : "col-span-2 sm:col-span-2";
      const imgCls = i === 0 ? "h-full min-h-[320px] w-full object-cover" : "aspect-square w-full object-cover";
      return `<figure class="${cls} overflow-hidden rounded-[var(--radius)]"><img src="${source}" alt="${escapeHtml(alt)}" loading="lazy" class="${imgCls}"></figure>`;
    }).join("");
    return `<div ${attr} class="grid grid-cols-4 gap-4 sm:grid-cols-8">${cells}</div>`;
  }
  if (variant === "bento") {
    const cells = figures.map(({ source, alt, i }, pos) => {
      const wide = i % 4 === 0 || i % 4 === 3;
      const cls = wide ? "col-span-2 sm:col-span-4" : "col-span-2 sm:col-span-2";
      const showCaption = Boolean(alt);
      return `<figure class="group relative ${cls} overflow-hidden rounded-[var(--radius)]"><img src="${source}" alt="${escapeHtml(alt)}" loading="lazy" class="h-[clamp(220px,24vw,340px)] w-full object-cover transition duration-700 group-hover:scale-105">${showCaption ? `<figcaption class="absolute inset-x-0 bottom-0 flex items-baseline justify-between gap-3 bg-gradient-to-t from-black/70 to-transparent px-4 pb-3 pt-8 ${HEADING_FONT} text-sm font-semibold text-white"><span>${escapeHtml(alt)}</span><span class="font-mono text-[10px] font-normal tracking-[0.16em] opacity-70">${String(pos + 1).padStart(2, "0")}</span></figcaption>` : ""}</figure>`;
    }).join("");
    return `<div ${attr} class="grid grid-cols-4 gap-3 sm:grid-cols-8">${cells}</div>`;
  }
  if (variant === "editorial") {
    const [first, ...rest] = figures;
    const heroFigure = first ? `<figure class="overflow-hidden rounded-[var(--radius)]"><img src="${first.source}" alt="${escapeHtml(first.alt)}" loading="lazy" class="aspect-[21/9] w-full object-cover">${first.alt ? `<figcaption class="mt-3 max-w-[55ch] text-sm ${MUTED}">${escapeHtml(first.alt)}</figcaption>` : ""}</figure>` : "";
    const restCells = rest.map(({ source, alt }) => `<figure class="overflow-hidden rounded-[var(--radius)]"><img src="${source}" alt="${escapeHtml(alt)}" loading="lazy" class="aspect-[4/3] w-full object-cover">${alt ? `<figcaption class="mt-2 text-sm ${MUTED}">${escapeHtml(alt)}</figcaption>` : ""}</figure>`).join("");
    return `<div ${attr} class="flex flex-col gap-10">${heroFigure}${restCells ? `<div class="grid gap-10 sm:grid-cols-2">${restCells}</div>` : ""}</div>`;
  }
  // grid (default)
  const cells = figures.map(({ source, alt }) => `<figure class="overflow-hidden rounded-[var(--radius)]"><img src="${source}" alt="${escapeHtml(alt)}" loading="lazy" class="aspect-[4/3] w-full object-cover"></figure>`).join("");
  return `<div ${attr} class="grid grid-cols-2 gap-4 sm:grid-cols-3">${cells}</div>`;
}

// ---------------------------------------------------------------------------
// Reseñas
// ---------------------------------------------------------------------------

function stars(rating: unknown) {
  return `<div class="text-[var(--accent)] tracking-wide" aria-label="${escapeHtml(rating || 5)} de 5 estrellas">★★★★★</div>`;
}

function testimonialsHtml(variant: string, reviews: Record<string, unknown>[], attr: string) {
  if (!reviews.length) return "";
  const card = (review: Record<string, unknown>) => `<figure class="flex flex-col rounded-[var(--radius)] border border-current/10 bg-current/[0.04] p-6">${stars(review.rating)}<blockquote class="mt-3 line-clamp-3 ${BODY_FONT}">\u201c${escapeHtml(review.quote)}\u201d</blockquote><figcaption class="mt-4 flex flex-col ${HEADING_FONT}"><strong>${escapeHtml(review.name)}</strong>${review.role ? `<span class="text-sm ${MUTED}">${escapeHtml(review.role)}</span>` : ""}</figcaption></figure>`;

  if (variant === "quotes") {
    const items = reviews.map((review) => `<figure class="mx-auto max-w-[60ch] text-center"><blockquote class="${HEADING_FONT} text-[clamp(1.4rem,2.6vw,2rem)] font-medium leading-snug">\u201c${escapeHtml(review.quote)}\u201d</blockquote><figcaption class="mt-5 flex flex-col items-center gap-1"><span class="${HEADING_FONT} font-semibold">${escapeHtml(review.name)}</span>${review.role ? `<span class="text-sm ${MUTED}">${escapeHtml(review.role)}</span>` : ""}</figcaption></figure>`).join("");
    return `<div ${attr} class="flex flex-col gap-14 sm:gap-20">${items}</div>`;
  }
  if (variant === "featured") {
    const [first, ...rest] = reviews;
    const featured = first ? `<figure class="flex flex-col justify-center rounded-[var(--radius)] border border-[var(--accent)]/30 bg-[var(--accent)]/[0.06] p-8 lg:col-span-7">${stars(first.rating)}<blockquote class="mt-4 ${HEADING_FONT} text-[clamp(1.3rem,2.2vw,1.8rem)] font-medium leading-snug">\u201c${escapeHtml(first.quote)}\u201d</blockquote><figcaption class="mt-5 flex flex-col ${HEADING_FONT}"><strong>${escapeHtml(first.name)}</strong>${first.role ? `<span class="text-sm ${MUTED}">${escapeHtml(first.role)}</span>` : ""}</figcaption></figure>` : "";
    const restCells = rest.slice(0, 3).map((review) => `<figure class="border-b border-current/10 pb-4 last:border-0 last:pb-0">${stars(review.rating)}<blockquote class="mt-2 line-clamp-2 text-sm">\u201c${escapeHtml(review.quote)}\u201d</blockquote><figcaption class="mt-2 text-sm font-semibold">${escapeHtml(review.name)}</figcaption></figure>`).join("");
    return `<div ${attr} class="grid gap-6 lg:grid-cols-12">${featured}<div class="flex flex-col gap-4 lg:col-span-5">${restCells}</div></div>`;
  }
  if (variant === "list") {
    const items = reviews.map((review) => `<figure class="flex items-start gap-4 py-5 first:pt-0 last:pb-0"><span class="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-[var(--accent)] font-[var(--heading)] font-bold text-[var(--on-accent)]">${escapeHtml(String(review.name || "").charAt(0) || "•")}</span><div class="min-w-0">${stars(review.rating)}<blockquote class="mt-1">\u201c${escapeHtml(review.quote)}\u201d</blockquote><figcaption class="mt-1 text-sm font-semibold ${MUTED}">${escapeHtml(review.name)}${review.role ? ` · ${escapeHtml(review.role)}` : ""}</figcaption></div></figure>`).join("");
    return `<div ${attr} class="flex flex-col divide-y divide-current/10">${items}</div>`;
  }
  if (variant === "wall") {
    const items = reviews.map((review) => `<figure class="flex flex-col rounded-[var(--radius)] border border-current/10 p-5">${stars(review.rating)}<blockquote class="mt-2 line-clamp-3 text-sm">\u201c${escapeHtml(review.quote)}\u201d</blockquote><figcaption class="mt-3 text-sm font-semibold">${escapeHtml(review.name)}</figcaption></figure>`).join("");
    return `<div ${attr} class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">${items}</div>`;
  }
  // cards (default)
  return `<div ${attr} class="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">${reviews.map(card).join("")}</div>`;
}

// ---------------------------------------------------------------------------
// Acordeón (FAQ)
// ---------------------------------------------------------------------------

function accordionHtml(variant: string, faqs: Record<string, unknown>[], attr: string) {
  if (!faqs.length) return "";
  if (variant === "cards") {
    const items = faqs.map((faq) => `<details class="group rounded-[var(--radius)] bg-current/[0.05] p-5 open:bg-current/10"><summary class="flex cursor-pointer list-none items-center justify-between gap-4 font-[var(--heading)] font-semibold"><span>${escapeHtml(faq.question)}</span><span class="shrink-0 text-xl leading-none text-[var(--accent)] group-open:hidden">+</span><span class="hidden shrink-0 text-xl leading-none text-[var(--accent)] group-open:inline">−</span></summary><p class="mt-3 ${MUTED}">${escapeHtml(faq.answer)}</p></details>`).join("");
    return `<div ${attr} class="mx-auto flex max-w-[900px] flex-col gap-3">${items}</div>`;
  }
  if (variant === "minimal") {
    const items = faqs.map((faq) => `<details class="group py-6 first:pt-0 last:pb-0"><summary class="flex cursor-pointer list-none items-center justify-between gap-6 ${HEADING_FONT} text-lg font-medium"><span>${escapeHtml(faq.question)}</span><span class="shrink-0 text-2xl font-light leading-none ${MUTED} transition group-open:rotate-45">+</span></summary><p class="mt-3 max-w-[65ch] ${MUTED}">${escapeHtml(faq.answer)}</p></details>`).join("");
    return `<div ${attr} class="mx-auto flex max-w-[820px] flex-col divide-y divide-current/10">${items}</div>`;
  }
  // lines (default)
  const items = faqs.map((faq) => `<details class="border-b border-current/12 py-5 first:pt-0 last:border-0 last:pb-0"><summary class="cursor-pointer list-none font-[var(--heading)] font-bold">${escapeHtml(faq.question)}</summary><p class="mt-3 ${MUTED}">${escapeHtml(faq.answer)}</p></details>`).join("");
  return `<div ${attr} class="mx-auto flex max-w-[900px] flex-col">${items}</div>`;
}

// ---------------------------------------------------------------------------
// Encabezado — el widget "brand" define la variante de todo el header
// (se detecta a nivel de sección, ver headerChromeClasses()).
// ---------------------------------------------------------------------------

function headerChromeClasses(variant: string) {
  switch (variant) {
    case "floating":
      return "sticky top-4 z-30 mx-auto mt-4 w-[min(1100px,94%)] rounded-[999px] border border-current/10 bg-[var(--bg)]/90 shadow-lg backdrop-blur";
    case "overlay":
      return "absolute inset-x-0 top-0 z-30 bg-transparent text-white";
    case "bordered":
      return "sticky top-0 z-30 border-b-2 border-current/15 bg-[var(--bg)]";
    case "pill":
      return "sticky top-4 z-30 mx-auto mt-4 w-[min(760px,92%)] rounded-[999px] bg-[var(--secondary)] px-3 py-2 text-[var(--footer-text)] shadow-lg";
    case "hvac":
      return "sticky top-0 z-30 border-b border-current/10 bg-[var(--bg)]";
    default: // bar / minimal
      return "sticky top-0 z-30 border-b border-current/10 bg-[var(--bg)]/95 backdrop-blur";
  }
}

function brandHtml(attr: string, variant: string, name: string, logo: string) {
  const isPill = variant === "pill";
  const isHvac = variant === "hvac";
  const isFooterWordmark = variant === "hvac-footer";
  if (isFooterWordmark) {
    return `<span ${attr} class="mt-10 block ${HEADING_FONT} text-[clamp(3.5rem,9vw,8rem)] font-normal leading-none tracking-[-0.05em] opacity-10">${escapeHtml(name)}</span>`;
  }
  const wrap = isPill
    ? "inline-flex items-center gap-2 rounded-full bg-[var(--accent)] px-4 py-1.5"
    : "inline-flex items-center gap-3";
  const logoImg = logo ? `<img src="${escapeHtml(logo)}" alt="" loading="eager" class="h-8 w-8 object-contain">` : "";
  const nameCls = isPill ? "text-sm font-bold text-[var(--on-accent)]" : isHvac ? "text-xl font-semibold tracking-[-0.03em]" : "text-lg font-bold";
  const hvacMark = isHvac ? `<span class="grid h-6 w-6 -rotate-12 place-items-center rounded-full bg-[var(--accent)] text-base font-black leading-none text-white">≋</span>` : "";
  return `<a ${attr} href="#top" class="${wrap} ${HEADING_FONT} no-underline">${hvacMark}${logoImg}<strong class="${nameCls}">${escapeHtml(name)}</strong></a>`;
}

function navHtml(attr: string, items: Record<string, unknown>[]) {
  const links = items.map((item) => {
    const href = safeUrl(item.href) || "#contact";
    return `<a href="${escapeHtml(href)}" class="whitespace-nowrap text-sm no-underline opacity-90 hover:opacity-100 hover:text-[var(--accent)]">${escapeHtml(item.label)}</a>`;
  }).join("");
  return `<nav ${attr} class="relative flex items-center justify-end" aria-label="Navegación principal">
<button class="v2-nav-toggle relative z-10 flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-md lg:hidden" type="button" aria-label="Abrir menú" aria-expanded="false"><span class="block h-0.5 w-6 rounded bg-current"></span><span class="block h-0.5 w-6 rounded bg-current"></span><span class="block h-0.5 w-6 rounded bg-current"></span></button>
<div class="v2-nav-links hidden flex-wrap items-center justify-end gap-6 lg:flex">${links}</div>
</nav>`;
}

// ---------------------------------------------------------------------------
// Formularios
// ---------------------------------------------------------------------------

const FORM_INPUT = "min-h-[46px] w-full rounded-[calc(var(--radius)/2)] border border-[var(--text)]/25 bg-[var(--bg)] px-3 py-2 text-[var(--text)] focus:border-[var(--accent)] focus:outline focus:outline-[3px] focus:outline-[var(--accent)]/40";
const FORM_LABEL = "flex flex-col gap-1.5 text-sm font-semibold";

function formHtml(attr: string, variant: string, anchorId: string, title: string, body: string, buttonText: string, leadEndpoint: string) {
  const wrapClass = variant === "dark"
    ? "rounded-[var(--radius)] border border-white/15 bg-black/20 p-6 sm:p-8"
    : variant === "inline"
      ? ""
      : "rounded-[var(--radius)] border border-current/15 bg-current/[0.04] p-6 sm:p-8";
  const gridClass = variant === "split" || variant === "inline" ? "grid gap-4 sm:grid-cols-2" : "grid gap-4 sm:grid-cols-2";
  return `<div ${attr} id="${escapeHtml(anchorId)}" class="${wrapClass}">
${title ? `<h2 class="${H2} text-[clamp(1.6rem,3vw,2.4rem)]">${escapeHtml(title)}</h2>` : ""}
${body ? `<p class="mt-2 ${BODY_P}">${escapeHtml(body)}</p>` : ""}
<form data-cluster-form data-endpoint="${escapeHtml(leadEndpoint)}" class="${gridClass} ${title || body ? "mt-6" : ""}">
<label class="${FORM_LABEL}">Nombre<input class="${FORM_INPUT}" name="name" required maxlength="120" autocomplete="name"></label>
<label class="${FORM_LABEL}">Email<input class="${FORM_INPUT}" name="email" type="email" maxlength="160" autocomplete="email"></label>
<label class="${FORM_LABEL}">Teléfono<input class="${FORM_INPUT}" name="phone" type="tel" maxlength="40" autocomplete="tel"></label>
<label class="${FORM_LABEL} sm:col-span-2">Mensaje<textarea class="${FORM_INPUT} min-h-[130px]" name="message" required maxlength="2000"></textarea></label>
<input class="hidden" name="website" tabindex="-1" autocomplete="off">
<button class="${BUTTON_BASE} ${BUTTON_VARIANT.solid} sm:col-span-2" type="submit">${escapeHtml(buttonText)}</button>
<output class="sm:col-span-2 text-sm ${MUTED}" aria-live="polite"></output>
</form>
</div>`;
}

function widgetHtml(widget: WidgetV2, content: SiteContentV2, theme: ThemeTokensV2, leadEndpoint: string, editable = false): string {
  const value = valueFor(widget, content);
  const inlineEditable = editable && (widget.type === "heading" || widget.type === "text" || widget.type === "button");
  const attr = `data-widget-id="${escapeHtml(widget.id)}" data-widget-type="${widget.type}"${inlineEditable ? ' data-editable-text="1"' : ""}`;
  const emptyClass = "grid min-h-[120px] place-items-center rounded-[var(--radius)] border border-dashed border-[var(--text)]/40 p-4 text-[var(--muted)] opacity-70";
  switch (widget.type) {
    case "brand":
      return brandHtml(attr, widget.variant || "bar", String(value || content.business.name), safeUrl(content.business.logo));
    case "nav": {
      const items = Array.isArray(widget.data?.items) ? widget.data.items as Record<string, unknown>[] : [];
      return navHtml(attr, items);
    }
    case "heading": {
      const level = widget.variant === "h1" ? "h1" : widget.variant === "h3" ? "h3" : "h2";
      const cls = headingClasses(level, theme);
      if (!String(value || "").trim()) return editable ? `<${level} ${attr} class="${emptyClass}">Escribe un título</${level}>` : "";
      return `<${level} ${attr} class="${cls}">${escapeHtml(value)}</${level}>`;
    }
    case "text":
      return String(value || "").trim() ? `<p ${attr} class="${BODY_P}">${escapeHtml(value)}</p>` : editable ? `<p ${attr} class="${emptyClass}">Escribe un texto</p>` : "";
    case "image": {
      const source = safeUrl(value);
      const variant = widget.variant || "cover";
      if (variant === "background") {
        if (!source) return editable ? `<div ${attr} class="${emptyClass} absolute inset-0">Agrega una imagen</div>` : "";
        return `<img ${attr} src="${escapeHtml(source)}" alt="${escapeHtml(widget.data?.alt as string || content.business.name)}" loading="eager" class="v2-media-bg absolute inset-0 -z-10 h-full w-full object-cover">`;
      }
      if (!source) return editable ? `<div ${attr} class="${emptyClass}">Agrega una imagen</div>` : "";
      return `<img ${attr} class="${IMAGE_VARIANT[variant] ?? IMAGE_VARIANT.cover}" src="${escapeHtml(source)}" alt="${escapeHtml(widget.data?.alt as string || content.business.name)}" loading="lazy">`;
    }
    case "video": {
      const source = safeUrl(value);
      const background = widget.variant === "background";
      if (!source) return editable ? `<div ${attr} class="${emptyClass}${background ? " absolute inset-0" : ""}">Agrega un video</div>` : "";
      const youtube = source.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{6,20})/i)?.[1];
      const bgClass = background ? "v2-media-bg absolute inset-0 -z-10 h-full w-full" : "aspect-video w-full rounded-[var(--radius)] bg-[#09090b]";
      if (youtube) return `<iframe ${attr} class="${bgClass} border-0" src="https://www.youtube-nocookie.com/embed/${escapeHtml(youtube)}${background ? "?autoplay=1&mute=1&loop=1&controls=0" : ""}" title="Video" loading="lazy" allowfullscreen></iframe>`;
      if (!/\.(?:mp4|webm)(?:$|[?#])/i.test(source)) return `<img ${attr} class="${background ? "v2-media-bg absolute inset-0 -z-10 h-full w-full object-cover" : IMAGE_VARIANT.cover}" src="${escapeHtml(source)}" alt="${escapeHtml(content.business.name)}" loading="lazy">`;
      return `<video ${attr} class="${bgClass} object-cover" src="${escapeHtml(source)}" ${background ? "autoplay muted loop playsinline" : "controls"} preload="metadata"></video>`;
    }
    case "button": {
      const linkSlot = widget.data?.linkSlot;
      const linked = typeof linkSlot === "string" ? resolveContentSlot(content, linkSlot as never) : widget.data?.link;
      return buttonHtml(attr, widget.variant || "solid", safeUrl(linked) || "#contact", String(value || "Contactar"));
    }
    case "business_info": {
      const rows = [
        content.business.phone ? `<a class="w-max no-underline hover:text-[var(--accent)]" href="tel:${escapeHtml(content.business.phone)}">${escapeHtml(content.business.phone)}</a>` : "",
        content.business.email ? `<a class="w-max no-underline hover:text-[var(--accent)]" href="mailto:${escapeHtml(content.business.email)}">${escapeHtml(content.business.email)}</a>` : "",
        content.business.location ? `<span>${escapeHtml(content.business.location)}</span>` : "",
      ].join("");
      return `<address ${attr} class="not-italic flex flex-col gap-2"><strong class="${HEADING_FONT}">${escapeHtml(content.business.name)}</strong>${rows}</address>`;
    }
    case "list": {
      const items = Array.isArray(value) ? value as Record<string, unknown>[] : [];
      if (!items.length) return editable ? `<div ${attr} class="${emptyClass}">Agrega elementos a esta lista</div>` : "";
      const variant = widget.variant || "cards";
      return `<div ${attr} class="${LIST_WRAP[variant] ?? LIST_WRAP.cards}">${items.map((item, i) => listItemHtml(variant, item, i)).join("")}</div>`;
    }
    case "gallery": {
      const items = Array.isArray(value) ? value as Record<string, unknown>[] : [];
      const html = galleryHtml(widget.variant || "grid", items, attr);
      if (!html) return editable ? `<div ${attr} class="${emptyClass}">Agrega imágenes a la galería</div>` : "";
      return html;
    }
    case "testimonials": {
      const reviews = Array.isArray(value) ? value as Record<string, unknown>[] : [];
      const html = testimonialsHtml(widget.variant || "cards", reviews, attr);
      if (!html) return editable ? `<div ${attr} class="${emptyClass}">Agrega reseñas</div>` : "";
      return html;
    }
    case "accordion": {
      const faqs = Array.isArray(value) ? value as Record<string, unknown>[] : [];
      const html = accordionHtml(widget.variant || "lines", faqs, attr);
      if (!html) return editable ? `<div ${attr} class="${emptyClass}">Agrega preguntas frecuentes</div>` : "";
      return html;
    }
    case "form": {
      const titleSlot = typeof widget.data?.titleSlot === "string" ? widget.data.titleSlot : "";
      const bodySlot = typeof widget.data?.bodySlot === "string" ? widget.data.bodySlot : "";
      const buttonSlot = typeof widget.data?.buttonSlot === "string" ? widget.data.buttonSlot : "contact.ctaText";
      const anchorId = String(widget.data?.anchorId || "contact").replace(/[^a-zA-Z0-9_-]/g, "") || "contact";
      const title = titleSlot ? String(resolveContentSlot(content, titleSlot as never) || "") : "";
      const body = bodySlot ? String(resolveContentSlot(content, bodySlot as never) || "") : "";
      const buttonText = String(resolveContentSlot(content, buttonSlot as never) || "Enviar mensaje");
      return formHtml(attr, widget.variant || "card", anchorId, title, body, buttonText, leadEndpoint);
    }
    case "social": {
      const links = value && typeof value === "object" ? Object.entries(value as Record<string, unknown>) : [];
      if (!links.some(([, href]) => safeUrl(href))) return editable ? `<nav ${attr} class="${emptyClass}">Agrega tus redes sociales</nav>` : "";
      return `<nav ${attr} class="flex flex-wrap gap-4" aria-label="Redes sociales">${links.map(([label, href]) => { const safe = safeUrl(href); return safe ? `<a href="${escapeHtml(safe)}" target="_blank" rel="noreferrer" class="text-sm underline-offset-4 hover:underline">${escapeHtml(label)}</a>` : ""; }).join("")}</nav>`;
    }
    case "map": {
      const location = String(value || content.business.location);
      if (!location.trim()) return editable ? `<div ${attr} class="${emptyClass}">Agrega la ubicación</div>` : "";
      const query = encodeURIComponent(location);
      return `<div ${attr} class="grid overflow-hidden rounded-[var(--radius)] bg-current/[0.05]"><iframe class="min-h-[280px] w-full border-0" title="Mapa de ${escapeHtml(content.business.name)}" src="https://maps.google.com/maps?q=${query}&output=embed" loading="lazy" referrerpolicy="no-referrer-when-downgrade"></iframe><a class="flex flex-col gap-1 p-5 no-underline hover:bg-current/[0.04]" href="https://www.google.com/maps/search/?api=1&query=${query}" target="_blank" rel="noreferrer"><span class="text-sm ${MUTED}">Ubicación</span><strong>${escapeHtml(location)}</strong><small class="${MUTED}">Abrir en Google Maps ↗</small></a></div>`;
    }
    case "hero_pixel": {
      const title = String(widget.data?.title || "").trim() || content.hero.title || content.business.name || "Tu negocio";
      const words = title.split(/\s+/);
      const word1 = String(widget.data?.word1 || "").trim() || words[0] || "";
      const word2 = String(widget.data?.word2 || "").trim() || words.slice(1).join(" ");
      const description = String(widget.data?.description || "").trim() || content.hero.subtitle || content.hero.body;
      const ctaText = String(widget.data?.ctaText || "").trim() || content.hero.ctaText || "Contactar";
      const ctaLink = safeUrl(widget.data?.ctaLink) || safeUrl(content.hero.ctaLink) || "#contact";
      const secondaryText = String(widget.data?.secondaryText || "").trim();
      const secondaryLink = safeUrl(widget.data?.secondaryLink) || "#contact";
      const marqueeLabel = String(widget.data?.marqueeLabel ?? "").trim() || "Con la confianza de";
      const marqueeItems = (Array.isArray(widget.data?.marqueeItems) ? widget.data.marqueeItems : []).map((item) => String(item ?? "").trim()).filter(Boolean).slice(0, 12);
      const marqueeGroup = `<div class="flex items-center gap-12">${marqueeItems.map((item) => `<span class="whitespace-nowrap ${HEADING_FONT} text-base font-bold opacity-60">${escapeHtml(item)}</span>`).join("")}</div>`;
      const marquee = marqueeItems.length ? `<div class="mt-auto flex flex-col gap-4"><span class="text-[.72rem] font-semibold uppercase tracking-[0.12em] opacity-65">${escapeHtml(marqueeLabel)}</span><div class="v2-scroll-fade mx-auto w-[min(64rem,100%)] overflow-hidden"><div class="v2-pxh-track flex w-max gap-12 py-2">${marqueeGroup}<div class="flex items-center gap-12" aria-hidden="true">${marqueeItems.map((item) => `<span class="whitespace-nowrap ${HEADING_FONT} text-base font-bold opacity-60">${escapeHtml(item)}</span>`).join("")}</div></div></div></div>` : "";
      const colors = [theme.muted, theme.muted, theme.muted, theme.muted, theme.accent].join(",");
      return `<div ${attr} class="relative isolate flex min-h-[min(94dvh,880px)] w-screen -mx-[50vw] left-1/2 flex-col justify-center gap-8 overflow-hidden bg-[var(--secondary)] px-5 py-16 text-center text-[var(--footer-text)] sm:px-8"><canvas class="absolute inset-0 -z-20 h-full w-full" data-pixel-hero data-colors="${escapeHtml(colors)}" aria-hidden="true"></canvas><div class="absolute inset-0 -z-10" style="background:radial-gradient(circle at center,transparent 0%,var(--secondary) 100%);opacity:.8" aria-hidden="true"></div><div class="mx-auto my-auto flex flex-col items-center gap-6"><h1 class="v2-pxh-title flex max-w-none flex-wrap justify-center gap-x-3 text-[clamp(2.8rem,8vw,7rem)] leading-none">${word1 ? `<em class="font-serif italic font-medium">${escapeHtml(word1)}</em>` : ""}${word2 ? `<strong class="${HEADING_FONT} font-black tracking-[-0.045em]">${escapeHtml(word2)}</strong>` : ""}</h1>${description ? `<p class="mx-auto max-w-[42rem] text-[clamp(1rem,1.6vw,1.25rem)] font-light opacity-85">${escapeHtml(description)}</p>` : ""}<div class="flex flex-wrap justify-center gap-3">${buttonHtml("", "solid", ctaLink, ctaText)}${secondaryText ? buttonHtml("", "outline", secondaryLink, secondaryText) : ""}</div></div>${marquee}</div>`;
    }
    case "divider":
      return `<hr ${attr} class="border-current/12">`;
    case "spacer": {
      const size = String(widget.data?.size || "md");
      const height = size === "sm" ? "h-4" : size === "lg" ? "h-20" : "h-10";
      return `<div ${attr} aria-hidden class="${height}"></div>`;
    }
    case "embed": {
      const code = typeof widget.data?.html === "string" ? widget.data.html.slice(0, 8000) : "";
      if (!code.trim()) return editable ? `<div ${attr} class="${emptyClass}">Agrega tu código insertado</div>` : "";
      const height = Math.max(60, Math.min(1200, Number(widget.data?.height) || 300));
      // Sandbox sin allow-same-origin: el código pegado no puede leer cookies ni tocar el resto del sitio.
      return `<iframe ${attr} class="w-full rounded-[var(--radius)] border-0 bg-white" style="height:${height}px" sandbox="allow-scripts allow-popups" loading="lazy" title="Contenido insertado" srcdoc="${escapeHtml(code)}"></iframe>`;
    }
  }
}

const SPAN_CLASS: Record<number, string> = { 1: "1", 2: "2", 3: "3", 4: "4", 5: "5", 6: "6", 7: "7", 8: "8", 9: "9", 10: "10", 11: "11", 12: "12" };
function columnSpanClasses(span: CanvasColumnV2["span"]) {
  return `col-span-12 md:col-span-${SPAN_CLASS[span.tablet]} lg:col-span-${SPAN_CLASS[span.desktop]}`;
}

function columnHasBackgroundMedia(column: CanvasColumnV2) {
  return column.widgets.some((widget) => (widget.type === "image" || widget.type === "video") && widget.variant === "background");
}

function columnHtml(column: CanvasColumnV2, content: SiteContentV2, theme: ThemeTokensV2, leadEndpoint: string, editable: boolean, sectionRegion: CanvasSectionV2["region"]) {
  const widgets = column.widgets.map((widget) => widgetHtml(widget, content, theme, leadEndpoint, editable)).join("");
  if (!widgets && !editable) return "";
  const span = columnSpanClasses(column.span);
  const hasBg = columnHasBackgroundMedia(column);
  const isHeaderColumn = sectionRegion === "header";
  const layoutClasses = hasBg
    ? "relative isolate flex min-h-[clamp(560px,78dvh,820px)] flex-col justify-center overflow-hidden px-6 py-16 text-white sm:px-10 sm:py-20"
    : isHeaderColumn
      ? "flex min-w-0 flex-col justify-center gap-2"
      : "flex min-w-0 flex-col gap-5";
  const scrim = hasBg ? `<div class="pointer-events-none absolute inset-0 -z-10 bg-black/55"></div>` : "";
  return `<div class="${span} ${layoutClasses}" data-column-id="${escapeHtml(column.id)}">${scrim}${widgets}</div>`;
}

function sectionHtml(section: CanvasSectionV2, content: SiteContentV2, theme: ThemeTokensV2, leadEndpoint: string, editable = false, mainIndex = 0) {
  const rows = section.rows.map((row) => {
    const columns = row.columns.map((column) => columnHtml(column, content, theme, leadEndpoint, editable, section.region)).join("");
    if (!columns && !editable) return "";
    const isHeaderRow = section.region === "header";
    const rowClass = isHeaderRow
      ? "grid grid-cols-12 items-center gap-4"
      : "grid grid-cols-12 items-center gap-6 sm:gap-8 lg:gap-10";
    return `<div class="${rowClass}" data-row-id="${escapeHtml(row.id)}">${columns}</div>`;
  }).join("");
  if (!rows && !editable) return "";
  const key = section.key.replace(/[^a-zA-Z0-9_-]/g, "");

  const isHeader = section.region === "header";
  const brandWidget = isHeader ? section.rows.flatMap((r) => r.columns).flatMap((c) => c.widgets).find((w) => w.type === "brand") : undefined;
  const chrome = isHeader ? headerChromeClasses(brandWidget?.variant || "bar") : "";
  const padding = isHeader ? "px-5 py-3 sm:px-8" : "px-5 py-16 sm:px-8 sm:py-20 lg:py-28";
  const containerWidth = isHeader ? "max-w-wide" : "max-w-wide";
  const innerClass = `mx-auto w-full ${containerWidth}`;

  const reveal = section.region === "main" && !editable ? ` v2-reveal` : "";
  const revealStyle = section.region === "main" && !editable ? ` style="--reveal-index:${mainIndex}"` : "";
  return `<section id="${escapeHtml(section.key)}" class="v2-section v2-region-${section.region} relative ${padding} ${chrome} v2-key-${key}${reveal}" data-section-id="${escapeHtml(section.id)}"${revealStyle}><div class="${innerClass}">${rows}</div></section>`;
}

function dynamicCss(sections: CanvasSectionV2[]) {
  return sections.map((section) => {
    const sectionRule = responsiveCss(`[data-section-id="${section.id.replace(/[^a-zA-Z0-9_-]/g, "")}"]`, section.style);
    const children = section.rows.flatMap((row) => [responsiveCss(`[data-row-id="${row.id.replace(/[^a-zA-Z0-9_-]/g, "")}"]`, row.style), ...row.columns.flatMap((column) => [responsiveCss(`[data-column-id="${column.id.replace(/[^a-zA-Z0-9_-]/g, "")}"]`, column.style), ...column.widgets.map((widget) => responsiveCss(widgetSelector(widget), widget.style))])]);
    return sectionRule + children.join("");
  }).join("");
}

function baseCss(theme: ThemeTokensV2) {
  const radius = RADIUS[theme.radius];
  const buttonText = readableText(theme.accent);
  const footerText = readableText(theme.secondary);
  const grammar = getDesignLanguagePack(theme.language).grammar;
  const themeVars = `:root{--primary:${theme.primary};--secondary:${theme.secondary};--accent:${theme.accent};--button-text:${buttonText};--footer-text:${footerText};--bg:${theme.background};--text:${theme.text};--muted:${theme.muted};--on-primary:${readableText(theme.primary)};--on-secondary:${footerText};--on-accent:${buttonText};--on-background:${theme.text};--on-text:${readableText(theme.text)};--on-muted:${readableText(theme.muted)};--radius:${radius};--heading:${theme.headingFont};--body:${theme.bodyFont};--language-content:${grammar.contentWidth};--language-rule:${grammar.ruleWidth};--language-heading-tracking:${grammar.headingTracking};--language-heading-leading:${grammar.headingLineHeight};--language-body-leading:${grammar.bodyLineHeight};--language-nav-tracking:${grammar.navTracking}}
html{scroll-behavior:smooth}
body{margin:0;overflow-x:hidden;background:var(--bg)}
.v2-region-footer{margin-top:auto;background:var(--secondary)!important;color:var(--footer-text)!important}
.v2-region-footer a{color:inherit}
[data-widget-type="nav"].v2-nav-open .v2-nav-links{position:absolute;left:0;right:0;top:100%;z-index:40;display:flex!important;flex-direction:column;align-items:stretch;gap:0;padding:.4rem 1.1rem 1rem;background:var(--bg);color:var(--text);border-bottom:1px solid color-mix(in srgb,var(--text) 14%,transparent);box-shadow:0 24px 48px #00000026}
[data-widget-type="nav"].v2-nav-open .v2-nav-links a{padding:.9rem .15rem;font-size:1rem;border-bottom:1px solid color-mix(in srgb,var(--text) 8%,transparent)}
[data-widget-type="nav"].v2-nav-open .v2-nav-links a:last-child{border-bottom:0}`;
  const languageCss = `
[data-design-language] .v2-section>div{max-width:var(--language-content)}
[data-design-language] [data-widget-type="heading"]{letter-spacing:var(--language-heading-tracking);line-height:var(--language-heading-leading)}
[data-design-language] [data-widget-type="text"]{line-height:var(--language-body-leading)}
[data-design-language] [data-widget-type="nav"] a{letter-spacing:var(--language-nav-tracking)}
[data-design-language="bauhaus"] .v2-region-main+.v2-region-main{border-top:var(--language-rule) solid color-mix(in srgb,var(--text) 88%,transparent)}
[data-design-language="bauhaus"] [data-widget-type="button"],[data-design-language="bauhaus"] [data-widget-type="form"] button{text-transform:uppercase;letter-spacing:.08em;border:2px solid currentColor;box-shadow:4px 4px 0 color-mix(in srgb,var(--text) 82%,transparent)}
[data-design-language="bauhaus"] [data-widget-type="nav"] a{text-transform:uppercase;font-weight:700}
[data-design-language="bauhaus"] [data-widget-type="list"]>article{border:2px solid currentColor;padding:1.25rem;box-shadow:6px 6px 0 color-mix(in srgb,var(--accent) 72%,transparent)}
[data-design-language="bauhaus"] [data-widget-type="image"]:not(.v2-media-bg){outline:2px solid currentColor;outline-offset:-2px;filter:saturate(.9) contrast(1.08)}
[data-design-language="swiss"] .v2-region-main+.v2-region-main{border-top:var(--language-rule) solid color-mix(in srgb,var(--text) 18%,transparent)}
[data-design-language="swiss"] [data-widget-type="nav"] a{text-transform:uppercase;font-size:.75rem;font-weight:700}
[data-design-language="swiss"] [data-widget-type="list"]>article{border-color:color-mix(in srgb,currentColor 18%,transparent)}
[data-design-language="editorial"] .v2-region-main+.v2-region-main{border-top:var(--language-rule) solid color-mix(in srgb,var(--text) 14%,transparent)}
[data-design-language="editorial"] [data-widget-type="heading"]{font-weight:600;max-width:18ch}
[data-design-language="editorial"] [data-widget-type="text"]{max-width:58ch}
[data-design-language="editorial"] [data-widget-type="list"]>article{border-top:1px solid color-mix(in srgb,currentColor 18%,transparent);padding-top:1.25rem}
[data-design-language="editorial"] [data-widget-type="testimonials"] blockquote{font-family:var(--heading);font-size:1.2em;line-height:1.45}
[data-design-language="editorial"] [data-widget-type="button"]{font-weight:600;letter-spacing:.025em}
[data-design-language="editorial"] [data-widget-type="image"]:not(.v2-media-bg){filter:saturate(.82) contrast(1.04)}
@media(max-width:640px){[data-design-language="bauhaus"] [data-widget-type="list"]>article{box-shadow:4px 4px 0 color-mix(in srgb,var(--accent) 65%,transparent)}}`;
  return `${themeVars}\n${V2_TAILWIND_CSS}\n${languageCss}`;
}

// Recorte de seguridad: si un valor arbitrario del usuario (padding XL, ancho
// fijo, etc.) igual empuja contenido fuera del viewport en móvil, esto evita
// el scroll horizontal como última red — Tailwind ya previene la mayoría de
// los casos, esto es un backstop, no el mecanismo principal.
const mobileSafetyCss = `@media(max-width:640px){h1,h2,h3,p,a,span{overflow-wrap:break-word}}`;

// Recursos que solo se inyectan cuando el sitio se renderiza dentro del editor (iframe del builder).
const editorCss = `[data-widget-id],[data-column-id],[data-section-id]{cursor:pointer}
.v2-ed-hover{outline:1px dashed #8b5cf6;outline-offset:2px}
.v2-ed-selected{outline:2px solid #7c3aed!important;outline-offset:2px;position:relative}
.v2-ed-selected[data-v2-label]::before{content:attr(data-v2-label);position:absolute;top:-1.45rem;left:-2px;z-index:999;background:#7c3aed;color:#fff;font:600 .65rem/1 system-ui,sans-serif;padding:.28rem .5rem;border-radius:.25rem .25rem 0 0;white-space:nowrap;pointer-events:none}
[data-editable-text="1"][contenteditable="true"]{cursor:text;outline:2px solid #7c3aed!important;outline-offset:3px;caret-color:#7c3aed}
.v2-ed-drop-line{position:absolute;height:4px;background:#7c3aed;border-radius:2px;z-index:9999;pointer-events:none;display:none}
.v2-ed-drop-target{outline:2px dashed #7c3aed!important;outline-offset:2px}`;

function editorScript() {
  const labels = `{brand:'Marca',nav:'Navegaci\\u00f3n',heading:'T\\u00edtulo',text:'Texto',image:'Imagen',video:'Video',button:'Bot\\u00f3n',business_info:'Datos del negocio',list:'Lista',gallery:'Galer\\u00eda',testimonials:'Rese\\u00f1as',accordion:'Acorde\\u00f3n',form:'Formulario',social:'Redes',map:'Mapa',divider:'Divisor',spacer:'Espacio',embed:'C\\u00f3digo insertado',hero_pixel:'Portada animada'}`;
  return `(function(){
var LABELS=${labels};
var editing=null;var editingOriginal='';
document.querySelectorAll('[data-widget-type]').forEach(function(node){node.setAttribute('data-v2-label',LABELS[node.getAttribute('data-widget-type')]||'Elemento');});
function pick(target){if(!(target instanceof Element))return null;return target.closest('[data-widget-id]')||target.closest('[data-column-id]')||target.closest('[data-section-id]');}
function kindOf(node){return node.hasAttribute('data-widget-id')?'widget':node.hasAttribute('data-column-id')?'column':'section';}
function idOf(node){return node.getAttribute('data-widget-id')||node.getAttribute('data-column-id')||node.getAttribute('data-section-id');}
function select(node){document.querySelectorAll('.v2-ed-selected').forEach(function(item){item.classList.remove('v2-ed-selected');});if(node)node.classList.add('v2-ed-selected');}
function finishEditing(){if(!editing)return;var node=editing;editing=null;node.removeAttribute('contenteditable');parent.postMessage({source:'cluster-canvas',kind:'edit-text',id:idOf(node),value:node.innerText},'*');}
function cancelEditing(){if(!editing)return;var node=editing;editing=null;node.innerText=editingOriginal;node.removeAttribute('contenteditable');node.blur();}
document.addEventListener('dblclick',function(event){var target=event.target instanceof Element?event.target.closest('[data-editable-text="1"]'):null;if(!target)return;event.preventDefault();event.stopPropagation();if(editing&&editing!==target)finishEditing();editing=target;editingOriginal=target.innerText;select(target);target.setAttribute('contenteditable','true');target.focus();var range=document.createRange();range.selectNodeContents(target);var selection=window.getSelection();selection.removeAllRanges();selection.addRange(range);parent.postMessage({source:'cluster-canvas',kind:'widget',id:idOf(target)},'*');},true);
document.addEventListener('blur',function(event){if(editing&&event.target===editing)finishEditing();},true);
document.addEventListener('keydown',function(event){if(!editing)return;if(event.key==='Escape'){event.preventDefault();cancelEditing();}else if(event.key==='Enter'&&!event.shiftKey&&editing.getAttribute('data-widget-type')!=='text'){event.preventDefault();editing.blur();}},true);
document.addEventListener('mouseover',function(event){if(editing)return;var target=pick(event.target);document.querySelectorAll('.v2-ed-hover').forEach(function(item){item.classList.remove('v2-ed-hover');});if(target&&!target.classList.contains('v2-ed-selected'))target.classList.add('v2-ed-hover');});
document.addEventListener('click',function(event){if(editing)return;if(event.target instanceof Element&&event.target.closest('.v2-nav-toggle'))return;event.preventDefault();event.stopPropagation();var target=pick(event.target);if(!target)return;select(target);parent.postMessage({source:'cluster-canvas',kind:kindOf(target),id:idOf(target)},'*');},true);
document.addEventListener('submit',function(event){event.preventDefault();event.stopPropagation();},true);
var dropLine=document.createElement('div');dropLine.className='v2-ed-drop-line';document.body.appendChild(dropLine);
function dragKind(event){var types=event.dataTransfer?Array.prototype.slice.call(event.dataTransfer.types):[];if(types.indexOf('application/x-cluster-widget')>=0)return 'widget';if(types.indexOf('application/x-cluster-section')>=0)return 'section';return null;}
function clearDrop(){dropLine.style.display='none';document.querySelectorAll('.v2-ed-drop-target').forEach(function(node){node.classList.remove('v2-ed-drop-target');});}
function placeLine(x,y,width){dropLine.style.display='block';dropLine.style.left=(x+window.scrollX)+'px';dropLine.style.top=(y+window.scrollY-2)+'px';dropLine.style.width=width+'px';}
function columnFor(event){var column=event.target instanceof Element?event.target.closest('[data-column-id]'):null;if(column)return column;var section=event.target instanceof Element?event.target.closest('[data-section-id]'):null;return section?section.querySelector('[data-column-id]'):null;}
function widgetInsertion(column,y){var widgets=Array.prototype.slice.call(column.querySelectorAll('[data-widget-id]'));var index=widgets.length;for(var i=0;i<widgets.length;i++){var rect=widgets[i].getBoundingClientRect();if(y<rect.top+rect.height/2){index=i;break;}}return {index:index,widgets:widgets};}
document.addEventListener('dragover',function(event){var kind=dragKind(event);if(!kind)return;event.preventDefault();event.dataTransfer.dropEffect='copy';clearDrop();
if(kind==='widget'){var column=columnFor(event);if(!column)return;column.classList.add('v2-ed-drop-target');var info=widgetInsertion(column,event.clientY);var rect;if(!info.widgets.length){rect=column.getBoundingClientRect();placeLine(rect.left,rect.top+6,rect.width);}else if(info.index<info.widgets.length){rect=info.widgets[info.index].getBoundingClientRect();placeLine(rect.left,rect.top-4,rect.width);}else{rect=info.widgets[info.widgets.length-1].getBoundingClientRect();placeLine(rect.left,rect.bottom+4,rect.width);}}
else{var section=event.target instanceof Element?event.target.closest('[data-section-id]'):null;if(!section)return;var bounds=section.getBoundingClientRect();var before=event.clientY<bounds.top+bounds.height/2;placeLine(bounds.left,before?bounds.top:bounds.bottom,bounds.width);}});
document.addEventListener('drop',function(event){var kind=dragKind(event);if(!kind)return;event.preventDefault();
if(kind==='widget'){var column=columnFor(event);if(column){var info=widgetInsertion(column,event.clientY);parent.postMessage({source:'cluster-canvas',kind:'drop-widget',widgetType:event.dataTransfer.getData('application/x-cluster-widget'),columnId:column.getAttribute('data-column-id'),index:info.index},'*');}}
else{var section=event.target instanceof Element?event.target.closest('[data-section-id]'):null;var payload={source:'cluster-canvas',kind:'drop-section',sectionKey:event.dataTransfer.getData('application/x-cluster-section')};if(section){var bounds=section.getBoundingClientRect();payload.targetSectionId=section.getAttribute('data-section-id');payload.position=event.clientY<bounds.top+bounds.height/2?'before':'after';}parent.postMessage(payload,'*');}
clearDrop();});
document.addEventListener('dragleave',function(event){if(!event.relatedTarget)clearDrop();});
document.addEventListener('keydown',function(event){if(editing&&(event.key==='Enter'||event.key==='Escape')){event.preventDefault();editing.blur();return;}
if(event.key==='Delete'&&!editing){var selected=document.querySelector('.v2-ed-selected');if(selected){event.preventDefault();var targetKind=selected.hasAttribute('data-row-id')?'row':kindOf(selected);parent.postMessage({source:'cluster-canvas',kind:'delete-element',targetKind:targetKind,id:selected.getAttribute('data-row-id')||idOf(selected)},'*');}return;}
if(!(event.ctrlKey||event.metaKey))return;var key=event.key.toLowerCase();if(key!=='z'&&key!=='y')return;event.preventDefault();parent.postMessage({source:'cluster-canvas',kind:(key==='y'||event.shiftKey)?'redo':'undo'},'*');});
document.addEventListener('contextmenu',function(event){if(editing){event.preventDefault();return;}var target=pick(event.target);if(!target)return;event.preventDefault();select(target);parent.postMessage({source:'cluster-canvas',kind:'context',targetKind:kindOf(target),id:idOf(target),x:event.clientX,y:event.clientY},'*');});
window.addEventListener('message',function(event){var data=event.data||{};if(data.source!=='cluster-editor')return;
if(data.type==='clear-drop')return clearDrop();
if(data.type!=='select')return;if(!data.id)return select(null);var node=document.querySelector('[data-widget-id="'+data.id+'"],[data-column-id="'+data.id+'"],[data-section-id="'+data.id+'"],[data-row-id="'+data.id+'"]');select(node);if(node&&data.scroll)node.scrollIntoView({block:'center',behavior:'smooth'});});
parent.postMessage({source:'cluster-canvas',kind:'ready'},'*');
})();`;
}

// Arrastre con el mouse para las galerías en tira: sin esto solo se puede
// desplazar con trackpad o Shift+rueda y la tira parece estática.
function galleryScript() {
  return `document.querySelectorAll('.v2-gallery-filmstrip').forEach(function(strip){
var down=false,startX=0,startLeft=0,moved=false;
strip.addEventListener('pointerdown',function(event){down=true;moved=false;startX=event.clientX;startLeft=strip.scrollLeft;});
strip.addEventListener('pointermove',function(event){if(!down)return;var dx=event.clientX-startX;if(Math.abs(dx)>4&&!moved){moved=true;strip.classList.add('v2-dragging');try{strip.setPointerCapture(event.pointerId);}catch(error){}}if(moved)strip.scrollLeft=startLeft-dx;});
function release(){if(!down)return;down=false;strip.classList.remove('v2-dragging');}
strip.addEventListener('pointerup',release);strip.addEventListener('pointercancel',release);strip.addEventListener('pointerleave',release);
strip.addEventListener('click',function(event){if(moved){event.preventDefault();event.stopPropagation();moved=false;}},true);
});`;
}

// Menú móvil del header: abre y cierra la lista de enlaces bajo el encabezado.
function navScript() {
  return `document.querySelectorAll('.v2-nav-toggle').forEach(function(toggle){toggle.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();var nav=toggle.closest('nav');if(!nav)return;var open=nav.classList.toggle('v2-nav-open');toggle.setAttribute('aria-expanded',open?'true':'false');});});
function closeMenus(except){document.querySelectorAll('nav.v2-nav-open').forEach(function(nav){if(nav===except)return;nav.classList.remove('v2-nav-open');var toggle=nav.querySelector('.v2-nav-toggle');if(toggle)toggle.setAttribute('aria-expanded','false');});}
document.addEventListener('click',function(event){var target=event.target instanceof Element?event.target:null;if(target&&target.closest('.v2-nav-links a'))return closeMenus(null);var inside=target?target.closest('nav.v2-nav-open'):null;closeMenus(inside);});
document.addEventListener('keydown',function(event){if(event.key==='Escape')closeMenus(null);});`;
}

function formScript() {
  return `document.querySelectorAll('[data-cluster-form]').forEach(form=>form.addEventListener('submit',async event=>{event.preventDefault();const output=form.querySelector('output');const button=form.querySelector('button');button.disabled=true;output.textContent='Enviando…';try{const response=await fetch(form.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'No se pudo enviar.');form.reset();output.textContent='Mensaje enviado correctamente.'}catch(error){output.textContent=error.message||'No se pudo enviar.'}finally{button.disabled=false}}));`;
}

// Revelado de secciones al entrar en viewport. Una sola vez por sección (se
// deja de observar tras revelarla); sin esto el motion del tema (subtle/
// stagger/cinematic) no tiene ningún efecto visible pese a estar definido.
function revealScript() {
  return `(function(){
if(window.matchMedia('(prefers-reduced-motion: reduce)').matches)return;
var targets=document.querySelectorAll('.v2-reveal');
if(!targets.length)return;
if(!('IntersectionObserver' in window)){targets.forEach(function(el){el.classList.add('v2-in');});return;}
var io=new IntersectionObserver(function(entries){entries.forEach(function(entry){if(entry.isIntersecting){entry.target.classList.add('v2-in');io.unobserve(entry.target);}});},{threshold:.15,rootMargin:'0px 0px -8% 0px'});
targets.forEach(function(el){io.observe(el);});
})();`;
}

// Motor de puntos del hero animado (puerto vanilla del efecto de canvas):
// cada punto crece con un retraso proporcional a su distancia al centro y
// luego titila. Respeta prefers-reduced-motion dejando el campo estático.
function pixelHeroScript() {
  return `(function(){
var reduced=window.matchMedia('(prefers-reduced-motion: reduce)').matches;
function rand(min,max){return Math.random()*(max-min)+min}
document.querySelectorAll('[data-pixel-hero]').forEach(function(canvas){
var ctx=canvas.getContext('2d');if(!ctx)return;
var colors=(canvas.getAttribute('data-colors')||'#94a3b8').split(',');
var gap=6,pixels=[],raf=0,last=0;
function build(){
var host=canvas.parentElement;if(!host)return;
var rect=host.getBoundingClientRect();var w=Math.floor(rect.width),h=Math.floor(rect.height);
if(!w||!h)return;canvas.width=w;canvas.height=h;
var speed=reduced?0:.03;pixels=[];
for(var x=0;x<w;x+=gap)for(var y=0;y<h;y+=gap){
var dx=x-w/2,dy=y-h/2;
pixels.push({x:x,y:y,color:colors[Math.floor(Math.random()*colors.length)],speed:rand(.08,.4)*speed,size:0,sizeStep:rand(.12,.28),minSize:.5,maxSize:rand(.5,2),delay:reduced?0:Math.sqrt(dx*dx+dy*dy)*.65,counter:0,counterStep:rand(1.8,3.2)+(w+h)*.008,reverse:false,twinkle:false});}}
function step(p){
if(p.counter<=p.delay){p.counter+=p.counterStep;return false}
if(p.size>=p.maxSize)p.twinkle=true;
if(p.twinkle){if(p.size>=p.maxSize)p.reverse=true;else if(p.size<=p.minSize)p.reverse=false;p.size+=p.reverse?-p.speed:p.speed}
else p.size+=p.sizeStep;
var offset=1-p.size*.5;
ctx.fillStyle=p.color;ctx.fillRect(p.x+offset,p.y+offset,p.size,p.size);
return p.twinkle||p.size>=p.maxSize}
function loop(now){
raf=requestAnimationFrame(loop);
if(now-last<1000/60)return;last=now;
ctx.clearRect(0,0,canvas.width,canvas.height);
var done=true;
for(var i=0;i<pixels.length;i++){if(!step(pixels[i]))done=false;}
if(done&&reduced)cancelAnimationFrame(raf);}
function start(){build();cancelAnimationFrame(raf);raf=requestAnimationFrame(loop);}
start();
if(window.ResizeObserver&&canvas.parentElement)new ResizeObserver(function(){start();}).observe(canvas.parentElement);
});
})();`;
}

export function renderSiteV2(input: RenderSiteV2Input): RenderedSiteV2 {
  const content = normalizeSiteContentV2(input.content);
  const theme = normalizeThemeV2(input.design);
  const sections = normalizeCanvasSectionsV2(input.sections).sort((left, right) => {
    const rank = { header: 0, main: 1, footer: 2 } as const;
    return rank[left.region] - rank[right.region];
  });
  const title = content.seo.title || content.business.name || "Sitio web";
  const description = content.seo.description || [content.business.name, content.business.type].filter(Boolean).join(" - ");
  const canonical = safeUrl(input.publicUrl);
  const socialImage = socialImageFor(content, input.socialImage);
  const indexable = Boolean(input.indexable && canonical);
  const logo = safeUrl(content.business.logo);
  const structuredData = indexable ? {
    "@context": "https://schema.org",
    "@type": content.business.location || content.business.phone ? "LocalBusiness" : "Organization",
    name: content.business.name,
    description,
    url: canonical,
    ...(content.business.phone ? { telephone: content.business.phone } : {}),
    ...(content.business.email ? { email: content.business.email } : {}),
    ...(content.business.location ? { address: { "@type": "PostalAddress", streetAddress: content.business.location } } : {}),
    ...(logo ? { logo } : {}),
    ...(socialImage ? { image: socialImage } : {}),
    ...(Object.values(content.social).filter((url) => safeUrl(url)).length ? { sameAs: Object.values(content.social).map(safeUrl).filter(Boolean) } : {}),
  } : null;
  const structuredDataHtml = structuredData ? `<script type="application/ld+json">${JSON.stringify(structuredData).replace(/</g, "\\u003c")}</script>` : "";
  let mainCounter = 0;
  const body = `<div id="top" data-design-language="${theme.language}" class="v2-motion-${theme.motion} flex min-h-dvh flex-col bg-[var(--bg)] text-[var(--text)]" style="font-family:var(--body)">${sections.map((section) => sectionHtml(section, content, theme, input.leadEndpoint, input.editable, section.region === "main" ? mainCounter++ : 0)).join("")}${input.showBranding ? `<div class="p-4 text-center text-xs text-[var(--muted)]">Creado con Cluster</div>` : ""}</div>${structuredDataHtml}`;
  const css = `${baseCss(theme)}${dynamicCss(sections)}${mobileSafetyCss}${input.editable ? editorCss : ""}`;
  const hasPixelHero = sections.some((section) => section.rows.some((row) => row.columns.some((column) => column.widgets.some((widget) => widget.type === "hero_pixel"))));
  const script = `${formScript()}${navScript()}${galleryScript()}${input.editable ? "" : revealScript()}${hasPixelHero ? pixelHeroScript() : ""}${input.editable ? editorScript() : ""}`;
  const head = [
    `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`,
    fontLinksFor(theme),
    `<title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}">`,
    `<meta name="robots" content="${indexable ? "index,follow" : "noindex,nofollow"}">`,
    canonical && `<link rel="canonical" href="${escapeHtml(canonical)}">`,
    logo && `<link rel="icon" href="${escapeHtml(logo)}">`,
    `<meta property="og:title" content="${escapeHtml(title)}"><meta property="og:description" content="${escapeHtml(description)}"><meta property="og:type" content="website"><meta property="og:site_name" content="${escapeHtml(content.business.name)}"><meta property="og:locale" content="es_ES">`,
    canonical && `<meta property="og:url" content="${escapeHtml(canonical)}">`,
    socialImage && `<meta property="og:image" content="${escapeHtml(socialImage)}">`,
    `<meta name="twitter:card" content="summary_large_image"><meta name="twitter:title" content="${escapeHtml(title)}"><meta name="twitter:description" content="${escapeHtml(description)}">`,
    socialImage && `<meta name="twitter:image" content="${escapeHtml(socialImage)}">`,
    `<style>${css}</style>`,
  ].filter(Boolean).join("");
  const html = `<!doctype html><html lang="es"><head>${head}</head><body>${body}<script>${script}</script></body></html>`;
  return { html, head, body, css, script };
}
