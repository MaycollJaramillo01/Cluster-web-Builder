/**
 * Section imagery.
 *
 * Smarter Pexels query builder for AI generated websites.
 *
 * Main improvements over the simple KEYWORDS map:
 * - Combines `businessType` + `prompt` instead of allowing generic prompt words
 *   to override the business category.
 * - Uses weighted industry/service keywords, phrase detection and Spanish/English
 *   normalization.
 * - Removes generic stock words when better topical words exist.
 * - Keeps the public URL contract compatible with `/api/images/pexels?q=&seed=&w=&h=`.
 */

export type ImageRequest = {
  /** The section's AI imagePrompt (may be empty). */
  prompt?: string;
  /** Stored businessType label, used to enrich the prompt / fallback tags. */
  businessType: string;
  /** Stable seed so the same slot renders the same image (no hydration drift). */
  seed: string | number;
  width: number;
  height: number;
  /** Optional section name: hero, about, services, gallery, contact, team, etc. */
  section?: string;
};

type QueryContext = Pick<ImageRequest, "prompt" | "businessType" | "width" | "height" | "section">;

type WeightedQuery = {
  term: string;
  weight: number;
};

const DEFAULT_TAGS = "local business professional service";

/**
 * Generic words should not dominate a search. They are kept only when no strong
 * industry/service terms are found.
 */
const GENERIC_TERMS = new Set([
  "business",
  "professional",
  "modern",
  "office",
  "team",
  "service",
  "services",
  "company",
  "customer",
  "client",
  "quality",
  "premium",
  "luxury",
  "local",
  "commercial",
  "residential",
  "photo",
  "photography",
  "people",
  "person",
  "work",
  "working",
]);

/**
 * Words we do not want to use as Pexels search intent. These often come from AI
 * image prompts but are useless or harmful for stock-photo search.
 */
const PROMPT_NOISE_WORDS = new Set([
  "hero",
  "image",
  "section",
  "background",
  "banner",
  "website",
  "web",
  "landing",
  "page",
  "homepage",
  "header",
  "footer",
  "cta",
  "card",
  "cards",
  "grid",
  "layout",
  "abstract",
  "cinematic",
  "beautiful",
  "clean",
  "minimal",
  "minimalist",
  "high",
  "resolution",
  "realistic",
  "stock",
  "photo",
  "copyspace",
  "copy",
  "space",
  "no",
  "text",
  "without",
  "with",
  "and",
  "or",
  "the",
  "a",
  "an",
  "de",
  "del",
  "la",
  "el",
  "los",
  "las",
  "un",
  "una",
  "para",
  "por",
  "con",
  "sin",
  "sobre",
  "en",
]);

/**
 * Industry/category keywords. Keys can be enum values, Spanish labels, English
 * labels or common words that may appear in the business type.
 *
 * Keep terms natural-language. Pexels usually performs better with phrases like
 * "roofing contractor" than comma-separated tags like "roof,house,construction".
 */
