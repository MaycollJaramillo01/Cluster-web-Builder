/**
 * Section imagery.
 *
 * Free topical photos via LoremFlickr. The configured ImageKit GenAI endpoint
 * returns 403, so using it made some generated layouts render empty images.
 */

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
  estudio: "modernarchitecture,modernhouse,interiordesign",
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
  const promptTags = imagePromptTags(req.prompt);
  return loremFlickrUrl(
    promptTags || businessKeyword(req.businessType),
    req.seed,
    req.width,
    req.height
  );
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

function imagePromptTags(prompt?: string): string {
  if (!prompt) return "";
  const translations: Record<string, string> = {
    architecture: "modernarchitecture",
    architectural: "modernarchitecture",
    arquitectura: "modernarchitecture",
    residential: "modernhouse",
    residencial: "modernhouse",
    interior: "interiordesign",
    sustainable: "sustainablearchitecture",
    sostenible: "sustainablearchitecture",
    restaurant: "restaurant",
    roofing: "roofing",
    landscaping: "landscaping",
    garden: "garden",
    cleaning: "cleaning",
    clinic: "clinic",
    medical: "medical",
    beauty: "beautysalon",
    salon: "beautysalon",
    fitness: "fitness",
    gym: "gym",
  };
  const tags = prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z]+/g)
    ?.flatMap((word) => translations[word] ? [translations[word]] : []) ?? [];
  return [...new Set(tags)].slice(0, 4).join(",");
}
