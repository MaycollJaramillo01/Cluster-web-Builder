import { NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

type PexelsPhoto = {
  id: number;
  photographer: string;
  src: { original: string };
};

export async function GET(request: NextRequest) {
  const query = request.nextUrl.searchParams.get("q")?.slice(0, 80) || "business";
  const seed = request.nextUrl.searchParams.get("seed") || query;
  const width = dimension(request.nextUrl.searchParams.get("w"), 1200);
  const height = dimension(request.nextUrl.searchParams.get("h"), 800);
  const fallback = `https://loremflickr.com/${width}/${height}/${encodeURIComponent(query)}?lock=${stableLock(seed)}`;
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) return NextResponse.redirect(fallback, 307);

  try {
    const endpoint = new URL("https://api.pexels.com/v1/search");
    endpoint.searchParams.set("query", query);
    endpoint.searchParams.set("orientation", width >= height ? "landscape" : "portrait");
    endpoint.searchParams.set("per_page", "40");

    const response = await fetch(endpoint, {
      headers: { Authorization: apiKey },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) return NextResponse.redirect(fallback, 307);

    const data = (await response.json()) as { photos?: PexelsPhoto[] };
    const photos = data.photos ?? [];
    if (!photos.length) return NextResponse.redirect(fallback, 307);

    const photo = photos[stableLock(seed) % photos.length];
    const image = new URL(photo.src.original);
    image.searchParams.set("auto", "compress");
    image.searchParams.set("cs", "tinysrgb");
    image.searchParams.set("fit", "crop");
    image.searchParams.set("w", String(width));
    image.searchParams.set("h", String(height));

    const redirect = NextResponse.redirect(image, 307);
    redirect.headers.set("Cache-Control", "public, max-age=86400, stale-while-revalidate=604800");
    redirect.headers.set("X-Image-Provider", "Pexels");
    redirect.headers.set("X-Pexels-Photo-Id", String(photo.id));
    redirect.headers.set("X-Pexels-Photographer", encodeURIComponent(photo.photographer));
    return redirect;
  } catch {
    return NextResponse.redirect(fallback, 307);
  }
}

function dimension(value: string | null, fallback: number) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? Math.min(2400, Math.max(240, Math.round(parsed))) : fallback;
}

function stableLock(seed: string) {
  let hash = 0;
  for (let index = 0; index < seed.length; index++) {
    hash = (hash * 31 + seed.charCodeAt(index)) >>> 0;
  }
  return (hash % 9000) + 1;
}
