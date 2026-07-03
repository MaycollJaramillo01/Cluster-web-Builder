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
  /** Modo editor: resalta elementos al pasar el cursor y reporta clics al padre via postMessage. */
  editable?: boolean;
};

export type RenderedSiteV2 = { html: string; body: string; css: string; script: string };

const escapeHtml = (value: unknown) => String(value ?? "").replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);
const safeUrl = (value: unknown) => {
  const clean = sanitizeLink(typeof value === "string" ? value : "");
  return clean.startsWith("http://") ? "" : clean;
};

const FONT_SIZE: Record<NonNullable<StyleTokensV2["fontSize"]>, string> = { xs: ".75rem", sm: ".875rem", md: "1rem", lg: "1.25rem", xl: "1.75rem", "2xl": "2.5rem", display: "clamp(3rem,8vw,7.5rem)" };
const FONT_WEIGHT = { normal: 400, medium: 500, semibold: 600, bold: 700, black: 900 } as const;
const SPACE = { none: "0", sm: ".75rem", md: "1.5rem", lg: "3rem", xl: "5rem" } as const;
const RADIUS = { none: "0", sm: ".25rem", md: ".75rem", lg: "1.5rem", pill: "999px" } as const;
const SHADOW = { none: "none", sm: "0 2px 8px #0001", md: "0 16px 40px #0002", lg: "0 30px 80px #0004" } as const;
const WIDTH = { content: "760px", wide: "1200px", full: "none" } as const;

function tokensCss(style?: StyleTokensV2) {
  if (!style) return "";
  return [
    style.color && `color:${style.color}`, style.background && `background:${style.background}`,
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

function widgetHtml(widget: WidgetV2, content: SiteContentV2, theme: ThemeTokensV2, leadEndpoint: string): string {
  const value = valueFor(widget, content);
  const attr = `data-widget-id="${escapeHtml(widget.id)}" data-widget-type="${widget.type}"`;
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
      return `<${level} ${attr}>${escapeHtml(value)}</${level}>`;
    }
    case "text": return `<p ${attr}>${escapeHtml(value)}</p>`;
    case "image": {
      const source = safeUrl(value);
      if (!source) return `<div ${attr} class="v2-media-placeholder">Agrega una imagen</div>`;
      return `<img ${attr} class="v2-image v2-image-${escapeHtml(widget.variant || "cover")}" src="${escapeHtml(source)}" alt="${escapeHtml(widget.data?.alt || content.business.name)}" loading="lazy">`;
    }
    case "video": {
      const source = safeUrl(value);
      if (!source) return `<div ${attr} class="v2-media-placeholder">Agrega un video</div>`;
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
      return `<div ${attr} class="v2-list v2-list-${escapeHtml(widget.variant || "cards")}">${items.map((item, index) => { const record = item as Record<string, unknown>; return `<article><span class="v2-index">${String(index + 1).padStart(2, "0")}</span>${record.image ? `<img src="${escapeHtml(safeUrl(record.image))}" alt="" loading="lazy">` : ""}<h3>${escapeHtml(record.title)}</h3><p>${escapeHtml(record.description)}</p>${record.meta ? `<small>${escapeHtml(record.meta)}</small>` : ""}</article>`; }).join("")}</div>`;
    }
    case "gallery": {
      const items = Array.isArray(value) ? value : [];
      return `<div ${attr} class="v2-gallery v2-gallery-${escapeHtml(widget.variant || "grid")}">${items.map((item) => { const record = item as Record<string, unknown>; const source = safeUrl(record.url); return source ? `<figure><img src="${escapeHtml(source)}" alt="${escapeHtml(record.alt)}" loading="lazy"></figure>` : ""; }).join("")}</div>`;
    }
    case "testimonials": {
      const reviews = Array.isArray(value) ? value : [];
      return `<div ${attr} class="v2-testimonials v2-testimonials-${escapeHtml(widget.variant || "cards")}">${reviews.map((item) => { const review = item as Record<string, unknown>; return `<figure><div class="v2-stars" aria-label="${escapeHtml(review.rating || 5)} de 5 estrellas">★★★★★</div><blockquote>“${escapeHtml(review.quote)}”</blockquote><figcaption><strong>${escapeHtml(review.name)}</strong>${review.role ? `<span>${escapeHtml(review.role)}</span>` : ""}</figcaption></figure>`; }).join("")}</div>`;
    }
    case "accordion": {
      const faqs = Array.isArray(value) ? value : [];
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
      return `<nav ${attr} class="v2-social" aria-label="Redes sociales">${links.map(([label, href]) => { const safe = safeUrl(href); return safe ? `<a href="${escapeHtml(safe)}" target="_blank" rel="noreferrer">${escapeHtml(label)}</a>` : ""; }).join("")}</nav>`;
    }
    case "map": {
      const location = String(value || content.business.location);
      return `<a ${attr} class="v2-map" href="https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(location)}" target="_blank" rel="noreferrer"><span>Ubicación</span><strong>${escapeHtml(location)}</strong><small>Abrir en Google Maps ↗</small></a>`;
    }
    case "divider": return `<hr ${attr}>`;
    case "spacer": return `<div ${attr} aria-hidden class="v2-spacer v2-spacer-${escapeHtml(String(widget.data?.size || "md"))}"></div>`;
    case "embed": {
      const code = typeof widget.data?.html === "string" ? widget.data.html.slice(0, 8000) : "";
      if (!code.trim()) return `<div ${attr} class="v2-media-placeholder">Agrega tu código insertado</div>`;
      const height = Math.max(60, Math.min(1200, Number(widget.data?.height) || 300));
      // Sandbox sin allow-same-origin: el código pegado no puede leer cookies ni tocar el resto del sitio.
      return `<iframe ${attr} class="v2-embed" style="height:${height}px" sandbox="allow-scripts allow-popups" loading="lazy" title="Contenido insertado" srcdoc="${escapeHtml(code)}"></iframe>`;
    }
  }
}

