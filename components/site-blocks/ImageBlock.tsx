import { sectionImageUrl } from "@/lib/site/images";
import { getStyleOverride, resolveElementStyle } from "@/lib/site/element-style";
import { getThemeSurface } from "@/lib/site/theme-surface";
import type { BlockProps } from "./types";

export function ImageBlock({ section, theme, preset, site }: BlockProps) {
  const surface = getThemeSurface(theme);
  const source = safeHttpUrl(section.mediaUrl ?? "") || (section.imagePrompt ? sectionImageUrl({ prompt: section.imagePrompt, businessType: site.businessType, seed: section.id, width: 1600, height: 1000 }) : "");
  return <section className="px-6 py-12 sm:py-20" style={{ backgroundColor: theme.background }}>
    <figure className="mx-auto max-w-6xl">
      {section.title && <h2 className="mb-7 text-3xl sm:text-5xl" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight, ...resolveElementStyle("title", getStyleOverride(section.settings, "title")) }}>{section.title}</h2>}
      {source ? <img src={source} alt={section.altText || section.title || site.businessName} loading="lazy" className="max-h-[720px] w-full object-cover" style={{ borderRadius: "var(--site-radius)" }} /> : <div className="grid min-h-64 place-items-center border border-dashed p-8 text-center" style={{ borderColor: `${theme.text}33`, color: surface.muted, borderRadius: "var(--site-radius)" }}>Agrega una URL de imagen desde el editor.</div>}
      {section.body && <figcaption className="mt-4 text-sm" style={{ color: surface.muted, ...resolveElementStyle("body", getStyleOverride(section.settings, "body")) }}>{section.body}</figcaption>}
    </figure>
  </section>;
}

function safeHttpUrl(value: string) {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:" ? url.toString() : "";
  } catch {
    return "";
  }
}