const BUSINESS_KEYWORDS: Record<string, string[]> = {
  // Home services
  roofing: ["roofing contractor", "roof repair", "shingle roof", "house exterior"],
  roof: ["roofing contractor", "roof repair", "shingle roof", "house exterior"],
  roofer: ["roofing contractor", "roof repair", "shingle roof"],
  techos: ["roofing contractor", "roof repair", "shingle roof", "house exterior"],
  techo: ["roofing contractor", "roof repair", "shingle roof"],
  tejado: ["roofing contractor", "roof repair", "tile roof"],
  pintura: ["house painting", "painting contractor", "paint roller", "home exterior painting"],
  painting: ["house painting", "painting contractor", "paint roller", "home exterior painting"],
  painter: ["painting contractor", "house painting", "paint roller"],
  landscaping: ["landscaping", "lawn care", "garden maintenance", "backyard"],
  landscape: ["landscaping", "lawn care", "garden design", "backyard"],
  jardineria: ["landscaping", "lawn care", "garden maintenance", "plants"],
  jardinería: ["landscaping", "lawn care", "garden maintenance", "plants"],
  jardinero: ["landscaping", "lawn care", "garden maintenance"],
  jardiner: ["landscaping", "lawn care", "garden maintenance"],
  cleaning: ["home cleaning", "professional cleaning", "cleaning service", "housekeeping"],
  limpieza: ["home cleaning", "professional cleaning", "cleaning service", "housekeeping"],
  housekeeping: ["home cleaning", "cleaning service", "housekeeping"],
  janitorial: ["commercial cleaning", "janitorial service", "cleaning staff"],
  construction: ["construction site", "building contractor", "home construction", "contractor"],
  construccion: ["construction site", "building contractor", "home construction"],
  construcción: ["construction site", "building contractor", "home construction"],
  contractor: ["contractor", "construction worker", "home improvement", "tools"],
  remodeling: ["home remodeling", "renovation", "interior renovation", "contractor"],
  renovation: ["home renovation", "remodeling", "interior renovation"],
  remodelacion: ["home remodeling", "renovation", "interior renovation"],
  remodelación: ["home remodeling", "renovation", "interior renovation"],
  flooring: ["flooring installation", "hardwood floor", "floor renovation", "contractor"],
  floor: ["flooring installation", "hardwood floor", "floor renovation"],
  pisos: ["flooring installation", "hardwood floor", "floor renovation"],
  epoxy: ["epoxy floor", "garage floor", "floor coating"],
  drywall: ["drywall installation", "home renovation", "construction worker"],
  plumbing: ["plumber", "plumbing repair", "pipe repair", "tools"],
  plomeria: ["plumber", "plumbing repair", "pipe repair"],
  plomería: ["plumber", "plumbing repair", "pipe repair"],
  plumber: ["plumber", "plumbing repair", "pipe repair"],
  electrical: ["electrician", "electrical wiring", "electrical repair", "tools"],
  electricidad: ["electrician", "electrical wiring", "electrical repair"],
  electrician: ["electrician", "electrical wiring", "electrical repair"],
  hvac: ["hvac technician", "air conditioner repair", "ventilation system"],
  ac: ["hvac technician", "air conditioner repair", "ventilation system"],
  concrete: ["concrete contractor", "cement work", "construction"],
  masonry: ["masonry", "brick wall", "stone work", "construction"],
  hardscaping: ["hardscaping", "patio pavers", "stone walkway", "backyard"],
  drainage: ["yard drainage", "french drain", "landscaping drainage"],
  waterproofing: ["basement waterproofing", "foundation repair", "water damage"],
  restoration: ["water damage restoration", "home restoration", "emergency cleanup"],
  damage: ["water damage restoration", "home restoration", "emergency cleanup"],
  pressure: ["pressure washing", "power washing", "driveway cleaning"],
  washing: ["pressure washing", "power washing", "exterior cleaning"],
  pest: ["pest control", "exterminator", "home inspection"],
  pool: ["pool cleaning", "swimming pool", "pool maintenance"],
  fence: ["fence installation", "wood fence", "backyard fence"],
  fencing: ["fence installation", "wood fence", "backyard fence"],
  windows: ["window installation", "window repair", "home exterior"],
  siding: ["siding installation", "house exterior", "home improvement"],
  gutter: ["gutter cleaning", "rain gutter", "roofline"],
  gutters: ["gutter cleaning", "rain gutter", "roofline"],
  garage: ["garage door repair", "garage", "tools"],
  moving: ["moving service", "moving truck", "movers"],
  mover: ["moving service", "moving truck", "movers"],
  locksmith: ["locksmith", "door lock", "key service"],

  // Automotive
  automotive: ["auto repair shop", "car mechanic", "vehicle service", "garage"],
  automotriz: ["auto repair shop", "car mechanic", "vehicle service"],
  automotor: ["auto repair shop", "car mechanic", "vehicle service"],
  auto: ["auto repair shop", "car mechanic", "vehicle service"],
  car: ["car mechanic", "auto repair shop", "vehicle service"],
  cars: ["car mechanic", "auto repair shop", "vehicle service"],
  vehicle: ["vehicle service", "car mechanic", "auto repair shop"],
  dealership: ["car dealership", "car showroom", "new cars"],
  showroom: ["car showroom", "car dealership", "new cars"],
  towing: ["tow truck", "roadside assistance", "car towing", "highway"],
  grua: ["tow truck", "roadside assistance", "car towing"],
  grúa: ["tow truck", "roadside assistance", "car towing"],
  wash: ["car wash", "auto detailing", "clean car"],
  detailing: ["auto detailing", "car wash", "clean car"],
  tire: ["tire shop", "car tires", "mechanic"],
  tires: ["tire shop", "car tires", "mechanic"],

  // Food and hospitality
  restaurant: ["restaurant", "chef plating food", "dining", "kitchen"],
  restaurante: ["restaurant", "chef plating food", "dining", "kitchen"],
  food: ["restaurant food", "chef plating food", "fresh ingredients"],
  cocina: ["chef cooking", "restaurant kitchen", "fresh ingredients"],
  cafe: ["coffee shop", "barista", "coffee cup", "cafe interior"],
  café: ["coffee shop", "barista", "coffee cup", "cafe interior"],
  coffee: ["coffee shop", "barista", "coffee cup"],
  coffeeshop: ["coffee shop", "barista", "cafe interior"],
  bakery: ["bakery", "fresh bread", "pastry", "baker"],
  panaderia: ["bakery", "fresh bread", "pastry", "baker"],
  panadería: ["bakery", "fresh bread", "pastry", "baker"],
  catering: ["catering", "event food", "chef"],
  bar: ["bar", "cocktail", "restaurant interior"],
  hotel: ["hotel lobby", "hospitality", "luxury hotel", "reception"],
  hospitality: ["hotel lobby", "hospitality", "reception"],
  travel: ["travel agency", "vacation", "destination", "suitcase"],
  turismo: ["travel agency", "vacation", "destination"],

  // Health and wellness
  medical: ["medical clinic", "doctor", "healthcare", "patient consultation"],
  clinic: ["medical clinic", "doctor", "healthcare"],
  clinica: ["medical clinic", "doctor", "healthcare"],
  clínica: ["medical clinic", "doctor", "healthcare"],
  healthcare: ["healthcare", "doctor", "medical clinic"],
  doctor: ["doctor", "medical clinic", "patient consultation"],
  dental: ["dental clinic", "dentist", "dental care", "smile"],
  dentist: ["dental clinic", "dentist", "dental care"],
  teeth: ["dental clinic", "dentist", "dental care"],
  orthodontic: ["orthodontist", "dental clinic", "braces"],
  therapy: ["physical therapy", "rehabilitation", "therapist"],
  therapist: ["therapist", "consultation", "wellness"],
  chiropractor: ["chiropractor", "physical therapy", "back pain"],
  pharmacy: ["pharmacy", "pharmacist", "medicine"],
  spa: ["spa", "massage", "wellness", "relaxation"],
  beauty: ["beauty salon", "spa", "makeup", "skincare"],
  belleza: ["beauty salon", "spa", "makeup", "skincare"],
  salon: ["beauty salon", "hair salon", "stylist"],
  peluqueria: ["hair salon", "stylist", "beauty salon"],
  peluquería: ["hair salon", "stylist", "beauty salon"],
  barber: ["barbershop", "barber", "haircut"],
  barbershop: ["barbershop", "barber", "haircut"],
  fitness: ["gym", "fitness training", "workout", "personal trainer"],
  gym: ["gym", "fitness training", "workout", "personal trainer"],
  gimnasio: ["gym", "fitness training", "workout", "personal trainer"],
  yoga: ["yoga studio", "wellness", "meditation"],

  // Professional services
  law: ["law office", "lawyer", "legal consultation", "attorney"],
  legal: ["law office", "lawyer", "legal consultation"],
  lawyer: ["law office", "lawyer", "legal consultation"],
  attorney: ["law office", "attorney", "legal consultation"],
  accounting: ["accounting office", "accountant", "finance", "documents"],
  accountant: ["accounting office", "accountant", "finance"],
  finance: ["financial advisor", "finance office", "business meeting"],
  financial: ["financial advisor", "finance office", "business meeting"],
  insurance: ["insurance agent", "business consultation", "documents"],
  consulting: ["business consulting", "meeting", "professional team", "office"],
  consultoria: ["business consulting", "meeting", "professional team"],
  consultoría: ["business consulting", "meeting", "professional team"],
  real: ["real estate agent", "house keys", "modern house", "property"],
  estate: ["real estate agent", "house keys", "modern house", "property"],
  bienes: ["real estate agent", "house keys", "modern house", "property"],
  realtor: ["real estate agent", "house keys", "modern house"],
  notary: ["notary", "documents", "signature"],
  tax: ["tax preparation", "accountant", "documents"],

  // Creative, digital and tech
  agency: ["creative agency", "marketing team", "branding", "office"],
  agencia: ["creative agency", "marketing team", "branding", "office"],
  marketing: ["digital marketing", "branding", "creative agency", "team"],
  branding: ["branding design", "creative agency", "marketing"],
  seo: ["digital marketing", "analytics dashboard", "marketing strategy"],
  social: ["social media marketing", "content creation", "digital marketing"],
  media: ["social media marketing", "content creation", "digital marketing"],
  photography: ["photographer", "camera", "photo studio"],
  photographer: ["photographer", "camera", "photo studio"],
  video: ["video production", "camera operator", "studio"],
  design: ["designer workspace", "creative studio", "design"],
  designer: ["designer workspace", "creative studio", "design"],
  portfolio: ["creative portfolio", "design studio", "workspace"],
  portafolio: ["creative portfolio", "design studio", "workspace"],
  technology: ["technology office", "software development", "computer code", "startup"],
  tech: ["technology office", "software development", "computer code"],
  software: ["software development", "computer code", "developer"],
  development: ["software development", "computer code", "developer"],
  developer: ["software developer", "computer code", "workspace"],
  app: ["mobile app", "software development", "phone"],
  cybersecurity: ["cybersecurity", "security operations", "computer code"],
  security: ["security camera", "cybersecurity", "professional security"],

  // Retail and ecommerce
  retail: ["retail store", "shopping", "products", "boutique"],
  tienda: ["retail store", "shopping", "products", "boutique"],
  store: ["retail store", "shopping", "products"],
  ecommerce: ["ecommerce", "online shopping", "packages", "products"],
  shopify: ["ecommerce", "online shopping", "packages"],
  boutique: ["fashion boutique", "clothing store", "retail"],
  fashion: ["fashion boutique", "clothing store", "style"],
  moda: ["fashion boutique", "clothing store", "style"],
  clothing: ["clothing store", "fashion boutique", "style"],
  jewelry: ["jewelry store", "luxury jewelry", "rings"],
  joyeria: ["jewelry store", "luxury jewelry", "rings"],
  joyería: ["jewelry store", "luxury jewelry", "rings"],
  florist: ["flower shop", "florist", "bouquet"],
  flowers: ["flower shop", "florist", "bouquet"],

  // Education, kids and community
  education: ["classroom", "school", "students", "teacher"],
  escuela: ["classroom", "school", "students", "teacher"],
  school: ["classroom", "school", "students", "teacher"],
  tutoring: ["tutoring", "student", "teacher"],
  childcare: ["childcare", "kids playing", "daycare"],
  daycare: ["childcare", "kids playing", "daycare"],
  nonprofit: ["community", "volunteer", "charity", "team"],
  charity: ["community", "volunteer", "charity"],
  church: ["church community", "volunteer", "people"],

  // Events and lifestyle
  event: ["event planning", "wedding venue", "celebration"],
  events: ["event planning", "wedding venue", "celebration"],
  wedding: ["wedding", "event planning", "celebration"],
  party: ["party event", "celebration", "decor"],
  logistics: ["logistics warehouse", "delivery truck", "shipping"],
  warehouse: ["warehouse", "logistics", "shipping"],
  delivery: ["delivery truck", "courier", "packages"],
  pesca: ["fishing", "angler", "fishing boat", "lake"],
  pescador: ["fishing", "angler", "fishing boat", "lake"],
  fishing: ["fishing", "angler", "fishing boat", "lake"],
  boat: ["fishing boat", "boat", "lake"],

  // Architecture/interior
  architecture: ["modern architecture", "building design", "architect", "interior design"],
  arquitectura: ["modern architecture", "building design", "architect", "interior design"],
  architect: ["modern architecture", "building design", "architect"],
  estudio: ["modern architecture", "interior design", "design studio"],
  interior: ["interior design", "modern living room", "home decor"],

  // Fashion, tailoring and textiles
  sastreria: ["tailor shop", "suit fitting", "custom suits", "sewing atelier"],
  sastrería: ["tailor shop", "suit fitting", "custom suits", "sewing atelier"],
  sastre: ["tailor shop", "suit fitting", "custom suits"],
  tailor: ["tailor shop", "suit fitting", "custom suits", "sewing"],
  tailoring: ["tailor shop", "suit fitting", "custom suits", "sewing"],
  costura: ["sewing atelier", "tailor shop", "fabric", "needle thread"],
  confeccion: ["clothing production", "sewing atelier", "tailor shop", "fabric"],
  confección: ["clothing production", "sewing atelier", "tailor shop", "fabric"],
  modista: ["fashion design studio", "dress making", "sewing atelier"],
  alteraciones: ["clothing alteration", "tailor shop", "sewing"],
  alteracion: ["clothing alteration", "tailor shop", "sewing"],
  uniformes: ["work uniforms", "corporate clothing", "uniform production"],
  telas: ["fabric store", "textile fabric", "sewing material"],
  textil: ["textile fabric", "clothing production", "fabric"],
  textiles: ["textile fabric", "clothing production", "fabric"],
  vestidos: ["wedding dress", "dress shop", "fashion boutique"],
  ropa: ["clothing store", "fashion boutique", "wardrobe"],
  bordado: ["embroidery", "needlework", "fabric art"],
  bordados: ["embroidery", "needlework", "fabric art"],

  // Pets and veterinary
  veterinaria: ["veterinary clinic", "veterinarian", "pet care"],
  veterinario: ["veterinary clinic", "veterinarian", "pet care"],
  veterinary: ["veterinary clinic", "veterinarian", "pet care"],
  vet: ["veterinary clinic", "veterinarian", "pet care"],
  mascotas: ["pets", "pet care", "veterinary clinic"],
  mascota: ["pets", "pet care", "veterinary clinic"],
  pets: ["pet store", "pets", "animal care"],
  petshop: ["pet store", "pets", "pet accessories"],
  grooming: ["dog grooming", "pet grooming", "grooming salon"],
  "peluqueria canina": ["dog grooming", "pet grooming", "grooming salon"],
  "peluquería canina": ["dog grooming", "pet grooming", "grooming salon"],
  canina: ["dog grooming", "pets", "dog"],
  adiestramiento: ["dog training", "pet obedience", "dog trainer"],

  // Solar and renewable energy
  solar: ["solar panels", "solar energy", "rooftop solar installation"],
  solares: ["solar panels", "solar energy", "rooftop solar installation"],
  fotovoltaico: ["solar panels", "photovoltaic", "solar energy"],
  renovable: ["renewable energy", "solar panels", "green energy"],
  "energia solar": ["solar panels", "solar energy", "rooftop solar installation"],
  "energía solar": ["solar panels", "solar energy", "rooftop solar installation"],
  "paneles solares": ["solar panels", "solar energy installation", "rooftop solar"],
  eolica: ["wind turbine", "renewable energy", "wind energy"],
  eólica: ["wind turbine", "renewable energy", "wind energy"],

  // Pharmacy and health stores
  farmacia: ["pharmacy", "pharmacist", "medicine shelves"],
  drogueria: ["pharmacy", "pharmacist", "medicine shelves"],
  droguería: ["pharmacy", "pharmacist", "medicine shelves"],
  "health store": ["health store", "vitamins", "supplements"],
  suplementos: ["supplements", "nutrition store", "vitamins"],
  naturista: ["natural health store", "herbal products", "supplements"],
  optica: ["optician", "eyeglasses", "eye care"],
  óptica: ["optician", "eyeglasses", "eye care"],
  optometria: ["optometrist", "eye exam", "eyeglasses"],

  // Laundry and dry cleaning
  lavanderia: ["laundry service", "washing machine", "clean clothes"],
  lavandería: ["laundry service", "washing machine", "clean clothes"],
  tintoreria: ["dry cleaning", "ironing service", "clothes pressing"],
  tintorería: ["dry cleaning", "ironing service", "clothes pressing"],
  laundry: ["laundry service", "washing machine", "clean clothes"],
  "dry cleaning": ["dry cleaning", "ironing service", "clothes pressing"],
  lavado: ["laundry service", "car wash", "cleaning service"],

  // Printing and signage
  imprenta: ["printing press", "print shop", "graphic design"],
  impresion: ["printing", "print shop", "graphic design"],
  impresión: ["printing", "print shop", "graphic design"],
  printing: ["print shop", "printing press", "graphic design"],
  serigrafía: ["screen printing", "t-shirt printing", "print design"],
  serigrafia: ["screen printing", "t-shirt printing", "print design"],
  rotulos: ["signage", "business sign", "illuminated sign"],
  rótulos: ["signage", "business sign", "illuminated sign"],
  letreros: ["signage", "business sign", "outdoor advertising"],
  publicidad: ["advertising", "marketing signage", "branding display"],
  vallas: ["billboard advertising", "outdoor advertising", "signage"],

  // Music and entertainment
  musica: ["music studio", "musician", "live music"],
  música: ["music studio", "musician", "live music"],
  music: ["music studio", "musician", "live music"],
  band: ["live music band", "concert", "musicians performing"],
  banda: ["live music band", "concert", "musicians performing"],
  discoteca: ["nightclub", "dj mixing", "club music"],
  cantina: ["bar interior", "drinks", "local bar"],
  karaoke: ["karaoke bar", "microphone", "singing"],
  teatro: ["theater stage", "performing arts", "stage lights"],
  cine: ["movie theater", "cinema", "film"],
  academia: ["music school", "classroom", "teaching"],
  "academia de musica": ["music school", "guitar lesson", "piano lesson"],
  "academia de música": ["music school", "guitar lesson", "piano lesson"],
  dj: ["dj mixing", "music studio", "turntable"],
  entretenimiento: ["entertainment event", "live show", "stage lights"],

  // Sports and fitness
  deporte: ["sports", "athlete training", "sports field"],
  deportes: ["sports", "athlete training", "sports field"],
  sports: ["sports", "athlete training", "sports field"],
  futbol: ["soccer field", "football", "soccer player"],
  fútbol: ["soccer field", "football", "soccer player"],
  soccer: ["soccer field", "football", "soccer player"],
  football: ["american football", "sports field", "athlete"],
  basketball: ["basketball court", "basketball player", "sport"],
  baloncesto: ["basketball court", "basketball player", "sport"],
  natacion: ["swimming pool", "swimmer", "aquatics"],
  natación: ["swimming pool", "swimmer", "aquatics"],
  swimming: ["swimming pool", "swimmer", "aquatics"],
  tenis: ["tennis court", "tennis player", "racquet"],
  tennis: ["tennis court", "tennis player", "racquet"],
  boxeo: ["boxing gym", "boxer", "boxing ring"],
  boxing: ["boxing gym", "boxer", "boxing ring"],
  crossfit: ["crossfit gym", "fitness training", "workout"],
  pilates: ["pilates studio", "pilates workout", "fitness"],
  ciclismo: ["cycling", "bicycle", "cyclist"],
  cycling: ["cycling", "bicycle", "cyclist"],
  atletismo: ["athletics track", "runner", "athlete"],
  running: ["running", "runner", "marathon"],

  // Transportation and mobility
  transporte: ["transportation", "transport vehicle", "road logistics"],
  taxi: ["taxi cab", "ride service", "city transport"],
  uber: ["ride sharing", "car service", "transportation app"],
  conductor: ["driver", "professional driver", "transport service"],
  bus: ["bus transport", "passenger bus", "urban transit"],
  autobus: ["bus transport", "passenger bus", "urban transit"],
  autobús: ["bus transport", "passenger bus", "urban transit"],
  flota: ["fleet vehicles", "transport company", "logistics fleet"],
  mudanzas: ["moving service", "moving truck", "movers"],
  carga: ["freight transport", "cargo truck", "logistics"],
  mensajeria: ["courier service", "delivery", "packages"],
  mensajería: ["courier service", "delivery", "packages"],
  courier: ["courier service", "delivery", "packages"],

  // Nail salon and beauty extensions
  "nail salon": ["nail salon", "manicure", "nail art"],
  manicure: ["manicure", "nail salon", "nail art"],
  manicura: ["manicure", "nail salon", "nail art"],
  pedicure: ["pedicure", "foot care", "nail salon"],
  pedicura: ["pedicure", "foot care", "nail salon"],
  uñas: ["nail salon", "manicure", "nail art"],
  "nail art": ["nail art", "manicure", "nail design"],
  pestañas: ["eyelash extensions", "beauty salon", "lashes"],
  depilacion: ["waxing salon", "hair removal", "beauty treatment"],
  depilación: ["waxing salon", "hair removal", "beauty treatment"],
  cejas: ["eyebrow shaping", "beauty salon", "microblading"],
  microblading: ["microblading", "eyebrow tattoo", "beauty salon"],
  tatuaje: ["tattoo studio", "tattoo artist", "ink art"],
  tatuajes: ["tattoo studio", "tattoo artist", "ink art"],
  tattoo: ["tattoo studio", "tattoo artist", "ink art"],
  piercing: ["piercing studio", "body jewelry", "tattoo parlor"],

  // Agriculture and farming
  agricultura: ["agriculture", "farm field", "crop harvest"],
  agro: ["agriculture", "farm field", "agribusiness"],
  granja: ["farm", "farm animals", "countryside"],
  finca: ["farm", "countryside", "rural property"],
  ganaderia: ["cattle ranch", "livestock farm", "cattle"],
  ganadería: ["cattle ranch", "livestock farm", "cattle"],
  ganado: ["cattle ranch", "livestock", "cattle farm"],
  cultivos: ["crop field", "farm harvest", "agriculture"],
  cosecha: ["harvest", "crop field", "agriculture"],
  invernadero: ["greenhouse", "plant nursery", "horticulture"],
  vivero: ["plant nursery", "garden center", "plants"],
  huerto: ["vegetable garden", "organic garden", "harvest"],
  organico: ["organic farm", "organic food", "healthy harvest"],
  orgánico: ["organic farm", "organic food", "healthy harvest"],
  farming: ["farm field", "agriculture", "crop harvest"],
  agriculture: ["farm field", "agriculture", "crop harvest"],
  nursery: ["plant nursery", "garden center", "plants"],

  // Childcare and education (expanded)
  guarderia: ["daycare", "kids playing", "childcare center"],
  guardería: ["daycare", "kids playing", "childcare center"],
  preescolar: ["preschool classroom", "kids learning", "early education"],
  kinder: ["kindergarten classroom", "kids learning", "preschool"],
  kindergarten: ["kindergarten classroom", "kids learning", "preschool"],
  jardin: ["kindergarten", "kids playing", "garden"],
  colegio: ["school classroom", "students", "teacher"],
  liceo: ["high school", "students", "classroom"],
  universidad: ["university campus", "students studying", "college"],
  tutoria: ["tutoring", "student teacher", "study session"],
  tutoría: ["tutoring", "student teacher", "study session"],
  idiomas: ["language school", "foreign language class", "classroom"],
  ingles: ["english class", "language school", "classroom"],
  inglés: ["english class", "language school", "classroom"],

  // Wholesale and import/export
  mayorista: ["wholesale warehouse", "bulk products", "distribution center"],
  importadora: ["import export", "cargo warehouse", "supply chain"],
  distribuidora: ["distribution center", "warehouse", "logistics"],
  distribucion: ["distribution center", "warehouse", "logistics"],
  distribución: ["distribution center", "warehouse", "logistics"],
  wholesale: ["wholesale warehouse", "bulk products", "distribution"],
  exportacion: ["export cargo", "shipping containers", "international trade"],
  exportación: ["export cargo", "shipping containers", "international trade"],

  // Security services
  vigilancia: ["security guard", "surveillance camera", "security service"],
  seguridad: ["security guard", "surveillance camera", "security service"],
  guardia: ["security guard", "surveillance", "patrol"],
  alarmas: ["alarm system", "home security", "surveillance camera"],
  camaras: ["surveillance camera", "security system", "cctv"],
  cámaras: ["surveillance camera", "security system", "cctv"],
  "security guard": ["security guard", "surveillance", "patrol"],
  cctv: ["surveillance camera", "cctv", "security monitoring"],

  // Tourism and guided tours (expanded)
  tours: ["guided tour", "travel adventure", "tourism"],
  tour: ["guided tour", "travel adventure", "tourism"],
  ecoturismo: ["ecotourism", "nature travel", "adventure tour"],
  aventura: ["adventure travel", "outdoor adventure", "extreme sports"],
  senderismo: ["hiking trail", "nature walk", "outdoor adventure"],
  hiking: ["hiking trail", "mountain trek", "outdoor adventure"],
  camping: ["camping", "outdoor tent", "nature campsite"],
  crucero: ["cruise ship", "ocean cruise", "travel"],

  // Winery and brewery
  vino: ["winery", "wine cellar", "vineyard"],
  vinos: ["winery", "wine cellar", "vineyard"],
  wine: ["winery", "wine cellar", "vineyard"],
  winery: ["winery", "vineyard", "wine cellar"],
  bodega: ["winery cellar", "wine barrels", "vineyard"],
  cerveza: ["brewery", "craft beer", "beer brewing"],
  cerveceria: ["brewery", "craft beer", "beer brewing"],
  cervecería: ["brewery", "craft beer", "beer brewing"],
  brewery: ["brewery", "craft beer", "beer brewing"],
  licoreria: ["liquor store", "spirits", "bar"],
  licorera: ["liquor store", "spirits", "bar"],

  // Churches and religious organizations
  iglesia: ["church community", "religious gathering", "congregation"],
  iglesias: ["church community", "religious gathering", "congregation"],
  ministerio: ["church ministry", "religious community", "congregation"],
  ministerios: ["church ministry", "religious community", "congregation"],
  mision: ["mission church", "community volunteer", "religious organization"],
  misión: ["mission church", "community volunteer", "religious organization"],
  pastoral: ["church pastoral", "religious community", "faith"],
  capilla: ["chapel", "church interior", "religious space"],

  // Immigration and international legal
  migracion: ["immigration office", "visa documents", "passport"],
  migración: ["immigration office", "visa documents", "passport"],
  immigration: ["immigration office", "visa documents", "passport"],
  visas: ["visa documents", "passport", "immigration office"],
  pasaporte: ["passport", "immigration documents", "travel"],
  tramites: ["document processing", "office", "paperwork"],
  trámites: ["document processing", "office", "paperwork"],

  // Industrial and manufacturing
  manufactura: ["manufacturing plant", "factory", "industrial production"],
  fabrica: ["factory", "manufacturing plant", "production line"],
  fábrica: ["factory", "manufacturing plant", "production line"],
  factory: ["factory", "manufacturing plant", "production line"],
  industrial: ["industrial facility", "manufacturing plant", "warehouse"],
  metalmecanica: ["metalworking", "industrial machinery", "manufacturing"],
  metalmecánica: ["metalworking", "industrial machinery", "manufacturing"],
  soldadura: ["welding", "metalwork", "welder"],
  welding: ["welding", "metalwork", "welder"],
  mecanica: ["machinist", "metalworking", "industrial tools"],
  mecánica: ["machinist", "metalworking", "industrial tools"],
  maquinaria: ["industrial machinery", "equipment", "manufacturing"],
};