function sectionHtml(section: CanvasSectionV2, content: SiteContentV2, theme: ThemeTokensV2, leadEndpoint: string) {
  const rows = section.rows.map((row) => `<div class="v2-row" data-row-id="${escapeHtml(row.id)}">${row.columns.map((column) => `<div class="v2-column" data-column-id="${escapeHtml(column.id)}" style="--span-d:${column.span.desktop};--span-t:${column.span.tablet};--span-m:${column.span.mobile}">${column.widgets.map((widget) => widgetHtml(widget, content, theme, leadEndpoint)).join("")}</div>`).join("")}</div>`).join("");
  return `<section id="${escapeHtml(section.key)}" class="v2-section v2-region-${section.region}" data-section-id="${escapeHtml(section.id)}"><div class="v2-section-inner">${rows}</div></section>`;
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
  return `:root{--primary:${theme.primary};--secondary:${theme.secondary};--accent:${theme.accent};--bg:${theme.background};--text:${theme.text};--muted:${theme.muted};--radius:${radius};--heading:${theme.headingFont};--body:${theme.bodyFont}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 var(--body);overflow-x:hidden}img,video,iframe{max-width:100%}a{color:inherit}.v2-site{min-height:100vh}.v2-section{padding:4rem max(5vw,1.25rem)}.v2-section-inner{width:min(1200px,100%);margin:auto}.v2-row{display:grid;grid-template-columns:repeat(12,minmax(0,1fr));gap:1.5rem;align-items:center}.v2-row+.v2-row{margin-top:2rem}.v2-column{grid-column:span var(--span-d);display:flex;flex-direction:column;gap:1.25rem;min-width:0}h1,h2,h3,p{margin:0}h1,h2,h3{font-family:var(--heading);line-height:1.04}h1{font-size:clamp(2.8rem,7vw,6.5rem)}h2{font-size:clamp(2rem,4vw,4rem)}h3{font-size:1.25rem}.v2-region-header{position:relative;z-index:20;padding-block:1rem;border-bottom:1px solid color-mix(in srgb,var(--text) 12%,transparent)}.v2-region-footer{background:var(--secondary);color:white}.v2-brand{display:flex;align-items:center;gap:.75rem;text-decoration:none;font-family:var(--heading)}.v2-brand img{width:42px;height:42px;object-fit:contain}.v2-region-header nav{display:flex;justify-content:flex-end;gap:1.25rem}.v2-region-header nav a{text-decoration:none;font-size:.9rem}.v2-button{display:inline-flex;width:max-content;min-height:44px;align-items:center;justify-content:center;border:0;border-radius:var(--radius);background:var(--accent);color:#fff;padding:.75rem 1.25rem;font-weight:700;text-decoration:none;cursor:pointer}.v2-button-outline{background:transparent;color:currentColor;border:1px solid currentColor}.v2-image{width:100%;height:100%;min-height:280px;object-fit:cover;border-radius:var(--radius)}.v2-image-portrait{aspect-ratio:4/5}.v2-image-monochrome{filter:grayscale(1)}.v2-video{width:100%;aspect-ratio:16/9;border:0;background:#000;border-radius:var(--radius)}.v2-media-placeholder{display:grid;min-height:260px;place-items:center;border:1px dashed currentColor;border-radius:var(--radius);opacity:.55}.v2-list{display:grid;grid-template-columns:repeat(auto-fit,minmax(210px,1fr));gap:1rem}.v2-list article,.v2-testimonials figure{margin:0;padding:1.5rem;border:1px solid color-mix(in srgb,currentColor 15%,transparent);border-radius:var(--radius);background:color-mix(in srgb,var(--bg) 94%,var(--primary))}.v2-list article h3{margin:.5rem 0}.v2-list article p,.v2-list article small{color:var(--muted)}.v2-list-minimal{display:block}.v2-list-minimal article{border:0;border-bottom:1px solid color-mix(in srgb,currentColor 18%,transparent);border-radius:0;background:none}.v2-list-editorial article:nth-child(even){transform:translateY(2rem)}.v2-list-metrics article{text-align:center}.v2-list-metrics h3{font-size:2rem}.v2-index{font:700 .75rem monospace;color:var(--primary)}.v2-gallery{display:grid;grid-template-columns:repeat(3,1fr);gap:1rem}.v2-gallery figure{margin:0;overflow:hidden;border-radius:var(--radius)}.v2-gallery img{width:100%;height:280px;object-fit:cover}.v2-gallery-mosaic figure:first-child{grid-column:span 2;grid-row:span 2}.v2-gallery-mosaic figure:first-child img{height:576px}.v2-gallery-filmstrip{display:flex;overflow:auto}.v2-gallery-filmstrip figure{min-width:70%}.v2-testimonials{display:grid;grid-template-columns:repeat(auto-fit,minmax(240px,1fr));gap:1rem}.v2-testimonials blockquote{margin:1rem 0;font-size:1.05rem}.v2-testimonials figcaption{display:flex;flex-direction:column}.v2-testimonials-quotes figure{border:0;background:none}.v2-stars{color:var(--accent);letter-spacing:.1em}.v2-accordion details{border-bottom:1px solid color-mix(in srgb,currentColor 18%,transparent);padding:1rem 0}.v2-accordion summary{cursor:pointer;font-weight:700}.v2-accordion details p{margin-top:.75rem;color:var(--muted)}.v2-business-info{display:flex;flex-direction:column;gap:.5rem;font-style:normal}.v2-form-wrap form{display:grid;grid-template-columns:1fr 1fr;gap:1rem;margin-top:1.5rem;padding:1.5rem;border:1px solid color-mix(in srgb,currentColor 15%,transparent);border-radius:var(--radius);background:color-mix(in srgb,var(--bg) 96%,var(--primary))}.v2-form-wrap label{display:grid;gap:.35rem;font-size:.85rem}.v2-form-wrap input,.v2-form-wrap textarea{width:100%;min-height:44px;padding:.75rem;border:1px solid #8885;border-radius:calc(var(--radius)/2);background:transparent;color:inherit;font:inherit}.v2-form-wrap textarea{min-height:130px}.v2-wide,.v2-form-wrap output,.v2-form-wrap button{grid-column:1/-1}.v2-trap{display:none}.v2-social{display:flex;flex-wrap:wrap;gap:.75rem}.v2-map{display:flex;min-height:260px;flex-direction:column;justify-content:flex-end;padding:1.5rem;border-radius:var(--radius);background:color-mix(in srgb,var(--primary) 15%,var(--bg));text-decoration:none}.v2-map strong{font-size:1.35rem}.v2-spacer-sm{height:1rem}.v2-spacer-md{height:2.5rem}.v2-spacer-lg{height:5rem}.v2-embed{width:100%;border:0;border-radius:var(--radius);background:#fff}@media(max-width:1024px){.v2-column{grid-column:span var(--span-t)}.v2-section{padding-block:3rem}.v2-region-header nav{flex-wrap:wrap}}@media(max-width:640px){.v2-row{gap:1rem}.v2-column{grid-column:span var(--span-m)}.v2-section{padding:2.5rem 1.1rem}.v2-region-header .v2-row{display:flex;justify-content:space-between}.v2-region-header nav{display:none}.v2-gallery{grid-template-columns:1fr 1fr}.v2-gallery img{height:210px}.v2-gallery-mosaic figure:first-child{grid-column:span 2}.v2-form-wrap form{grid-template-columns:1fr}.v2-form-wrap label,.v2-form-wrap button,.v2-form-wrap output{grid-column:1}}@media(prefers-reduced-motion:no-preference){.v2-motion-subtle .v2-region-main{animation:v2-reveal .5s ease both}.v2-motion-stagger .v2-region-main{animation:v2-reveal .6s ease both}.v2-motion-cinematic .v2-region-main{animation:v2-cinema .8s cubic-bezier(.2,.8,.2,1) both}@keyframes v2-reveal{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}@keyframes v2-cinema{from{opacity:0;transform:scale(.985)}to{opacity:1;transform:none}}}`;
}

