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

const FONT_SIZE: Record<NonNullable<StyleTokensV2["fontSize"]>, string> = { xs: ".75rem", sm: ".875rem", md: "1rem", lg: "1.25rem", xl: "1.75rem", "2xl": "2.5rem", display: "clamp(2.8rem,7vw,6rem)" };
const FONT_WEIGHT = { normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 } as const;
const SPACE = { none: "0", sm: ".75rem", md: "1.5rem", lg: "3rem", xl: "5rem" } as const;
const RADIUS = { none: "0", sm: ".25rem", md: ".75rem", lg: "1.5rem", pill: "999px" } as const;
const SHADOW = { none: "none", sm: "0 2px 8px #0001", md: "0 16px 40px #0002", lg: "0 30px 80px #0004" } as const;
const WIDTH = { content: "760px", wide: "1200px", full: "none" } as const;

// Un estilo puede referirse a la paleta por nombre; se resuelve a la variable CSS
// para que siga a la paleta del cliente. `--on-<token>` da texto legible encima.
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

function widgetHtml(widget: WidgetV2, content: SiteContentV2, theme: ThemeTokensV2, leadEndpoint: string, editable = false): string {
  const value = valueFor(widget, content);
  const inlineEditable = editable && (widget.type === "heading" || widget.type === "text" || widget.type === "button");
  const attr = `data-widget-id="${escapeHtml(widget.id)}" data-widget-type="${widget.type}"${inlineEditable ? ' data-editable-text="1"' : ""}`;
  switch (widget.type) {
    case "brand": {
      const name = String(value || content.business.name);
      const logo = safeUrl(content.business.logo);
      return `<a ${attr} class="v2-brand v2-brand-${escapeHtml(widget.variant || "bar")}" href="#top">${logo ? `<img src="${escapeHtml(logo)}" alt="" loading="eager">` : ""}<strong>${escapeHtml(name)}</strong></a>`;
    }
    case "nav": {
      const items = Array.isArray(widget.data?.items) ? widget.data.items : [];
      const links = items.map((item) => { const record = item && typeof item === "object" ? item as Record<string, unknown> : {}; const href = safeUrl(record.href) || "#contact"; return `<a href="${escapeHtml(href)}">${escapeHtml(record.label)}</a>`; }).join("");
      return `<nav ${attr} class="v2-nav-${escapeHtml(widget.variant || "horizontal")}" aria-label="Navegación principal"><button class="v2-nav-toggle" type="button" aria-label="Abrir menú" aria-expanded="false"><span></span><span></span><span></span></button><div class="v2-nav-links">${links}</div></nav>`;
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
      const variant = widget.variant || "cover";
      return `<img ${attr} class="v2-image v2-image-${escapeHtml(variant)}${variant === "background" ? " v2-media-background" : ""}" src="${escapeHtml(source)}" alt="${escapeHtml(widget.data?.alt || content.business.name)}" loading="lazy">`;
    }
    case "video": {
      const source = safeUrl(value);
      if (!source) return editable ? `<div ${attr} class="v2-media-placeholder">Agrega un video</div>` : "";
      const youtube = source.match(/(?:youtu\.be\/|youtube\.com\/watch\?v=)([\w-]{6,20})/i)?.[1];
      const background = widget.variant === "background";
      if (youtube) return `<iframe ${attr} class="v2-video${background ? " v2-media-background" : ""}" src="https://www.youtube-nocookie.com/embed/${escapeHtml(youtube)}${background ? "?autoplay=1&mute=1&loop=1&controls=0" : ""}" title="Video" loading="lazy" allowfullscreen></iframe>`;
      if (!/\.(?:mp4|webm)(?:$|[?#])/i.test(source)) return `<img ${attr} class="v2-image ${background ? "v2-media-background" : "v2-image-cover"}" src="${escapeHtml(source)}" alt="${escapeHtml(content.business.name)}" loading="lazy">`;
      return `<video ${attr} class="v2-video${background ? " v2-media-background" : ""}" src="${escapeHtml(source)}" ${background ? "autoplay muted loop playsinline" : "controls"} preload="metadata"></video>`;
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
      const variant = widget.variant || "grid";
      // El bento tipográfico muestra la descripción de cada foto como leyenda numerada.
      let position = 0;
      return `<div ${attr} class="v2-gallery v2-gallery-${escapeHtml(variant)}">${items.map((item) => { const record = item as Record<string, unknown>; const source = safeUrl(record.url); if (!source) return ""; position += 1; const alt = String(record.alt ?? "").trim(); const caption = variant === "bento" && alt ? `<figcaption><span>${escapeHtml(alt)}</span><span class="v2-gallery-index">${String(position).padStart(2, "0")}</span></figcaption>` : ""; return `<figure><img src="${escapeHtml(source)}" alt="${escapeHtml(record.alt)}" loading="lazy">${caption}</figure>`; }).join("")}</div>`;
    }
    case "testimonials": {
      const reviews = Array.isArray(value) ? value : [];
      if (!reviews.length) return editable ? `<div ${attr} class="v2-empty-placeholder">Agrega reseñas</div>` : "";
      return `<div ${attr} class="v2-testimonials v2-testimonials-${escapeHtml(widget.variant || "cards")}">${reviews.map((item) => { const review = item as Record<string, unknown>; return `<figure><div class="v2-stars" aria-label="${escapeHtml(review.rating || 5)} de 5 estrellas">★★★★★</div><blockquote>“${escapeHtml(review.quote)}”</blockquote><figcaption><strong>${escapeHtml(review.name)}</strong>${review.role ? `<span>${escapeHtml(review.role)}</span>` : ""}</figcaption></figure>`; }).join("")}</div>`;
    }
    case "accordion": {
      const faqs = Array.isArray(value) ? value : [];
      if (!faqs.length) return editable ? `<div ${attr} class="v2-empty-placeholder">Agrega preguntas frecuentes</div>` : "";
      return `<div ${attr} class="v2-accordion v2-accordion-${escapeHtml(widget.variant || "lines")}">${faqs.map((item) => { const faq = item as Record<string, unknown>; return `<details><summary>${escapeHtml(faq.question)}</summary><p>${escapeHtml(faq.answer)}</p></details>`; }).join("")}</div>`;
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
    case "hero_pixel": {
      // Portada a pantalla completa con fondo de puntos animados. Los campos
      // vacíos caen al contenido principal (hero.*) para que la IA lo llene.
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
      const marqueeGroup = `<div class="v2-pxh-group">${marqueeItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div>`;
      const marquee = marqueeItems.length ? `<div class="v2-pxh-trust"><span class="v2-pxh-trust-label">${escapeHtml(marqueeLabel)}</span><div class="v2-pxh-marquee"><div class="v2-pxh-track">${marqueeGroup}<div class="v2-pxh-group" aria-hidden="true">${marqueeItems.map((item) => `<span>${escapeHtml(item)}</span>`).join("")}</div></div></div></div>` : "";
      // 4 partes de gris del tema + 1 de acento, como el diseño original.
      const colors = [theme.muted, theme.muted, theme.muted, theme.muted, theme.accent].join(",");
      return `<div ${attr} class="v2-pxh"><canvas class="v2-pxh-canvas" data-pixel-hero data-colors="${escapeHtml(colors)}" aria-hidden="true"></canvas><div class="v2-pxh-fade" aria-hidden="true"></div><div class="v2-pxh-content"><h1 class="v2-pxh-title">${word1 ? `<em>${escapeHtml(word1)}</em>` : ""}${word2 ? `<strong>${escapeHtml(word2)}</strong>` : ""}</h1>${description ? `<p class="v2-pxh-description">${escapeHtml(description)}</p>` : ""}<div class="v2-pxh-actions"><a class="v2-button" href="${escapeHtml(ctaLink)}">${escapeHtml(ctaText)}</a>${secondaryText ? `<a class="v2-button v2-button-outline" href="${escapeHtml(secondaryLink)}">${escapeHtml(secondaryText)}</a>` : ""}</div></div>${marquee}</div>`;
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
  return `:root{--primary:${theme.primary};--secondary:${theme.secondary};--accent:${theme.accent};--button-text:${buttonText};--footer-text:${footerText};--bg:${theme.background};--text:${theme.text};--muted:${theme.muted};--on-primary:${readableText(theme.primary)};--on-secondary:${footerText};--on-accent:${buttonText};--on-background:${theme.text};--on-text:${readableText(theme.text)};--on-muted:${readableText(theme.muted)};--radius:${radius};--heading:${theme.headingFont};--body:${theme.bodyFont};--heading-case:${theme.headingCase === "uppercase" ? "uppercase" : "none"}}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 var(--body);overflow-x:hidden}img,video,iframe{display:block;max-width:100%}a{color:inherit}.v2-site{display:flex;min-height:100dvh;flex-direction:column;background:var(--bg)}
.v2-section{padding:clamp(3rem,6vw,6rem) max(5vw,1.25rem)}.v2-section-inner{width:min(1200px,100%);margin:auto}.v2-row{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:clamp(1.25rem,3vw,2.5rem);align-items:center}.v2-row+.v2-row{margin-top:clamp(2rem,4vw,4rem)}.v2-column{grid-column:span var(--span-d);display:flex;min-width:0;flex-direction:column;gap:1.25rem}.v2-column>p{max-width:68ch}
h1,h2,h3,p{margin:0}h1,h2,h3{font-family:var(--heading);line-height:1.06;text-wrap:balance;text-transform:var(--heading-case)}h1{max-width:18ch;font-size:clamp(2.6rem,6vw,5.5rem);letter-spacing:${theme.headingCase === "uppercase" ? "0" : "-.045em"}}h2{max-width:24ch;font-size:clamp(2rem,4vw,3.75rem);letter-spacing:${theme.headingCase === "uppercase" ? "0" : "-.03em"}}h3{font-size:clamp(1.1rem,2vw,1.35rem)}
.v2-region-header{position:relative;z-index:20;padding-block:1rem;border-bottom:1px solid color-mix(in srgb,var(--text) 12%,transparent)}.v2-region-header .v2-section-inner{width:min(1320px,100%)}.v2-region-footer{margin-top:auto;background:var(--secondary)!important;color:var(--footer-text)!important}.v2-region-footer .v2-row{align-items:start}.v2-region-footer a{color:inherit}
.v2-brand{display:flex;align-items:center;gap:.75rem;text-decoration:none;font-family:var(--heading)}.v2-brand img{width:42px;height:42px;object-fit:contain}.v2-region-header nav{display:flex;justify-content:flex-end}.v2-nav-links{display:flex;flex-wrap:wrap;justify-content:flex-end;gap:1.25rem}.v2-region-header .v2-nav-links{white-space:nowrap}.v2-region-header nav a{text-decoration:none;font-size:.9rem}
.v2-nav-toggle{display:none;width:44px;height:44px;flex-direction:column;justify-content:center;gap:5px;padding:11px;background:none;border:0;color:inherit;cursor:pointer}.v2-nav-toggle span{display:block;height:2px;width:100%;background:currentColor;border-radius:2px;transition:transform .25s ease,opacity .25s ease}
nav.v2-nav-open .v2-nav-toggle span:nth-child(1){transform:translateY(7px) rotate(45deg)}nav.v2-nav-open .v2-nav-toggle span:nth-child(2){opacity:0}nav.v2-nav-open .v2-nav-toggle span:nth-child(3){transform:translateY(-7px) rotate(-45deg)}
.v2-region-header:has(.v2-nav-pill){border-bottom:0;background:transparent!important}
.v2-column:has(>.v2-nav-pill){flex-direction:row;align-items:center;gap:.45rem;width:max-content;max-width:100%;margin-inline:auto;padding:.4rem .45rem;background:var(--secondary);color:var(--footer-text);border-radius:999px;box-shadow:0 10px 30px #00000014}
.v2-brand-pill{background:var(--accent);border-radius:999px;padding:.4rem .95rem}.v2-brand-pill strong{color:var(--button-text);font-size:.95rem}.v2-brand-pill img{width:24px;height:24px}
.v2-nav-pill{justify-content:center}.v2-nav-pill .v2-nav-links{gap:.35rem;align-items:center}
.v2-nav-pill .v2-nav-links a{display:inline-flex;align-items:center;min-height:38px;padding:.25rem 1.05rem;border:1px solid color-mix(in srgb,var(--footer-text) 38%,transparent);border-radius:999px;color:var(--footer-text)}
.v2-nav-pill .v2-nav-links a:hover{background:color-mix(in srgb,var(--footer-text) 14%,transparent)}
.v2-button{display:inline-flex;width:max-content;min-height:46px;align-items:center;justify-content:center;border:0;border-radius:var(--radius);background:var(--accent);color:var(--button-text);padding:.8rem 1.35rem;font-weight:750;line-height:1.1;text-decoration:none;white-space:nowrap;cursor:pointer;transition:transform .2s ease,filter .2s ease}.v2-button:hover{filter:brightness(.94)}.v2-button:active{transform:translateY(1px)}.v2-button:focus-visible{outline:3px solid color-mix(in srgb,var(--accent) 55%,white);outline-offset:3px}.v2-button-outline{background:transparent;color:currentColor;border:1px solid currentColor}
.v2-image{width:100%;min-height:280px;aspect-ratio:4/3;object-fit:cover;border-radius:var(--radius)}.v2-image-portrait{aspect-ratio:4/5}.v2-image-wide{aspect-ratio:16/8}.v2-image-monochrome{filter:grayscale(1)}
.v2-image-tilt{width:calc(100% - 3rem);max-height:min(56vh,440px);margin:1.9rem 1.5rem 1.25rem;aspect-ratio:4/3;transform:rotate(-4deg);border-radius:1.4rem;box-shadow:22px -22px 0 -4px color-mix(in srgb,currentColor 16%,var(--bg)),0 24px 50px #00000029}.v2-video{width:100%;aspect-ratio:16/9;border:0;background:#09090b;border-radius:var(--radius)}.v2-key-hero:has(.v2-media-background){padding:0}.v2-key-hero:has(.v2-media-background) .v2-section-inner{width:100%;max-width:none}.v2-key-hero .v2-column:has(>.v2-media-background){position:relative;isolation:isolate;min-height:clamp(560px,78dvh,820px);justify-content:center;align-items:flex-start;overflow:hidden;padding:clamp(3rem,8vw,7rem) max(6vw,1.5rem);color:#fff}.v2-key-hero .v2-column:has(>.v2-media-background)::after{content:"";position:absolute;inset:0;z-index:-1;background:rgb(0 0 0/.56);pointer-events:none}.v2-key-hero .v2-media-background{position:absolute;inset:0;z-index:-2;width:100%;height:100%;min-height:100%;aspect-ratio:auto;object-fit:cover;border:0;border-radius:0;pointer-events:none}.v2-key-hero .v2-column:has(>.v2-media-background)>h1,.v2-key-hero .v2-column:has(>.v2-media-background)>p{max-width:min(720px,90%)}.v2-media-placeholder,.v2-empty-placeholder{display:grid;min-height:120px;place-items:center;border:1px dashed currentColor;border-radius:var(--radius);padding:1rem;opacity:.58}
.v2-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:1rem}.v2-list article,.v2-testimonials figure{margin:0;padding:clamp(1.25rem,2.5vw,2rem);border:1px solid color-mix(in srgb,currentColor 14%,transparent);border-radius:var(--radius);background:color-mix(in srgb,currentColor 6%,transparent)}.v2-list article h3{margin:.55rem 0}.v2-list article p,.v2-list article small{color:color-mix(in srgb,currentColor 72%,transparent)}.v2-list article img{width:100%;aspect-ratio:4/3;object-fit:cover;border-radius:calc(var(--radius)/2);margin-bottom:1rem}.v2-list-minimal{display:block}.v2-list-minimal article{border:0;border-bottom:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:0;background:none}.v2-list-minimal article:last-child{border-bottom:0}.v2-list-minimal article img{display:none}.v2-list-editorial article:nth-child(even){transform:translateY(1.5rem)}.v2-list-bento{grid-template-columns:repeat(12,minmax(0,1fr))}.v2-list-bento article{grid-column:span 5}.v2-list-bento article:nth-child(3n+1){grid-column:span 7}.v2-list-metrics{grid-template-columns:repeat(auto-fit,minmax(150px,1fr))}.v2-list-metrics article{text-align:center}.v2-list-metrics h3{font-size:clamp(1.75rem,4vw,3rem)}.v2-list-metrics .v2-index{color:currentColor;opacity:.62}.v2-index{font:700 .75rem monospace;color:var(--primary)}
.v2-gallery{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:1rem}.v2-gallery figure{grid-column:span 4;margin:0;overflow:hidden;border-radius:var(--radius)}.v2-gallery img{width:100%;height:clamp(220px,24vw,340px);object-fit:cover}.v2-gallery-mosaic figure:first-child{grid-column:span 8;grid-row:span 2}.v2-gallery-mosaic figure:first-child img{height:100%;min-height:576px}.v2-gallery-filmstrip{display:flex;overflow-x:auto;scroll-snap-type:x mandatory;scrollbar-width:none;-ms-overflow-style:none;cursor:grab;-webkit-mask-image:linear-gradient(to right,transparent,#000 4%,#000 96%,transparent);mask-image:linear-gradient(to right,transparent,#000 4%,#000 96%,transparent)}.v2-gallery-filmstrip::-webkit-scrollbar{display:none}.v2-gallery-filmstrip figure{min-width:min(70%,780px);scroll-snap-align:start}.v2-gallery-filmstrip.v2-dragging{cursor:grabbing;scroll-snap-type:none}.v2-gallery-filmstrip.v2-dragging img{pointer-events:none}
.v2-gallery-bento{grid-auto-flow:dense;gap:1.1rem}.v2-gallery-bento figure{position:relative;grid-column:span 5}.v2-gallery-bento figure:nth-child(4n+1),.v2-gallery-bento figure:nth-child(4n){grid-column:span 7}.v2-gallery-bento img{height:clamp(260px,26vw,380px);transition:transform .6s cubic-bezier(.22,1,.36,1)}@media(hover:hover){.v2-gallery-bento figure:hover img{transform:scale(1.045)}}
.v2-gallery-bento figcaption{position:absolute;inset:auto 0 0 0;display:flex;align-items:baseline;justify-content:space-between;gap:1rem;padding:2.4rem 1.2rem .95rem;background:linear-gradient(transparent,rgba(0,0,0,.66));color:#fff;font-family:var(--heading);font-size:1.1rem;font-weight:600;text-transform:var(--heading-case)}.v2-gallery-index{font:600 .7rem/1 var(--body);letter-spacing:.16em;opacity:.72}
.v2-testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.v2-testimonials blockquote{display:-webkit-box;overflow:hidden;margin:1rem 0;font-size:1.05rem;-webkit-box-orient:vertical;-webkit-line-clamp:3}.v2-testimonials figcaption{display:flex;flex-direction:column}.v2-testimonials-quotes figure{border:0;background:none}.v2-stars{color:var(--accent);letter-spacing:.08em}
.v2-accordion{max-width:900px}.v2-accordion details{border-bottom:1px solid color-mix(in srgb,currentColor 18%,transparent);padding:1rem 0}.v2-accordion summary{cursor:pointer;font-weight:700}.v2-accordion details p{margin-top:.75rem;color:color-mix(in srgb,currentColor 74%,transparent)}
.v2-accordion-cards{width:100%;max-width:900px;margin-inline:auto}.v2-accordion-cards details{border:0;margin-bottom:.85rem;padding:1.05rem 1.35rem;background:color-mix(in srgb,currentColor 9%,transparent);border-radius:calc(var(--radius));transition:background .2s ease}.v2-accordion-cards details[open]{background:color-mix(in srgb,currentColor 14%,transparent)}.v2-accordion-cards details:last-child{margin-bottom:0}.v2-business-info{display:flex;flex-direction:column;gap:.5rem;font-style:normal}
.v2-form-wrap form{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.5rem;padding:clamp(1.25rem,3vw,2rem);border:1px solid color-mix(in srgb,var(--text) 22%,transparent);border-radius:var(--radius);background:color-mix(in srgb,var(--bg) 94%,var(--primary));color:var(--text)}.v2-form-wrap label{display:grid;gap:.4rem;font-size:.875rem;font-weight:650}.v2-form-wrap input,.v2-form-wrap textarea{width:100%;min-height:46px;padding:.75rem;border:1px solid color-mix(in srgb,currentColor 40%,transparent);border-radius:calc(var(--radius)/2);background:color-mix(in srgb,var(--bg) 97%,var(--text));color:var(--text);font:inherit}.v2-form-wrap input:focus,.v2-form-wrap textarea:focus{outline:3px solid color-mix(in srgb,var(--accent) 45%,transparent);border-color:var(--accent)}.v2-form-wrap textarea{min-height:130px}.v2-wide,.v2-form-wrap output,.v2-form-wrap button{grid-column:1/-1}.v2-trap{display:none}
.v2-social{display:flex;flex-wrap:wrap;gap:.75rem}.v2-social a{text-underline-offset:.25em}.v2-map{display:flex;min-height:280px;flex-direction:column;justify-content:flex-end;padding:1.5rem;border-radius:var(--radius);background:color-mix(in srgb,var(--primary) 15%,var(--bg));text-decoration:none}.v2-map strong{font-size:1.35rem}.v2-spacer-sm{height:1rem}.v2-spacer-md{height:2.5rem}.v2-spacer-lg{height:5rem}.v2-embed{width:100%;border:0;border-radius:var(--radius);background:#fff}
/* HVAC Premium: faithful service-business composition built from normal V2 widgets. */
.v2-site:has(.v2-brand-hvac){--hvac-blue:#3b82f6;background:#fff;color:#111;font-size:16px;line-height:1.35}
.v2-site:has(.v2-brand-hvac) .v2-section-inner{width:min(1240px,100%)}
.v2-site:has(.v2-brand-hvac) .v2-region-header{position:sticky;top:0;z-index:50;padding:.9rem max(1.25rem,2vw)!important;background:#fff;border-bottom:1px solid #ececec}
.v2-site:has(.v2-brand-hvac) .v2-region-header .v2-section-inner{width:min(1260px,100%)}
.v2-site:has(.v2-brand-hvac) .v2-region-header .v2-row{gap:1rem;align-items:center}
.v2-site:has(.v2-brand-hvac) .v2-region-header .v2-column{gap:0;justify-content:center}
.v2-site:has(.v2-brand-hvac) .v2-region-header .v2-column:last-child{align-items:flex-end}
.v2-brand-hvac{gap:.45rem;font-size:1.25rem;letter-spacing:-.04em}.v2-brand-hvac::before{content:"≋";display:grid;width:24px;height:24px;place-items:center;border-radius:50%;background:var(--hvac-blue);color:#fff;font-size:1.5rem;font-weight:900;line-height:1;transform:rotate(-12deg)}
.v2-site:has(.v2-brand-hvac) .v2-nav-hvac{justify-content:center}.v2-site:has(.v2-brand-hvac) .v2-nav-hvac .v2-nav-links{gap:1.75rem}.v2-site:has(.v2-brand-hvac) .v2-nav-hvac a{font-size:1rem}
.v2-site:has(.v2-brand-hvac) .v2-button{min-height:44px;border-radius:8px;background:var(--hvac-blue);padding:.8rem 1.35rem;font-weight:700}
.v2-site:has(.v2-brand-hvac) .v2-key-hero{padding:12px 20px 0!important}
.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-section-inner{width:100%;max-width:none}
.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-column:has(>.v2-media-background){min-height:min(calc(100dvh - 102px),860px);padding:clamp(3rem,7vw,6rem) clamp(2rem,17.5vw,21rem);border-radius:11px;justify-content:flex-start;gap:1rem}
.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-column:has(>.v2-media-background)::after{background:rgb(0 0 0/.58)}
.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-media-background{border-radius:11px}
.v2-site:has(.v2-brand-hvac) .v2-key-hero h1{max-width:18ch;font-size:clamp(3rem,4.1vw,4.65rem);font-weight:400;line-height:1.04;letter-spacing:-.045em}
.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-column>p{max-width:42rem}.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-column>p:first-of-type{font-size:.95rem;font-weight:700}.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-column>p:nth-of-type(2){max-width:34rem;font-size:1.05rem;font-weight:600;line-height:1.25}
.v2-list-hvac-hero-trust{display:flex;max-width:32rem;flex-direction:column;gap:.55rem}.v2-list-hvac-hero-trust article{display:block;padding:0;border:0;background:none}.v2-list-hvac-hero-trust article:nth-child(n+4){display:none}.v2-list-hvac-hero-trust .v2-index,.v2-list-hvac-hero-trust p,.v2-list-hvac-hero-trust img{display:none}.v2-list-hvac-hero-trust h3{margin:0;font-size:1rem;font-weight:600}.v2-list-hvac-hero-trust h3::before{content:"✓";margin-right:.55rem;color:var(--hvac-blue);font-weight:900}
.v2-site:has(.v2-brand-hvac) .v2-key-hero>.v2-section-inner>.v2-row>.v2-column>.v2-button{position:absolute;left:clamp(2rem,17.5vw,21rem);bottom:4.9rem}
.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-business-info{position:absolute;left:calc(clamp(2rem,17.5vw,21rem) + 11.2rem);bottom:4.9rem;min-height:44px;justify-content:center;padding:.55rem 1.2rem;border:1px solid #ffffff55;border-radius:8px;background:#ffffff22;backdrop-filter:blur(8px)}
.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-business-info strong,.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-business-info a[href^="mailto"],.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-business-info span{display:none}.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-business-info a{font-weight:700;text-decoration:none}
.v2-testimonials-hvac-rating{position:absolute;right:clamp(2rem,17vw,20rem);bottom:4.9rem;display:block}.v2-testimonials-hvac-rating figure{min-width:250px;padding:1.1rem 1.35rem;border:1px solid #ffffff22;border-radius:8px;background:#111827cc;backdrop-filter:blur(10px)}.v2-testimonials-hvac-rating figure:not(:first-child),.v2-testimonials-hvac-rating blockquote{display:none}.v2-testimonials-hvac-rating figure::before{content:"G";float:left;display:grid;width:42px;height:42px;margin-right:.8rem;place-items:center;border-radius:50%;background:#fff;color:var(--hvac-blue);font-size:1.35rem;font-weight:900}.v2-testimonials-hvac-rating .v2-stars{font-size:.9rem}.v2-testimonials-hvac-rating figcaption strong::after{content:" · 4.9 out of 5"}.v2-testimonials-hvac-rating figcaption span::before{content:"From 250+ Reviews";font-size:.85rem}.v2-testimonials-hvac-rating figcaption span{font-size:0}
.v2-site:has(.v2-brand-hvac) .v2-region-main:not(.v2-key-hero){padding:clamp(5rem,8vw,8rem) max(1.25rem,5vw)!important}.v2-site:has(.v2-brand-hvac) .v2-region-main h2{font-size:clamp(2.4rem,3.6vw,3.75rem);font-weight:400;line-height:1.08;letter-spacing:-.045em}.v2-site:has(.v2-brand-hvac) .v2-region-main .v2-column>p:first-child:not(:only-child){font-size:.78rem;font-weight:600;color:#3f3f46}.v2-site:has(.v2-brand-hvac) .v2-region-main .v2-column>p:first-child:not(:only-child)::before{content:"⌘";margin-right:.45rem;color:var(--hvac-blue)}
.v2-list-hvac-stats{grid-template-columns:repeat(4,1fr);gap:0;padding:2.75rem 2rem;border:1px solid #dedede;border-radius:9px;background:repeating-linear-gradient(135deg,#fff,#fff 5px,#f5f5f5 5px,#f5f5f5 7px)}.v2-list-hvac-stats article{padding:0 1.75rem;border:0;background:none}.v2-list-hvac-stats .v2-index,.v2-list-hvac-stats img{display:none}.v2-list-hvac-stats h3{margin:0;font-size:clamp(2.25rem,3.5vw,3.5rem);font-weight:400;letter-spacing:-.05em}.v2-list-hvac-stats p{font-size:1rem;color:#444}
.v2-list-hvac-services{display:block}.v2-list-hvac-services article{display:grid;min-height:240px;grid-template-columns:1.2fr 1.2fr .9fr;grid-template-areas:"title copy image";align-items:start;gap:2rem;padding:2.6rem 0;border:0;border-bottom:1px solid #ddd;border-radius:0;background:none}.v2-list-hvac-services .v2-index{display:none}.v2-list-hvac-services h3{grid-area:title;margin:0;font-size:1.8rem;font-weight:400;letter-spacing:-.035em}.v2-list-hvac-services p{grid-area:copy;margin:0;font-size:1rem;color:#333}.v2-list-hvac-services img{grid-area:image;width:100%;height:190px;margin:0;border-radius:8px;object-fit:cover}
.v2-key-services>.v2-section-inner>.v2-row>.v2-column>.v2-button{margin-top:1.5rem}
.v2-list-hvac-features{grid-template-columns:repeat(3,1fr);gap:1rem}.v2-list-hvac-features article{min-height:180px;padding:1.6rem;border:1px solid #ddd;border-radius:8px;background:#fff}.v2-list-hvac-features .v2-index{display:grid;width:40px;height:40px;place-items:center;border:1px solid #ddd;border-radius:5px;color:#111}.v2-list-hvac-features h3{font-size:1.35rem;font-weight:400}.v2-list-hvac-features p{color:#444}
.v2-key-reviews{text-align:center}.v2-testimonials-hvac-wall{grid-template-columns:repeat(3,1fr);text-align:left}.v2-testimonials-hvac-wall figure{min-height:250px;border:1px solid #ddd;border-radius:8px;background:#fff}.v2-testimonials-hvac-wall blockquote{display:block;overflow:visible;font-size:1.05rem;-webkit-line-clamp:unset}.v2-testimonials-hvac-wall figcaption{padding-top:1rem;border-top:1px solid #e5e5e5}.v2-key-reviews>.v2-section-inner>.v2-row>.v2-column>.v2-button{margin:2rem auto 0}
.v2-key-hvac-financing{margin:3rem max(1.25rem,5vw);padding:6rem 2rem!important;border-radius:10px;text-align:center}.v2-key-hvac-financing .v2-column{align-items:center}.v2-key-hvac-financing h2{max-width:23ch}.v2-key-hvac-financing .v2-button{margin-top:1rem}
.v2-key-hvac-service-areas .v2-map{min-height:390px;justify-content:flex-end;border:1px solid #ddd;background:repeating-linear-gradient(135deg,#fff,#fff 5px,#f4f4f4 5px,#f4f4f4 7px)}.v2-key-hvac-service-areas .v2-map::before{content:"Service coverage";display:grid;min-height:250px;margin-bottom:1rem;place-items:center;background:#f0f5fb;color:var(--hvac-blue);font-size:1.25rem}.v2-key-hvac-service-areas .v2-business-info{gap:.7rem}.v2-key-hvac-service-areas .v2-button{margin-top:1rem}
.v2-gallery-hvac-works{grid-template-columns:1fr 1fr;gap:1.5rem}.v2-gallery-hvac-works figure{grid-column:auto;border-radius:8px}.v2-gallery-hvac-works figure:nth-child(n+3){display:none}.v2-gallery-hvac-works img{height:360px}
.v2-list-hvac-process{grid-template-columns:repeat(4,1fr);gap:1rem}.v2-list-hvac-process article{min-height:220px;padding:1.5rem;border:1px solid #ddd;border-radius:8px;background:#fff}.v2-list-hvac-process .v2-index{display:grid;width:48px;height:48px;place-items:center;border:1px solid #ddd;border-radius:6px;color:#111;font-size:1rem}.v2-list-hvac-process h3{font-size:1.3rem;font-weight:400}.v2-list-hvac-process p{color:#555}
.v2-accordion-hvac{width:100%;max-width:none}.v2-accordion-hvac details{margin-bottom:.6rem;padding:1rem 1.2rem;border:1px solid #ddd;border-radius:7px}.v2-accordion-hvac summary{display:flex;justify-content:space-between;font-weight:400;list-style:none}.v2-accordion-hvac summary::after{content:"+";font-size:1.25rem}.v2-accordion-hvac details[open] summary::after{content:"−"}
.v2-site:has(.v2-brand-hvac) .v2-key-contact{width:min(930px,calc(100% - 2.5rem));margin:1rem auto 7rem;padding:5rem 2rem!important;border-radius:9px;background:#30343b!important;color:#fff;text-align:center}.v2-site:has(.v2-brand-hvac) .v2-key-contact .v2-column{align-items:center}.v2-site:has(.v2-brand-hvac) .v2-key-contact h2{font-size:2.3rem}.v2-site:has(.v2-brand-hvac) .v2-key-contact p{max-width:39rem}.v2-site:has(.v2-brand-hvac) .v2-key-contact .v2-business-info strong,.v2-site:has(.v2-brand-hvac) .v2-key-contact .v2-business-info a[href^="mailto"],.v2-site:has(.v2-brand-hvac) .v2-key-contact .v2-business-info span{display:none}.v2-site:has(.v2-brand-hvac) .v2-key-contact .v2-business-info a{color:#fff;text-decoration:none}
.v2-site:has(.v2-brand-hvac) .v2-region-footer{padding:5rem max(1.25rem,5vw)!important;background:#fff!important;color:#111!important;border-top:1px solid #eee}.v2-site:has(.v2-brand-hvac) .v2-region-footer .v2-row:first-child{padding-bottom:2.5rem;border-bottom:1px solid #ddd}.v2-site:has(.v2-brand-hvac) .v2-region-footer .v2-nav-links{flex-direction:column;gap:.5rem}.v2-site:has(.v2-brand-hvac) .v2-region-footer nav{justify-content:flex-start}.v2-list-hvac-footer-services{display:block}.v2-list-hvac-footer-services article{padding:.2rem 0;border:0;background:none}.v2-list-hvac-footer-services .v2-index,.v2-list-hvac-footer-services p,.v2-list-hvac-footer-services img{display:none}.v2-list-hvac-footer-services h3{margin:0;font-size:1rem;font-weight:400}.v2-brand-hvac-footer{margin-top:3rem;opacity:.2}.v2-brand-hvac-footer strong{font-size:clamp(4rem,10vw,9rem);font-weight:400;letter-spacing:-.06em}.v2-brand-hvac-footer::before{content:"≋";color:var(--hvac-blue);font-size:8rem}
@media(max-width:1024px){.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-column:has(>.v2-media-background){padding-inline:3rem}.v2-site:has(.v2-brand-hvac) .v2-key-hero>.v2-section-inner>.v2-row>.v2-column>.v2-button{left:3rem}.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-business-info{left:14.2rem}.v2-testimonials-hvac-rating{right:3rem}.v2-list-hvac-features,.v2-testimonials-hvac-wall{grid-template-columns:repeat(2,1fr)}.v2-list-hvac-services article{grid-template-columns:1fr 1fr;grid-template-areas:"title image" "copy image"}.v2-list-hvac-stats{grid-template-columns:repeat(2,1fr);gap:2rem}.v2-list-hvac-process{grid-template-columns:repeat(2,1fr)}}
@media(max-width:640px){.v2-site:has(.v2-brand-hvac) .v2-region-header .v2-column:last-child{display:none}.v2-site:has(.v2-brand-hvac) .v2-key-hero{padding:0!important}.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-column:has(>.v2-media-background){min-height:720px;padding:4rem 1.25rem 10rem;border-radius:0}.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-media-background{border-radius:0}.v2-site:has(.v2-brand-hvac) .v2-key-hero h1{font-size:2.8rem}.v2-site:has(.v2-brand-hvac) .v2-key-hero>.v2-section-inner>.v2-row>.v2-column>.v2-button{left:1.25rem;bottom:6.5rem}.v2-site:has(.v2-brand-hvac) .v2-key-hero .v2-business-info{left:1.25rem;bottom:2.75rem}.v2-testimonials-hvac-rating{display:none}.v2-list-hvac-stats,.v2-list-hvac-features,.v2-testimonials-hvac-wall,.v2-gallery-hvac-works,.v2-list-hvac-process{grid-template-columns:1fr}.v2-list-hvac-services article{grid-template-columns:1fr;grid-template-areas:"image" "title" "copy"}.v2-list-hvac-services img{height:220px}.v2-key-hvac-financing{margin:0}.v2-brand-hvac-footer strong{font-size:3.5rem}.v2-brand-hvac-footer::before{font-size:4rem}}
.v2-pxh{position:relative;isolation:isolate;overflow:hidden;display:flex;width:100vw;min-height:min(94dvh,880px);flex-direction:column;justify-content:center;gap:clamp(2rem,5vh,3.5rem);margin-inline:calc(50% - 50vw);padding:clamp(3.5rem,9vh,6rem) max(5vw,1.25rem);background:var(--secondary);color:var(--footer-text);text-align:center}
.v2-section:has(>.v2-section-inner .v2-pxh){padding:0}.v2-section:has(>.v2-section-inner .v2-pxh) .v2-section-inner{width:100%}
.v2-pxh-content{margin-block:auto}.v2-pxh-trust{margin-top:auto}
.v2-pxh-canvas{position:absolute;inset:0;z-index:-2;width:100%;height:100%}.v2-pxh-fade{position:absolute;inset:0;z-index:-1;background:radial-gradient(circle at center,transparent 0%,var(--secondary) 100%);opacity:.8;pointer-events:none}
.v2-pxh-content{display:flex;flex-direction:column;align-items:center;gap:1.5rem}
.v2-pxh-title{display:flex;max-width:none;flex-wrap:wrap;justify-content:center;column-gap:.3em;font-size:clamp(2.8rem,8vw,7rem);line-height:1;letter-spacing:normal;filter:drop-shadow(0 15px 35px #0006) drop-shadow(0 5px 10px #0003)}
.v2-pxh-title em{font-family:Georgia,'Times New Roman',serif;font-style:italic;font-weight:500}.v2-pxh-title strong{font-family:var(--heading);font-weight:900;letter-spacing:-.045em}
@supports(-webkit-background-clip:text){.v2-pxh-title{color:transparent;background:linear-gradient(135deg,var(--footer-text) 0%,color-mix(in srgb,var(--footer-text) 60%,transparent) 25%,color-mix(in srgb,var(--footer-text) 38%,transparent) 45%,color-mix(in srgb,var(--footer-text) 92%,transparent) 55%,color-mix(in srgb,var(--footer-text) 50%,transparent) 75%,var(--footer-text) 100%);background-size:200% auto;-webkit-background-clip:text;background-clip:text;-webkit-text-stroke:1.5px color-mix(in srgb,var(--footer-text) 32%,transparent);animation:v2-pxh-shimmer 8s linear infinite}}
.v2-pxh-description{max-width:42rem;margin-inline:auto;font-size:clamp(1rem,1.6vw,1.25rem);font-weight:300;opacity:.85}
.v2-pxh-actions{display:flex;flex-wrap:wrap;justify-content:center;gap:.75rem}.v2-pxh-actions .v2-button-outline{border-color:color-mix(in srgb,var(--footer-text) 45%,transparent)}
.v2-pxh-trust{display:flex;flex-direction:column;gap:1rem}.v2-pxh-trust-label{font-size:.72rem;font-weight:600;letter-spacing:.12em;text-transform:uppercase;opacity:.65}
.v2-pxh-marquee{width:min(64rem,100%);margin-inline:auto;overflow:hidden;-webkit-mask-image:linear-gradient(to right,transparent,#000 15%,#000 85%,transparent);mask-image:linear-gradient(to right,transparent,#000 15%,#000 85%,transparent)}
.v2-pxh-track{display:flex;width:max-content;gap:3rem;padding-block:.5rem;animation:v2-pxh-marquee 25s linear infinite}.v2-pxh-group{display:flex;align-items:center;gap:3rem}.v2-pxh-group span{font-family:var(--heading);font-size:1.05rem;font-weight:700;white-space:nowrap;opacity:.6}
@keyframes v2-pxh-shimmer{0%{background-position:200% center}100%{background-position:0% center}}@keyframes v2-pxh-marquee{to{transform:translateX(calc(-50% - 1.5rem))}}
@media(prefers-reduced-motion:reduce){.v2-pxh-title{animation:none}.v2-pxh-track{animation:none}}
@media(max-width:1024px){.v2-column{grid-column:span var(--span-t)}.v2-section{padding-block:clamp(3rem,7vw,5rem)}.v2-region-header .v2-nav-links{gap:.8rem}.v2-list-bento article,.v2-list-bento article:nth-child(3n+1){grid-column:span 6}}
@media(max-width:640px){.v2-row{gap:1.25rem}.v2-column{grid-column:span var(--span-m)}.v2-section{padding:3rem 1.1rem}.v2-region-header{padding-block:.75rem}.v2-region-header .v2-row{display:flex;align-items:center;justify-content:space-between}.v2-region-header .v2-nav-toggle{display:flex}.v2-region-header .v2-nav-links{display:none}
.v2-region-header nav.v2-nav-open .v2-nav-links{position:absolute;left:0;right:0;top:100%;z-index:40;display:flex;flex-direction:column;align-items:stretch;gap:0;padding:.4rem 1.1rem 1rem;background:var(--bg);color:var(--text);border-bottom:1px solid color-mix(in srgb,var(--text) 14%,transparent);box-shadow:0 24px 48px #00000026;white-space:normal}
.v2-region-header nav.v2-nav-open .v2-nav-links a{padding:.9rem .15rem;font-size:1rem;border-bottom:1px solid color-mix(in srgb,var(--text) 8%,transparent)}.v2-region-header nav.v2-nav-open .v2-nav-links a:last-child{border-bottom:0}h1{font-size:clamp(2.35rem,13vw,4rem)}h2{font-size:clamp(1.9rem,10vw,3rem)}.v2-list-bento article,.v2-list-bento article:nth-child(3n+1){grid-column:1/-1}.v2-gallery figure{grid-column:span 6}.v2-gallery-bento figure,.v2-gallery-bento figure:nth-child(4n+1),.v2-gallery-bento figure:nth-child(4n){grid-column:1/-1}.v2-gallery-mosaic figure:first-child{grid-column:1/-1}.v2-gallery-mosaic figure:first-child img{min-height:360px}.v2-gallery-filmstrip figure{min-width:88%}.v2-form-wrap form{grid-template-columns:1fr}.v2-form-wrap label,.v2-form-wrap button,.v2-form-wrap output{grid-column:1}.v2-button{max-width:100%;white-space:normal}}
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
document.addEventListener('keydown',function(event){if(editing&&(event.key==='Enter'||event.key==='Escape')){event.preventDefault();editing.blur();return;}if(!(event.ctrlKey||event.metaKey))return;var key=event.key.toLowerCase();if(key!=='z'&&key!=='y')return;event.preventDefault();parent.postMessage({source:'cluster-canvas',kind:(key==='y'||event.shiftKey)?'redo':'undo'},'*');});
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
  const body = `<div id="top" class="v2-site v2-motion-${theme.motion}">${sections.map((section) => sectionHtml(section, content, theme, input.leadEndpoint, input.editable)).join("")}${input.showBranding ? `<div style="padding:14px;text-align:center;font-size:12px;color:var(--muted)">Creado con Cluster</div>` : ""}</div>${structuredDataHtml}`;
  const css = `${baseCss(theme)}${dynamicCss(sections)}${mobileSafetyCss}${input.editable ? editorCss : ""}`;
  const hasPixelHero = sections.some((section) => section.rows.some((row) => row.columns.some((column) => column.widgets.some((widget) => widget.type === "hero_pixel"))));
  const script = `${formScript()}${navScript()}${galleryScript()}${hasPixelHero ? pixelHeroScript() : ""}${input.editable ? editorScript() : ""}`;
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
