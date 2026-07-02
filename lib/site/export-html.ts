import type { SiteTheme } from "@/lib/site/blueprint";
import { sanitizeLink } from "@/lib/site/links";
import type { RenderSection } from "@/lib/site/section";
import { normalizeSectionLayout } from "@/lib/site/section-layout";
import { socialLinksFromBlueprint } from "@/lib/site/social-links";
import { getDesignPreset, type ContactStyle } from "@/lib/site/design";

type ExportSite = {
  businessName: string; businessType: string; phone: string | null; email: string | null;
  location: string | null; publicSlug: string; theme: SiteTheme; sections: RenderSection[];
  showBranding: boolean; blueprintJson?: unknown; visualStyle?: string | null;
};

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

const EXPORT_CONTACT_LAYOUTS: Record<ContactStyle, { section?: string; wrap: string; info?: string; form?: string; grid?: string }> = {
  split: { wrap: "display:grid;grid-template-columns:.85fr 1.15fr;gap:48px;align-items:start" },
  editorial: { wrap: "display:grid;grid-template-columns:.7fr 1.3fr;gap:64px;border-block:1px solid #8884;padding-block:40px", form: "border:0;border-radius:0" },
  spotlight: { section: "max-width:none;background:var(--secondary);color:#fff", wrap: "max-width:760px;margin:auto;text-align:center", form: "margin:36px auto 0;text-align:left" },
  glass: { wrap: "display:grid;grid-template-columns:.8fr 1.2fr;gap:34px;align-items:center", form: "background:#ffffffd9;backdrop-filter:blur(18px);box-shadow:0 24px 70px #0002" },
  floating: { wrap: "display:grid;grid-template-columns:.8fr 1.2fr;align-items:center", info: "position:relative;z-index:1;transform:translate(34px);background:var(--primary);color:#fff;padding:32px", form: "padding-left:70px" },
  minimalLine: { wrap: "max-width:760px;margin:auto", form: "border:0;border-radius:0;padding-inline:0" },
  reverse: { wrap: "display:grid;grid-template-columns:1.2fr .8fr;gap:42px", info: "order:2", form: "order:1" },
  brutal: { wrap: "display:grid;grid-template-columns:1fr 1fr;gap:0", info: "border:3px solid currentColor;padding:36px", form: "border:3px solid currentColor;border-left:0;border-radius:0;box-shadow:10px 10px 0 var(--primary)" },
  centered: { wrap: "max-width:760px;margin:auto;text-align:center", form: "margin:36px auto 0;text-align:left" },
  bordered: { wrap: "border:1px solid #8885;padding:40px", form: "max-width:none;margin-top:30px", grid: "grid-template-columns:repeat(3,1fr)" },
  offset: { wrap: "display:grid;grid-template-columns:1fr 1fr;gap:44px;align-items:center", form: "transform:translate(18px,18px);box-shadow:-18px -18px 0 #8882" },
  dark: { section: "max-width:none;background:var(--secondary);color:#fff", wrap: "display:grid;grid-template-columns:.75fr 1.25fr;gap:56px", form: "border-color:#fff5" },
  asymmetric: { wrap: "display:grid;grid-template-columns:.55fr 1.45fr;gap:70px" },
  quote: { wrap: "display:grid;grid-template-columns:1.25fr .75fr;gap:50px;border-block:1px solid #8884;padding-block:44px", form: "border:0" },
  sidebar: { wrap: "display:grid;grid-template-columns:.65fr 1.35fr;gap:0", info: "background:var(--secondary);color:#fff;padding:38px", form: "border-radius:0;padding:38px" },
  banner: { wrap: "display:block", info: "border-bottom:1px solid #8884;padding-bottom:30px", form: "max-width:none;margin-top:30px", grid: "grid-template-columns:repeat(3,1fr)" },
  framed: { wrap: "border:1px solid #8885;outline:1px solid #8885;outline-offset:-12px;padding:38px", form: "max-width:none;margin-top:26px" },
  steps: { wrap: "display:grid;grid-template-columns:.75fr 1.25fr;gap:48px", info: "border-top:8px solid var(--primary);padding-top:24px", form: "border-top:8px solid var(--accent);border-radius:0" },
  stacked: { wrap: "max-width:680px;margin:auto", form: "border:0;border-top:1px solid #8884;border-radius:0;margin-top:34px;padding-inline:0" },
  compact: { section: "padding-top:52px;padding-bottom:52px", wrap: "display:block", info: "border-bottom:1px solid #8884;padding-bottom:24px", form: "max-width:none;margin-top:24px;padding:20px", grid: "grid-template-columns:repeat(3,1fr)" },
};

