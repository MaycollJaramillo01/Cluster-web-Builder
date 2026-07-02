/* eslint-disable @next/next/no-img-element */
import type { CSSProperties } from "react";

import { resolveElementStyle } from "@/lib/site/element-style";
import { normalizeFreeformLayout, type FreeformWidget } from "@/lib/site/freeform";
import { getThemeSurface } from "@/lib/site/theme-surface";
import type { BlockProps } from "./types";

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}

const SPACER_HEIGHT: Record<string, string> = { sm: "1rem", md: "2.5rem", lg: "5rem" };

function WidgetContent({ widget, theme, businessName }: { widget: FreeformWidget; theme: BlockProps["theme"]; businessName: string }) {
  const style = resolveElementStyle("body", widget.style);
  const surface = getThemeSurface(theme);
  switch (widget.type) {
    case "heading":
      return <h3 className="text-2xl font-bold sm:text-3xl" style={{ color: theme.text, fontFamily: "var(--site-heading)", ...style }}>{String(widget.content.text ?? "")}</h3>;
    case "text":
      return <p className="whitespace-pre-line leading-relaxed" style={{ color: surface.muted, ...style }}>{String(widget.content.text ?? "")}</p>;
    case "image": {
      const source = safeHttpUrl(String(widget.content.url ?? ""));
      if (!source) return <div className="grid min-h-40 place-items-center border border-dashed p-6 text-center text-sm" style={{ borderColor: `${theme.text}33`, color: surface.muted }}>Agrega una URL de imagen</div>;
      return <img src={source} alt={String(widget.content.alt || businessName)} loading="lazy" className="w-full object-cover" style={{ borderRadius: "var(--site-radius)", ...style }} />;
    }
    case "button": {
      const link = String(widget.content.link ?? "") || "#contact";
      const text = String(widget.content.text ?? "") || "Click aquí";
      return <a href={link} className="inline-flex min-h-11 items-center justify-center px-6 py-3 font-semibold" style={{ backgroundColor: theme.accent, color: "#fff", borderRadius: "var(--site-btn-radius)", ...style }}>{text}</a>;
    }
    case "spacer":
      return <div aria-hidden style={{ height: SPACER_HEIGHT[String(widget.content.size)] ?? SPACER_HEIGHT.md }} />;
    case "divider":
      return <hr style={{ borderColor: `${theme.text}22` }} />;
  }
}

export function WidgetBlock({ section, theme, site }: BlockProps) {
  const layout = normalizeFreeformLayout(section.settings?.freeform);
  if (!layout.rows.length) return null;
  return (
    <section className="px-6 py-12 sm:py-16" style={{ backgroundColor: theme.background }}>
      <div className="mx-auto flex max-w-6xl flex-col gap-8">
        {layout.rows.map((row) => (
          <div
            key={row.id}
            className="site-freeform-row grid gap-6"
            style={{ gridTemplateColumns: row.columns.map((column) => `${column.width}fr`).join(" ") } as CSSProperties}
          >
            {row.columns.map((column) => (
              <div key={column.id} className="flex flex-col gap-4">
                {column.widgets.map((widget) => <WidgetContent key={widget.id} widget={widget} theme={theme} businessName={site.businessName} />)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </section>
  );
}
