/**
 * Tests the image query builder with real business types and prompts.
 * Run: npx tsx scripts/test-image-queries.ts
 * Output: test-results/image-queries.txt
 */

import { writeFileSync } from "fs";
import { buildImageQuery } from "../lib/site/images";

const CASES: Array<{
  label: string;
  businessType: string;
  prompt?: string;
  section?: string;
}> = [
  // ── The original bug ─────────────────────────────────────────────────────
  { label: "Sastrería (original bug)",        businessType: "Sastrería / Tailoring",    prompt: "Sitio web de Sastreria con 10 años de experiencia ubicada en Medellin colombia" },
  { label: "Sastre en inglés",                 businessType: "tailor",                   prompt: "custom suit tailoring shop downtown" },
  { label: "Costura / modista",                businessType: "costura y confección",      prompt: "Modista especializada en vestidos de novia y alteraciones" },

  // ── Home services ────────────────────────────────────────────────────────
  { label: "Techos / Roofing",                 businessType: "Techos / Roofing",          prompt: "roof repair and shingle replacement" },
  { label: "Pintura exterior",                  businessType: "Pintura / Painting",        prompt: "exterior painting contractor residential" },
  { label: "Pisos epóxicos",                   businessType: "Pisos / Flooring",          prompt: "epoxy floor garage coating installation" },
  { label: "Plomería",                         businessType: "Plomería / Plumbing",       prompt: "plumber pipe repair emergency service" },
  { label: "Jardinería",                       businessType: "Jardinería / Landscaping",  prompt: "lawn care garden maintenance backyard" },
  { label: "Limpieza del hogar",               businessType: "Limpieza / Cleaning",       prompt: "home cleaning professional housekeeping" },
  { label: "Restauración agua",                businessType: "Restauración / Restoration",prompt: "water damage restoration flood cleanup emergency" },
  { label: "Presión lavado",                   businessType: "Pressure Washing",          prompt: "pressure washing driveway sidewalk cleaning" },
  { label: "Control de plagas",                businessType: "Pest Control",              prompt: "pest exterminator home inspection" },

  // ── Automotive ───────────────────────────────────────────────────────────
  { label: "Taller mecánico",                  businessType: "Taller Mecánico / Auto Repair", prompt: "car mechanic auto repair shop" },
  { label: "Detailing automotriz",              businessType: "Detailing / Car Wash",       prompt: "auto detailing car wash mobile service" },
  { label: "Grúa / Towing",                   businessType: "Grúa / Towing",               prompt: "tow truck roadside assistance" },
  { label: "Venta de autos",                   businessType: "Car Dealership / Automotriz", prompt: "car showroom new vehicles dealership" },

  // ── Food & hospitality ────────────────────────────────────────────────────
  { label: "Restaurante",                      businessType: "Restaurante / Restaurant",   prompt: "restaurant chef cooking fine dining cuisine" },
  { label: "Café / Cafetería",                 businessType: "Café / Coffee Shop",         prompt: "coffee shop barista espresso cozy cafe" },
  { label: "Panadería",                        businessType: "Panadería / Bakery",         prompt: "bakery fresh bread pastry artisan" },
  { label: "Hotel",                            businessType: "Hotel / Hospitality",         prompt: "hotel lobby luxury reception hospitality" },
  { label: "Bar / Cantina",                   businessType: "Bar / Cantina",               prompt: "cocktail bar drinks local cantina" },
  { label: "Bodega de vinos",                 businessType: "Bodega / Winery",             prompt: "winery wine cellar vineyard barrels" },
  { label: "Cervecería artesanal",            businessType: "Cervecería / Brewery",        prompt: "craft beer brewery tap room" },

  // ── Health & wellness ────────────────────────────────────────────────────
  { label: "Clínica médica",                  businessType: "Clínica / Medical Clinic",    prompt: "medical clinic doctor patient healthcare" },
  { label: "Odontología",                     businessType: "Dental / Odontología",        prompt: "dental clinic dentist teeth care smile" },
  { label: "Salón de belleza",                businessType: "Belleza / Beauty Salon",      prompt: "beauty salon hair stylist makeup spa" },
  { label: "Gimnasio / Gym",                  businessType: "Gimnasio / Fitness",          prompt: "gym fitness training workout personal trainer" },
  { label: "Crossfit",                        businessType: "CrossFit / Functional",       prompt: "crossfit gym functional training WOD" },
  { label: "Yoga / Pilates",                  businessType: "Yoga / Pilates Studio",       prompt: "yoga studio pilates wellness meditation" },
  { label: "Barbería",                        businessType: "Barbería / Barbershop",       prompt: "barbershop barber haircut grooming" },

  // ── Fashion & beauty extensions ──────────────────────────────────────────
  { label: "Nail salon / Uñas",               businessType: "Nail Salon / Uñas",           prompt: "nail salon manicure pedicure gel nails art" },
  { label: "Microblading / Cejas",            businessType: "Microblading / Belleza",      prompt: "microblading eyebrow shaping beauty" },
  { label: "Tatuajes",                        businessType: "Tatuajes / Tattoo Studio",    prompt: "tattoo studio artist ink body art" },
  { label: "Depilación",                      businessType: "Depilación / Waxing",         prompt: "waxing hair removal beauty salon laser" },

  // ── Pets & veterinary ────────────────────────────────────────────────────
  { label: "Veterinaria",                     businessType: "Veterinaria / Veterinary",    prompt: "veterinary clinic vet pet care animals" },
  { label: "Peluquería canina",               businessType: "Peluquería Canina / Grooming",prompt: "dog grooming pet grooming salon canino" },
  { label: "Pet shop",                        businessType: "Pet Shop / Mascotas",         prompt: "pet store dog cat accessories" },

  // ── Energy ──────────────────────────────────────────────────────────────
  { label: "Paneles solares",                 businessType: "Energía Solar / Solar Panels",prompt: "solar panels installation energy renewable rooftop" },
  { label: "Paneles (español)",               businessType: "Paneles Solares",             prompt: "instalación de paneles solares energía renovable" },

  // ── Pharmacy & health stores ─────────────────────────────────────────────
  { label: "Farmacia",                        businessType: "Farmacia / Pharmacy",         prompt: "pharmacy pharmacist medicine shelves" },
  { label: "Naturista / Suplementos",         businessType: "Naturista / Health Store",    prompt: "natural health store vitamins supplements organic" },
  { label: "Óptica",                          businessType: "Óptica / Optometría",         prompt: "optician eyeglasses eye exam optometrist" },

  // ── Laundry ──────────────────────────────────────────────────────────────
  { label: "Lavandería",                      businessType: "Lavandería / Laundry",        prompt: "laundry service washing dry cleaning ironing" },
  { label: "Tintorería",                      businessType: "Tintorería / Dry Cleaning",   prompt: "dry cleaning tintoreria clothes pressing" },

  // ── Printing & signage ───────────────────────────────────────────────────
  { label: "Imprenta",                        businessType: "Imprenta / Print Shop",       prompt: "printing press print shop flyers posters" },
  { label: "Serigrafía",                      businessType: "Serigrafía / Screen Printing",prompt: "screen printing t-shirt serigrafia ink" },
  { label: "Rótulos / Señaletica",            businessType: "Rótulos / Signage",           prompt: "signage business sign letrero rotulo illuminated" },

  // ── Professional services ────────────────────────────────────────────────
  { label: "Abogados",                        businessType: "Abogados / Law Office",       prompt: "law office lawyer legal consultation attorney" },
  { label: "Contabilidad",                    businessType: "Contabilidad / Accounting",   prompt: "accounting office accountant tax preparation" },
  { label: "Bienes raíces",                   businessType: "Bienes Raíces / Real Estate", prompt: "real estate agent house keys property modern" },
  { label: "Consultoría",                     businessType: "Consultoría / Consulting",    prompt: "business consulting meeting professional team" },
  { label: "Seguros",                         businessType: "Seguros / Insurance",         prompt: "insurance agent business consultation documents" },
  { label: "Migración / Visas",               businessType: "Migración / Immigration",     prompt: "immigration office visa documents passport tramites" },

  // ── Creative & tech ──────────────────────────────────────────────────────
  { label: "Agencia de marketing",            businessType: "Agencia de Marketing",        prompt: "digital marketing agency branding social media" },
  { label: "Software / Tech",                 businessType: "Software / Technology",       prompt: "software development computer code startup office" },
  { label: "Diseño gráfico",                 businessType: "Diseño Gráfico / Design",     prompt: "designer workspace creative studio branding" },
  { label: "Fotografía",                      businessType: "Fotografía / Photography",    prompt: "photographer studio camera photo session" },

  // ── Retail & ecommerce ───────────────────────────────────────────────────
  { label: "Tienda retail",                   businessType: "Tienda / Retail Store",       prompt: "retail store shopping boutique products" },
  { label: "Joyería",                         businessType: "Joyería / Jewelry",           prompt: "jewelry store luxury rings necklace" },
  { label: "Floristería",                     businessType: "Floristería / Florist",       prompt: "flower shop florist bouquet roses" },

  // ── Education ────────────────────────────────────────────────────────────
  { label: "Guardería / Daycare",             businessType: "Guardería / Daycare",         prompt: "daycare childcare kids playing early education" },
  { label: "Academia de música",              businessType: "Academia de Música",          prompt: "music school guitar lesson piano violin" },
  { label: "Idiomas / Inglés",               businessType: "Academia de Idiomas",         prompt: "english class language school foreign language" },
  { label: "Colegio privado",                businessType: "Colegio / School",            prompt: "school classroom students teacher education" },

  // ── Events ──────────────────────────────────────────────────────────────
  { label: "Eventos / Wedding planner",       businessType: "Eventos / Wedding Planner",   prompt: "wedding venue event planning decoration celebration" },

  // ── Transport & logistics ─────────────────────────────────────────────────
  { label: "Empresa de transporte",           businessType: "Transporte / Logistics",      prompt: "transport company fleet vehicles cargo logistics" },
  { label: "Mensajería / Courier",           businessType: "Mensajería / Courier",        prompt: "courier delivery service packages express" },
  { label: "Mudanzas",                       businessType: "Mudanzas / Moving",           prompt: "moving service truck movers furniture" },

  // ── Security ─────────────────────────────────────────────────────────────
  { label: "Seguridad / Vigilancia",          businessType: "Seguridad / Security",        prompt: "security guard surveillance camera patrol professional" },
  { label: "Alarmas / CCTV",                 businessType: "Alarmas / CCTV",              prompt: "alarm system cctv home security surveillance camera" },

  // ── Tourism ──────────────────────────────────────────────────────────────
  { label: "Agencia de viajes",              businessType: "Agencia de Viajes / Travel",  prompt: "travel agency vacation destination tour packages" },
  { label: "Ecoturismo",                     businessType: "Ecoturismo / Ecotourism",     prompt: "ecotourism nature adventure hiking outdoors" },
  { label: "Tours locales",                  businessType: "Tours / Guía Turístico",      prompt: "guided tour local tourism sightseeing" },

  // ── Agriculture ──────────────────────────────────────────────────────────
  { label: "Finca / Agricultura",            businessType: "Agricultura / Farming",       prompt: "farm field crop harvest agriculture countryside" },
  { label: "Ganadería",                      businessType: "Ganadería / Cattle Ranch",    prompt: "cattle ranch livestock farm animals" },
  { label: "Vivero / Plantas",               businessType: "Vivero / Nursery",            prompt: "plant nursery garden center plants greenhouse" },

  // ── Industrial & manufacturing ────────────────────────────────────────────
  { label: "Manufactura / Fábrica",          businessType: "Manufactura / Factory",       prompt: "manufacturing plant factory production line industrial" },
  { label: "Soldadura",                      businessType: "Soldadura / Welding",         prompt: "welding metalwork welder fabrication shop" },
  { label: "Metalmecánica",                  businessType: "Metalmecánica / Industrial",  prompt: "metalworking industrial machinery manufacturing" },

  // ── Wholesale ─────────────────────────────────────────────────────────────
  { label: "Mayorista / Distribuidora",      businessType: "Mayorista / Wholesale",       prompt: "wholesale warehouse bulk products distribution" },
  { label: "Importadora",                    businessType: "Importadora / Import Export", prompt: "import export cargo shipping international trade" },

  // ── Religion & community ─────────────────────────────────────────────────
  { label: "Iglesia / Ministerio",           businessType: "Iglesia / Church Ministry",   prompt: "church community congregation worship ministry" },
  { label: "ONG / Nonprofit",               businessType: "ONG / Nonprofit",             prompt: "nonprofit community volunteer charity social impact" },

  // ── Fallback / edge cases ────────────────────────────────────────────────
  { label: "Negocio genérico sin categoría", businessType: "other / otro",               prompt: "empresa local de servicios" },
  { label: "Prompt vacío",                   businessType: "restaurant",                  prompt: "" },
  { label: "Solo prompt, sin tipo",          businessType: "other",                       prompt: "modern coworking space shared office startup hub" },
  { label: "Prompt con ruido de IA",         businessType: "Dental / Odontología",        prompt: "hero background banner cinematic modern dental clinic no text high resolution" },
];