export function exportSiteHtml(site: ExportSite, leadEndpoint: string) {
  const phone = site.phone ? `<a href="tel:${escape(site.phone)}">${escape(site.phone)}</a>` : "";
  const whatsapp = site.phone?.replace(/\D/g, "");
  const social = socialLinksFromBlueprint(site.blueprintJson);
  const links = [
    whatsapp && whatsapp.length >= 8 ? ["WhatsApp", `https://wa.me/${whatsapp}`] : null,
    ...Object.entries(social).filter(([, href]) => href).map(([label, href]) => [label, href]),
  ].filter((item): item is string[] => Boolean(item));
  const dock = links.map(([label, href]) => `<a href="${escape(href)}" target="_blank" rel="noreferrer" aria-label="Abrir ${escape(label)}">${escape(label.slice(0, 2).toUpperCase())}</a>`).join("");
  const contactStyle = getDesignPreset(site.visualStyle).contactStyle;
  const visible = site.sections.filter((section) => section.isVisible);
  // IDs unicos: el primero de cada tipo conserva el ancla simple (#contact) y los repetidos llevan sufijo.
  const idCounts = new Map<string, number>();
  const uniqueId = (type: string) => {
    const count = (idCounts.get(type) ?? 0) + 1;
    idCounts.set(type, count);
    return count === 1 ? type : `${type}-${count}`;
  };
  const sections = visible.map((section) => sectionHtml(section, site, contactStyle, uniqueId(section.type))).join("");
  // Solo genera un hero de respaldo si el sitio no tiene uno editado.
  const fallbackHero = visible.some((section) => section.type === "hero")
    ? ""
    : `<section class="hero"><p class="eyebrow">${escape(site.businessType)}</p><h1>${escape(site.businessName)}</h1><p>${escape(site.location || "")}</p><a class="button" href="#contact">Contáctanos</a></section>`;

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(site.businessName)}</title><meta name="description" content="${escape(`${site.businessName} — ${site.businessType}`)}"><style>
:root{--primary:${site.theme.primary};--secondary:${site.theme.secondary};--accent:${site.theme.accent};--bg:${site.theme.background};--text:${site.theme.text}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 system-ui,sans-serif}nav,section,footer{padding:24px max(6vw,24px)}nav{display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--bg);border-bottom:1px solid #8883;z-index:2}nav div{display:flex;gap:16px;align-items:center}a{color:inherit}section{max-width:1100px;margin:auto;padding-top:80px;padding-bottom:80px}h1,h2{line-height:1.08}h1{font-size:clamp(2.6rem,8vw,6rem)}h2{font-size:clamp(2rem,5vw,3.8rem)}.hero{min-height:75vh;display:grid;align-content:center}.eyebrow{color:var(--primary);font-weight:700;text-transform:uppercase;letter-spacing:.12em}.button,button{display:inline-block;border:0;border-radius:8px;background:var(--accent);color:#fff;min-height:44px;padding:13px 20px;font-weight:700;text-decoration:none;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-top:30px}.grid article,form{padding:24px;border:1px solid #8884;border-radius:12px}form{display:grid;gap:14px;max-width:620px}input,textarea{width:100%;min-height:44px;padding:12px;border:1px solid #8886;border-radius:7px;background:transparent;color:inherit;font:inherit}textarea{min-height:130px}.trap{display:none}output{min-height:24px}.social-dock{position:fixed;right:20px;bottom:20px;display:grid;gap:8px;padding:0;border:0;background:none}.social-dock a{display:grid;place-items:center;width:48px;height:48px;border-radius:999px;background:#111018;color:#fff;text-decoration:none;box-shadow:0 10px 28px #0004;font:800 11px system-ui}footer{background:var(--secondary);color:#fff}@media(max-width:640px){body>nav div{display:none}section{padding-top:56px;padding-bottom:56px}}@media(prefers-reduced-motion:no-preference){section{animation:reveal .4s ease-out both}@keyframes reveal{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}}
</style></head><body><nav><strong>${escape(site.businessName)}</strong><div>${phone}${site.email ? `<a href="mailto:${escape(site.email)}">${escape(site.email)}</a>` : ""}<a href="#contact">Contacto</a></div></nav>${fallbackHero}${sections}${site.showBranding ? '<div style="padding:16px;text-align:center;font-size:13px;color:#888">Creado con Cluster</div>' : ""}${dock ? `<nav class="social-dock" aria-label="Redes y contacto">${dock}</nav>` : ""}<script>
const form=document.querySelector('#contact-form');if(form)form.addEventListener('submit',async event=>{event.preventDefault();const output=form.querySelector('output');const button=form.querySelector('button');button.disabled=true;output.textContent='Enviando…';try{const response=await fetch(${JSON.stringify(leadEndpoint)},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'No se pudo enviar.');form.reset();output.textContent='Mensaje enviado correctamente.'}catch(error){output.textContent=error.message||'No se pudo enviar. Intenta de nuevo.'}finally{button.disabled=false}});
</script></body></html>`;
}

function sectionHtml(section: RenderSection, site: ExportSite, contactStyle: ContactStyle, id: string) {
  const businessName = site.businessName;
  const layoutStyle = normalizeSectionLayout(section);
  const ctaHref = sanitizeLink(section.ctaLink) || "#contact";
  if (section.type === "hero") {
    // El hero exportado respeta el contenido editado en el editor.
    return `<section class="hero" id="${escape(id)}"><p class="eyebrow">${escape(section.subtitle || site.businessType)}</p><h1>${escape(section.title || businessName)}</h1><p>${escape(section.body || site.location || "")}</p><a class="button" href="${escape(ctaHref)}">${escape(section.ctaText || "Contáctanos")}</a></section>`;
  }
  if (section.type === "contact") return contactSectionHtml(section, site, contactStyle, id);
  if (section.type === "footer") return `<footer><strong>${escape(section.title || businessName)}</strong><p>${escape(section.subtitle)}</p></footer>`;
  if (section.type === "image") {
    const source = safeMediaUrl(section.mediaUrl);
    return `<section id="image"><h2>${escape(section.title)}</h2>${source ? `<img src="${escape(source)}" alt="${escape(section.altText || section.title || businessName)}" style="width:100%;max-height:720px;object-fit:cover;border-radius:12px">` : ""}<p>${escape(section.body)}</p></section>`;
  }
  if (section.type === "video") {
    const media = exportVideo(section.mediaUrl);
    const player = media?.kind === "embed" ? `<iframe src="${escape(media.url)}" title="${escape(section.title || "Video")}" allowfullscreen loading="lazy" style="width:100%;aspect-ratio:16/9;border:0"></iframe>` : media ? `<video src="${escape(media.url)}" controls preload="metadata" style="width:100%;aspect-ratio:16/9;background:#000"></video>` : "";
    return `<section id="video"><h2>${escape(section.title)}</h2>${player}<p>${escape(section.body)}</p></section>`;
  }
  const items = Array.isArray(section.settings.items) ? section.settings.items : [];
  const cards = items.map((item) => { const record = typeof item === "object" && item ? item as Record<string, unknown> : {}; return `<article><h3>${escape(String(record.title || record.name || ""))}</h3><p>${escape(String(record.description || record.body || record.text || ""))}</p></article>`; }).join("");
  return `<section id="${escape(section.type)}"><p class="eyebrow">${escape(section.subtitle)}</p><h2>${escape(section.title)}</h2><p>${escape(section.body)}</p>${cards ? `<div class="grid">${cards}</div>` : ""}${section.ctaText ? `<a class="button" href="${escape(section.ctaLink || "#contact")}">${escape(section.ctaText)}</a>` : ""}</section>`;
}

function safeMediaUrl(value?: string) {
  try {
    const url = new URL(value || "");
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

function exportVideo(value?: string): { kind: "embed" | "file"; url: string } | null {
  const source = safeMediaUrl(value);
  if (!source) return null;
  const url = new URL(source);
  const youtubeId = url.hostname.includes("youtu.be") ? url.pathname.slice(1) : url.hostname.includes("youtube.com") ? url.searchParams.get("v") : null;
  if (youtubeId && /^[\w-]{6,20}$/.test(youtubeId)) return { kind: "embed", url: `https://www.youtube-nocookie.com/embed/${youtubeId}` };
  const vimeoId = url.hostname.includes("vimeo.com") ? url.pathname.split("/").filter(Boolean).at(-1) : null;
  if (vimeoId && /^\d+$/.test(vimeoId)) return { kind: "embed", url: `https://player.vimeo.com/video/${vimeoId}` };
  return /\.(mp4|webm)(?:$|\?)/i.test(source) ? { kind: "file", url: source } : null;
}

