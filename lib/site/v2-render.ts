import { sanitizeLink } from "@/lib/site/links";
import { getDesignLanguagePack } from "@/lib/site/design-languages";
import { iconSvg, resolveIconName } from "@/lib/site/v2-icons";
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
  "Barlow Condensed": "500;600;700;800;900", Archivo: "400;500;600;700;800;900",
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
const H1 = `${HEADING_FONT} max-w-[16ch] text-balance text-[clamp(2.75rem,5.2vw,5.25rem)] font-bold leading-[1.02] tracking-[-0.035em]`;
const H2 = `${HEADING_FONT} max-w-[22ch] text-balance text-[clamp(2rem,3.7vw,3.5rem)] font-bold leading-[1.06] tracking-[-0.025em]`;
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
  checks: "grid gap-3 sm:grid-cols-2",
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
    case "checks": {
      // El icono se deduce del propio punto, para que seis compromisos no
      // repitan seis veces la misma palomita.
      const glyph = iconSvg(resolveIconName(`${item.title ?? ""} ${item.description ?? ""}`), 16);
      return `<article class="flex items-start gap-2.5 rounded-[var(--radius)] border border-current/12 bg-current/[0.05] px-3.5 py-3"><span class="grid h-7 w-7 shrink-0 place-items-center rounded-full bg-[var(--accent)] text-[var(--on-accent)]">${glyph}</span><span class="min-w-0"><span class="block ${HEADING_FONT} text-sm font-semibold">${title}</span>${desc ? `<span class="mt-0.5 block text-xs ${MUTED}">${desc}</span>` : ""}</span></article>`;
    }
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

  // Comparador antes/despues. Las fotos se toman de dos en dos de la galería:
  // la primera de cada par es el antes y la segunda el después, que es como el
  // contratista las sube. Una foto suelta al final se descarta en vez de
  // quedar emparejada con nada.
  // Portada entera como comparador: el visitante arrastra y la pantalla
  // completa pasa del antes al despues. El texto vive encima, sobre un velo
  // que lo mantiene legible sea cual sea la foto que quede debajo.
  if (variant === "before-after-hero") {
    const [before, after] = figures;
    if (!after) return "";
    const chip = "absolute top-5 z-10 rounded-full px-3.5 py-1.5 text-[.64rem] font-bold uppercase tracking-[.16em] backdrop-blur sm:top-8";
    return `<div ${attr} class="v2-ba v2-ba-hero pointer-events-none absolute inset-0">
<img src="${after.source}" alt="${escapeHtml(after.alt)}" loading="eager" class="absolute inset-0 -z-10 h-full w-full object-cover">
<img src="${before.source}" alt="${escapeHtml(before.alt)}" loading="eager" class="v2-ba-before absolute inset-0 -z-10 h-full w-full object-cover">
<span class="absolute inset-0 -z-10 bg-gradient-to-r from-black/90 via-black/55 to-black/20"></span>
<span class="absolute inset-0 -z-10 bg-gradient-to-t from-black/70 via-transparent to-transparent"></span>
<span class="${chip} left-5 bg-black/60 text-white sm:left-8">Antes</span>
<span class="${chip} right-5 bg-[var(--accent)]/90 text-[var(--on-accent)] sm:right-8">Después</span>
<input type="range" min="0" max="100" value="58" class="v2-ba-range pointer-events-auto absolute inset-0 z-20 h-full w-full" aria-label="Arrastrar para comparar el antes y el después de la portada">
<span class="v2-ba-line pointer-events-none absolute inset-y-0 z-10 -ml-px w-0.5 bg-white/90 shadow-[0_0_18px_rgba(0,0,0,.45)]"><span class="v2-ba-grip absolute top-1/2 left-1/2 grid h-14 w-14 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-lg font-black tracking-[-.1em] text-black shadow-[0_10px_30px_rgba(0,0,0,.35)]">&#8249;&#8250;</span></span>
</div>`;
  }
  if (variant === "before-after" || variant === "before-after-single") {
    const pairs = figures.reduce<Array<[typeof figures[number], typeof figures[number]]>>((all, figure, index) => {
      if (index % 2 === 1) all.push([figures[index - 1], figure]);
      return all;
    }, []);
    if (!pairs.length) return "";
    const shown = variant === "before-after-single" ? pairs.slice(0, 1) : pairs;
    const chip = "absolute top-3 z-10 rounded-full px-3 py-1 text-[.62rem] font-bold uppercase tracking-[.14em]";
    const cards = shown.map(([before, after], index) => `<figure class="v2-ba relative isolate overflow-hidden rounded-[var(--radius)]">
<img src="${after.source}" alt="${escapeHtml(after.alt)}" loading="${index ? "lazy" : "eager"}" class="block aspect-[4/3] w-full object-cover">
<img src="${before.source}" alt="${escapeHtml(before.alt)}" loading="${index ? "lazy" : "eager"}" class="v2-ba-before absolute inset-0 h-full w-full object-cover">
<span class="${chip} left-3 bg-black/70 text-white">Antes</span>
<span class="${chip} right-3 bg-[var(--accent)] text-[var(--on-accent)]">Después</span>
<input type="range" min="0" max="100" value="50" class="v2-ba-range absolute inset-0 z-20 h-full w-full" aria-label="Comparar antes y después: ${escapeHtml(after.alt || `transformación ${index + 1}`)}">
<span class="v2-ba-line pointer-events-none absolute inset-y-0 z-10 -ml-px w-0.5 bg-white shadow-[0_0_0_1px_rgba(0,0,0,.25)]"><span class="v2-ba-grip absolute top-1/2 left-1/2 grid h-10 w-10 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-white text-sm font-black text-black shadow-lg">&#8942;</span></span>
</figure>`).join("");
    if (variant === "before-after-single") return `<div ${attr}>${cards}</div>`;
    return `<div ${attr} class="grid gap-5 sm:grid-cols-2">${cards}</div>`;
  }
  // Fondo de portada: las imágenes se apilan a sangre completa y se recorren
  // con la miniatura de la siguiente y dos flechas. Agregar una imagen a la
  // galería agrega una diapositiva; no hay lista de medios aparte.
  if (variant === "hero-backdrop") {
    const slides = figures.map(({ source, alt }, index) =>
      `<img src="${source}" alt="${escapeHtml(alt)}" loading="${index ? "lazy" : "eager"}" class="v2-hero-slide${index ? "" : " v2-hero-on"} absolute inset-0 -z-10 h-full w-full object-cover">`).join("");
    const veil = `<span class="absolute inset-0 -z-10 bg-gradient-to-r from-black/85 via-black/60 to-black/25"></span>`;
    const round = "grid h-11 w-11 place-items-center rounded-full border border-white/45 bg-black/35 text-lg leading-none text-white backdrop-blur transition hover:border-white hover:bg-black/55";
    // Una miniatura por imagen: se ve cuántas hay y se salta directo a
    // cualquiera. Al agregar una imagen a la galería aparece su miniatura.
    const thumbs = figures.map(({ source, alt }, index) =>
      `<button type="button" data-hero-go="${index}" class="v2-hero-thumb${index ? "" : " v2-hero-thumb-on"} block h-14 w-20 shrink-0 overflow-hidden border-2 p-0 sm:h-16 sm:w-24" aria-label="Ver imagen ${index + 1}${alt ? `: ${escapeHtml(alt)}` : ""}"><img src="${source}" alt="" loading="lazy" class="h-full w-full object-cover"></button>`).join("");
    // Los mandos son lo único interactivo: el envoltorio es inerte para no
    // robarle los clics al titular ni a los botones, que quedan por encima.
    const controls = figures.length > 1
      ? `<div class="pointer-events-auto absolute bottom-6 right-5 z-10 flex flex-col items-end gap-3 sm:bottom-9 sm:right-9">
<div class="v2-hero-thumbs v2-scroll-hide flex max-w-[17rem] gap-2 overflow-x-auto sm:max-w-[26rem]">${thumbs}</div>
<div class="flex items-center gap-2"><button type="button" data-hero-step="-1" class="${round}" aria-label="Imagen anterior">&#8249;</button><button type="button" data-hero-step="1" class="${round}" aria-label="Imagen siguiente">&#8250;</button></div>
</div>`
      : "";
    return `<div ${attr} class="v2-hero-backdrop pointer-events-none absolute inset-0">${slides}${veil}${controls}</div>`;
  }
  // Par superpuesto para la sección de nosotros: la segunda foto pisa a la
  // primera y sobresale por arriba y por abajo. Con una sola imagen se
  // degrada a una foto suelta en vez de fingir una composición.
  if (variant === "about-stack") {
    const [first, second] = figures;
    const cover = (figure: { source: string; alt: string }) =>
      `<img src="${figure.source}" alt="${escapeHtml(figure.alt)}" loading="lazy" class="h-full w-full object-cover">`;
    if (!second) {
      return `<div ${attr} class="v2-about-stack relative aspect-[4/3] w-full md:aspect-[4/5]"><figure class="absolute inset-0 overflow-hidden rounded-[var(--radius)]">${cover(first)}</figure></div>`;
    }
    // La caja marca la altura y las dos fotos se posicionan dentro: la de atrás
    // queda recogida arriba y abajo, la de adelante la pisa y la desborda.
    return `<div ${attr} class="v2-about-stack relative aspect-[4/3] w-full md:aspect-[4/5]">
<figure class="absolute inset-y-[9%] left-0 w-[62%] overflow-hidden rounded-[var(--radius)]">${cover(first)}</figure>
<figure class="absolute inset-y-0 right-0 z-10 w-[56%] overflow-hidden rounded-[var(--radius)] shadow-2xl ring-8 ring-[var(--bg)]">${cover(second)}</figure>
</div>`;
  }
  if (variant === "filmstrip") {
    const cells = figures.map(({ source, alt }, index) => `<figure class="min-w-[78%] shrink-0 snap-start overflow-hidden rounded-[var(--radius)] sm:min-w-[46%] lg:min-w-[31%]"><img src="${source}" alt="${escapeHtml(alt)}" loading="lazy" class="h-[clamp(220px,26vw,360px)] w-full object-cover">${alt ? `<figcaption class="flex items-start justify-between gap-5 pt-3 text-sm ${MUTED}"><span>${escapeHtml(alt)}</span><span class="font-mono text-xs">${String(index + 1).padStart(2, "0")}</span></figcaption>` : ""}</figure>`).join("");
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

function navHtml(attr: string, items: Record<string, unknown>[], content: SiteContentV2) {
  const links = items.map((item) => {
    const href = safeUrl(item.href) || "#contact";
    return `<a href="${escapeHtml(href)}" class="inline-flex min-h-11 items-center whitespace-nowrap text-sm no-underline opacity-90 hover:opacity-100 hover:text-[var(--accent)]">${escapeHtml(item.label)}</a>`;
  }).join("");
  const phone = content.business.phone.trim();
  const phoneLink = phone
    ? `<a href="tel:${escapeHtml(phone)}" class="v2-nav-extra v2-nav-phone hidden min-h-11 items-center whitespace-nowrap text-sm font-bold no-underline">${escapeHtml(phone)}</a>`
    : "";
  const ctaLabel = content.hero.ctaText.trim();
  const ctaLink = safeUrl(content.hero.ctaLink) || "#contact";
  const cta = ctaLabel
    ? `<a href="${escapeHtml(ctaLink)}" class="v2-nav-extra v2-nav-cta hidden min-h-11 items-center justify-center whitespace-nowrap px-4 py-2 text-sm font-black no-underline">${escapeHtml(ctaLabel)}</a>`
    : "";
  return `<nav ${attr} class="flex items-center justify-end" aria-label="Navegación principal">
<button class="v2-nav-toggle relative z-10 flex h-11 w-11 flex-col items-center justify-center gap-[5px] rounded-md lg:hidden" type="button" aria-label="Abrir menú" aria-expanded="false"><span class="block h-0.5 w-6 rounded bg-current"></span><span class="block h-0.5 w-6 rounded bg-current"></span><span class="block h-0.5 w-6 rounded bg-current"></span></button>
<div class="v2-nav-links hidden flex-wrap items-center justify-end gap-6 lg:flex">${links}${phoneLink}${cta}</div>
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
  // El slot viaja al DOM para que las reglas de lenguaje apunten al contenido
  // ("este párrafo es el subtítulo") en vez de a su posición entre hermanos,
  // que cambia en cuanto un dato del negocio llega vacío.
  const attr = `data-widget-id="${escapeHtml(widget.id)}" data-widget-type="${widget.type}"${widget.slot ? ` data-widget-slot="${widget.slot}"` : ""}${inlineEditable ? ' data-editable-text="1"' : ""}`;
  const emptyClass = "grid min-h-[120px] place-items-center rounded-[var(--radius)] border border-dashed border-[var(--text)]/40 p-4 text-[var(--muted)] opacity-70";
  switch (widget.type) {
    case "brand":
      return brandHtml(attr, widget.variant || "bar", String(value || content.business.name), safeUrl(content.business.logo));
    case "nav": {
      const items = Array.isArray(widget.data?.items) ? widget.data.items as Record<string, unknown>[] : [];
      return navHtml(attr, items, content);
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
  const hasBg = columnHasBackgroundMedia(column);
  const isHeaderColumn = sectionRegion === "header";
  const span = isHeaderColumn ? "" : columnSpanClasses(column.span);
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
      ? "grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4"
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

// El ancho de una SECCIÓN limita su contenido, nunca su caja: aplicarlo al
// elemento recorta el fondo en una franja centrada y deja el color flotando
// con márgenes a los lados. Quién manda sobre el ancho de lectura es la
// gramática del lenguaje (--language-content) y el contenedor interior.
// En filas, columnas y widgets el token sigue funcionando igual.
function sectionBoxStyle(style?: ResponsiveStyleV2): ResponsiveStyleV2 | undefined {
  if (!style) return style;
  const withoutWidth = (tokens?: StyleTokensV2) => {
    if (!tokens || tokens.width === undefined) return tokens;
    const { width: _ignored, ...rest } = tokens;
    return rest;
  };
  return { desktop: withoutWidth(style.desktop), tablet: withoutWidth(style.tablet), mobile: withoutWidth(style.mobile) };
}

function dynamicCss(sections: CanvasSectionV2[]) {
  return sections.map((section) => {
    const sectionRule = responsiveCss(`[data-section-id="${section.id.replace(/[^a-zA-Z0-9_-]/g, "")}"]`, sectionBoxStyle(section.style));
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
*,*::before,*::after{box-sizing:border-box}
html{scroll-behavior:smooth;background:var(--bg)}
body{margin:0;overflow-x:hidden;background:var(--bg);color:var(--text);text-rendering:optimizeLegibility}
img{display:block}
::selection{background:var(--accent);color:var(--on-accent)}
.v2-section{isolation:isolate}
.v2-region-header{position:sticky;top:0;z-index:30;background:var(--bg);box-shadow:0 1px 0 color-mix(in srgb,var(--text) 12%,transparent)}
.v2-region-footer{margin-top:auto;background:var(--secondary)!important;color:var(--footer-text)!important}
.v2-region-footer a{color:inherit}
[data-widget-type="nav"].v2-nav-open .v2-nav-links{position:absolute;left:0;right:0;top:100%;z-index:40;display:flex!important;flex-direction:column;align-items:stretch;gap:0;padding:.4rem 1.1rem 1rem;background:var(--bg);color:var(--text);border-bottom:1px solid color-mix(in srgb,var(--text) 14%,transparent);box-shadow:0 24px 48px #00000026}
[data-widget-type="nav"].v2-nav-open .v2-nav-links a{padding:.9rem .15rem;font-size:1rem;border-bottom:1px solid color-mix(in srgb,var(--text) 8%,transparent)}
[data-widget-type="nav"].v2-nav-open .v2-nav-links a:last-child{border-bottom:0}`;
  const languageCss = `
[data-design-language] .v2-section>div{max-width:var(--language-content)}
[data-design-language] [data-widget-type="heading"]{font-family:var(--heading);letter-spacing:var(--language-heading-tracking);line-height:var(--language-heading-leading)}
[data-design-language] [data-widget-type="brand"] strong,[data-design-language] [data-widget-type="list"] h3,[data-design-language] [data-widget-type="testimonials"] blockquote{font-family:var(--heading)}
[data-design-language] [data-widget-type="text"]{line-height:var(--language-body-leading)}
[data-design-language] [data-widget-type="nav"] a{letter-spacing:var(--language-nav-tracking)}
[data-design-language] .v2-key-library-hero-split-image-v2{min-height:min(46rem,calc(100svh - 4.5rem));display:grid;align-items:center}
[data-design-language] .v2-key-library-hero-split-image-v2 [data-widget-type="text"]{max-width:46ch}
[data-design-language] .v2-key-library-hero-split-image-v2 [data-widget-type="image"]{height:clamp(25rem,54svh,36rem);aspect-ratio:auto}
[data-design-language] .v2-key-library-hero-background-image-v2 [data-column-id]{min-height:min(46rem,calc(100svh - 4.5rem))}
/* Portada de emergencia: el fondo se ancla a la sección (no a la columna), así
   la imagen llega a los bordes mientras el texto sigue el ancho de lectura.
   El bloque es full-bleed por definición, en cualquier lenguaje. */
[data-design-language] .v2-key-library-hero-emergency-v2{overflow:hidden}
[data-design-language] .v2-key-library-hero-emergency-v2>div{max-width:none}
[data-design-language] .v2-key-library-hero-emergency-v2 [data-column-id]{min-height:min(48rem,calc(100svh - 4.5rem));padding-inline:max(1.5rem,calc((100% - var(--language-content))/2 + 1.5rem))}
[data-design-language] .v2-key-library-hero-emergency-v2 [data-widget-type="text"]{max-width:46ch}
/* La banda de emergencia usa fondo "accent": el botón sólido también es accent
   y se perdería sobre ella en cualquier lenguaje que la use. */
[data-design-language] .v2-key-library-emergency-band-v2 [data-widget-type="button"]{background:var(--secondary);border-color:var(--secondary);color:var(--footer-text)}

/* Bauhaus: cartel funcional, geometría visible y contraste material. */
[data-design-language="bauhaus"] .v2-region-header{border-bottom:3px solid var(--text);box-shadow:none}
[data-design-language="bauhaus"] .v2-region-header>div{max-width:var(--language-content);padding-block:.1rem}
[data-design-language="bauhaus"] .v2-region-header [data-widget-type="brand"]{width:max-content;align-self:flex-start;background:var(--accent);color:var(--on-accent);padding:.72rem 1rem;border:2px solid var(--text);box-shadow:4px 4px 0 var(--text)}
[data-design-language="bauhaus"] [data-widget-type="nav"] a{text-transform:uppercase;font-size:.72rem;font-weight:800}
[data-design-language="bauhaus"] .v2-region-main+.v2-region-main{border-top:3px solid var(--text)}
[data-design-language="bauhaus"] .v2-key-library-hero-split-image-v2{overflow:hidden;background-image:linear-gradient(90deg,color-mix(in srgb,var(--text) 8%,transparent) 1px,transparent 1px),linear-gradient(color-mix(in srgb,var(--text) 8%,transparent) 1px,transparent 1px);background-size:4rem 4rem}
[data-design-language="bauhaus"] .v2-key-library-hero-split-image-v2::before{content:"";position:absolute;width:9rem;height:9rem;border-radius:50%;background:var(--accent);right:38%;top:3rem;z-index:-1}
[data-design-language="bauhaus"] .v2-key-library-hero-split-image-v2::after{content:"";position:absolute;width:3rem;height:14rem;background:var(--text);right:2rem;bottom:0;z-index:-1}
[data-design-language="bauhaus"] .v2-key-library-hero-split-image-v2 h1{max-width:11.5ch;font-size:clamp(3.25rem,6.2vw,5.65rem);line-height:.88}
[data-design-language="bauhaus"] .v2-key-library-hero-split-image-v2 [data-widget-type="text"]:first-child{width:max-content;background:var(--text);color:var(--bg);padding:.42rem .65rem;text-transform:uppercase;font-size:.72rem;font-weight:800;letter-spacing:.12em}
[data-design-language="bauhaus"] .v2-key-library-hero-split-image-v2 [data-widget-type="image"]{border:3px solid var(--text);box-shadow:14px 14px 0 var(--accent);filter:saturate(.72) contrast(1.12)}
[data-design-language="bauhaus"] [data-widget-type="button"],[data-design-language="bauhaus"] [data-widget-type="form"] button{text-transform:uppercase;letter-spacing:.08em;border:2px solid var(--text);box-shadow:5px 5px 0 var(--text);transition:transform .18s ease,box-shadow .18s ease}
[data-design-language="bauhaus"] [data-widget-type="button"]:hover,[data-design-language="bauhaus"] [data-widget-type="form"] button:hover{transform:translate(3px,3px);box-shadow:2px 2px 0 var(--text)}
[data-design-language="bauhaus"] .v2-key-library-about-stats [data-widget-type="list"]>article{border-left:3px solid var(--text);padding-left:1.25rem;text-align:left}
[data-design-language="bauhaus"] .v2-key-library-services-bento [data-widget-type="list"]>article,[data-design-language="bauhaus"] .v2-key-library-services-cards-v2 [data-widget-type="list"]>article{border:2px solid var(--text);background:var(--bg);padding:1.4rem;box-shadow:7px 7px 0 var(--accent)}
[data-design-language="bauhaus"] .v2-key-library-services-bento [data-widget-type="list"]>article:nth-child(2){background:var(--text);color:var(--bg);box-shadow:7px 7px 0 var(--accent)}
[data-design-language="bauhaus"] .v2-key-library-benefits-numbered-v2 [data-widget-type="list"]>article{border-bottom:2px solid var(--text);padding-block:1.25rem}
[data-design-language="bauhaus"] [data-widget-type="image"]:not(.v2-media-bg),[data-design-language="bauhaus"] [data-widget-type="gallery"] figure{border:2px solid var(--text);filter:saturate(.82) contrast(1.08)}
[data-design-language="bauhaus"] .v2-key-library-cta-band{background:var(--secondary)!important;color:var(--footer-text)!important}
[data-design-language="bauhaus"] .v2-key-library-reviews-wall-v2{background:var(--accent)!important;color:var(--on-accent)!important}
[data-design-language="bauhaus"] .v2-key-library-reviews-wall-v2 figure{border:2px solid currentColor;background:transparent}
[data-design-language="bauhaus"] .v2-key-library-faq-cards-v2 details{border:2px solid var(--text);background:transparent}
[data-design-language="bauhaus"] .v2-key-library-contact-split-v2 form,[data-design-language="bauhaus"] .v2-key-library-contact-card form{border:2px solid var(--text);box-shadow:9px 9px 0 var(--accent)}
[data-design-language="bauhaus"] .v2-region-footer{border-top:3px solid var(--text)}

/* Swiss: retícula explícita, alineación rigurosa e información primero. */
[data-design-language="swiss"] .v2-region-header{border-top:5px solid var(--accent);box-shadow:0 1px 0 color-mix(in srgb,var(--text) 22%,transparent)}
[data-design-language="swiss"] .v2-region-header [data-widget-type="brand"] strong{font-size:1rem;letter-spacing:-.02em}
[data-design-language="swiss"] [data-widget-type="nav"] a{text-transform:uppercase;font-size:.7rem;font-weight:700}
[data-design-language="swiss"] .v2-region-main+.v2-region-main{border-top:1px solid color-mix(in srgb,var(--text) 22%,transparent)}
[data-design-language="swiss"] .v2-key-library-hero-split-image-v2{border-bottom:1px solid color-mix(in srgb,var(--text) 22%,transparent)}
[data-design-language="swiss"] .v2-key-library-hero-split-image-v2::before{content:"01 / EVALUACIÓN";position:absolute;top:2rem;left:max(2rem,calc((100% - var(--language-content))/2));font:700 .68rem/1 var(--body);letter-spacing:.13em;color:var(--accent)}
[data-design-language="swiss"] .v2-key-library-hero-split-image-v2 h1{max-width:13ch;font-size:clamp(2.9rem,4.45vw,4.55rem);line-height:.94}
[data-design-language="swiss"] .v2-key-library-hero-split-image-v2 [data-column-id]:first-child{border-left:5px solid var(--accent);padding-left:1.5rem}
[data-design-language="swiss"] .v2-key-library-hero-split-image-v2 [data-widget-type="text"]:first-child{text-transform:uppercase;font-size:.7rem;font-weight:700;letter-spacing:.12em;color:var(--accent)}
[data-design-language="swiss"] .v2-key-library-hero-split-image-v2 [data-widget-type="image"]{filter:saturate(.6) contrast(1.05)}
[data-design-language="swiss"] [data-widget-type="button"]{border-radius:0;padding-inline:1.4rem}
[data-design-language="swiss"] .v2-key-library-about-minimal-v2 [data-column-id]:first-child{align-self:start;padding-top:.4rem;color:var(--accent);font-size:.75rem;text-transform:uppercase;letter-spacing:.12em}
[data-design-language="swiss"] .v2-key-library-services-editorial-v2 [data-widget-type="list"]{grid-template-columns:repeat(3,minmax(0,1fr));gap:0}
[data-design-language="swiss"] .v2-key-library-services-editorial-v2 article{margin:0!important;border-left:1px solid color-mix(in srgb,var(--text) 24%,transparent);padding:1.25rem 1.5rem 2rem}
[data-design-language="swiss"] .v2-key-library-services-editorial-v2 article:first-child{border-left:5px solid var(--accent)}
[data-design-language="swiss"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"]>article{text-align:left;border-top:3px solid var(--text);padding-top:1rem}
[data-design-language="swiss"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"]>article:first-child{border-color:var(--accent)}
[data-design-language="swiss"] .v2-key-library-cta-split-v2,[data-design-language="swiss"] .v2-key-library-cta-band{background:var(--accent)!important;color:var(--on-accent)!important}
[data-design-language="swiss"] .v2-key-library-cta-split-v2 [data-widget-type="button"],[data-design-language="swiss"] .v2-key-library-cta-band [data-widget-type="button"]{background:var(--secondary);color:var(--footer-text)}
[data-design-language="swiss"] .v2-key-library-reviews-quotes figure{display:grid;grid-template-columns:5rem 1fr;text-align:left;max-width:none;border-top:1px solid color-mix(in srgb,var(--text) 22%,transparent);padding-top:1.5rem}
[data-design-language="swiss"] .v2-key-library-reviews-quotes figure::before{content:"\\201C";font:700 5rem/.75 var(--heading);color:var(--accent)}
[data-design-language="swiss"] .v2-key-library-reviews-quotes figure>*{grid-column:2}
[data-design-language="swiss"] .v2-key-library-faq-minimal-v2 details{border-color:color-mix(in srgb,var(--text) 24%,transparent)}
[data-design-language="swiss"] [data-widget-type="form"]{border-radius:0;background:transparent}
[data-design-language="swiss"] [data-widget-type="form"] input,[data-design-language="swiss"] [data-widget-type="form"] textarea{border-radius:0}
[data-design-language="swiss"] [data-widget-type="map"]{border-radius:0;border-top:5px solid var(--accent)}

/* Editorial: contraste tipográfico, respiración y narrativa fotográfica. */
[data-design-language="editorial"] .v2-region-header{padding-block:.35rem;box-shadow:0 1px 0 color-mix(in srgb,var(--text) 16%,transparent)}
[data-design-language="editorial"] .v2-region-header [data-widget-type="brand"] strong{font-family:var(--heading);font-size:1.55rem;font-weight:600;letter-spacing:-.02em}
[data-design-language="editorial"] [data-widget-type="nav"] a{font-size:.78rem}
[data-design-language="editorial"] .v2-region-main+.v2-region-main{border-top:1px solid color-mix(in srgb,var(--text) 14%,transparent)}
[data-design-language="editorial"] [data-widget-type="heading"]{font-weight:600;max-width:18ch}
[data-design-language="editorial"] [data-widget-type="text"]{max-width:58ch}
[data-design-language="editorial"] .v2-key-library-hero-split-image-v2{min-height:min(48rem,calc(100svh - 5rem))}
[data-design-language="editorial"] .v2-key-library-hero-split-image-v2::before{content:"ESTANCIA / 01";position:absolute;top:2.5rem;left:max(2rem,calc((100% - var(--language-content))/2));font:700 .68rem/1 var(--body);letter-spacing:.14em;color:var(--muted)}
[data-design-language="editorial"] .v2-key-library-hero-split-image-v2 h1{max-width:10ch;font-size:clamp(3.25rem,5vw,4.8rem);line-height:.92}
[data-design-language="editorial"] .v2-key-library-hero-split-image-v2 [data-widget-type="text"]:first-child{text-transform:uppercase;font-size:.7rem;font-weight:700;letter-spacing:.14em;color:var(--muted)}
[data-design-language="editorial"] .v2-key-library-hero-split-image-v2 [data-widget-type="image"]{height:clamp(30rem,66svh,40rem);filter:saturate(.78) contrast(1.03)}
[data-design-language="editorial"] [data-widget-type="button"]{border-radius:0;background:var(--secondary);color:var(--footer-text);font-weight:600;letter-spacing:.035em}
[data-design-language="editorial"] .v2-key-library-about-overlap [data-column-id]:last-child{position:relative;z-index:1;margin-left:-5rem;background:var(--bg);padding:3rem;border-top:1px solid var(--text);border-bottom:1px solid var(--text)}
[data-design-language="editorial"] .v2-key-library-about-overlap [data-widget-type="text"]{font-size:1.08rem}
[data-design-language="editorial"] .v2-key-library-services-editorial-v2 [data-widget-type="list"]{grid-template-columns:repeat(3,minmax(0,1fr));gap:2.5rem}
[data-design-language="editorial"] .v2-key-library-services-editorial-v2 article{border-top:1px solid color-mix(in srgb,var(--text) 25%,transparent);padding-top:1.25rem}
[data-design-language="editorial"] .v2-key-library-services-editorial-v2 article:nth-child(2){margin-top:3.5rem}
[data-design-language="editorial"] .v2-key-library-services-editorial-v2 h3{font-family:var(--heading);font-size:1.75rem;font-weight:600}
[data-design-language="editorial"] .v2-gallery-filmstrip{gap:1.25rem;padding-bottom:1rem}
[data-design-language="editorial"] .v2-gallery-filmstrip figure{min-width:62%;overflow:visible}
[data-design-language="editorial"] .v2-gallery-filmstrip figure:nth-child(even){min-width:34%}
[data-design-language="editorial"] .v2-gallery-filmstrip img{height:clamp(22rem,48vw,38rem);filter:saturate(.78) contrast(1.03)}
[data-design-language="editorial"] .v2-gallery-filmstrip figure:nth-child(even) img{height:clamp(18rem,38vw,30rem);margin-top:5rem}
[data-design-language="editorial"] .v2-key-library-benefits-numbered-v2 article{display:grid;grid-template-columns:3.5rem 1fr;border-top:1px solid color-mix(in srgb,var(--text) 20%,transparent);padding-block:1.5rem}
[data-design-language="editorial"] .v2-key-library-cta-card-v2{background:var(--secondary)!important;color:var(--footer-text)!important}
[data-design-language="editorial"] .v2-key-library-cta-card-v2 [data-widget-type="button"]{background:var(--bg);color:var(--text)}
[data-design-language="editorial"] [data-widget-type="testimonials"] blockquote{font-family:var(--heading);font-size:clamp(1.65rem,3vw,2.45rem);line-height:1.22}
[data-design-language="editorial"] .v2-key-library-reviews-quotes figure{text-align:left;margin-inline:0;border-left:1px solid var(--text);padding-left:2rem}
[data-design-language="editorial"] .v2-key-library-faq-minimal-v2 details{border-color:color-mix(in srgb,var(--text) 18%,transparent)}
[data-design-language="editorial"] .v2-key-library-contact-card [data-column-id]:first-child{border-top:1px solid var(--text);padding-top:1.5rem}
[data-design-language="editorial"] .v2-key-library-contact-card form{border-radius:0;border:1px solid color-mix(in srgb,var(--text) 22%,transparent);background:transparent}
[data-design-language="editorial"] .v2-region-footer [data-widget-type="brand"] strong{font-family:var(--heading);font-size:2rem;font-weight:500}

/* Industrial Utility: jerarquía de obra, evidencia visible y acción inmediata. */
[data-design-language="industrial"] .v2-region-header{background:var(--secondary);color:var(--footer-text);border-top:5px solid var(--accent);border-bottom:1px solid color-mix(in srgb,var(--footer-text) 18%,transparent);box-shadow:0 10px 30px #0002}
[data-design-language="industrial"] .v2-region-header>div{max-width:var(--language-content)}
[data-design-language="industrial"] .v2-region-header [data-widget-type="brand"] strong{max-width:15rem;font-size:1.35rem;font-weight:800;line-height:.9;letter-spacing:.01em;text-transform:uppercase}
[data-design-language="industrial"] [data-widget-type="nav"] .v2-nav-links{gap:1.05rem}
[data-design-language="industrial"] [data-widget-type="nav"] a{text-transform:uppercase;font-size:.68rem;font-weight:800}
[data-design-language="industrial"] [data-widget-type="nav"] .v2-nav-extra{display:inline-flex}
[data-design-language="industrial"] [data-widget-type="nav"] .v2-nav-phone{border-left:1px solid color-mix(in srgb,var(--footer-text) 25%,transparent);padding-left:1.05rem;color:var(--footer-text)}
[data-design-language="industrial"] [data-widget-type="nav"] .v2-nav-cta{border:2px solid var(--accent);background:var(--accent);color:var(--on-accent);letter-spacing:.04em}
[data-design-language="industrial"] .v2-key-library-hero-split-image-v2{overflow:hidden;background:var(--secondary)!important;color:var(--footer-text)!important;border-bottom:6px solid var(--accent)}
[data-design-language="industrial"] .v2-key-library-hero-split-image-v2::before{content:"";position:absolute;inset:0;z-index:0;pointer-events:none;background-image:linear-gradient(90deg,color-mix(in srgb,var(--footer-text) 7%,transparent) 1px,transparent 1px),linear-gradient(color-mix(in srgb,var(--footer-text) 7%,transparent) 1px,transparent 1px);background-size:4rem 4rem;mask-image:linear-gradient(90deg,#000,transparent 65%)}
[data-design-language="industrial"] .v2-key-library-hero-split-image-v2>div{position:relative;z-index:1}
[data-design-language="industrial"] .v2-key-library-hero-split-image-v2 h1{max-width:9.5ch;font-size:clamp(3.8rem,6.2vw,6.45rem);font-weight:800;line-height:.84}
[data-design-language="industrial"] .v2-key-library-hero-split-image-v2 [data-widget-type="text"]:first-child{width:max-content;max-width:100%;color:var(--accent);font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.16em}
[data-design-language="industrial"] .v2-key-library-hero-split-image-v2 [data-widget-type="text"]{color:var(--footer-text);opacity:.78}
[data-design-language="industrial"] .v2-key-library-hero-split-image-v2 [data-widget-type="image"]{border:2px solid color-mix(in srgb,var(--footer-text) 24%,transparent);box-shadow:12px 12px 0 var(--accent);filter:saturate(.72) contrast(1.12)}
[data-design-language="industrial"] [data-widget-type="button"],[data-design-language="industrial"] [data-widget-type="form"] button{text-transform:uppercase;letter-spacing:.055em;border:2px solid var(--accent);border-radius:2px}
[data-design-language="industrial"] .v2-key-library-about-stats{border-bottom:2px solid var(--text);background:var(--bg)}
[data-design-language="industrial"] .v2-key-library-about-stats h2{max-width:13ch;font-size:clamp(2.4rem,4vw,4rem)}
[data-design-language="industrial"] .v2-key-library-about-stats [data-widget-type="list"]{gap:0;text-align:left}
[data-design-language="industrial"] .v2-key-library-about-stats [data-widget-type="list"]>article{text-align:left;border-left:3px solid var(--accent);padding:1rem 1.15rem}
[data-design-language="industrial"] .v2-key-library-about-stats [data-widget-type="list"] h3{font-size:clamp(1.65rem,3vw,2.5rem);font-weight:800}
[data-design-language="industrial"] .v2-key-library-services-cards-v2{background:color-mix(in srgb,var(--secondary) 5%,var(--bg));border-bottom:2px solid var(--text)}
[data-design-language="industrial"] .v2-key-library-services-cards-v2 [data-column-id]:first-child{align-self:start;border-top:5px solid var(--accent);padding-top:1.1rem}
[data-design-language="industrial"] .v2-key-library-services-cards-v2 [data-widget-type="list"]{gap:0;border-top:2px solid var(--text);border-left:2px solid var(--text)}
[data-design-language="industrial"] .v2-key-library-services-cards-v2 [data-widget-type="list"]>article{min-height:14rem;border:0;border-right:2px solid var(--text);border-bottom:2px solid var(--text);border-radius:0;background:var(--bg);padding:1.5rem}
[data-design-language="industrial"] .v2-key-library-services-cards-v2 [data-widget-type="list"]>article>span:first-child{color:var(--accent)}
[data-design-language="industrial"] .v2-key-library-services-cards-v2 [data-widget-type="list"] h3{font-size:1.55rem;font-weight:800;text-transform:uppercase}
[data-design-language="industrial"] .v2-key-library-gallery-projects-v2 [data-column-id]:first-child{align-self:start;border-top:5px solid var(--accent);padding-top:1.1rem}
[data-design-language="industrial"] .v2-key-library-gallery-projects-v2 [data-widget-type="gallery"]{gap:.65rem}
[data-design-language="industrial"] .v2-key-library-gallery-projects-v2 figure{border-radius:0;border:1px solid var(--text);background:var(--secondary)}
[data-design-language="industrial"] .v2-key-library-gallery-projects-v2 img{filter:saturate(.78) contrast(1.08)}
[data-design-language="industrial"] .v2-key-library-benefits-metrics-v2{background:var(--secondary)!important;color:var(--footer-text)!important;border-block:6px solid var(--accent)}
[data-design-language="industrial"] .v2-key-library-benefits-metrics-v2 [data-column-id]:first-child{align-self:start}
[data-design-language="industrial"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"]{gap:0;text-align:left}
[data-design-language="industrial"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"]>article{text-align:left;border-top:2px solid color-mix(in srgb,var(--footer-text) 35%,transparent);padding:1.25rem 1rem}
[data-design-language="industrial"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"]>article:first-child{border-top-color:var(--accent)}
[data-design-language="industrial"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"] h3{color:var(--accent);font-size:1.5rem;font-weight:800}
[data-design-language="industrial"] .v2-key-library-reviews-trust-v2{background:color-mix(in srgb,var(--accent) 7%,var(--bg))}
[data-design-language="industrial"] .v2-key-library-reviews-trust-v2 [data-column-id]:first-child{align-self:start;border-top:5px solid var(--accent);padding-top:1.1rem}
[data-design-language="industrial"] .v2-key-library-reviews-trust-v2 figure{border:2px solid var(--text);border-radius:0;background:var(--bg);box-shadow:6px 6px 0 color-mix(in srgb,var(--text) 15%,transparent)}
[data-design-language="industrial"] .v2-key-library-faq-minimal-v2{border-top:2px solid var(--text)}
[data-design-language="industrial"] .v2-key-library-faq-minimal-v2 [data-column-id]:first-child{align-self:start;border-top:5px solid var(--accent);padding-top:1.1rem}
[data-design-language="industrial"] .v2-key-library-faq-minimal-v2 details{border-color:color-mix(in srgb,var(--text) 32%,transparent)}
[data-design-language="industrial"] .v2-key-library-cta-band{background:var(--accent)!important;color:var(--on-accent)!important;border-block:2px solid var(--text)}
[data-design-language="industrial"] .v2-key-library-cta-band h2{max-width:16ch;font-size:clamp(2.5rem,4.5vw,4.6rem)}
[data-design-language="industrial"] .v2-key-library-cta-band [data-widget-type="button"]{background:var(--secondary);border-color:var(--secondary);color:var(--footer-text)}
[data-design-language="industrial"] .v2-key-library-contact-split-v2{background:color-mix(in srgb,var(--secondary) 5%,var(--bg));border-top:2px solid var(--text)}
[data-design-language="industrial"] .v2-key-library-contact-split-v2 [data-column-id]:first-child{align-self:start;border-top:5px solid var(--accent);padding-top:1.1rem}
[data-design-language="industrial"] .v2-key-library-contact-split-v2 [data-widget-type="form"]{border:2px solid var(--text);border-radius:0;background:var(--bg);box-shadow:9px 9px 0 var(--accent)}
[data-design-language="industrial"] .v2-key-library-contact-split-v2 input,[data-design-language="industrial"] .v2-key-library-contact-split-v2 textarea{border-radius:0}
[data-design-language="industrial"] .v2-region-footer{border-top:6px solid var(--accent)}
[data-design-language="industrial"] .v2-region-footer [data-widget-type="brand"] strong{font-size:2.1rem;font-weight:800;text-transform:uppercase}

/* Storm Response: lectura de despacho. Franja de peligro como firma, estado en
   vivo junto al teléfono y datos operativos en retícula tabular. */
[data-design-language="storm"]{--storm-hazard:repeating-linear-gradient(135deg,var(--accent) 0 .85rem,color-mix(in srgb,var(--accent) 25%,transparent) .85rem 1.7rem)}
[data-design-language="storm"] .v2-region-header{background:var(--secondary);color:var(--footer-text);border-bottom:1px solid color-mix(in srgb,var(--footer-text) 16%,transparent);box-shadow:0 12px 32px #00000026}
[data-design-language="storm"] .v2-region-header::before{content:"";position:absolute;inset:0 0 auto;height:.4rem;background:var(--storm-hazard)}
[data-design-language="storm"] .v2-region-header>div{max-width:var(--language-content);padding-top:.4rem}
[data-design-language="storm"] .v2-region-header [data-widget-type="brand"] strong{max-width:16rem;font-size:1.3rem;font-weight:800;line-height:.92;letter-spacing:-.01em;text-transform:uppercase}
[data-design-language="storm"] [data-widget-type="nav"] .v2-nav-links{gap:1.1rem}
[data-design-language="storm"] [data-widget-type="nav"] a{text-transform:uppercase;font-size:.67rem;font-weight:700}
[data-design-language="storm"] [data-widget-type="nav"] .v2-nav-extra{display:inline-flex}
/* El teléfono es la conversión principal: se muestra como botón, no como dato. */
[data-design-language="storm"] [data-widget-type="nav"] .v2-nav-phone{background:var(--accent);color:var(--on-accent);padding-inline:1rem;font-size:.85rem;letter-spacing:.01em}
[data-design-language="storm"] [data-widget-type="nav"] .v2-nav-cta{border:2px solid color-mix(in srgb,var(--footer-text) 45%,transparent);color:var(--footer-text);font-weight:700;letter-spacing:.05em}

[data-design-language="storm"] .v2-key-library-hero-emergency-v2{overflow:hidden;background:var(--secondary)!important}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2::after{content:"";position:absolute;inset:auto 0 0;z-index:2;height:.75rem;background:var(--storm-hazard)}
/* Retícula en vez de columna: cada widget ocupa su propio renglón salvo los
   botones, que se colocan automáticamente en las dos celdas de una misma fila.
   Con flex-wrap no funcionaba: los max-width de cada widget encogen su tamaño
   hipotético y varios terminaban compartiendo renglón. */
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-column-id]{display:grid;grid-template-columns:auto 1fr;justify-items:start;align-content:center;gap:1.35rem 1rem;padding-block:5rem}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-column-id]>*{grid-column:1/-1}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-column-id]>[data-widget-type="button"]{grid-column:auto}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="divider"]{width:21rem}
[data-design-language="storm"] .v2-hero-thumb{border-radius:0}
[data-design-language="storm"] .v2-hero-thumb.v2-hero-thumb-on{border-color:var(--accent)}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 h1{max-width:15ch;font-size:clamp(3rem,5.6vw,5.4rem);font-weight:900;line-height:.9}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="text"]{opacity:.92}
/* Chip de estado con el punto en vivo. */
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-slot="hero.subtitle"]{display:flex;align-items:center;gap:.6rem;width:max-content;max-width:100%;opacity:1;border:1px solid color-mix(in srgb,var(--accent) 55%,transparent);border-radius:999px;background:color-mix(in srgb,var(--accent) 16%,transparent);padding:.5rem 1.05rem;color:var(--accent);font-size:.72rem;font-weight:800;text-transform:uppercase;letter-spacing:.14em}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-slot="hero.subtitle"]::before{content:"";flex:none;width:.6rem;height:.6rem;border-radius:50%;background:var(--accent);animation:v2-storm-pulse 2.4s cubic-bezier(0,0,.2,1) infinite}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-slot="hero.body"]{border-left:3px solid var(--accent);padding-left:1.1rem;font-size:1.05rem}
/* Chip secundario con la actividad del negocio. */
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-slot="business.type"]{width:max-content;max-width:100%;opacity:1;border:1px solid color-mix(in srgb,currentColor 38%,transparent);border-radius:999px;padding:.5rem 1.15rem;font-size:.74rem;font-weight:700;text-transform:uppercase;letter-spacing:.1em}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="button"]:not([data-widget-slot]){border-color:color-mix(in srgb,currentColor 45%,transparent);background:color-mix(in srgb,#000 28%,transparent)}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="divider"]{max-width:100%;border-color:color-mix(in srgb,currentColor 30%,transparent)}
/* Bloque de contacto: disco con auricular, el nombre pasa a etiqueta y el
   teléfono manda. */
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="business_info"]{display:grid;grid-template-columns:2.9rem 1fr;align-items:center;column-gap:1rem;row-gap:0;width:max-content;max-width:100%}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="business_info"]::before{content:"";grid-row:1/3;width:2.9rem;height:2.9rem;border-radius:50%;background-color:var(--accent);background-image:url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 24 24' fill='white'%3E%3Cpath d='M6.6 10.8c1.4 2.8 3.8 5.2 6.6 6.6l2.2-2.2c.3-.3.7-.4 1-.2 1.2.4 2.4.6 3.6.6.6 0 1 .4 1 1V20c0 .6-.4 1-1 1C10.6 21 3 13.4 3 4c0-.6.4-1 1-1h3.5c.6 0 1 .4 1 1 0 1.3.2 2.5.6 3.6.1.4 0 .7-.2 1l-2.3 2.2z'/%3E%3C/svg%3E");background-position:center;background-repeat:no-repeat;background-size:1.2rem}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="business_info"]>*{grid-column:2}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="business_info"] strong{font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;opacity:.7}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="business_info"] a[href^="tel:"]{font-family:var(--heading);font-size:clamp(1.5rem,2.6vw,2.15rem);font-weight:800;line-height:1.1;letter-spacing:-.01em}
[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="business_info"] a[href^="mailto:"],[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="business_info"] span{font-size:.8rem;opacity:.7}

/* Disponibilidad: los datos se leen como panel operativo, no como tarjetas. */
[data-design-language="storm"] .v2-key-library-availability-grid-v2,[data-design-language="storm"] .v2-key-library-benefits-metrics-v2{border-bottom:2px solid var(--text);background:color-mix(in srgb,var(--secondary) 4%,var(--bg))}
[data-design-language="storm"] .v2-key-library-availability-grid-v2 [data-column-id]:first-child,[data-design-language="storm"] .v2-key-library-benefits-metrics-v2 [data-column-id]:first-child{align-self:start;border-top:5px solid var(--accent);padding-top:1.1rem}
[data-design-language="storm"] .v2-key-library-availability-grid-v2 [data-widget-type="list"],[data-design-language="storm"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"]{gap:0;text-align:left;border-top:2px solid var(--text);border-left:2px solid var(--text)}
[data-design-language="storm"] .v2-key-library-availability-grid-v2 [data-widget-type="list"]>article,[data-design-language="storm"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"]>article{text-align:left;border-right:2px solid var(--text);border-bottom:2px solid var(--text);padding:1.35rem 1.25rem}
[data-design-language="storm"] .v2-key-library-availability-grid-v2 [data-widget-type="list"] h3,[data-design-language="storm"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"] h3{font-size:clamp(1.7rem,3vw,2.4rem);font-weight:900;letter-spacing:-.02em}
[data-design-language="storm"] .v2-key-library-availability-grid-v2 [data-widget-type="list"] p,[data-design-language="storm"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"] p{font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.76rem;line-height:1.5;text-transform:uppercase;letter-spacing:.05em}

[data-design-language="storm"] .v2-key-library-services-cards-v2{border-bottom:2px solid var(--text)}
[data-design-language="storm"] .v2-key-library-services-cards-v2 [data-column-id]:first-child{align-self:start;border-top:5px solid var(--accent);padding-top:1.1rem}
[data-design-language="storm"] .v2-key-library-services-cards-v2 [data-widget-type="list"]{gap:1rem}
[data-design-language="storm"] .v2-key-library-services-cards-v2 [data-widget-type="list"]>article{min-height:13rem;border:2px solid var(--text);border-radius:0;background:var(--bg);padding:1.4rem}
[data-design-language="storm"] .v2-key-library-services-cards-v2 [data-widget-type="list"]>article>span:first-child{color:var(--accent);font-weight:800}
[data-design-language="storm"] .v2-key-library-services-cards-v2 [data-widget-type="list"] h3{font-size:1.4rem;font-weight:800;text-transform:uppercase;letter-spacing:-.01em}
/* :not(:first-child) evita que el servicio sin "meta" convierta su número de
   índice en la etiqueta inferior de la tarjeta. */
[data-design-language="storm"] .v2-key-library-services-cards-v2 [data-widget-type="list"]>article>span:last-child:not(:first-child){margin-top:auto;border-top:2px solid var(--accent);padding-top:.6rem;opacity:1;color:var(--accent)}

[data-design-language="storm"] .v2-key-library-emergency-band-v2{position:relative;border-block:2px solid var(--text)}
[data-design-language="storm"] .v2-key-library-emergency-band-v2::before,[data-design-language="storm"] .v2-key-library-emergency-band-v2::after{content:"";position:absolute;inset-inline:0;height:.55rem;background:repeating-linear-gradient(135deg,var(--on-accent) 0 .85rem,transparent .85rem 1.7rem);opacity:.85}
[data-design-language="storm"] .v2-key-library-emergency-band-v2::before{top:0}
[data-design-language="storm"] .v2-key-library-emergency-band-v2::after{bottom:0}
[data-design-language="storm"] .v2-key-library-emergency-band-v2>div{padding-block:1rem}
[data-design-language="storm"] .v2-key-library-emergency-band-v2 [data-widget-type="text"]:first-child{width:max-content;max-width:100%;background:var(--on-accent);color:var(--accent);padding:.35rem .7rem;font-size:.68rem;font-weight:800;text-transform:uppercase;letter-spacing:.16em;opacity:1}
[data-design-language="storm"] .v2-key-library-emergency-band-v2 h2{max-width:17ch;font-size:clamp(2.1rem,3.9vw,3.5rem);font-weight:900}
[data-design-language="storm"] .v2-key-library-emergency-band-v2 [data-column-id]:last-child{align-items:flex-start;justify-content:center}
[data-design-language="storm"] .v2-key-library-emergency-band-v2 [data-widget-type="business_info"]{gap:.1rem}
[data-design-language="storm"] .v2-key-library-emergency-band-v2 [data-widget-type="business_info"] strong{font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;opacity:.7}
[data-design-language="storm"] .v2-key-library-emergency-band-v2 [data-widget-type="business_info"] a[href^="tel:"]{font-family:var(--heading);font-size:clamp(1.9rem,3.4vw,2.9rem);font-weight:900;line-height:1;letter-spacing:-.02em}
[data-design-language="storm"] .v2-key-library-emergency-band-v2 [data-widget-type="business_info"] a[href^="mailto:"],[data-design-language="storm"] .v2-key-library-emergency-band-v2 [data-widget-type="business_info"] span{font-size:.82rem;opacity:.75}

/* El lenguaje ofrece varios bloques de galería y el compositor elige según el
   ritmo de la página: todos deben verse resueltos, no solo el preferido. */
[data-design-language="storm"] .v2-key-library-gallery-grid-v2,[data-design-language="storm"] .v2-key-library-gallery-mosaic-v2{border-top:2px solid var(--text)}
[data-design-language="storm"] .v2-key-library-gallery-projects-v2 [data-column-id]:first-child{align-self:start;border-top:5px solid var(--accent);padding-top:1.1rem}
[data-design-language="storm"] .v2-key-library-gallery-projects-v2 [data-widget-type="gallery"],[data-design-language="storm"] .v2-key-library-gallery-grid-v2 [data-widget-type="gallery"],[data-design-language="storm"] .v2-key-library-gallery-mosaic-v2 [data-widget-type="gallery"]{gap:.5rem}
[data-design-language="storm"] .v2-key-library-gallery-projects-v2 figure,[data-design-language="storm"] .v2-key-library-gallery-grid-v2 figure,[data-design-language="storm"] .v2-key-library-gallery-mosaic-v2 figure{border-radius:0;border:2px solid var(--text);background:var(--secondary)}
[data-design-language="storm"] .v2-key-library-gallery-projects-v2 img,[data-design-language="storm"] .v2-key-library-gallery-grid-v2 img,[data-design-language="storm"] .v2-key-library-gallery-mosaic-v2 img{filter:saturate(.72) contrast(1.1)}
/* Con pocas fotos, una rejilla de tres deja un hueco delator en la última fila. */
[data-design-language="storm"] .v2-key-library-gallery-grid-v2 [data-widget-type="gallery"]{grid-template-columns:repeat(auto-fit,minmax(15rem,1fr))}

/* Nosotros: fotos que se pisan, relato y compromisos marcados uno a uno. */
[data-design-language="storm"] .v2-key-library-about-showcase-v2{border-bottom:2px solid var(--text)}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-column-id]{gap:1.35rem}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-column-id]:last-child{justify-content:center}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-slot="about.subtitle"]{width:max-content;max-width:100%;opacity:1;border-bottom:3px solid var(--accent);padding-bottom:.4rem;color:var(--accent);font-size:.74rem;font-weight:800;text-transform:uppercase;letter-spacing:.14em}
/* Bicolor sin partir el texto: la primera línea conserva el color base y el
   resto queda en acento. Si el titular cabe en una línea, se ve monocolor. */
[data-design-language="storm"] .v2-key-library-about-showcase-v2 h2{max-width:18ch;color:var(--accent);font-size:clamp(2.1rem,3.6vw,3.3rem);font-weight:900}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 h2::first-line{color:var(--text)}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-slot="about.body"]{max-width:54ch;opacity:.78}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-type="list"]>article{border-color:color-mix(in srgb,var(--text) 16%,transparent);border-radius:0;background:color-mix(in srgb,var(--accent) 8%,transparent)}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-type="list"] h3,[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-type="list"] span{text-transform:none;letter-spacing:0}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-type="button"]{width:max-content;max-width:100%;gap:.6rem}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-type="button"]::after{content:"\\2192";font-weight:700}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-type="business_info"]{gap:.1rem}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-type="business_info"] strong{font-size:.66rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;opacity:.6}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-type="business_info"] a[href^="tel:"]{font-family:var(--heading);font-size:1.5rem;font-weight:800;line-height:1.15}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-type="business_info"] a[href^="mailto:"],[data-design-language="storm"] .v2-key-library-about-showcase-v2 [data-widget-type="business_info"] span{font-size:.8rem;opacity:.65}
/* El par de fotos se recorta contra el fondo de la sección, no contra blanco. */
[data-design-language="storm"] .v2-key-library-about-showcase-v2 figure{border-radius:0}
[data-design-language="storm"] .v2-key-library-about-showcase-v2 .v2-about-stack figure:last-child{--tw-ring-color:var(--bg);border:2px solid var(--text)}

[data-design-language="storm"] .v2-key-library-about-stats{border-bottom:2px solid var(--text)}
[data-design-language="storm"] .v2-key-library-about-stats h2{max-width:14ch;font-size:clamp(2.2rem,3.8vw,3.6rem)}
[data-design-language="storm"] .v2-key-library-about-stats [data-widget-type="list"]{gap:0;text-align:left}
[data-design-language="storm"] .v2-key-library-about-stats [data-widget-type="list"]>article{text-align:left;border-top:2px solid color-mix(in srgb,var(--text) 28%,transparent);padding:1.1rem 0}
[data-design-language="storm"] .v2-key-library-about-stats [data-widget-type="list"]>article:first-child{border-top-color:var(--accent)}
[data-design-language="storm"] .v2-key-library-about-stats [data-widget-type="list"] h3{color:var(--accent);font-size:clamp(1.5rem,2.6vw,2.2rem);font-weight:900}

[data-design-language="storm"] .v2-key-library-reviews-trust-v2 [data-column-id]:first-child{align-self:start;border-top:5px solid var(--accent);padding-top:1.1rem}
[data-design-language="storm"] .v2-key-library-reviews-trust-v2 figure{border:2px solid var(--text);border-radius:0;background:var(--bg)}

/* Seguros: el acordeón se lee como expediente numerado del reclamo. */
[data-design-language="storm"] .v2-key-library-insurance-faq-v2{border-top:2px solid var(--text);background:color-mix(in srgb,var(--secondary) 4%,var(--bg))}
[data-design-language="storm"] .v2-key-library-insurance-faq-v2 [data-column-id]:first-child{align-self:start;border-top:5px solid var(--accent);padding-top:1.1rem}
[data-design-language="storm"] .v2-key-library-insurance-faq-v2 [data-widget-type="accordion"]{max-width:none;counter-reset:v2-storm-claim;border-top:2px solid var(--text)}
[data-design-language="storm"] .v2-key-library-insurance-faq-v2 details{counter-increment:v2-storm-claim;border-bottom:1px solid color-mix(in srgb,var(--text) 28%,transparent);padding-block:1.35rem}
[data-design-language="storm"] .v2-key-library-insurance-faq-v2 summary::before{content:counter(v2-storm-claim,decimal-leading-zero);flex:none;width:2rem;font-family:ui-monospace,SFMono-Regular,Menlo,monospace;font-size:.78rem;font-weight:700;color:var(--accent)}
/* El contador y la pregunta van juntos a la izquierda; el signo queda al borde. */
[data-design-language="storm"] .v2-key-library-insurance-faq-v2 summary{gap:1.1rem;justify-content:flex-start;font-weight:700;text-transform:uppercase;letter-spacing:.01em}
[data-design-language="storm"] .v2-key-library-insurance-faq-v2 summary>span:last-child{margin-left:auto}
[data-design-language="storm"] .v2-key-library-insurance-faq-v2 details p{padding-left:3.1rem}

[data-design-language="storm"] .v2-key-library-contact-split-v2{border-top:2px solid var(--text)}
[data-design-language="storm"] .v2-key-library-contact-split-v2 [data-column-id]:first-child{align-self:start;border-top:5px solid var(--accent);padding-top:1.1rem}
[data-design-language="storm"] .v2-key-library-contact-split-v2 [data-widget-type="form"]{border:2px solid var(--text);border-radius:0;background:var(--bg)}
[data-design-language="storm"] .v2-key-library-contact-split-v2 input,[data-design-language="storm"] .v2-key-library-contact-split-v2 textarea{border-radius:0;border-width:2px}
[data-design-language="storm"] [data-widget-type="button"],[data-design-language="storm"] [data-widget-type="form"] button{border-radius:0;text-transform:uppercase;font-weight:800;letter-spacing:.06em}

[data-design-language="storm"] .v2-region-footer{position:relative;padding-top:2.6rem}
[data-design-language="storm"] .v2-region-footer::before{content:"";position:absolute;inset:0 0 auto;height:.55rem;background:var(--storm-hazard)}
[data-design-language="storm"] .v2-region-footer [data-widget-type="brand"] strong{font-size:1.9rem;font-weight:900;text-transform:uppercase}

/* Before & After: superficies limpias, esquinas suaves y el acento claro como
   protagonista sobre el tono profundo. Todo apunta al comparador. */
[data-design-language="makeover"] .v2-region-header{background:var(--secondary);color:var(--footer-text);border-bottom:1px solid color-mix(in srgb,var(--footer-text) 14%,transparent);box-shadow:0 10px 30px #0000001f}
[data-design-language="makeover"] .v2-region-header>div{padding-block:.35rem}
/* Punto de acento antes del nombre: da presencia al encabezado sin cargarlo. */
[data-design-language="makeover"] .v2-region-header [data-widget-type="brand"]::before{content:"";width:.7rem;height:.7rem;border-radius:999px;background:var(--accent);flex:none}
[data-design-language="makeover"] .v2-region-header [data-widget-type="brand"] strong{font-size:1.35rem;font-weight:700;letter-spacing:-.03em}
[data-design-language="makeover"] [data-widget-type="nav"] a{font-size:.82rem;font-weight:500}
[data-design-language="makeover"] [data-widget-type="nav"] .v2-nav-extra{display:inline-flex}
[data-design-language="makeover"] [data-widget-type="nav"] .v2-nav-phone{color:var(--accent);font-weight:700}
[data-design-language="makeover"] [data-widget-type="nav"] .v2-nav-cta{border-radius:999px;background:var(--accent);color:var(--on-accent);font-weight:700}
[data-design-language="makeover"] [data-widget-type="button"],[data-design-language="makeover"] [data-widget-type="form"] button{border-radius:999px;padding-inline:1.6rem;font-weight:700;letter-spacing:0}

/* Portada monumental: foto a sangre completa, titular gigante a la izquierda y
   el mapa de la zona real a la derecha. */
[data-design-language] .v2-key-library-hero-atlas-v2{overflow:hidden}
[data-design-language] .v2-key-library-hero-atlas-v2>div{max-width:none}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-column-id]{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,.85fr);grid-template-rows:auto auto 1fr auto;align-items:start;gap:1.1rem 3rem;min-height:min(52rem,calc(100svh - 4.5rem));padding-block:5.5rem 3.5rem;padding-inline:max(1.5rem,calc((100% - var(--language-content))/2 + 1.5rem))}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-slot="hero.subtitle"]{grid-area:1/1;width:max-content;opacity:1;border:1px solid rgba(255,255,255,.32);border-radius:999px;background:rgba(255,255,255,.14);padding:.55rem 1.15rem;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;backdrop-filter:blur(6px)}
/* El titular alterna color por linea sin partir el texto: un degradado
   repetido del alto de una linea, recortado sobre la tipografia. */
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 h1{grid-area:2/1;max-width:11ch;font-size:clamp(3rem,7.4vw,7rem);font-weight:900;line-height:.86;letter-spacing:-.05em;text-transform:uppercase;text-shadow:0 4px 30px rgba(0,0,0,.4)}
@supports (-webkit-background-clip:text){
  [data-design-language="makeover"] .v2-key-library-hero-atlas-v2 h1{color:transparent;-webkit-background-clip:text;background-clip:text;background-image:repeating-linear-gradient(180deg,#fff 0 .86em,var(--accent) .86em 1.72em);text-shadow:none;filter:drop-shadow(0 4px 26px rgba(0,0,0,.45))}
}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-slot="hero.body"]{grid-area:3/2;align-self:start;max-width:34ch;font-size:.92rem;opacity:.9;text-shadow:0 1px 12px rgba(0,0,0,.45)}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="business_info"]{grid-area:4/1;align-self:end;gap:.1rem}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="business_info"] strong{font-size:.64rem;font-weight:600;text-transform:uppercase;letter-spacing:.14em;opacity:.7}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="business_info"] a[href^="tel:"]{font-family:var(--heading);font-size:1.65rem;font-weight:700;color:var(--accent)}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="business_info"] a[href^="mailto:"],[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="business_info"] span{font-size:.78rem;opacity:.75}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="button"]{grid-area:4/2;align-self:end;justify-self:end;width:max-content;padding-inline:2rem;font-size:1rem;box-shadow:0 14px 34px rgba(0,0,0,.32)}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="button"]::after{content:"\\2197";margin-left:.7rem;font-weight:700}
/* Panel del mapa: cristal sobre la foto, con la zona real consultada en vivo. */
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="map"]{grid-area:2/2;align-self:start;overflow:hidden;border:1px solid rgba(255,255,255,.28);border-radius:calc(var(--radius) * 1.2);background:rgba(255,255,255,.1);box-shadow:0 24px 60px rgba(0,0,0,.35);backdrop-filter:blur(8px)}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="map"] iframe{min-height:15rem;filter:grayscale(.25) contrast(1.05)}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="map"] a{padding:1rem 1.15rem;color:#fff}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="map"] a:hover{background:rgba(255,255,255,.08)}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="map"] a span:first-child{color:var(--accent);font-size:.64rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;opacity:1}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="map"] strong{font-size:1.02rem;font-weight:600}
[data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="map"] small{opacity:.7}

/* Portada-comparador: el bloque es a sangre completa por definición, en
   cualquier lenguaje que lo use. */
[data-design-language] .v2-key-library-hero-transform-v2{overflow:hidden}
[data-design-language] .v2-key-library-hero-transform-v2>div{max-width:none}
[data-design-language] .v2-key-library-hero-transform-v2 [data-column-id]{min-height:min(50rem,calc(100svh - 4.5rem));justify-content:center;padding-inline:max(1.5rem,calc((100% - var(--language-content))/2 + 1.5rem))}

[data-design-language="makeover"] .v2-key-library-hero-transform-v2{background:var(--secondary)!important;color:#fff!important}
[data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-column-id]{gap:1.5rem;padding-block:6rem;max-width:none}
/* El texto ocupa la mitad izquierda: la derecha queda libre para que se vea
   el cambio de una foto a otra. */
[data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-column-id]>*{max-width:min(34rem,52%)}
[data-design-language="makeover"] .v2-key-library-hero-transform-v2 h1{max-width:min(15ch,52%);font-size:clamp(2.8rem,5.4vw,5rem);letter-spacing:-.045em;line-height:.98;text-shadow:0 2px 24px rgba(0,0,0,.35)}
[data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-widget-slot="hero.subtitle"]{width:max-content;opacity:1;border:1px solid rgba(255,255,255,.3);border-radius:999px;background:rgba(255,255,255,.12);padding:.55rem 1.15rem;color:#fff;font-size:.72rem;font-weight:700;text-transform:uppercase;letter-spacing:.14em;backdrop-filter:blur(6px)}
[data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-widget-slot="hero.body"]{opacity:.9;text-shadow:0 1px 12px rgba(0,0,0,.4)}
[data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-widget-type="button"]{width:max-content;box-shadow:0 12px 30px rgba(0,0,0,.28)}
[data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-widget-type="business_info"]{gap:.1rem;margin-top:.3rem}
[data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-widget-type="business_info"] strong{font-size:.64rem;font-weight:600;text-transform:uppercase;letter-spacing:.14em;opacity:.7}
[data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-widget-type="business_info"] a[href^="tel:"]{font-family:var(--heading);font-size:1.6rem;font-weight:700;color:var(--accent);text-shadow:0 1px 12px rgba(0,0,0,.4)}
[data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-widget-type="business_info"] a[href^="mailto:"],[data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-widget-type="business_info"] span{font-size:.8rem;opacity:.75}

[data-design-language="makeover"] .v2-key-library-gallery-before-after-v2{background:color-mix(in srgb,var(--accent) 10%,var(--bg))}
[data-design-language="makeover"] .v2-key-library-gallery-before-after-v2 [data-column-id]:first-child{align-self:start}
[data-design-language="makeover"] .v2-key-library-gallery-before-after-v2 h2{max-width:12ch;font-size:clamp(1.9rem,3.4vw,2.9rem)}
[data-design-language="makeover"] .v2-ba{box-shadow:0 18px 40px #00000026}

[data-design-language="makeover"] .v2-key-library-services-cards-v2 [data-column-id]:first-child{align-self:start}
[data-design-language="makeover"] .v2-key-library-services-cards-v2 [data-widget-type="list"]>article{border-color:transparent;background:var(--bg);box-shadow:0 10px 30px #00000014}
[data-design-language="makeover"] .v2-key-library-services-cards-v2 [data-widget-type="list"]>article>span:first-child{display:grid;place-items:center;width:2.4rem;height:2.4rem;border-radius:999px;background:color-mix(in srgb,var(--accent) 30%,transparent);color:var(--text)}
[data-design-language="makeover"] .v2-key-library-benefits-numbered-v2{background:var(--secondary)!important;color:var(--footer-text)!important}
[data-design-language="makeover"] .v2-key-library-benefits-numbered-v2 article{border-color:color-mix(in srgb,var(--footer-text) 18%,transparent)}
[data-design-language="makeover"] .v2-key-library-benefits-numbered-v2 article>span:first-child{color:var(--accent)}
[data-design-language="makeover"] .v2-key-library-cta-card-v2{background:var(--accent)!important;color:var(--on-accent)!important;border-radius:0}
[data-design-language="makeover"] .v2-key-library-cta-card-v2 [data-widget-type="button"]{background:var(--secondary);color:var(--footer-text)}
[data-design-language="makeover"] [data-widget-type="testimonials"] figure,[data-design-language="makeover"] [data-widget-type="accordion"] details{border-color:transparent;background:color-mix(in srgb,var(--accent) 14%,transparent)}
[data-design-language="makeover"] [data-widget-type="form"]{border-color:transparent;background:color-mix(in srgb,var(--accent) 12%,transparent)}

/* Toda etapa se presenta igual: rotulo en acento sobre el fondo profundo,
   titular grande y texto de lectura real. Sin esto las secciones parecian
   listas sueltas flotando. */
[data-design-language="makeover"] .v2-region-main [data-column-id]:first-child>[data-widget-type="heading"]:first-child{position:relative;padding-top:1.4rem;font-size:clamp(1.8rem,3.2vw,2.7rem)}
[data-design-language="makeover"] .v2-region-main [data-column-id]:first-child>[data-widget-type="heading"]:first-child::before{content:"";position:absolute;top:0;left:0;width:3.5rem;height:.4rem;border-radius:999px;background:var(--accent)}
[data-design-language="makeover"] .v2-region-main [data-widget-type="text"]{font-size:1.02rem;opacity:.86}
[data-design-language="makeover"] .v2-key-library-contact-split-v2 [data-column-id]:first-child{align-self:center}
[data-design-language="makeover"] .v2-key-library-contact-split-v2 h2{max-width:14ch}

/* Cobertura: el mapa cierra la pagina en vez de repetir el formulario. */
[data-design-language="makeover"] .v2-key-library-service-area-v2{background:var(--secondary)!important;color:var(--footer-text)!important}
[data-design-language="makeover"] .v2-key-library-service-area-v2 [data-column-id]:first-child{align-self:center}
[data-design-language="makeover"] .v2-key-library-service-area-v2 [data-widget-type="business_info"] a[href^="tel:"]{font-family:var(--heading);font-size:1.4rem;font-weight:700;color:var(--accent)}
[data-design-language="makeover"] .v2-key-library-service-area-v2 [data-widget-type="map"]{overflow:hidden;border-radius:var(--radius);background:color-mix(in srgb,var(--footer-text) 8%,transparent)}
[data-design-language="makeover"] .v2-key-library-service-area-v2 [data-widget-type="map"] iframe{min-height:24rem}
[data-design-language="makeover"] .v2-key-library-service-area-v2 [data-widget-type="map"] a{color:var(--footer-text)}
[data-design-language="makeover"] .v2-region-footer [data-widget-type="brand"] strong{font-size:1.8rem;font-weight:700;letter-spacing:-.03em}

@keyframes v2-storm-pulse{0%{box-shadow:0 0 0 0 color-mix(in srgb,var(--accent) 65%,transparent)}70%{box-shadow:0 0 0 .7rem transparent}100%{box-shadow:0 0 0 0 transparent}}

@media(min-width:1024px){
  [data-design-language="bauhaus"] .v2-key-library-hero-split-image-v2 [data-row-id]>[data-column-id]:first-child{grid-column:span 7/span 7}
  [data-design-language="bauhaus"] .v2-key-library-hero-split-image-v2 [data-row-id]>[data-column-id]:last-child{grid-column:span 5/span 5}
  [data-design-language="swiss"] .v2-key-library-hero-split-image-v2 [data-row-id]>[data-column-id]:first-child{grid-column:span 7/span 7}
  [data-design-language="swiss"] .v2-key-library-hero-split-image-v2 [data-row-id]>[data-column-id]:last-child{grid-column:span 5/span 5}
  [data-design-language="editorial"] .v2-key-library-hero-split-image-v2 [data-row-id]>[data-column-id]:first-child{grid-column:span 5/span 5}
  [data-design-language="editorial"] .v2-key-library-hero-split-image-v2 [data-row-id]>[data-column-id]:last-child{grid-column:span 7/span 7}
  [data-design-language="industrial"] .v2-key-library-hero-split-image-v2 [data-row-id]>[data-column-id]:first-child{grid-column:span 7/span 7}
  [data-design-language="industrial"] .v2-key-library-hero-split-image-v2 [data-row-id]>[data-column-id]:last-child{grid-column:span 5/span 5}
  [data-design-language="storm"] .v2-key-library-availability-grid-v2 [data-widget-type="list"],[data-design-language="storm"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"]{grid-template-columns:repeat(2,minmax(0,1fr))}
}
@media(max-width:1023px){
  [data-design-language] .v2-key-library-hero-split-image-v2{min-height:auto;padding-block:4rem}
  [data-design-language] .v2-key-library-hero-split-image-v2 [data-widget-type="image"]{height:auto;aspect-ratio:4/3}
  [data-design-language] .v2-key-library-hero-emergency-v2 [data-column-id]{min-height:min(42rem,calc(100svh - 4rem))}
  [data-design-language="bauhaus"] .v2-key-library-hero-split-image-v2::before{width:6rem;height:6rem;right:1rem;top:1rem}
  [data-design-language="bauhaus"] .v2-key-library-hero-split-image-v2::after{display:none}
  [data-design-language="swiss"] .v2-key-library-hero-split-image-v2::before,[data-design-language="editorial"] .v2-key-library-hero-split-image-v2::before{position:static;display:block;margin-bottom:1.75rem}
  [data-design-language="editorial"] .v2-key-library-about-overlap [data-column-id]:last-child{margin-left:0;padding:2rem 0}
  [data-design-language="swiss"] .v2-key-library-services-editorial-v2 [data-widget-type="list"],[data-design-language="editorial"] .v2-key-library-services-editorial-v2 [data-widget-type="list"]{grid-template-columns:1fr}
  [data-design-language="editorial"] .v2-key-library-services-editorial-v2 article:nth-child(2){margin-top:0}
  [data-design-language="industrial"] .v2-key-library-hero-split-image-v2 [data-widget-type="image"]{box-shadow:8px 8px 0 var(--accent)}
  [data-design-language="storm"] .v2-key-library-emergency-band-v2 [data-column-id]:last-child{margin-top:1.5rem}
}
@media(max-width:640px){
  [data-design-language] .v2-region-main{padding-block:3.5rem}
  [data-design-language] .v2-key-library-hero-split-image-v2{padding-block:3rem}
  [data-design-language] .v2-key-library-hero-split-image-v2 h1{font-size:clamp(2.55rem,13vw,3.55rem);max-width:100%}
  [data-design-language] [data-widget-type="button"]{width:100%}
  [data-design-language="bauhaus"] .v2-region-header [data-widget-type="brand"]{padding:.55rem .7rem;box-shadow:3px 3px 0 var(--text)}
  [data-design-language="bauhaus"] .v2-key-library-hero-split-image-v2 [data-widget-type="image"]{box-shadow:8px 8px 0 var(--accent)}
  [data-design-language="bauhaus"] [data-widget-type="list"]>article{box-shadow:none}
  [data-design-language="swiss"] .v2-key-library-hero-split-image-v2 [data-column-id]:first-child{padding-left:1rem}
  [data-design-language="swiss"] .v2-key-library-reviews-quotes figure{grid-template-columns:2.5rem 1fr}
  [data-design-language="swiss"] .v2-key-library-reviews-quotes figure::before{font-size:3rem}
  [data-design-language="editorial"] .v2-gallery-filmstrip figure,[data-design-language="editorial"] .v2-gallery-filmstrip figure:nth-child(even){min-width:86%}
  [data-design-language="editorial"] .v2-gallery-filmstrip figure:nth-child(even) img{margin-top:0}
  [data-design-language="industrial"] .v2-region-header [data-widget-type="brand"] strong{max-width:12rem;font-size:1.05rem}
  [data-design-language="industrial"] [data-widget-type="nav"].v2-nav-open .v2-nav-links{background:var(--secondary);color:var(--footer-text);border-bottom:5px solid var(--accent)}
  [data-design-language="industrial"] [data-widget-type="nav"] .v2-nav-phone{border-left:0;padding-left:.15rem}
  [data-design-language="industrial"] [data-widget-type="nav"] .v2-nav-cta{width:100%;margin-top:.45rem}
  [data-design-language="industrial"] .v2-key-library-hero-split-image-v2{padding-block:2.35rem}
  [data-design-language="industrial"] .v2-key-library-hero-split-image-v2 h1{font-size:clamp(2.85rem,13.5vw,3.85rem);line-height:.86}
  [data-design-language="industrial"] .v2-key-library-services-cards-v2 [data-widget-type="list"]{border-left:0}
  [data-design-language="industrial"] .v2-key-library-services-cards-v2 [data-widget-type="list"]>article{min-height:auto;border-left:2px solid var(--text)}
  [data-design-language="storm"] .v2-region-header [data-widget-type="brand"] strong{max-width:11rem;font-size:1rem}
  [data-design-language="storm"] [data-widget-type="nav"].v2-nav-open .v2-nav-links{background:var(--secondary);color:var(--footer-text);border-bottom:.4rem solid var(--accent)}
  [data-design-language="storm"] [data-widget-type="nav"] .v2-nav-phone,[data-design-language="storm"] [data-widget-type="nav"] .v2-nav-cta{width:100%;margin-top:.45rem}
  /* mobileSafetyCss reinyecta padding lateral con !important; aquí estorba
     porque la imagen debe llegar al borde de la pantalla. */
  [data-design-language] .v2-key-library-hero-emergency-v2{padding-inline:0!important}
  /* Sin espacio para la tira: quedan solo las flechas, y el contenido reserva
     el hueco inferior para no cruzarse con ellas. */
  [data-design-language] .v2-key-library-hero-emergency-v2 .v2-hero-thumbs{display:none}
  /* En móvil cada botón toma su propio renglón completo. */
  [data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-column-id]{grid-template-columns:minmax(0,1fr);justify-items:stretch;gap:1.1rem;padding-block:3.5rem 6.5rem}
  [data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-column-id]>[data-widget-type="button"]{grid-column:1/-1}
  [data-design-language="storm"] .v2-key-library-hero-emergency-v2 h1{font-size:clamp(2.5rem,11vw,3.5rem);line-height:.92;max-width:100%}
  [data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="divider"]{width:100%}
  [data-design-language="storm"] .v2-key-library-availability-grid-v2 [data-widget-type="list"],[data-design-language="storm"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"]{border-left:0}
  [data-design-language="storm"] .v2-key-library-availability-grid-v2 [data-widget-type="list"]>article,[data-design-language="storm"] .v2-key-library-benefits-metrics-v2 [data-widget-type="list"]>article{border-left:2px solid var(--text)}
  [data-design-language="storm"] .v2-key-library-insurance-faq-v2 details p{padding-left:0}
  /* En móvil el texto cubre casi todo el ancho, así que el velo pasa a ser
     vertical y el tirador baja para no quedar bajo el titular. */
  [data-design-language] .v2-key-library-hero-transform-v2,[data-design-language] .v2-key-library-hero-atlas-v2{padding-inline:0!important}
  /* En móvil la retícula se deshace: todo a una columna y el mapa después del
     titular, que es el orden en el que se lee. */
  [data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-column-id]{grid-template-columns:minmax(0,1fr);grid-template-rows:none;gap:1.15rem;padding-block:4.5rem 3rem}
  [data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-column-id]>*{grid-area:auto!important;justify-self:stretch!important;align-self:auto!important}
  [data-design-language="makeover"] .v2-key-library-hero-atlas-v2 h1{max-width:100%;font-size:clamp(2.6rem,12vw,4rem)}
  [data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="button"]{width:100%}
  [data-design-language="makeover"] .v2-key-library-hero-atlas-v2 [data-widget-type="map"] iframe{min-height:12rem}
  [data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-column-id]{padding-block:4.5rem 3.5rem;gap:1.15rem}
  [data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-column-id]>*,[data-design-language="makeover"] .v2-key-library-hero-transform-v2 h1{max-width:100%}
  [data-design-language="makeover"] .v2-key-library-hero-transform-v2 h1{font-size:clamp(2.4rem,10.5vw,3.4rem)}
  [data-design-language="makeover"] .v2-key-library-hero-transform-v2 [data-widget-type="button"]{width:100%}
  [data-design-language="makeover"] .v2-ba-hero .v2-ba-grip{height:3rem;width:3rem;font-size:1rem}
  [data-design-language="industrial"] .v2-key-library-contact-split-v2 [data-widget-type="form"]{box-shadow:6px 6px 0 var(--accent)}
}
@media(prefers-reduced-motion:reduce){html{scroll-behavior:auto}.v2-reveal{transition:none!important;transform:none!important}[data-design-language="storm"] .v2-key-library-hero-emergency-v2 [data-widget-type="text"]:first-child::before{animation:none}}`;
  return `${themeVars}\n${V2_TAILWIND_CSS}\n${languageCss}`;
}

// Recorte de seguridad: si un valor arbitrario del usuario (padding XL, ancho
// fijo, etc.) igual empuja contenido fuera del viewport en móvil, esto evita
// el scroll horizontal como última red — Tailwind ya previene la mayoría de
// los casos, esto es un backstop, no el mecanismo principal.
const mobileSafetyCss = `.v2-section h1,.v2-section h2,.v2-section h3{overflow-wrap:normal;word-break:normal;hyphens:none}.v2-section p,.v2-section a,.v2-section span{overflow-wrap:anywhere}@media(max-width:640px){.v2-region-main{padding-inline:1.25rem!important}.v2-region-header{padding-inline:1rem!important}}`;

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
  return `document.querySelectorAll('.v2-nav-toggle').forEach(function(toggle){toggle.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();var nav=toggle.closest('nav');if(!nav)return;var open=nav.classList.toggle('v2-nav-open');toggle.setAttribute('aria-expanded',open?'true':'false');toggle.setAttribute('aria-label',open?'Cerrar menú':'Abrir menú');});});
function closeMenus(except){document.querySelectorAll('nav.v2-nav-open').forEach(function(nav){if(nav===except)return;nav.classList.remove('v2-nav-open');var toggle=nav.querySelector('.v2-nav-toggle');if(toggle){toggle.setAttribute('aria-expanded','false');toggle.setAttribute('aria-label','Abrir menú');}});}
document.addEventListener('click',function(event){var target=event.target instanceof Element?event.target:null;if(target&&target.closest('.v2-nav-links a'))return closeMenus(null);var inside=target?target.closest('nav.v2-nav-open'):null;closeMenus(inside);});
document.addEventListener('keydown',function(event){if(event.key==='Escape')closeMenus(null);});window.addEventListener('resize',function(){if(window.innerWidth>=1024)closeMenus(null);});`;
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

// El comparador ya funciona sin JS (el range nativo arrastra y responde al
// teclado); esto solo traduce su valor a la variable que recorta la foto.
function beforeAfterScript() {
  return `document.querySelectorAll('.v2-ba').forEach(function(card){
var range=card.querySelector('.v2-ba-range');
if(!range)return;
function sync(){card.style.setProperty('--ba',range.value+'%');}
range.addEventListener('input',sync);
sync();
});`;
}

// Recorrido manual del fondo de portada. Sin reproducción automática: la
// portada no debe moverse sola detrás del texto que el visitante está leyendo.
function heroBackdropScript() {
  return `document.querySelectorAll('.v2-hero-backdrop').forEach(function(root){
var slides=root.querySelectorAll('.v2-hero-slide');
if(slides.length<2)return;
var thumbs=root.querySelectorAll('.v2-hero-thumb');
var current=0;
function show(index){
current=(index+slides.length)%slides.length;
for(var i=0;i<slides.length;i++)slides[i].classList.toggle('v2-hero-on',i===current);
for(var j=0;j<thumbs.length;j++){thumbs[j].classList.toggle('v2-hero-thumb-on',j===current);thumbs[j].setAttribute('aria-current',j===current?'true':'false');}}
function bind(selector,resolve){root.querySelectorAll(selector).forEach(function(control){control.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();show(resolve(control));});});}
bind('[data-hero-step]',function(control){return current+(Number(control.getAttribute('data-hero-step'))||1);});
bind('[data-hero-go]',function(control){return Number(control.getAttribute('data-hero-go'))||0;});
show(0);
});`;
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
  const allWidgets = sections.flatMap((section) => section.rows.flatMap((row) => row.columns.flatMap((column) => column.widgets)));
  const hasPixelHero = allWidgets.some((widget) => widget.type === "hero_pixel");
  const hasHeroBackdrop = allWidgets.some((widget) => widget.type === "gallery" && widget.variant === "hero-backdrop");
  const hasBeforeAfter = allWidgets.some((widget) => widget.type === "gallery" && widget.variant?.startsWith("before-after"));
  const script = `${formScript()}${navScript()}${galleryScript()}${input.editable ? "" : revealScript()}${hasPixelHero ? pixelHeroScript() : ""}${hasHeroBackdrop ? heroBackdropScript() : ""}${hasBeforeAfter ? beforeAfterScript() : ""}${input.editable ? editorScript() : ""}`;
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