/**
 * Prompt-level synonym map. These are used when the AI prompt mentions a more
 * specific service than the stored business type.
 */
const PROMPT_KEYWORDS: Record<string, string[]> = {
  // Roofing specifics
  shingle: ["shingle roof", "roofing contractor"],
  shingles: ["shingle roof", "roofing contractor"],
  metal: ["metal roof", "roofing contractor"],
  tile: ["tile roof", "roofing contractor"],
  leak: ["roof leak repair", "water damage"],
  leaks: ["roof leak repair", "water damage"],

  // Painting/remodeling specifics
  exterior: ["home exterior", "exterior painting"],
  interior: ["interior design", "interior painting"],
  brush: ["paint brush", "painting contractor"],
  roller: ["paint roller", "painting contractor"],
  cabinet: ["cabinet painting", "kitchen renovation"],
  kitchen: ["kitchen renovation", "modern kitchen"],
  bathroom: ["bathroom renovation", "remodeling"],
  hardwood: ["hardwood floor", "flooring installation"],
  laminate: ["laminate flooring", "flooring installation"],
  vinyl: ["vinyl flooring", "flooring installation"],

  // Water/restoration
  flood: ["water damage restoration", "emergency cleanup"],
  flooding: ["water damage restoration", "emergency cleanup"],
  mold: ["mold remediation", "water damage restoration"],
  basement: ["basement waterproofing", "foundation repair"],
  foundation: ["foundation repair", "basement waterproofing"],
  drain: ["yard drainage", "french drain"],
  french: ["french drain", "yard drainage"],
  pavers: ["patio pavers", "hardscaping"],
  patio: ["patio pavers", "backyard", "hardscaping"],
  walkway: ["stone walkway", "hardscaping"],

  // Automotive specifics
  mechanic: ["car mechanic", "auto repair shop"],
  repair: ["repair service", "technician", "tools"],
  detailing: ["auto detailing", "car wash"],
  roadside: ["roadside assistance", "tow truck"],
  truck: ["truck", "service vehicle"],

  // Medical/beauty specifics
  skincare: ["skincare", "beauty salon", "spa"],
  makeup: ["makeup artist", "beauty salon"],
  hair: ["hair salon", "stylist"],
  massage: ["massage therapy", "spa"],
  smile: ["dentist", "dental care", "smile"],
  braces: ["orthodontist", "braces", "dental clinic"],

  // Food specifics
  chef: ["chef cooking", "restaurant kitchen"],
  dining: ["restaurant dining", "restaurant interior"],
  gourmet: ["gourmet food", "chef plating food"],
  pastry: ["pastry", "bakery"],
  bread: ["fresh bread", "bakery"],
  barista: ["barista", "coffee shop"],

  // Digital/professional specifics
  laptop: ["laptop workspace", "technology office"],
  computer: ["computer code", "technology office"],
  coding: ["computer code", "software developer"],
  analytics: ["analytics dashboard", "digital marketing"],
  ads: ["digital marketing", "analytics dashboard"],
  meeting: ["business meeting", "professional team"],
  contract: ["legal documents", "business contract"],
  documents: ["documents", "office"],
  keys: ["house keys", "real estate agent"],

  // Tailoring/fashion specifics
  suit: ["custom suit", "suit fitting"],
  suits: ["custom suit", "suit fitting"],
  sewing: ["sewing atelier", "needle thread"],
  needle: ["sewing atelier", "tailoring"],
  thread: ["sewing atelier", "needle thread"],
  fabric: ["fabric store", "textile fabric"],
  alteration: ["clothing alteration", "tailor shop"],
  embroidery: ["embroidery", "needlework"],

  // Pet/vet specifics
  dog: ["dog", "pet care"],
  cat: ["cat", "pet care"],
  puppy: ["puppy", "dog", "pet"],
  paw: ["dog paw", "pet care"],
  animal: ["animal care", "veterinary"],
  feline: ["cat", "feline", "veterinary"],

  // Solar/energy specifics
  panel: ["solar panels", "solar energy"],
  panels: ["solar panels", "solar energy"],
  renewable: ["renewable energy", "solar panels"],
  green: ["green energy", "eco friendly"],
  wind: ["wind turbine", "renewable energy"],

  // Laundry specifics
  iron: ["ironing service", "clothes pressing"],
  ironing: ["ironing service", "dry cleaning"],
  laundromat: ["laundry service", "washing machines"],

  // Print/signage specifics
  poster: ["print poster", "graphic design"],
  flyer: ["flyer printing", "print design"],
  ink: ["printing ink", "print shop"],
  print: ["print shop", "printing press"],
  sign: ["business sign", "signage"],
  billboard: ["billboard advertising", "outdoor advertising"],

  // Music specifics
  guitar: ["guitar", "musician", "music studio"],
  piano: ["piano", "music studio", "musician"],
  drums: ["drums", "band", "music studio"],
  singing: ["singing", "vocalist", "music studio"],
  microphone: ["microphone", "singing", "live music"],
  concert: ["concert", "live music", "stage lights"],
  stage: ["stage lights", "concert", "live performance"],

  // Sports specifics
  athlete: ["athlete training", "sports field"],
  stadium: ["stadium", "sports field", "sports event"],
  court: ["basketball court", "tennis court", "sports"],
  pool: ["swimming pool", "swimmer", "aquatics"],
  race: ["running race", "athlete", "marathon"],
  marathon: ["marathon", "runner", "road race"],
  gym: ["gym", "fitness training", "workout"],

  // Transport specifics
  driver: ["professional driver", "transport service"],
  fleet: ["fleet vehicles", "transport company"],
  freight: ["freight transport", "cargo truck"],
  cargo: ["cargo truck", "freight transport"],
  ship: ["shipping containers", "cargo", "international trade"],

  // Nail/beauty specifics
  nail: ["nail salon", "manicure", "nail art"],
  nails: ["nail salon", "manicure", "nail art"],
  gel: ["gel nails", "nail salon", "manicure"],
  lashes: ["eyelash extensions", "beauty salon"],
  waxing: ["waxing salon", "hair removal"],
  brow: ["eyebrow shaping", "beauty salon"],
  brows: ["eyebrow shaping", "microblading"],

  // Agriculture specifics
  farm: ["farm field", "agriculture", "countryside"],
  harvest: ["harvest", "crop field", "agriculture"],
  crop: ["crop field", "farm harvest"],
  tractor: ["tractor", "farm field", "agriculture"],
  field: ["farm field", "crop", "agriculture"],
  greenhouse: ["greenhouse", "plant nursery"],
  cattle: ["cattle ranch", "livestock farm"],
  organic: ["organic farm", "organic food"],

  // Industrial specifics
  welder: ["welding", "metalwork", "welder"],
  factory: ["factory", "manufacturing plant"],
  machinery: ["industrial machinery", "equipment"],
  production: ["production line", "manufacturing plant"],

  // Style modifiers - intentionally lower impact after weighting
  luxury: ["luxury"],
  premium: ["premium"],
  modern: ["modern"],
  professional: ["professional"],
};

