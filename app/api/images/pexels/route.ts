import { NextRequest, NextResponse } from "next/server";

import { consumeRateLimit } from "@/lib/rate-limit";
import { getClientIp } from "@/lib/security/client-ip";

export const runtime = "nodejs";

type PexelsPhoto = {
  id: number;
  photographer: string;
  src: { original: string };
};

export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (!(await consumeRateLimit("pexels-image", ip, 120, 60 * 60 * 1000))) {
    return NextResponse.json({ error: "Demasiadas solicitudes de imagen. Intenta más tarde." }, { status: 429 });
  }

  const query = request.nextUrl.searchParams.get("q")?.slice(0, 80) || "business";
  const seed = request.nextUrl.searchParams.get("seed") || query;
  const width = dimension(request.nextUrl.searchParams.get("w"), 1200);
  const height = dimension(request.nextUrl.searchParams.get("h"), 800);
  const forceJpeg = request.nextUrl.searchParams.get("format") === "jpeg";
  // loremflickr uses the query term to pick relevant photos (unlike picsum which ignores it)
  const fallback = `https://loremflickr.com/${width}/${height}/${encodeURIComponent(query)}?lock=${stableLock(seed)}`;
  const apiKey = process.env.PEXELS_API_KEY;

  if (!apiKey) return proxyImage(fallback, query, width, height, {}, forceJpeg);

  try {
    const endpoint = new URL("https://api.pexels.com/v1/search");
    endpoint.searchParams.set("query", query);
    endpoint.searchParams.set("orientation", width >= height ? "landscape" : "portrait");
    endpoint.searchParams.set("per_page", "40");

    const response = await fetch(endpoint, {
      headers: { Authorization: apiKey },
      next: { revalidate: 86_400 },
    });
    if (!response.ok) return proxyImage(fallback, query, width, height, {}, forceJpeg);

    const data = (await response.json()) as { photos?: PexelsPhoto[] };
    const photos = data.photos ?? [];
    if (!photos.length) return proxyImage(fallback, query, width, height, {}, forceJpeg);

    const photo = photos[stableLock(seed) % photos.length];
    const image = new URL(photo.src.original);
    image.searchParams.set("auto", "compress");
    image.searchParams.set("cs", "tinysrgb");
    image.searchParams.set("fit", "crop");
    image.searchParams.set("w", String(width));
    image.searchParams.set("h", String(height));
    if (forceJpeg) image.searchParams.set("fm", "jpg");

    return proxyImage(image.toString(), query, width, height, {
      "X-Image-Provider": "Pexels",
      "X-Pexels-Photo-Id": String(photo.id),
      "X-Pexels-Photographer": encodeURIComponent(photo.photographer),
    }, forceJpeg);
  } catch {
    return proxyImage(fallback, query, width, height, {}, forceJpeg);
  }
}

async function proxyImage(url: string, query: string, width: number, height: number, extraHeaders: Record<string, string> = {}, forceJpeg = false) {
  try {
    const response = await fetch(url, {
      redirect: "follow",
      headers: { Accept: forceJpeg ? "image/jpeg,image/*;q=0.8" : "image/avif,image/webp,image/*", "User-Agent": "Cluster-Web-Builder/1.0" },
      next: { revalidate: 86_400 },
    });
    const contentType = response.headers.get("content-type") || "";
    if (!response.ok || !contentType.startsWith("image/") || !response.body) throw new Error("Invalid image response");
    return new NextResponse(response.body, {
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=86400, stale-while-revalidate=604800",
        "X-Image-Provider": extraHeaders["X-Image-Provider"] || "Fallback",
        ...extraHeaders,
      },
    });
  } catch {
    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}"><defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1"><stop stop-color="#17131e"/><stop offset=".55" stop-color="#39245a"/><stop offset="1" stop-color="#8b5cf6"/></linearGradient></defs><rect width="100%" height="100%" fill="url(#g)"/><circle cx="${Math.round(width * .78)}" cy="${Math.round(height * .18)}" r="${Math.round(width * .22)}" fill="#fff" opacity=".05"/><circle cx="${Math.round(width * .2)}" cy="${Math.round(height * .86)}" r="${Math.round(width * .3)}" fill="#fff" opacity=".035"/></svg>`;
    return new NextResponse(svg, {
      headers: { "Content-Type": "image/svg+xml; charset=utf-8", "Cache-Control": "public, max-age=3600", "X-Image-Provider": "Generated-Fallback" },
    });
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
