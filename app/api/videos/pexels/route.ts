import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PexelsVideoFile = {
  id: number;
  file_type: string;
  quality: string;
  width: number | null;
  height: number | null;
  link: string;
};

type PexelsVideo = {
  id: number;
  url: string;
  video_files: PexelsVideoFile[];
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.slice(0, 80) || "small business";
  const seed = request.nextUrl.searchParams.get("seed") || query;
  const apiKey = process.env.PEXELS_API_KEY;
  if (!apiKey) return unavailable();

  try {
    const endpoint = new URL("https://api.pexels.com/v1/videos/search");
    endpoint.searchParams.set("query", query);
    endpoint.searchParams.set("orientation", "landscape");
    endpoint.searchParams.set("size", "medium");
    endpoint.searchParams.set("per_page", "24");

    const response = await fetch(endpoint, {
      headers: { Authorization: apiKey },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) return unavailable();

    const data = await response.json() as { videos?: PexelsVideo[] };
    const videos = data.videos ?? [];
    if (!videos.length) return unavailable();

    const video = videos[stableLock(seed) % videos.length];
    const candidates = video.video_files
      .filter((file) => file.file_type === "video/mp4" && file.link && (file.width ?? 0) >= 960)
      .sort((a, b) => scoreFile(a) - scoreFile(b));
    const file = candidates[0] ?? video.video_files.find((item) => item.file_type === "video/mp4");
    if (!file) return unavailable();

    const redirect = NextResponse.redirect(file.link, 307);
    redirect.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    redirect.headers.set("X-Video-Provider", "Pexels");
    redirect.headers.set("X-Pexels-Video-Id", String(video.id));
    redirect.headers.set("Link", `<${video.url}>; rel="canonical"`);
    return redirect;
  } catch {
    return unavailable();
  }
}

function scoreFile(file: PexelsVideoFile) {
  const width = file.width ?? 0;
  const height = file.height ?? 0;
  const shapePenalty = width > height ? 0 : 10_000;
  return shapePenalty + Math.abs(width - 1280) + Math.abs(height - 720);
}

function stableLock(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  return hash;
}

function unavailable() {
  return NextResponse.json(
    { error: "Video no disponible; usa la imagen de portada." },
    { status: 404, headers: { "Cache-Control": "public, max-age=300" } },
  );
}