/**
 * Phrase rules beat single-word matching. This is where most accuracy comes from.
 */
const PHRASE_RULES: Array<{ pattern: RegExp; terms: string[]; weight: number }> = [
  { pattern: /water\s+damage|damage\s+restoration|flood\s+cleanup|emergency\s+cleanup/, terms: ["water damage restoration", "emergency cleanup", "home restoration"], weight: 14 },
  { pattern: /mold\s+remediation|mold\s+removal/, terms: ["mold remediation", "water damage restoration"], weight: 14 },
  { pattern: /roof\s+repair|roofing\s+repair|roof\s+leak|leaky\s+roof/, terms: ["roof repair", "roofing contractor", "shingle roof"], weight: 14 },
  { pattern: /metal\s+roof|metal\s+roofing/, terms: ["metal roof", "roofing contractor", "house exterior"], weight: 14 },
  { pattern: /shingle\s+roof|asphalt\s+shingles/, terms: ["shingle roof", "roofing contractor", "house exterior"], weight: 14 },
  { pattern: /house\s+painting|home\s+painting|painting\s+contractor/, terms: ["house painting", "painting contractor", "paint roller"], weight: 14 },
  { pattern: /exterior\s+painting|paint\s+exterior/, terms: ["home exterior painting", "painting contractor", "house exterior"], weight: 14 },
  { pattern: /interior\s+painting|paint\s+interior/, terms: ["interior painting", "paint roller", "home renovation"], weight: 14 },
  { pattern: /flooring\s+installation|install\s+floor|hardwood\s+floor|vinyl\s+floor|laminate\s+floor/, terms: ["flooring installation", "hardwood floor", "floor renovation"], weight: 14 },
  { pattern: /epoxy\s+floor|floor\s+coating|garage\s+floor/, terms: ["epoxy floor", "garage floor", "floor coating"], weight: 14 },
  { pattern: /french\s+drain|yard\s+drainage|drainage\s+system/, terms: ["french drain", "yard drainage", "landscaping drainage"], weight: 14 },
  { pattern: /patio\s+pavers|paver\s+patio|stone\s+walkway|hardscaping/, terms: ["patio pavers", "hardscaping", "stone walkway"], weight: 14 },
  { pattern: /pressure\s+washing|power\s+washing/, terms: ["pressure washing", "power washing", "driveway cleaning"], weight: 14 },
  { pattern: /auto\s+detailing|car\s+detailing/, terms: ["auto detailing", "car wash", "clean car"], weight: 14 },
  { pattern: /car\s+wash|mobile\s+car\s+wash/, terms: ["car wash", "auto detailing", "clean car"], weight: 14 },
  { pattern: /tow\s+truck|roadside\s+assistance|car\s+towing/, terms: ["tow truck", "roadside assistance", "car towing"], weight: 14 },
  { pattern: /real\s+estate|realtor|property\s+agent/, terms: ["real estate agent", "house keys", "modern house"], weight: 14 },
  { pattern: /dental\s+clinic|dentist|dental\s+care/, terms: ["dental clinic", "dentist", "dental care"], weight: 14 },
  { pattern: /medical\s+clinic|healthcare|doctor\s+office/, terms: ["medical clinic", "doctor", "healthcare"], weight: 14 },
  { pattern: /beauty\s+salon|hair\s+salon|nail\s+salon/, terms: ["beauty salon", "hair salon", "spa"], weight: 14 },
  { pattern: /coffee\s+shop|coffeehouse|barista/, terms: ["coffee shop", "barista", "cafe interior"], weight: 14 },
  { pattern: /restaurant\s+kitchen|chef\s+cooking|fine\s+dining/, terms: ["restaurant", "chef cooking", "restaurant kitchen"], weight: 14 },
  { pattern: /digital\s+marketing|marketing\s+agency|social\s+media/, terms: ["digital marketing", "creative agency", "analytics dashboard"], weight: 14 },
  { pattern: /software\s+development|web\s+development|app\s+development/, terms: ["software development", "computer code", "developer workspace"], weight: 14 },
  { pattern: /law\s+office|legal\s+consultation|attorney|lawyer/, terms: ["law office", "lawyer", "legal consultation"], weight: 14 },
  { pattern: /accounting\s+office|tax\s+preparation|bookkeeping/, terms: ["accounting office", "accountant", "documents"], weight: 14 },
  { pattern: /wedding\s+planner|wedding\s+venue|event\s+planning/, terms: ["event planning", "wedding venue", "celebration"], weight: 14 },
  // Fashion & tailoring
  { pattern: /sastreria|sastrería|tailor\s+shop|custom\s+suit|traje\s+a\s+medida/, terms: ["tailor shop", "suit fitting", "custom suits", "sewing atelier"], weight: 14 },
  { pattern: /costura|sewing\s+atelier|dress\s+making|confeccion|confección/, terms: ["sewing atelier", "tailor shop", "fabric", "needle thread"], weight: 14 },
  { pattern: /peluqueria\s+canina|dog\s+grooming|pet\s+grooming|salon\s+canino/, terms: ["dog grooming", "pet grooming", "grooming salon"], weight: 14 },
  // Energy
  { pattern: /paneles\s+solares|solar\s+panels|energia\s+solar|solar\s+energy|instalacion\s+solar/, terms: ["solar panels", "solar energy", "rooftop solar installation"], weight: 14 },
  // Laundry
  { pattern: /lavanderia|lavandería|dry\s+cleaning|tintoreria|tintorería|limpieza\s+de\s+ropa/, terms: ["laundry service", "dry cleaning", "clothes pressing"], weight: 14 },
  // Printing
  { pattern: /imprenta|print\s+shop|serigrafia|serigrafía|rotulos|rótulos/, terms: ["print shop", "printing press", "graphic design"], weight: 14 },
  // Veterinary
  { pattern: /clinica\s+veterinaria|veterinary\s+clinic|hospital\s+veterinario/, terms: ["veterinary clinic", "veterinarian", "pet care"], weight: 14 },
  // Automotive extended
  { pattern: /taller\s+mecanico|taller\s+mecánico|auto\s+repair|mecanica\s+automotriz/, terms: ["auto repair shop", "car mechanic", "vehicle service"], weight: 14 },
  // Agriculture
  { pattern: /finca\s+agricola|organic\s+farm|granja\s+organica|cosecha|crop\s+harvest/, terms: ["farm field", "crop harvest", "agriculture"], weight: 14 },
  // Sports
  { pattern: /academia\s+de\s+futbol|soccer\s+academy|football\s+academy|escuela\s+deportiva/, terms: ["soccer field", "soccer player", "sports training"], weight: 14 },
  { pattern: /crossfit|functional\s+training|entrenamiento\s+funcional/, terms: ["crossfit gym", "fitness training", "workout"], weight: 14 },
  // Transport
  { pattern: /empresa\s+de\s+transporte|transport\s+company|servicio\s+de\s+transporte/, terms: ["transportation", "transport vehicle", "logistics fleet"], weight: 14 },
  // Industrial
  { pattern: /taller\s+de\s+soldadura|welding\s+shop|metalmecanica|metalmecánica/, terms: ["welding", "metalwork", "manufacturing plant"], weight: 14 },
  { pattern: /manufactura|manufacturing\s+plant|linea\s+de\s+produccion|production\s+line/, terms: ["manufacturing plant", "factory", "production line"], weight: 14 },
  // Music
  { pattern: /academia\s+de\s+musica|music\s+school|escuela\s+de\s+musica/, terms: ["music school", "guitar lesson", "piano lesson"], weight: 14 },
  { pattern: /estudio\s+de\s+grabacion|recording\s+studio|grabacion\s+musical/, terms: ["recording studio", "music studio", "musician"], weight: 14 },
  // Nail/beauty
  { pattern: /salon\s+de\s+unas|nail\s+salon|manicure\s+pedicure|unas\s+acrilicas/, terms: ["nail salon", "manicure", "nail art"], weight: 14 },
  // Tourism
  { pattern: /tour\s+operador|agencia\s+de\s+viajes|travel\s+agency|paquetes\s+turisticos/, terms: ["travel agency", "guided tour", "tourism"], weight: 14 },
  { pattern: /ecoturismo|ecotourism|turismo\s+de\s+aventura|adventure\s+tourism/, terms: ["ecotourism", "nature travel", "adventure tour"], weight: 14 },
];