const mobileSafetyCss = `@media(max-width:640px){.v2-section{padding-left:1.1rem!important;padding-right:1.1rem!important}.v2-column,.v2-form-wrap,.v2-form-wrap label{min-width:0}h1,h2,h3,p,a,span{overflow-wrap:anywhere}.v2-button{max-width:100%;white-space:normal}}`;

// Recursos que solo se inyectan cuando el sitio se renderiza dentro del editor (iframe del builder).
const editorCss = `[data-widget-id],[data-column-id],[data-section-id]{cursor:pointer}
.v2-ed-hover{outline:1px dashed #8b5cf6;outline-offset:2px}
.v2-ed-selected{outline:2px solid #7c3aed!important;outline-offset:2px;position:relative}
.v2-ed-selected[data-v2-label]::before{content:attr(data-v2-label);position:absolute;top:-1.45rem;left:-2px;z-index:999;background:#7c3aed;color:#fff;font:600 .65rem/1 system-ui,sans-serif;padding:.28rem .5rem;border-radius:.25rem .25rem 0 0;white-space:nowrap;pointer-events:none}
.v2-column:not(:has([data-widget-id])){min-height:56px;outline:1px dashed #d4d4d8;outline-offset:-4px;border-radius:6px}
.v2-ed-drop-line{position:absolute;height:4px;background:#7c3aed;border-radius:2px;z-index:9999;pointer-events:none;display:none}
.v2-ed-drop-target{outline:2px dashed #7c3aed!important;outline-offset:2px}`;