function run() {
  const lines: string[] = [];
  const now = new Date().toISOString();

  lines.push("═".repeat(80));
  lines.push(`  IMAGE QUERY TEST RESULTS`);
  lines.push(`  Generated: ${now}`);
  lines.push("═".repeat(80));
  lines.push("");

  let pass = 0;
  let warn = 0;

  for (const c of CASES) {
    const query = buildImageQuery({
      businessType: c.businessType,
      prompt: c.prompt,
      section: c.section,
      width: 1200,
      height: 800,
    });

    const isGeneric = query === "local business professional service";
    const flag = isGeneric ? "⚠ FALLBACK" : "✓";
    if (isGeneric) warn++; else pass++;

    lines.push(`${flag}  ${c.label}`);
    lines.push(`   businessType : ${c.businessType}`);
    if (c.prompt) lines.push(`   prompt       : ${c.prompt}`);
    if (c.section) lines.push(`   section      : ${c.section}`);
    lines.push(`   → query      : ${query}`);
    lines.push("");
  }

  lines.push("─".repeat(80));
  lines.push(`  SUMMARY: ${pass} resolved  |  ${warn} fell back to generic`);
  lines.push("─".repeat(80));

  const output = lines.join("\n");
  const outPath = "test-results/image-queries.txt";
  writeFileSync(outPath, output, "utf8");

  console.log(output);
  console.log(`\nSaved → ${outPath}`);
}

run();