const SECTION_KEYWORDS: Record<string, string[]> = {
  hero: ["wide hero image"],
  home: ["professional service"],
  about: ["business owner", "professional team"],
  team: ["professional team", "staff"],
  services: ["service professional", "tools"],
  service: ["service professional", "tools"],
  gallery: ["finished project", "before after"],
  portfolio: ["finished project", "portfolio"],
  testimonial: ["happy customer", "client consultation"],
  contact: ["customer service", "phone call"],
  appointment: ["customer service", "consultation"],
  booking: ["customer service", "consultation"],
};

/** Extracts the best keyword query from a label like "Automotive / Automotriz". */
export function businessKeyword(businessType: string): string {
  return buildImageQuery({ businessType, width: 1200, height: 800 });
}

/**
 * Resolves the best Pexels image URL for a section slot.
 */
export function sectionImageUrl(req: ImageRequest): string {
  const query = buildImageQuery(req);
  return pexelsImageUrl(query, req.seed, req.width, req.height);
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
  return pexelsImageUrl(buildImageQuery({ businessType, width, height }), seed, width, height);
}

/**
 * Useful while debugging. Example:
 * console.log(debugImageQuery({ businessType: "Roofing", prompt: "hero roof repair", width: 1600, height: 900 }));
 */
export function debugImageQuery(req: Omit<ImageRequest, "seed"> & { seed?: string | number }): string {
  return buildImageQuery(req);
}

