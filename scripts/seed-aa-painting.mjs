/**
 * AA Painting & Remodeling — real business site seeded from the client's own
 * content, logo and project photos (High Point, NC).
 *
 * Run:  node scripts/seed-aa-painting.mjs
 */

import { randomBytes } from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

function slug(value) {
  const base = value
    .toLowerCase().normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "").slice(0, 42) || "sitio";
  return `${base}-${randomBytes(3).toString("hex")}`;
}

function sec(type, order, title, content, settings = {}) {
  return { type, order, title, isVisible: true, content, settings };
}

const IMG = "/sites/aa-painting-remodeling";

const GALLERY_ITEMS = [
  { name: "Commercial Interior Painting", description: "Full interior repaint for a commercial office space, from surface prep to final coat.", image: `${IMG}/painting-1.jpg` },
  { name: "Accent Wall & Color Work", description: "Custom accent-wall color application inside a commercial warehouse space.", image: `${IMG}/painting-2.jpg` },
  { name: "Epoxy Floor Coating", description: "Durable epoxy floor coating installed in a commercial restroom.", image: `${IMG}/painting-3.jpg` },
  { name: "Drywall Repair & Patching", description: "Wall repair and patch work prepped and ready for paint.", image: `${IMG}/remodel-1.jpg` },
  { name: "Closet Build-Out", description: "Custom shelving and drywall finish for a full closet remodel.", image: `${IMG}/remodel-2.jpg` },
  { name: "Wall Framing & Drywall Install", description: "New wall framing and drywall installation for an interior remodel.", image: `${IMG}/remodel-3.jpg` },
  { name: "Ceiling Drywall Installation", description: "Fresh drywall ceiling install, ready for texture and paint.", image: `${IMG}/remodel-4.jpg` },
  { name: "Bathtub Surround Installation", description: "New tub surround and fixtures installed during a bathroom remodel.", image: `${IMG}/remodel-5.jpg` },
];

const SERVICE_ITEMS = [
  { name: "Interior & Exterior Painting", description: "Professional surface prep, priming and painting for interior rooms and exterior siding, trim and doors — finished with lasting, even coats.", image: `${IMG}/painting-1.jpg` },
  { name: "Drywall Installation & Repair", description: "Hanging, taping, mudding and patching for new walls, ceilings, and repairs after water damage or wear.", image: `${IMG}/remodel-3.jpg` },
  { name: "Bathroom Remodeling", description: "Tub and shower surround installation, fixtures, and finish work for full or partial bathroom renovations.", image: `${IMG}/remodel-5.jpg` },
  { name: "Epoxy & Specialty Flooring", description: "Seamless, durable epoxy coatings for commercial and residential floors that hold up to daily wear.", image: `${IMG}/painting-3.jpg` },
  { name: "Commercial Painting & Renovations", description: "Interior painting and light renovation work for offices, warehouses and commercial spaces with minimal downtime.", image: `${IMG}/painting-2.jpg` },
  { name: "Custom Closets & Storage", description: "Built-in shelving and drywall finish work that turns unused space into organized, functional storage.", image: `${IMG}/remodel-2.jpg` },
];

const site = {
  businessName: "AA Painting & Remodeling",
  businessType: "Home Painting & Remodeling",
  goal: "get_clients",
  visualStyle: "Local",
  location: "908 Carter St, High Point, NC 27260",
  phone: "+1 336-560-9847",
  email: null,
  domain: "aapaintingremodeling",
  language: "en",
  primaryColor: "#1d4e89",
  secondaryColor: "#0b1f3a",
  accentColor: "#e8973f",
  logoUrl: `${IMG}/logo.png`,
  coverUrl: `${IMG}/painting-2.jpg`,
  sections: [
    sec("hero", 0, "AA Painting & Remodeling", {
      subtitle: "Expert Home Repair & Renovation Services",
      body: "Reliable home repair solutions for lasting quality. From interior and exterior painting to complete remodels, our experienced team handles every project in High Point, NC and the Triad with professionalism and precision. Call (336) 307-4259 for a free quote.",
      ctaText: "Request a Free Quote",
      ctaLink: "#contact",
      imagePrompt: "professional painting and remodeling contractor at work, commercial interior",
    }),
    sec("about", 1, "Trusted Home Repair Experts", {
      subtitle: "About AA Painting & Remodeling",
      body: "At AA Painting & Remodeling, we specialize in high-quality home repair and remodeling services. Our experienced team is dedicated to transforming your property with professionalism and precision, ensuring lasting results. Whether it's interior updates or exterior enhancements, we handle every project with care and expertise.",
      ctaText: "",
      ctaLink: "",
      imagePrompt: "professional home painter and remodeling contractor working on site",
    }),
    sec("gallery", 2, "Our Work", {
      subtitle: "Transform your space with our expert home repairs",
      body: "",
      ctaText: "",
      ctaLink: "",
      imagePrompt: "",
    }, { items: GALLERY_ITEMS }),
    sec("services", 3, "What We Do", {
      subtitle: "Painting and remodeling services built to last",
      body: "",
      ctaText: "Request a Free Quote",
      ctaLink: "#contact",
      imagePrompt: "",
    }, { items: SERVICE_ITEMS }),
    sec("contact", 4, "Get in Touch", {
      subtitle: "Better yet, see us in person!",
      body: "We stay in constant communication with our customers until the job is done. To get a free quote, or if you have questions or special requests, just send us a message.",
      ctaText: "Send",
      ctaLink: "",
      imagePrompt: "",
    }),
    sec("footer", 5, "AA Painting & Remodeling", {
      subtitle: "Home Repair & Remodeling · High Point, NC",
      body: "908 Carter St, High Point, NC 27260 · (336) 560-9847 · Mon–Fri 9:00 a.m.–5:00 p.m.",
      ctaText: "",
      ctaLink: "",
      imagePrompt: "",
    }),
  ],
};

async function main() {
  const targetEmail = process.env.SEED_USER_EMAIL || "info@cluster.marketing";
  const user = await prisma.user.findFirst({
    where: { OR: [{ email: targetEmail }, { username: "admin" }] },
    select: { id: true, email: true },
  });

  const publicSlug = slug(site.domain || site.businessName);

  const created = await prisma.site.create({
    data: {
      userId: user?.id ?? null,
      businessName: site.businessName,
      businessType: site.businessType,
      goal: site.goal,
      visualStyle: site.visualStyle,
      location: site.location,
      phone: site.phone,
      email: site.email,
      domain: site.domain,
      publicSlug,
      language: site.language,
      status: "PUBLISHED",
      publishedAt: new Date(),
      primaryColor: site.primaryColor,
      secondaryColor: site.secondaryColor,
      accentColor: site.accentColor,
      logoUrl: site.logoUrl,
      coverUrl: site.coverUrl,
      blueprintJson: {},
      sections: {
        create: site.sections.map((s) => ({
          type: s.type,
          title: s.title,
          order: s.order,
          isVisible: s.isVisible,
          content: s.content,
          settingsJson: s.settings,
        })),
      },
    },
    include: { sections: { select: { type: true } } },
  });

  console.log("\n" + "━".repeat(70));
  console.log(`  ${site.businessName} creado — /s/${created.publicSlug}`);
  console.log(`  http://localhost:3000/s/${created.publicSlug}`);
  console.log("━".repeat(70) + "\n");
}

main()
  .catch((e) => { console.error("Error:", e.message); process.exit(1); })
  .finally(() => prisma.$disconnect());
