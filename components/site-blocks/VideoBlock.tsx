import { getThemeSurface } from "@/lib/site/theme-surface";
import type { BlockProps } from "./types";

export function VideoBlock({ section, theme, preset }: BlockProps) {
  const surface = getThemeSurface(theme);
  const media = videoSource(section.mediaUrl ?? "");
  return <section className="px-6 py-12 sm:py-20" style={{ backgroundColor: theme.background }}>
    <div className="mx-auto max-w-6xl">
      {section.title && <h2 className="mb-7 text-3xl sm:text-5xl" style={{ color: theme.text, fontFamily: "var(--site-heading)", fontWeight: preset.headingWeight }}>{section.title}</h2>}
      {media?.kind === "embed" && <iframe src={media.url} title={section.title || "Video"} loading="lazy" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen className="aspect-video w-full border-0" style={{ borderRadius: "var(--site-radius)" }} />}
      {media?.kind === "file" && <video src={media.url} controls preload="metadata" className="aspect-video w-full bg-black object-contain" style={{ borderRadius: "var(--site-radius)" }} />}
      {!media && <div className="grid aspect-video place-items-center border border-dashed p-8 text-center" style={{ borderColor: `${theme.text}33`, color: surface.muted, borderRadius: "var(--site-radius)" }}>Agrega una URL de YouTube, Vimeo, MP4 o WebM.</div>}
      {section.body && <p className="mt-4" style={{ color: surface.muted }}>{section.body}</p>}
    </div>
  </section>;
}

function videoSource(value: string): { kind: "embed" | "file"; url: string } | null {
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" && url.protocol !== "http:") return null;
    const youtubeId = url.hostname.includes("youtu.be") ? url.pathname.slice(1) : url.hostname.includes("youtube.com") ? url.searchParams.get("v") : null;
    if (youtubeId && /^[\w-]{6,20}$/.test(youtubeId)) return { kind: "embed", url: `https://www.youtube-nocookie.com/embed/${youtubeId}` };
    const vimeoId = url.hostname.includes("vimeo.com") ? url.pathname.split("/").filter(Boolean).at(-1) : null;
    if (vimeoId && /^\d+$/.test(vimeoId)) return { kind: "embed", url: `https://player.vimeo.com/video/${vimeoId}` };
    if (/\.(mp4|webm)(?:$|\?)/i.test(url.toString())) return { kind: "file", url: url.toString() };
    return null;
  } catch {
    return null;
  }
}
