import { sanitizeLink } from "@/lib/site/links";
import {
  normalizeCanvasSectionsV2, normalizeSiteContentV2, normalizeThemeV2, resolveContentSlot,
  type CanvasSectionV2, type ResponsiveStyleV2, type SiteContentV2, type StyleTokensV2, type ThemeTokensV2, type WidgetV2,
} from "@/lib/site/v2-schema";

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

function readableText(background: string) {
  const hex = background.replace("#", "");
  if (!/^[0-9a-f]{6}$/i.test(hex)) return "#ffffff";
  const channels = [0, 2, 4].map((offset) => Number.parseInt(hex.slice(offset, offset + 2), 16) / 255)
    .map((value) => value <= .03928 ? value / 12.92 : ((value + .055) / 1.055) ** 2.4);
  const luminance = .2126 * channels[0] + .7152 * channels[1] + .0722 * channels[2];
  return luminance > .42 ? "#111827" : "#ffffff";
}

function socialImageFor(content: SiteContentV2, explicit?: string) {
  const candidates = [explicit, content.hero.media, content.business.logo];
  return candidates.map(safeUrl).find((url) => url && !/(?:youtu\.be|youtube\.com|\.mp4(?:$|[?#])|\.webm(?:$|[?#]))/i.test(url)) || "";
}

const FONT_SIZE: Record<NonNullable<StyleTokensV2["fontSize"]>, string> = { xs: ".75rem", sm: ".875rem", md: "1rem", lg: "1.25rem", xl: "1.75rem", "2xl": "2.5rem", display: "clamp(2.8rem,7vw,6rem)" };
const FONT_WEIGHT = { normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 } as const;
const SPACE = { none: "0", sm: ".75rem", md: "1.5rem", lg: "3rem", xl: "5rem" } as const;
const RADIUS = { none: "0", sm: ".25rem", md: ".75rem", lg: "1.5rem", pill: "999px" } as const;
const SHADOW = { none: "none", sm: "0 2px 8px #0001", md: "0 16px 40px #0002", lg: "0 30px 80px #0004" } as const;
const WIDTH = { content: "760px", wide: "1200px", full: "none" } as const;

function tokensCss(style?: StyleTokensV2) {
  if (!style) return "";
  const backgroundImage = safeUrl(style.backgroundImage);
  const cssBackgroundImage = backgroundImage.replace(/["'()\\\s]/g, (character) => encodeURIComponent(character));
  return [
    style.color && `color:${style.color}`, style.background && `background:${style.background}`,
    backgroundImage && !style.background && "background-color:#111827", backgroundImage && !style.color && "color:#ffffff",
    backgroundImage && `background-image:url("${cssBackgroundImage}")`, backgroundImage && "background-size:cover", backgroundImage && "background-position:center", backgroundImage && "background-blend-mode:multiply",
    style.align && `text-align:${style.align}`, style.fontSize && `font-size:${FONT_SIZE[style.fontSize]}`,
    style.fontWeight && `font-weight:${FONT_WEIGHT[style.fontWeight]}`, style.padding && `padding:${SPACE[style.padding]}`,
    style.gap && `gap:${SPACE[style.gap]}`, style.radius && `border-radius:${RADIUS[style.radius]}`,
    style.shadow && `box-shadow:${SHADOW[style.shadow]}`, style.width && `max-width:${WIDTH[style.width]}`,
    style.width && style.width !== "full" && "margin-inline:auto",
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

function widgetHtml(widget: WidgetV2, content: SiteContentV2, theme: ThemeTokensV2, leadEndpoint: string, editable = false): string {
  const value = valueFor(widget, content);
  const inlineEditable = editable && (widget.type === "heading" || widget.type === "text" || widget.type === "button");
  const attr = `data-widget-id="${escapeHtml(widget.id)}" data-widget-type="${widget.type}"${inlineEditable ? ' data-editable-text="1"' : ""}`;
  switch (widget.type) {
    case "brand": {
      const name = String(value || content.business.name);
      const logo = safeUrl(content.business.logo);
      return `<a ${attr} class="v2-brand" href="#top">${logo ? `<img src="${escapeHtml(logo)}" alt="" loading="eager">` : ""}<strong>${escapeHtml(name)}</strong></a>`;
    }
    case "nav": {
      const items = Array.isArray(widget.data?.items) ? widget.data.items : [];
      return `<nav ${attr} aria-label="Navegación principal">${items.map((item) => { const record = item && typeof item === "object" ? item as Record<string, unknown> : {}; const href = safeUrl(record.href) || "#contact"; return `<a href="${escapeHtml(href)}">${escapeHtml(record.label)}</a>`; }).join("")}</nav>`;
    }
    case "heading": {
      const level = widget.variant === "h1" ? "h1" : widget.variant === "h3" ? "h3" : "h2";
      if (!String(value || "").trim()) return editable ? `<${level} ${attr} class="v2-empty-placeholder">Escribe un título</${level}>` : "";
      return `<${level} ${attr}>${escapeHtml(value)}</${level}>`;
    }
    case "text": return String(value || "").trim() ? `<p ${attr}>${escapeHtml(value)}</p>` : editable ? `<p ${attr} class="v2-empty-placeholder">Escribe un texto</p>` : "";
    case "image": {
      const source = safeUrl(value);
      if (!source) return editable ? `<div ${attr} class="v2-media-placeholder">Agrega una imagen</div>` : "";
      return `<img ${attr} class="v2-image v2-image-${escapeHtml(widget.variant || "cover")}" src="${escapeHtml(source)}" alt="${escapeHtml(widget.data?.alt || content.business.name)}" loading="lazy">`;
    }
    case "video": {
      const source = safeUrl(value);
      if (!source) return editable ? `<div ${attr} class="v2-media-placeholder">Agrega un video</div>` : "";
      const youtube = source.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{6,20})/i)?.[1];
      if (youtube) return `<iframe ${attr} class="v2-video" src="https://www.youtube-nocookie.com/embed/${escapeHtml(youtube)}" title="Video" loading="lazy" allowfullscreen></iframe>`;
      if (!/\.(?:mp4|webm)(?:$|[?#])/i.test(source)) return `<img ${attr} class="v2-image v2-image-cover" src="${escapeHtml(source)}" alt="${escapeHtml(content.business.name)}" loading="lazy">`;
      return `<video ${attr} class="v2-video" src="${escapeHtml(source)}" controls preload="metadata"></video>`;
    }
    case "button": {
      const linkSlot = widget.data?.linkSlot;
      const linked = typeof linkSlot === "string" ? resolveContentSlot(content, linkSlot as never) : widget.data?.link;
      return `<a ${attr} class="v2-button v2-button-${escapeHtml(widget.variant || "solid")}" href="${escapeHtml(safeUrl(linked) || "#contact")}">${escapeHtml(value || "Contactar")}</a>`;
    }
    case "business_info": return `<address ${attr} class="v2-business-info"><strong>${escapeHtml(content.business.name)}</strong>${content.business.phone ? `<a href="tel:${escapeHtml(content.business.phone)}">${escapeHtml(content.business.phone)}</a>` : ""}${content.business.email ? `<a href="mailto:${escapeHtml(content.business.email)}">${escapeHtml(content.business.email)}</a>` : ""}${content.business.location ? `<span>${escapeHtml(content.business.location)}</span>` : ""}</address>`;
    case "list": {
      const items = Array.isArray(value) ? value : [];
      if (!items.length) return editable ? `<div ${attr} class="v2-empty-placeholder">Agrega elementos a esta lista</div>` : "";
      return `<div ${attr} class="v2-list v2-list-${escapeHtml(widget.variant || "cards")}">${items.map((item, index) => { const record = item as Record<string, unknown>; return `<article><span class="v2-index">${String(index + 1).padStart(2, "0")}</span>${record.image ? `<img src="${escapeHtml(safeUrl(record.image))}" alt="" loading="lazy">` : ""}<h3>${escapeHtml(record.title)}</h3><p>${escapeHtml(record.description)}</p>${record.meta ? `<small>${escapeHtml(record.meta)}</small>` : ""}</article>`; }).join("")}</div>`;
    }
    case "gallery": {
      const items = Array.isArray(value) ? value : [];
      if (!items.some((item) => safeUrl((item as Record<string, unknown>)?.url))) return editable ? `<div ${attr} class="v2-media-placeholder">Agrega imágenes a la galería</div>` : "";
      return `<div ${attr} class="v2-gallery v2-gallery-${escapeHtml(widget.variant || "grid")}">${items.map((item) => { const record = item as Record<string, unknown>; const source = safeUrl(record.url); return source ? `<figure><img src="${escapeHtml(source)}" alt="${escapeHtml(record.alt)}" loading="lazy"></figure>` : ""; }).join("")}</div>`;
    }
    case "testimonials": {
      const reviews = Array.isArray(value) ? value : [];
      if (!reviews.length) return editable ? `<div ${attr} class="v2-empty-placeholder">Agrega reseñas</div>` : "";
      return `<div ${attr} class="v2-testimonials v2-testimonials-${escapeHtml(widget.variant || "cards")}">${reviews.map((item) => { const review = item as Record<string, unknown>; return `<figure><div class="v2-stars" aria-label="${escapeHtml(review.rating || 5)} de 5 estrellas">★★★★★</div><blockquote>“${escapeHtml(review.quote)}”</blockquote><figcaption><strong>${escapeHtml(review.name)}</strong>${review.role ? `<span>${escapeHtml(review.role)}</span>` : ""}</figcaption></figure>`; }).join("")}</div>`;
    }
    case "accordion": {
      const faqs = Array.isArray(value) ? value : [];
      if (!faqs.length) return editable ? `<div ${attr} class="v2-empty-placeholder">Agrega preguntas frecuentes</div>` : "";
      return `<div ${attr} class="v2-accordion">${faqs.map((item) => { const faq = item as Record<string, unknown>; return `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`; }).join("")}</div>`;
    }
    case "form": {
      const titleSlot = typeof widget.data?.titleSlot === "string" ? widget.data.titleSlot : "";
      const bodySlot = typeof widget.data?.bodySlot === "string" ? widget.data.bodySlot : "";
      const buttonSlot = typeof widget.data?.buttonSlot === "string" ? widget.data.buttonSlot : "contact.ctaText";
      const title = titleSlot ? resolveContentSlot(content, titleSlot as never) : "";
      const body = bodySlot ? resolveContentSlot(content, bodySlot as never) : "";
      const buttonText = resolveContentSlot(content, buttonSlot as never) || "Enviar mensaje";
      return `<div ${attr} id="contact" class="v2-form-wrap">${title ? `<h2>${escapeHtml(title)}</h2>` : ""}${body ? `<p>${escapeHtml(body)}</p>` : ""}<form data-cluster-form data-endpoint="${escapeHtml(leadEndpoint)}"><label>Nombre<input name="name" required maxlength="120" autocomplete="name"></label><label>Email<input name="email" type="email" maxlength="160" autocomplete="email"></label><label>Teléfono<input name="phone" type="tel" maxlength="40" autocomplete="tel"></label><label class="v2-wide">Mensaje<textarea name="message" required maxlength="2000"></textarea></label><input class="v2-trap" name="website" tabindex="-1" autocomplete="off"><button class="v2-button" type="submit">${escapeHtml(buttonText)}</button><output aria-live="polite"></output></form></div>`;
    }
    case "social": {
      const links = value && typeof value === "object" ? Object.entries(value as Record<string, unknown>) : [];
      if (!links.some(([, href]) => safeUrl(href))) return editable ? `<nav ${attr} class="v2-empty-placeholder">Agrega tus redes sociales</nav>` : "";
      return `<nav ${attr} class="v2-social" aria-label="Redes sociales">${links.map(([label, href]) => { const safe = safeUrl(href); return safe ? `<a href="${escapeHtml(safe)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>` : ""; }).join("")}</nav>`;
    }
    case "map": {
      const location = String(value || content.business.location);
      if (!location.trim()) return editable ? `<div ${attr} class="v2-empty-placeholder">Agrega la ubicación</div>` : "";
      return `<a ${attr} class="v2-map" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}" target="_blank" rel="noreferrer"><span>Ubicación</span><strong>${escapeHtml(location)}</strong><small>Abrir en Google Maps ↗</small></a>`;
    }
    case "divider": return `<hr ${attr}>`;
    case "spacer": return `<div ${attr} aria-hidden class="v2-spacer v2-spacer-${escapeHtml(String(widget.data?.size || "md"))}"></div>`;
    case "embed": {
      const code = typeof widget.data?.html === "string" ? widget.data.html.slice(0, 8000) : "";
      if (!code.trim()) return editable ? `<div ${attr} class="v2-media-placeholder">Agrega tu código insertado</div>` : "";
      const height = Math.max(60, Math.min(1200, Number(widget.data?.height) || 300));
      // Sandbox sin allow-same-origin: el código pegado no puede leer cookies ni tocar el resto del sitio.
      return `<iframe ${attr} class="v2-embed" style="height:${height}px" sandbox="allow-scripts allow-popups" loading="lazy" title="Contenido insertado" srcdoc="${escapeHtml(code)}"></iframe>`;
    }
  }
}

function sectionHtml(section: CanvasSectionV2, content: SiteContentV2, theme: ThemeTokensV2, leadEndpoint: string, editable = false) {
  const rows = section.rows.map((row) => {
    const columns = row.columns.map((column) => {
      const widgets = column.widgets.map((widget) => widgetHtml(widget, content, theme, leadEndpoint, editable)).join("");
      return widgets || editable ? `<div class="v2-column" data-column-id="${escapeHtml(column.id)}" style="--span-d:${column.span.desktop};--span-t:${column.span.tablet};--span-m:${column.span.mobile}">${widgets}</div>` : "";
    }).join("");
    return columns || editable ? `<div class="v2-row" data-row-id="${escapeHtml(row.id)}">${columns}</div>` : "";
  }).join("");
  if (!rows && !editable) return "";
  const key = section.key.replace(/[^a-zA-Z0-9_-]/g, "");
  return `<section id="${escapeHtml(section.key)}" class="v2-section v2-region-${section.region} v2-key-${key}" data-section-id="${escapeHtml(section.id)}"><div class="v2-section-inner">${rows}</div></section>`;
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
  return `:root{--primary:${theme.primary};--secondary:${theme.secondary};--accent:${theme.accent};--button-text:${buttonText};--footer-text:${footerText};--bg:${theme.background};--text:${theme.text};--muted:${theme.muted};--radius:${radius};--heading:${theme.headingFont};--body:${theme.bodyFont}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 var(--body);overflow-x:hidden}img,video,iframe{display:block;max-width:100%}a{color:inherit}.v2-site{display:flex;min-height:100dvh;flex-direction:column;background:var(--bg)}
.v2-section{padding:clamp(3rem,6vw,6rem) max(5vw,1.25rem)}.v2-section-inner{width:min(1200px,100%);margin:auto}.v2-row{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:clamp(1.25rem,3vw,2.5rem);align-items:center}.v2-row+.v2-row{margin-top:clamp(2rem,4vw,4rem)}.v2-column{grid-column:span var(--span-d);display:flex;min-width:0;flex-direction:column;gap:1.25rem}.v2-column>p{max-width:68ch}
h1,h2,h3,p{margin:0}h1,h2,h3{font-family:var(--heading);line-height:1.06;text-wrap:balance}h1{max-width:18ch;font-size:clamp(2.6rem,6vw,5.5rem);letter-spacing:-.045em}h2{max-width:24ch;font-size:clamp(2rem,4vw,3.75rem);letter-spacing:-.03em}h3{font-size:clamp(1.1rem,2vw,1.35rem)}
.v2-region-header{position:relative;z-index:20;padding-block:1rem;border-bottom:1px solid color-mix(in srgb,var(--text) 12%,transparent)}.v2-region-header .v2-section-inner{width:min(1320px,100%)}.v2-region-footer{margin-top:auto;background:var(--secondary)!important;color:var(--footer-text)!important}.v2-region-footer .v2-row{align-items:start}.v2-region-footer a{color:inherit}
.v2-brand{display:flex;align-items:center;gap:.75rem;text-decoration:none;font-family:var(--heading)}.v2-brand img{width:42px;height:42px;object-fit:contain}.v2-region-header nav{display:flex;justify-content:flex-end;gap:1.25rem;white-space:nowrap}.v2-region-header nav a{text-decoration:none;font-size:.9rem}
.v2-button{display:inline-flex;width:max-content;min-height:46px;align-items:center;justify-content:center;border:0;border-radius:var(--radius);background:var(--accent);color:var(--button-text);padding:.8rem 1.35rem;font-weight:750;line-height:1.1;text-decoration:none;white-space:nowrap;cursor:pointer;transition:transform .2s ease,filter .2s ease}.v2-button:hover{filter:brightness(.94)}.v2-button:active{transform:translateY(1px)}.v2-button:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 55%,white);outline-offset:3px}.v2-button-outline{background:transparent;color:currentColor;border:1px solid currentColor}
.v2-image{width:100%;min-height:280px;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius)}.v2-image-portrait{aspect-ratio:4/5}.v2-image-wide{aspect-ratio:16/8}.v2-image-monochrome{filter:grayscale(1)}.v2-video{width:100%;aspect-ratio:16/9;border:0;background:#09090b;border-radius:var(--radius)}.v2-media-placeholder,.v2-empty-placeholder{display:grid;min-height:120px;place-items:center;border:1px dashed currentColor;border-radius:var(--radius);padding:1rem;opacity:.58}
.v2-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}.v2-list article,.v2-testimonials figure{margin:0;padding:clamp(1.25rem,2.5vw,2rem);border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:var(--radius);background:color-mix(in srgb,currentColor 6%,transparent)}.v2-list article h3{margin:.55rem 0}.v2-list article p,.v2-list article small{color:color-mix(in srgb,currentColor 72%,transparent)}.v2-list article img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:calc(var(--radius)/2);margin-bottom:1rem}.v2-list-minimal{display:block}.v2-list-minimal article{border:0;border-bottom:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:0;background:none}.v2-list-minimal article:last-child{border-bottom:0}.v2-list-editorial article:nth-child(even){transform:translateY(1.5rem)}.v2-list-bento{grid-template-columns:repeat(12,minmax(0,1fr))}.v2-list-bento article{grid-column:span 5}.v2-list-bento article:nth-child(3n+1){grid-column:span 7}.v2-list-metrics article{text-align:center}.v2-list-metrics h3{font-size:clamp(1.75rem,4vw,3rem)}.v2-index{font:700 .75rem monospace;color:var(--primary)}
.v2-gallery{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:1rem}.v2-gallery figure{grid-column:span 4;margin:0;overflow:hidden;border-radius:var(--radius)}.v2-gallery img{width:100%;height:clamp(220px,24vw,340px);object-fit:cover}.v2-gallery-mosaic figure:first-child{grid-column:span 8;grid-row:span 2}.v2-gallery-mosaic figure:first-child img{height:100%;min-height:576px}.v2-gallery-filmstrip{display:flex;overflow:auto;scroll-snap-type:x mandatory}.v2-gallery-filmstrip figure{min-width:min(70%,780px);scroll-snap-align:start}
.v2-testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.v2-testimonials blockquote{display:-webkit-box;overflow:hidden;margin:1rem 0;font-size:1.05rem;-webkit-box-orient:vertical;-webkit-line-clamp:3}.v2-testimonials figcaption{display:flex;flex-direction:column}.v2-testimonials-quotes figure{border:0;background:none}.v2-stars{color:var(--accent);letter-spacing:.08em}
.v2-accordion{max-width:900px}.v2-accordion details{border-bottom:1px solid color-mix(in srgb,currentColor 18%,transparent);padding:1rem 0}.v2-accordion summary{cursor:pointer;font-weight:700}.v2-accordion details p{margin-top:.75rem;color:var(--muted)}.v2-business-info{display:flex;flex-direction:column;gap:.5rem;font-style:normal}
.v2-form-wrap form{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.5rem;padding:clamp(1.25rem,3vw,2rem);border:1px solid color-mix(in srgb,currentColor 22%,transparent);border-radius:var(--radius);background:color-mix(in srgb,var(--bg) 94%,var(--primary))}.v2-form-wrap label{display:grid;gap:.4rem;font-size:.875rem;font-weight:650}.v2-form-wrap input,.v2-form-wrap textarea{width:100%;min-height:46px;padding:.75rem;border:1px solid color-mix(in srgb,currentColor 40%,transparent);border-radius:calc(var(--radius)/2);background:color-mix(in srgb,var(--bg) 97%,var(--text));color:var(--text);font:inherit}.v2-form-wrap input:focus,.v2-form-wrap textarea:focus{outline:3px solid color-mix(in srgb,var(--accent) 45%,transparent);border-color:var(--accent)}.v2-form-wrap textarea{min-height:130px}.v2-wide,.v2-form-wrap output,.v2-form-wrap button{grid-column:1/-1}.v2-trap{display:none}
.v2-social{display:flex;flex-wrap:wrap;gap:.75rem}.v2-social a{text-underline-offset:.25em}.v2-map{display:flex;min-height:280px;flex-direction:column;justify-content:flex-end;padding:1.5rem;border-radius:var(--radius);background:color-mix(in srgb,var(--primary) 15%,var(--bg));text-decoration:none}.v2-map strong{font-size:1.35rem}.v2-spacer-sm{height:1rem}.v2-spacer-md{height:2.5rem}.v2-spacer-lg{height:5rem}.v2-embed{width:100%;border:0;border-radius:var(--radius);background:#fff}
@media(max-width:1024px){.v2-column{grid-column:span var(--span-t)}.v2-section{padding-block:clamp(3rem,7vw,5rem)}.v2-region-header nav{gap:.8rem}.v2-list-bento article,.v2-list-bento article:nth-child(3n+1){grid-column:span 6}}
@media(max-width:640px){.v2-row{gap:1.25rem}.v2-column{grid-column:span var(--span-m)}.v2-section{padding:3rem 1.1rem}.v2-region-header{padding-block:.75rem}.v2-region-header .v2-row{display:flex;justify-content:space-between}.v2-region-header nav{display:none}h1{font-size:clamp(2.35rem,13vw,4rem)}h2{font-size:clamp(1.9rem,10vw,3rem)}.v2-list-bento article,.v2-list-bento article:nth-child(3n+1){grid-column:1/-1}.v2-gallery figure{grid-column:span 6}.v2-gallery-mosaic figure:first-child{grid-column:1/-1}.v2-gallery-mosaic figure:first-child img{min-height:360px}.v2-gallery-filmstrip figure{min-width:88%}.v2-form-wrap form{grid-template-columns:1fr}.v2-form-wrap label,.v2-form-wrap button,.v2-form-wrap output{grid-column:1}.v2-button{max-width:100%;white-space:normal}}
@media(prefers-reduced-motion:no-preference){.v2-motion-subtle .v2-region-main{animation:v2-reveal .5s ease both}.v2-motion-stagger .v2-region-main{animation:v2-reveal .6s cubic-bezier(.16,1,.3,1) both}.v2-motion-stagger .v2-region-main:nth-of-type(2){animation-delay:.06s}.v2-motion-stagger .v2-region-main:nth-of-type(3){animation-delay:.12s}.v2-motion-stagger .v2-region-main:nth-of-type(4){animation-delay:.18s}.v2-motion-cinematic .v2-region-main{animation:v2-cinema .8s cubic-bezier(.2,.8,.2,1) both}@keyframes v2-reveal{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}@keyframes v2-cinema{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}}`;
}

const mobileSafetyCss = `@media(max-width:640px){.v2-section{padding-left:1.1rem!important;padding-right:1.1rem!important}.v2-column,.v2-form-wrap,.v2-form-wrap label{min-width:0}h1,h2,h3,p,a,span{overflow-wrap:anywhere}.v2-button{max-width:100%;white-space:normal}}`;

// Recursos que solo se inyectan cuando el sitio se renderiza dentro del editor (iframe del builder).
const editorCss = `[data-widget-id],[data-column-id],[data-section-id]{cursor:pointer}
.v2-ed-hover{outline:1px dashed #8b5cf6;outline-offset:2px}
.v2-ed-selected{outline:2px solid #7c3aed!important;outline-offset:2px;position:relative}
.v2-ed-selected[data-v2-label]::before{content:attr(data-v2-label);position:absolute;top:-1.45rem;left:-2px;z-index:999;background:#7c3aed;color:#fff;font:600 .65rem/1 system-ui,sans-serif;padding:.28rem .5rem;border-radius:.25rem .25rem 0 0;white-space:nowrap;pointer-events:none}
[data-editable-text="1"][contenteditable="true"]{cursor:text;outline:2px solid #7c3aed!important;outline-offset:3px;caret-color:#7c3aed}
.v2-column:not(:has([data-widget-id])){min-height:56px;outline:1px dashed #d4d4d8;outline-offset:-4px;border-radius:6px}
.v2-ed-drop-line{position:absolute;height:4px;background:#7c3aed;border-radius:2px;z-index:9999;pointer-events:none;display:none}
.v2-ed-drop-target{outline:2px dashed #7c3aed!important;outline-offset:2px}`;

function editorScript() {
  const labels = `{brand:'Marca',nav:'Navegaci\\u00f3n',heading:'T\\u00edtulo',text:'Texto',image:'Imagen',video:'Video',button:'Bot\\u00f3n',business_info:'Datos del negocio',list:'Lista',gallery:'Galer\\u00eda',testimonials:'Rese\\u00f1as',accordion:'Acorde\\u00f3n',form:'Formulario',social:'Redes',map:'Mapa',divider:'Divisor',spacer:'Espacio',embed:'C\\u00f3digo insertado'}`;
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
document.addEventListener('click',function(event){if(editing)return;event.preventDefault();event.stopPropagation();var target=pick(event.target);if(!target)return;select(target);parent.postMessage({source:'cluster-canvas',kind:kindOf(target),id:idOf(target)},'*');},true);
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
document.addEventListener('keydown',function(event){if(editing&&(event.key==='Enter'||event.key==='Escape')){event.preventDefault();editing.blur();return;}if(!(event.ctrlKey||event.metaKey))return;var key=event.key.toLowerCase();if(key!=='z'&&key!=='y')return;event.preventDefault();parent.postMessage({source:'cluster-canvas',kind:(key==='y'||event.shiftKey)?'redo':'undo'},'*');});
document.addEventListener('contextmenu',function(event){if(editing){event.preventDefault();return;}var target=pick(event.target);if(!target)return;event.preventDefault();select(target);parent.postMessage({source:'cluster-canvas',kind:'context',targetKind:kindOf(target),id:idOf(target),x:event.clientX,y:event.clientY},'*');});
window.addEventListener('message',function(event){var data=event.data||{};if(data.source!=='cluster-editor')return;
if(data.type==='clear-drop')return clearDrop();
if(data.type!=='select')return;if(!data.id)return select(null);var node=document.querySelector('[data-widget-id="'+data.id+'"],[data-column-id="'+data.id+'"],[data-section-id="'+data.id+'"],[data-row-id="'+data.id+'"]');select(node);if(node&&data.scroll)node.scrollIntoView({block:'center',behavior:'smooth'});});
parent.postMessage({source:'cluster-canvas',kind:'ready'},'*');
})();`;
}

function formScript() {
  return `document.querySelectorAll('[data-cluster-form]').forEach(form=>form.addEventListener('submit',async event=>{event.preventDefault();const output=form.querySelector('output');const button=form.querySelector('button');button.disabled=true;output.textContent='Enviando…';try{const response=await fetch(form.dataset.endpoint,{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'No se pudo enviar.');form.reset();output.textContent='Mensaje enviado correctamente.'}catch(error){output.textContent=error.message||'No se pudo enviar.'}finally{button.disabled=false}}));`;
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
  const body = `<div id="top" class="v2-site v2-motion-${theme.motion}">${sections.map((section) => sectionHtml(section, content, theme, input.leadEndpoint, input.editable)).join("")}${input.showBranding ? `<div style="padding:14px;text-align:center;font-size:12px;color:var(--muted)">Creado con Cluster</div>` : ""}</div>${structuredDataHtml}`;
  const css = `${baseCss(theme)}${dynamicCss(sections)}${mobileSafetyCss}${input.editable ? editorCss : ""}`;
  const script = `${formScript()}${input.editable ? editorScript() : ""}`;
  const head = [
    `<meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">`,
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