/**
 * Builds a compact Pexels query from business type + prompt + optional section.
 * The query intentionally stays short because long Pexels queries often produce
 * weaker results than 3-8 precise words.
 */
export function buildImageQuery(ctx: QueryContext): string {
  const scores = new Map<string, number>();
  const businessText = normalizeText(ctx.businessType || "");
  const promptText = normalizeText(ctx.prompt || "");
  const sectionText = normalizeText(ctx.section || "");
  const fullText = `${businessText} ${promptText} ${sectionText}`.trim();

  // 1) Highest priority: explicit phrase/service intent.
  for (const rule of PHRASE_RULES) {
    if (rule.pattern.test(fullText)) addTerms(scores, rule.terms, rule.weight);
  }

  // 2) Business category is more trustworthy than generated prompt style words.
  addMatchedDictionaryTerms(scores, businessText, BUSINESS_KEYWORDS, 10);

  // 3) Prompt can override/strengthen with specific services.
  addMatchedDictionaryTerms(scores, promptText, BUSINESS_KEYWORDS, 8);
  addMatchedDictionaryTerms(scores, promptText, PROMPT_KEYWORDS, 6);

  // 4) Section hints help composition but should never beat service intent.
  addMatchedDictionaryTerms(scores, sectionText, SECTION_KEYWORDS, 2);
  addMatchedDictionaryTerms(scores, promptText, SECTION_KEYWORDS, 1.5);

  // 5) If no category matched, try cleaned prompt words as a last resort.
  if (scores.size === 0) {
    const cleanedPromptTerms = tokens(promptText)
      .filter((word) => !PROMPT_NOISE_WORDS.has(word))
      .slice(0, 4);
    addTerms(scores, cleanedPromptTerms, 1);
  }

  const rankedTerms = rankTerms(scores, ctx);
  return compactPexelsQuery(rankedTerms) || DEFAULT_TAGS;
}

