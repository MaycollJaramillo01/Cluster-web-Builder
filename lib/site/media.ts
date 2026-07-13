import { randomUUID } from "node:crypto";

import { del, list, put } from "@vercel/blob";

export const IMAGE_MEDIA_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;
export const VIDEO_MEDIA_TYPES = ["video/mp4", "video/webm"] as const;
export const IMAGE_MAX_BYTES = 8 * 1024 * 1024;
export const VIDEO_MAX_BYTES = 60 * 1024 * 1024;

const DATA_URL_RE = /^data:([^;,]+)(?:;[^,]*)?;base64,([\s\S]+)$/i;
const EXT_BY_MEDIA_TYPE: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "video/mp4": "mp4",
  "video/webm": "webm",
};

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

export function isDataUrl(value: unknown): value is string {
  return typeof value === "string" && DATA_URL_RE.test(value);
}

export function stripDataUrls<T>(value: T): T {
  if (typeof value === "string") return (isDataUrl(value) ? "" : value) as T;
  if (Array.isArray(value)) return value.map((item) => stripDataUrls(item)) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>).map(([key, entry]) => [key, stripDataUrls(entry)]),
    ) as T;
  }
  return value;
}

export async function materializeDataUrlsForSite<T>(siteId: string, value: T, label = "asset"): Promise<T> {
  const cache = new Map<string, string>();
  let count = 0;
  const visit = async (entry: unknown, path: string): Promise<unknown> => {
    if (typeof entry === "string") {
      if (!isDataUrl(entry)) return entry;
      if (cache.has(entry)) return cache.get(entry);
      if (count >= 80) return "";
      count += 1;
      const url = await materializeDataUrl(siteId, entry, `${label}-${path}`);
      cache.set(entry, url);
      return url;
    }
    if (Array.isArray(entry)) return Promise.all(entry.map((item, index) => visit(item, `${path}-${index}`)));
    if (entry && typeof entry === "object") {
      const result: Record<string, unknown> = {};
      for (const [key, child] of Object.entries(entry as Record<string, unknown>)) {
        result[key] = await visit(child, `${path}-${key}`);
      }
      return result;
    }
    return entry;
  };
  return await visit(value, "root") as T;
}

async function materializeDataUrl(siteId: string, value: string, label: string) {
  if (!process.env.BLOB_READ_WRITE_TOKEN) return "";
  const match = value.match(DATA_URL_RE);
  if (!match) return value;

  const contentType = match[1].toLowerCase();
  const isImage = (IMAGE_MEDIA_TYPES as readonly string[]).includes(contentType);
  const isVideo = (VIDEO_MEDIA_TYPES as readonly string[]).includes(contentType);
  if (!isImage && !isVideo) return "";

  const buffer = Buffer.from(match[2].replace(/\s/g, ""), "base64");
  if ((isImage && buffer.byteLength > IMAGE_MAX_BYTES) || (isVideo && buffer.byteLength > VIDEO_MAX_BYTES)) return "";

  const extension = EXT_BY_MEDIA_TYPE[contentType] ?? "bin";
  const safeLabel = label.replace(/[^a-z0-9_-]+/gi, "-").slice(0, 64) || "asset";
  try {
    const blob = await put(`${siteMediaPrefix(siteId)}${safeLabel}-${randomUUID()}.${extension}`, buffer, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return blob.url;
  } catch {
    return "";
  }
}
