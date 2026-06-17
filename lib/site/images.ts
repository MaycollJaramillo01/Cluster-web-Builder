/**
 * Section imagery.
 *
 * Primary: ImageKit text-to-image (GenAI). When NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT
 * is set, we build a URL like:
 *   {endpoint}/ik-genimg-prompt-<prompt>/<hash>.jpg?tr=w-..,h-..,fo-auto,q-80
 * ImageKit generates the image once and caches it at that path, so each unique
 * prompt maps to a stable image (the hash filename keeps it deterministic).
 *
 * Fallback: free topical photos via LoremFlickr (no key needed) when ImageKit
 * is not configured, so the app still renders images out of the box.
 */

const IMAGEKIT_ENDPOINT = (
  process.env.NEXT_PUBLIC_IMAGEKIT_URL_ENDPOINT || ""
).replace(/\/$/, "");

// Maps the leading English word of the stored businessType label to good tags.
const KEYWORDS: Record<string, string> = {
  roofing: "roof,house,construction",
  painting: "painting,house,wall",
  landscaping: "garden,landscaping,lawn",
  cleaning: "cleaning,clean,home",
  restaurant: "restaurant,food,dining",
  law: "office,law,lawyer",
  real: "house,realestate,modern",
  medical: "clinic,medical,doctor",
  beauty: "beauty,salon,spa",
  fitness: "gym,fitness,workout",
};

const DEFAULT_TAGS = "business,office,modern";

/** Extracts the leading English word from a label like "Roofing / Techos". */
export function businessKeyword(businessType: string): string {
  const firstWord = businessType
    .split("/")[0]
    .trim()
    .toLowerCase()
    .split(/\s+/)[0];
  return KEYWORDS[firstWord] ?? DEFAULT_TAGS;
}

export type ImageRequest = {
  /** The section's AI imagePrompt (may be empty). */
  prompt?: string;
  /** Stored businessType label, used to enrich the prompt / fallback tags. */
  businessType: string;
  /** Stable seed so the same slot renders the same image (no hydration drift). */
  seed: string | number;
  width: number;
  height: number;
};

/**
 * Resolves the best image URL for a section slot.
 * Uses ImageKit GenAI when configured, otherwise LoremFlickr.
 */
export function sectionImageUrl(req: ImageRequest): string {
  if (IMAGEKIT_ENDPOINT) {
    return imageKitGenUrl(req);
  }
  return loremFlickrUrl(businessKeyword(req.businessType), req.seed, req.width, req.height);
}

/** Builds an ImageKit text-to-image URL with sizing/optimization transforms. */
function imageKitGenUrl(req: ImageRequest): string {
  const prompt = buildPrompt(req.prompt, req.businessType);
  const hash = stableLock(`${prompt}-${req.seed}`);
  const tr = `w-${req.width},h-${req.height},fo-auto,q-80`;
  return `${IMAGEKIT_ENDPOINT}/ik-genimg-prompt-${encodeURIComponent(
    prompt
  )}/site-${hash}.jpg?tr=${tr}`;
}

/** Crafts an English, photo-oriented prompt for better generation results. */
function buildPrompt(prompt: string | undefined, businessType: string): string {
  const base = (prompt && prompt.trim()) || businessKeyword(businessType).replace(/,/g, " ");
  return `Professional high-quality realistic photograph, ${base}, ${cleanBusiness(
    businessType
  )}, natural lighting, no text`;
}

function cleanBusiness(businessType: string): string {
  return businessType.split("/")[0].trim();
}

/**
 * Free stock photo (LoremFlickr) for high-count slots like galleries and
 * service cards. We deliberately use stock here (not ImageKit GenAI) to avoid
 * burning the AI-generation quota on many small images.
 */
export function stockImageUrl(
  businessType: string,
  seed: string | number,
  width: number,
  height: number
): string {
  return loremFlickrUrl(businessKeyword(businessType), seed, width, height);
}

function loremFlickrUrl(
  tags: string,
  seed: string | number,
  width: number,
  height: number
): string {
  const lock = stableLock(String(seed));
  return `https://loremflickr.com/${width}/${height}/${encodeURIComponent(
    tags
  )}?lock=${lock}`;
}

/** Small deterministic hash so the same input always maps to the same image. */
function stableLock(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  }
  return (hash % 9000) + 1;
}