function contactSectionHtml(section: RenderSection, site: ExportSite, contactStyle: ContactStyle) {
  const layout = EXPORT_CONTACT_LAYOUTS[contactStyle];
  const details = [
    site.phone ? `<a href="tel:${escape(site.phone)}">${escape(site.phone)}</a>` : "",
    site.email ? `<a href="mailto:${escape(site.email)}">${escape(site.email)}</a>` : "",
    site.location ? `<span>${escape(site.location)}</span>` : "",
  ].filter(Boolean).join("");
  return `<section id="${escape(id)}" data-contact-style="${contactStyle}" style="${layout.section || ""}"><style>.cluster-contact-wrap{${layout.wrap}}.cluster-contact-info{${layout.info || ""}}.cluster-contact-form{${layout.form || ""};max-width:none}.cluster-contact-grid{display:grid;grid-template-columns:1fr 1fr;gap:14px;${layout.grid || ""}}.cluster-contact-wide{grid-column:1/-1}.cluster-contact-details{display:grid;gap:8px;margin-top:24px}@media(max-width:760px){.cluster-contact-wrap{display:block!important}.cluster-contact-info{order:initial!important;transform:none!important;margin-bottom:28px}.cluster-contact-form{order:initial!important;transform:none!important;padding-left:24px!important}.cluster-contact-grid{grid-template-columns:1fr!important}.cluster-contact-wide{grid-column:auto}}</style><div class="cluster-contact-wrap"><div class="cluster-contact-info"><p class="eyebrow">Contacto</p><h2>${escape(section.title || "Contacto")}</h2><p>${escape(section.body)}</p><div class="cluster-contact-details">${details}</div></div><form id="contact-form" class="cluster-contact-form"><div class="cluster-contact-grid"><label>Nombre<input name="name" required maxlength="120" autocomplete="name"></label><label>Email<input name="email" type="email" required maxlength="160" autocomplete="email"></label><label class="cluster-contact-wide">Teléfono <small>(opcional)</small><input name="phone" type="tel" maxlength="40" autocomplete="tel"></label><label class="cluster-contact-wide">Mensaje<textarea name="message" required maxlength="2000"></textarea></label></div><input name="website" class="trap" tabindex="-1" autocomplete="off"><button>${escape(section.ctaText || "Enviar mensaje")}</button><output aria-live="polite"></output></form></div></section>`;
}
