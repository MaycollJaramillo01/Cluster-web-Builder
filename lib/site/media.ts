import { del, list } from "@vercel/blob";

export const IMAGE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const VIDEO_MEDIA_TYPES = ["video/mp4", "video/webm"] as const;
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 60 * 1024 * 1024;

export function siteMediaPrefix(siteId: string) {
  return `sites/${siteId}/`;
}

export async function getSiteMedia(siteId: string) {
  const blobs = [];
  let cursor: string | undefined;
  do {
    const page = await list({ prefix: siteMediaPrefix(siteId), cursor, limit: 1000 });
    blobs.push(...page.blobs);
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
  return blobs;
}

export async function deleteSiteMedia(siteId: string) {
  const blobs = await getSiteMedia(siteId);
  if (blobs.length) await del(blobs.map((blob) => blob.url));
  return blobs.length;
}

export function isSiteMediaUrl(siteId: string, value: unknown): value is string {
  if (typeof value !== "string" || !value) return false;
  try {
    return decodeURIComponent(new URL(value).pathname).replace(/^\/+/, "").startsWith(siteMediaPrefix(siteId));
  } catch {
    return false;
  }
}