function pexelsImageUrl(
  query: string,
  seed: string | number,
  width: number,
  height: number
): string {
  const params = new URLSearchParams({
    q: query,
    seed: String(seed),
    w: String(width),
    h: String(height),
  });

  return `/api/images/pexels?${params}`;
}

function addMatchedDictionaryTerms(
  scores: Map<string, number>,
  text: string,
  dictionary: Record<string, string[]>,
  weight: number
): void {
  if (!text) return;

  const textTokens = tokens(text);
  const tokenSet = new Set(textTokens);

  // Match single tokens.
  for (const token of tokenSet) {
    const terms = dictionary[token];
    if (terms) addTerms(scores, terms, weight);
  }

  // Match multi-word dictionary keys, if any are added later.
  for (const [key, terms] of Object.entries(dictionary)) {
    if (!key.includes(" ")) continue;
    if (text.includes(key)) addTerms(scores, terms, weight + 1);
  }
}

function addTerms(scores: Map<string, number>, terms: string[], weight: number): void {
  for (const rawTerm of terms) {
    const term = normalizeQueryTerm(rawTerm);
    if (!term) continue;
    scores.set(term, (scores.get(term) || 0) + weight);
  }
}

function rankTerms(scores: Map<string, number>, ctx: QueryContext): string[] {
  const aspectBoost = getAspectBoost(ctx.width, ctx.height);
  const weighted: WeightedQuery[] = [...scores.entries()].map(([term, weight]) => ({
    term,
    weight: weight + (aspectBoost[term] || 0),
  }));

  const hasSpecificTerms = weighted.some(({ term }) => !isGenericTerm(term));

  return weighted
    .filter(({ term }) => {
      if (!hasSpecificTerms) return true;
      return !isGenericTerm(term);
    })
    .sort((a, b) => {
      if (b.weight !== a.weight) return b.weight - a.weight;
      // Prefer more precise phrases over one-word generic terms.
      return wordCount(b.term) - wordCount(a.term);
    })
    .map(({ term }) => term);
}