function editorScript() {
  const labels = `{brand:'Marca',nav:'Navegaci\\u00f3n',heading:'T\\u00edtulo',text:'Texto',image:'Imagen',video:'Video',button:'Bot\\u00f3n',business_info:'Datos del negocio',list:'Lista',gallery:'Galer\\u00eda',testimonials:'Rese\\u00f1as',accordion:'Acorde\\u00f3n',form:'Formulario',social:'Redes',map:'Mapa',divider:'Divisor',spacer:'Espacio',embed:'C\\u00f3digo insertado'}`;
  return `(function(){
var LABELS=${labels};
document.querySelectorAll('[data-widget-type]').forEach(function(node){node.setAttribute('data-v2-label',LABELS[node.getAttribute('data-widget-type')]||'Elemento');});
function pick(target){if(!(target instanceof Element))return null;return target.closest('[data-widget-id]')||target.closest('[data-column-id]')||target.closest('[data-section-id]');}
function kindOf(node){return node.hasAttribute('data-widget-id')?'widget':node.hasAttribute('data-column-id')?'column':'section';}
function idOf(node){return node.getAttribute('data-widget-id')||node.getAttribute('data-column-id')||node.getAttribute('data-section-id');}
function select(node){document.querySelectorAll('.v2-ed-selected').forEach(function(item){item.classList.remove('v2-ed-selected');});if(node)node.classList.add('v2-ed-selected');}
document.addEventListener('mouseover',function(event){var target=pick(event.target);document.querySelectorAll('.v2-ed-hover').forEach(function(item){item.classList.remove('v2-ed-hover');});if(target&&!target.classList.contains('v2-ed-selected'))target.classList.add('v2-ed-hover');});
document.addEventListener('click',function(event){event.preventDefault();event.stopPropagation();var target=pick(event.target);if(!target)return;select(target);parent.postMessage({source:'cluster-canvas',kind:kindOf(target),id:idOf(target)},'*');},true);
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
document.addEventListener('keydown',function(event){if(!(event.ctrlKey||event.metaKey))return;var key=event.key.toLowerCase();if(key!=='z'&&key!=='y')return;event.preventDefault();parent.postMessage({source:'cluster-canvas',kind:(key==='y'||event.shiftKey)?'redo':'undo'},'*');});
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
  const body = `<div id="top" class="v2-site v2-motion-${theme.motion}">${sections.map((section) => sectionHtml(section, content, theme, input.leadEndpoint)).join("")}${input.showBranding ? `<div style="padding:14px;text-align:center;font-size:12px;color:var(--muted)">Creado con Cluster</div>` : ""}</div>`;
  const css = `${baseCss(theme)}${dynamicCss(sections)}${mobileSafetyCss}${input.editable ? editorCss : ""}`;
  const script = `${formScript()}${input.editable ? editorScript() : ""}`;
  const title = content.seo.title || content.business.name;
  const description = content.seo.description || `${content.business.name} — ${content.business.type}`;
  const html = `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escapeHtml(title)}</title><meta name="description" content="${escapeHtml(description)}"><style>${css}</style></head><body>${body}<script>${script}</script></body></html>`;
  return { html, body, css, script };
}
