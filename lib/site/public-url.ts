import { randomBytes } from "node:crypto";

export function createPublicSlug(value: string) {
  const base = value.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 42) || "sitio";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

export function publicSiteUrl(slug: string) {
  const root = process.env.PUBLIC_ROOT_DOMAIN?.replace(/^https?:\/\//, "").replace(/\/$/, "");
  if (root) return `https://${slug}.${root}`;
  return `/s/${slug}`;
}

export function absolutePublicSiteUrl(slug: string, origin?: string) {
  const url = publicSiteUrl(slug);
  if (url.startsWith("http")) return url;
  return `${appOrigin(origin)}${url}`;
}

export function appOrigin(fallback = "http://localhost:3000") {
  const configured = process.env.NEXT_PUBLIC_APP_URL;
  for (const candidate of [configured, fallback]) {
    try {
      const url = new URL(candidate || "");
      if (url.protocol === "http:" || url.protocol === "https:") return url.origin;
    } catch {
      // Try the next candidate.
    }
  }
  return "http://localhost:3000";
}