function compactPexelsQuery(terms: string[]): string {
  const selected: string[] = [];
  const usedWords = new Set<string>();
  let totalWords = 0;

  for (const term of terms) {
    const termWords = term.split(/\s+/).filter(Boolean);
    if (!termWords.length) continue;

    // Avoid repeating the same intent: "roof repair roofing contractor roof".
    const overlap = termWords.filter((word) => usedWords.has(word)).length;
    const tooSimilar = overlap >= Math.ceil(termWords.length * 0.75);
    if (tooSimilar && selected.length > 0) continue;

    const nextTotal = totalWords + termWords.length;
    const maxWords = selected.length === 0 ? 5 : 9;
    if (nextTotal > maxWords && selected.length >= 2) continue;

    selected.push(term);
    totalWords += termWords.length;
    termWords.forEach((word) => usedWords.add(word));

    if (selected.length >= 3 || totalWords >= 9) break;
  }

  return selected.join(" ").trim();
}

function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9\s/|,.-]+/g, " ")
    .replace(/[\/|,.-]+/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function normalizeQueryTerm(value: string): string {
  return normalizeText(value)
    .split(/\s+/)
    .filter((word) => word && !PROMPT_NOISE_WORDS.has(word))
    .join(" ")
    .trim();
}

function tokens(text: string): string[] {
  if (!text) return [];
  return text
    .split(/\s+/)
    .map((word) => word.trim())
    .filter((word) => word.length > 1 && !PROMPT_NOISE_WORDS.has(word));
}

function isGenericTerm(term: string): boolean {
  const words = term.split(/\s+/).filter(Boolean);
  return words.length > 0 && words.every((word) => GENERIC_TERMS.has(word));
}

function wordCount(term: string): number {
  return term.split(/\s+/).filter(Boolean).length;
}

function getAspectBoost(width: number, height: number): Record<string, number> {
  if (!width || !height) return {};

  const ratio = width / height;

  // These are intentionally tiny boosts. They should not change the category,
  // only help when there is a tie.
  if (ratio >= 1.55) {
    return {
      "house exterior": 0.25,
      "construction site": 0.25,
      "restaurant interior": 0.25,
      "hotel lobby": 0.25,
      "professional team": 0.2,
      "business meeting": 0.2,
    };
  }

  if (ratio <= 0.8) {
    return {
      "business owner": 0.25,
      "service professional": 0.25,
      "doctor": 0.2,
      "barista": 0.2,
      "stylist": 0.2,
      "car mechanic": 0.2,
    };
  }

  return {};
}
