import { resolveElementStyleString } from "@/lib/site/element-style";
import { normalizeFreeformLayout, type FreeformWidget } from "@/lib/site/freeform";
import { sanitizeLink } from "@/lib/site/links";
import type { RenderSection } from "@/lib/site/section";
import type { ExportSite } from "@/lib/site/export-html";

// Duplicated on purpose (not imported from export-html.ts) to avoid a runtime
// circular import between the two modules — export-html.ts imports the
// freeformSectionHtml function from this file at runtime.
const escape = (value: string) => value.replace(/[&<>"']/g, (char) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[char]!);

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

const SPACER_HEIGHT: Record<string, string> = { sm: "1rem", md: "2.5rem", lg: "5rem" };

function widgetHtml(widget: FreeformWidget, site: ExportSite): string {
  const style = resolveElementStyleString("body", widget.style);
  const styleAttr = style ? ` style="${style}"` : "";
  switch (widget.type) {
    case "heading":
      return `<h3${styleAttr}>${escape(String(widget.content.text ?? ""))}</h3>`;
    case "text":
      return `<p${styleAttr}>${escape(String(widget.content.text ?? ""))}</p>`;
    case "image": {
      const source = safeHttpUrl(String(widget.content.url ?? ""));
      if (!source) return "";
      return `<img src="${escape(source)}" alt="${escape(String(widget.content.alt || site.businessName))}" loading="lazy" style="width:100%;object-fit:cover;border-radius:12px${style ? `;${style}` : ""}">`;
    }
    case "button": {
      const link = sanitizeLink(String(widget.content.link ?? "")) || "#contact";
      const text = String(widget.content.text ?? "") || "Click aquí";
      return `<a class="button" href="${escape(link)}"${styleAttr}>${escape(text)}</a>`;
    }
    case "spacer":
      return `<div aria-hidden="true" style="height:${SPACER_HEIGHT[String(widget.content.size)] ?? SPACER_HEIGHT.md}"></div>`;
    case "divider":
      return `<hr style="border-color:#8884">`;
  }
}

/** Static-HTML counterpart to WidgetBlock.tsx — reads the same normalizeFreeformLayout so both stay structurally identical. */
export function freeformSectionHtml(section: RenderSection, site: ExportSite, id: string): string {
  const layout = normalizeFreeformLayout(section.settings?.freeform);
  if (!layout.rows.length) return "";
  const rows = layout.rows.map((row) => {
    const template = row.columns.map((column) => `${column.width}fr`).join(" ");
    const columns = row.columns.map((column) => {
      const widgets = column.widgets.map((widget) => widgetHtml(widget, site)).join("");
      return `<div>${widgets}</div>`;
    }).join("");
    return `<div class="site-freeform-row" style="display:grid;gap:24px;grid-template-columns:${template}">${columns}</div>`;
  }).join("");
  return `<section id="${escape(id)}"><div style="display:flex;flex-direction:column;gap:32px">${rows}</div></section>`;
}
