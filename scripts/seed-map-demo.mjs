/**
 * Seeds demo site records so the map shows markers across Latin America.
 * Run with: node --env-file=.env scripts/seed-map-demo.mjs
 */

import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const DEMO_SITES = [
  // Brasil
  { businessName: "Sabor Carioca", businessType: "restaurant", location: "Rio de Janeiro, Brasil", publicSlug: "demo-sabor-carioca" },
  { businessName: "Tech SP Soluções", businessType: "technology", location: "São Paulo, Brasil", publicSlug: "demo-tech-sp" },
  { businessName: "Clínica Beleza BH", businessType: "beauty", location: "Belo Horizonte, Brasil", publicSlug: "demo-clinica-beleza-bh" },

  // Argentina
  { businessName: "La Parrilla Porteña", businessType: "restaurant", location: "Buenos Aires, Argentina", publicSlug: "demo-parrilla-portena" },
  { businessName: "Bodegas del Sur", businessType: "winery", location: "Mendoza, Argentina", publicSlug: "demo-bodegas-sur" },
  { businessName: "Estudio Córdoba", businessType: "architecture", location: "Córdoba, Argentina", publicSlug: "demo-estudio-cordoba" },

  // Venezuela
  { businessName: "Empanadas Caraqueñas", businessType: "restaurant", location: "Caracas, Venezuela", publicSlug: "demo-empanadas-caraquenas" },
  { businessName: "Tecnología Maracaibo", businessType: "technology", location: "Maracaibo, Venezuela", publicSlug: "demo-tecnologia-maracaibo" },

  // Chile
  { businessName: "Viña Valle Central", businessType: "winery", location: "Santiago, Chile", publicSlug: "demo-vina-valle-central" },
  { businessName: "Puerto Pacifico Tours", businessType: "tourism", location: "Valparaíso, Chile", publicSlug: "demo-puerto-pacifico-tours" },
  { businessName: "Diseño Temuco", businessType: "design", location: "Temuco, Chile", publicSlug: "demo-diseno-temuco" },

  // Perú
  { businessName: "Cevichería Lima", businessType: "restaurant", location: "Lima, Perú", publicSlug: "demo-cevicheria-lima" },
  { businessName: "Machu Picchu Expediciones", businessType: "tourism", location: "Cusco, Perú", publicSlug: "demo-machu-picchu-expediciones" },
  { businessName: "Textiles Arequipa", businessType: "retail", location: "Arequipa, Perú", publicSlug: "demo-textiles-arequipa" },

  // México (supplement existing)
  { businessName: "Taquería El Padrino", businessType: "restaurant", location: "Guadalajara, México", publicSlug: "demo-taqueria-el-padrino" },
  { businessName: "Regio Tech", businessType: "technology", location: "Monterrey, México", publicSlug: "demo-regio-tech" },
  { businessName: "Artesanías Yucatán", businessType: "retail", location: "Mérida, México", publicSlug: "demo-artesanias-yucatan" },

  // Colombia (supplement existing)
  { businessName: "Café Origen Medellín", businessType: "cafe", location: "Medellín, Colombia", publicSlug: "demo-cafe-origen-medellin" },
  { businessName: "Playa Caribe Hotel", businessType: "hotel", location: "Cartagena, Colombia", publicSlug: "demo-playa-caribe-hotel" },
  { businessName: "Barranquilla Eventos", businessType: "events", location: "Barranquilla, Colombia", publicSlug: "demo-barranquilla-eventos" },
];

async function main() {
  console.log(`Seeding ${DEMO_SITES.length} demo map sites…`);

  let created = 0;
  let skipped = 0;

  for (const site of DEMO_SITES) {
    const existing = await prisma.site.findUnique({ where: { publicSlug: site.publicSlug } });
    if (existing) {
      skipped++;
      continue;
    }
    await prisma.site.create({
      data: {
        businessName: site.businessName,
        businessType: site.businessType,
        location: site.location,
        publicSlug: site.publicSlug,
        status: "GENERATED",
        language: "es",
      },
    });
    created++;
    console.log(`  ✓ ${site.businessName} — ${site.location}`);
  }

  console.log(`\nDone: ${created} created, ${skipped} already existed.`);
}

main()
  .catch((e) => { console.error(e); process.exit(1); })
  .finally(() => prisma.$disconnect());
