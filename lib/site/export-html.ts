import type { SiteTheme } from "@/lib/site/blueprint";
import type { RenderSection } from "@/lib/site/section";
import { socialLinksFromBlueprint } from "@/lib/site/social-links";

type ExportSite = {
  businessName: string; businessType: string; phone: string | null; email: string | null;
  location: string | null; publicSlug: string; theme: SiteTheme; sections: RenderSection[];
  showBranding: boolean; blueprintJson?: unknown;
};

const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

export function exportSiteHtml(site: ExportSite, leadEndpoint: string) {
  const phone = site.phone ? `<a href="tel:${escape(site.phone)}">${escape(site.phone)}</a>` : "";
  const whatsapp = site.phone?.replace(/\D/g, "");
  const social = socialLinksFromBlueprint(site.blueprintJson);
  const links = [
    whatsapp && whatsapp.length >= 8 ? ["WhatsApp", `https://wa.me/${whatsapp}`] : null,
    ...Object.entries(social).filter(([, href]) => href).map(([label, href]) => [label, href]),
  ].filter((item): item is string[] => Boolean(item));
  const dock = links.map(([label, href]) => `<a href="${escape(href)}" target="_blank" rel="noreferrer" aria-label="Abrir ${escape(label)}">${escape(label.slice(0, 2).toUpperCase())}</a>`).join("");
  const sections = site.sections.filter((section) => section.isVisible).map((section) => sectionHtml(section, site.businessName)).join("");

  return `<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${escape(site.businessName)}</title><meta name="description" content="${escape(`${site.businessName} — ${site.businessType}`)}"><style>
:root{--primary:${site.theme.primary};--secondary:${site.theme.secondary};--accent:${site.theme.accent};--bg:${site.theme.background};--text:${site.theme.text}}*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--text);font:16px/1.65 system-ui,sans-serif}nav,section,footer{padding:24px max(6vw,24px)}nav{display:flex;justify-content:space-between;align-items:center;position:sticky;top:0;background:var(--bg);border-bottom:1px solid #8883;z-index:2}nav div{display:flex;gap:16px;align-items:center}a{color:inherit}section{max-width:1100px;margin:auto;padding-top:80px;padding-bottom:80px}h1,h2{line-height:1.08}h1{font-size:clamp(2.6rem,8vw,6rem)}h2{font-size:clamp(2rem,5vw,3.8rem)}.hero{min-height:75vh;display:grid;align-content:center}.eyebrow{color:var(--primary);font-weight:700;text-transform:uppercase;letter-spacing:.12em}.button,button{display:inline-block;border:0;border-radius:8px;background:var(--accent);color:#fff;min-height:44px;padding:13px 20px;font-weight:700;text-decoration:none;cursor:pointer}.grid{display:grid;grid-template-columns:repeat(auto-fit,minmax(220px,1fr));gap:20px;margin-top:30px}.grid article,form{padding:24px;border:1px solid #8884;border-radius:12px}form{display:grid;gap:14px;max-width:620px}input,textarea{width:100%;min-height:44px;padding:12px;border:1px solid #8886;border-radius:7px;background:transparent;color:inherit;font:inherit}textarea{min-height:130px}.trap{display:none}output{min-height:24px}.social-dock{position:fixed;right:20px;bottom:20px;display:grid;gap:8px;padding:0;border:0;background:none}.social-dock a{display:grid;place-items:center;width:48px;height:48px;border-radius:999px;background:#111018;color:#fff;text-decoration:none;box-shadow:0 10px 28px #0004;font:800 11px system-ui}footer{background:var(--secondary);color:#fff}@media(max-width:640px){body>nav div{display:none}section{padding-top:56px;padding-bottom:56px}}@media(prefers-reduced-motion:no-preference){section{animation:reveal .4s ease-out both}@keyframes reveal{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}}
</style></head><body><nav><strong>${escape(site.businessName)}</strong><div>${phone}${site.email ? `<a href="mailto:${escape(site.email)}">${escape(site.email)}</a>` : ""}<a href="#contact">Contacto</a></div></nav><section class="hero"><p class="eyebrow">${escape(site.businessType)}</p><h1>${escape(site.businessName)}</h1><p>${escape(site.location || "")}</p><a class="button" href="#contact">Contáctanos</a></section>${sections}${site.showBranding ? '<div style="padding:16px;text-align:center;font-size:13px;color:#888">Creado con Cluster</div>' : ""}${dock ? `<nav class="social-dock" aria-label="Redes y contacto">${dock}</nav>` : ""}<script>
const form=document.querySelector('#contact-form');if(form)form.addEventListener('submit',async event=>{event.preventDefault();const output=form.querySelector('output');const button=form.querySelector('button');button.disabled=true;output.textContent='Enviando…';try{const response=await fetch(${JSON.stringify(leadEndpoint)},{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify(Object.fromEntries(new FormData(form)))});const data=await response.json().catch(()=>({}));if(!response.ok)throw new Error(data.error||'No se pudo enviar.');form.reset();output.textContent='Mensaje enviado correctamente.'}catch(error){output.textContent=error.message||'No se pudo enviar. Intenta de nuevo.'}finally{button.disabled=false}});
</script></body></html>`;
}

function sectionHtml(section: RenderSection, businessName: string) {
  if (section.type === "footer") return `<footer><strong>${escape(section.title || businessName)}</strong><p>${escape(section.subtitle)}</p></footer>`;
  if (section.type === "contact") return `<section id="contact"><h2>${escape(section.title || "Contacto")}</h2><p>${escape(section.body)}</p><form id="contact-form"><label>Nombre<input name="name" required maxlength="120" autocomplete="name"></label><label>Email<input name="email" type="email" required maxlength="160" autocomplete="email"></label><label>Teléfono<input name="phone" type="tel" maxlength="40" autocomplete="tel"></label><label>Mensaje<textarea name="message" required maxlength="2000"></textarea></label><input name="website" class="trap" tabindex="-1" autocomplete="off"><button>${escape(section.ctaText || "Enviar mensaje")}</button><output aria-live="polite"></output></form></section>`;
  const items = Array.isArray(section.settings.items) ? section.settings.items : [];
  const cards = items.map((item) => { const record = typeof item === "object" && item ? item as Record<string, unknown> : {}; return `<article><h3>${escape(String(record.title || record.name || ""))}</h3><p>${escape(String(record.description || record.body || record.text || ""))}</p></article>`; }).join("");
  return `<section id="${escape(section.type)}"><p class="eyebrow">${escape(section.subtitle)}</p><h2>${escape(section.title)}</h2><p>${escape(section.body)}</p>${cards ? `<div class="grid">${cards}</div>` : ""}${section.ctaText ? `<a class="button" href="${escape(section.ctaLink || "#contact")}">${escape(section.ctaText)}</a>` : ""}</section>`;
}
