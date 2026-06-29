/**
 * Section imagery.
 *
 * Free topical photos via the server-side Pexels proxy. The proxy keeps the
 * API key private, caches searches and falls back when the provider is down.
 */

// Maps the leading word of the stored businessType label to good Pexels tags.
// Includes both English keys (from businessType enum) and Spanish labels
// (from resolveBusinessTypeLabel) so lookups work regardless of which is stored.
const KEYWORDS: Record<string, string> = {
  // ── English keys (enum values) ───────────────────────────────────────────
  roofing: "roof,house,construction",
  painting: "painting,house,wall",
  landscaping: "garden,landscaping,lawn",
  cleaning: "cleaning,clean,home",
  restaurant: "restaurant,food,dining",
  cafe: "cafe,coffee,coffeeshop",
  bakery: "bakery,pastry,bread",
  law: "office,law,lawyer",
  legal: "office,law,professional",
  real: "house,realestate,modern",
  medical: "clinic,medical,doctor",
  dental: "dental,clinic,teeth",
  beauty: "beauty,salon,spa",
  fitness: "gym,fitness,workout",
  gym: "gym,fitness,workout",
  estudio: "modernarchitecture,modernhouse,interiordesign",
  // ── Spanish labels (from BUSINESS_TYPE_LABELS + resolveBusinessTypeLabel) ─
  jardineria:  "garden,landscaping,lawn,plants",
  jardiner:    "garden,landscaping,lawn,plants",
  limpieza:    "cleaning,clean,home,sparkling",
  pintura:     "painting,house,wall,brush",
  techos:      "roof,house,construction,tiles",
  techo:       "roof,house,construction,tiles",
  restaurante: "restaurant,food,dining,cuisine",
  servicios:   "office,professional,business,team",
  bienes:      "house,realestate,property,modern",
  clinica:     "clinic,medical,doctor,healthcare",
  clínica:     "clinic,medical,doctor,healthcare",
  belleza:     "beauty,salon,spa,makeup",
  gimnasio:    "gym,fitness,workout,weights",
  consultoria: "consulting,meeting,office,professional",
  consultoría: "consulting,meeting,office,professional",
  agencia:     "marketing,branding,creative,office",
  portafolio:  "portfolio,creative,design,studio",
  tienda:      "retail,store,shopping,products",
  architecture: "modernarchitecture,building,design",
  automotive: "car,automobile,showroom",
  auto: "car,automobile,showroom",
  vehicle: "car,automobile,garage",
  tech: "technology,computer,office",
  technology: "technology,computer,office",
  software: "technology,computer,coding",
  construction: "construction,building,contractor",
  plumbing: "plumbing,tools,pipe",
  electrical: "electrical,wiring,tools",
  financial: "finance,business,professional",
  finance: "finance,business,professional",
  accounting: "accounting,finance,office",
  education: "education,school,classroom",
  childcare: "childcare,kids,playground",
  event: "event,wedding,celebration",
  photography: "photography,camera,studio",
  marketing: "marketing,branding,office",
  consulting: "consulting,meeting,office",
  logistics: "logistics,warehouse,transport",
  hotel: "hotel,hospitality,luxury",
  travel: "travel,adventure,landscape",
  retail: "retail,store,shopping",
  ecommerce: "ecommerce,store,products",
  fashion: "fashion,clothing,style",
  food: "food,cuisine,gourmet",
  nonprofit: "community,volunteer,charity",
  security: "security,professional,technology",
  pesca: "fishing,angler,lake",
  fishing: "fishing,angler,lake",
  pescador: "fishing,angler,lake",
};

const DEFAULT_TAGS = "business,professional,modern";

/** Extracts the best keyword tags from a label like "Automotive / Automotriz". */
export function businessKeyword(businessType: string): string {
  const parts = businessType.split(/[/|,]/).map((s) => s.trim().toLowerCase());
  for (const part of parts) {
    const firstWord = part.split(/\s+/)[0];
    if (KEYWORDS[firstWord]) return KEYWORDS[firstWord];
    // Try each word in the part, not just the first
    for (const word of part.split(/\s+/)) {
      if (KEYWORDS[word]) return KEYWORDS[word];
    }
  }
  return DEFAULT_TAGS;
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
 * Resolves the best Pexels image URL for a section slot.
 */
export function sectionImageUrl(req: ImageRequest): string {
  const promptTags = imagePromptTags(req.prompt);
  return pexelsImageUrl(
    promptTags || businessKeyword(req.businessType),
    req.seed,
    req.width,
    req.height
  );
}

/**
 * Free Pexels stock photo for high-count slots like galleries and service cards.
 */
export function stockImageUrl(
  businessType: string,
  seed: string | number,
  width: number,
  height: number
): string {
  return pexelsImageUrl(businessKeyword(businessType), seed, width, height);
}

function pexelsImageUrl(
  tags: string,
  seed: string | number,
  width: number,
  height: number
): string {
  const params = new URLSearchParams({ q: tags, seed: String(seed), w: String(width), h: String(height) });
  return `/api/images/pexels?${params}`;
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
    automotive: "car",
    automobile: "car",
    automotriz: "car",
    automotor: "car",
    car: "car",
    cars: "car",
    vehicle: "car",
    vehicles: "car",
    dealership: "car",
    showroom: "car",
    garage: "garage",
    workshop: "garage",
    taller: "garage",
    technology: "technology",
    software: "technology",
    coding: "coding",
    tech: "technology",
    dental: "dental",
    teeth: "dental",
    dentist: "dental",
    law: "law",
    legal: "law",
    lawyer: "law",
    attorney: "law",
    finance: "finance",
    financial: "finance",
    accounting: "accounting",
    construction: "construction",
    building: "construction",
    contractor: "construction",
    plumbing: "plumbing",
    electrical: "electrical",
    education: "education",
    school: "education",
    classroom: "education",
    bakery: "bakery",
    bread: "bakery",
    coffee: "coffee",
    cafe: "coffee",
    hotel: "hotel",
    hospitality: "hotel",
    fashion: "fashion",
    clothing: "fashion",
    marketing: "marketing",
    branding: "marketing",
    photography: "photography",
    camera: "photography",
    consulting: "business",
    logistics: "logistics",
    warehouse: "logistics",
    event: "event",
    wedding: "wedding",
    travel: "travel",
    landscape: "landscape",
    luxury: "luxury",
    modern: "modern",
    professional: "professional",
    office: "office",
    pesca: "fishing",
    pescador: "fishing",
    fishing: "fishing",
    angler: "angler",
    fish: "fishing",
    boat: "fishingboat",
    lake: "lake",
  };
  const tags = prompt
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .match(/[a-z]+/g)
    ?.flatMap((word) => translations[word] ? [translations[word]] : []) ?? [];
  const unique = [...new Set(tags)];
  const generic = new Set(["professional", "modern", "office", "photography"]);
  const topical = unique.filter((tag) => !generic.has(tag));
  return (topical.length ? topical : unique).slice(0, 4).join(",");
}
