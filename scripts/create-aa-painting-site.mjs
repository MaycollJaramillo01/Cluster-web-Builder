import { mkdir, copyFile } from "node:fs/promises";
import { basename, extname, join } from "node:path";

import { PrismaClient } from "@prisma/client";

import { instantiateTemplateV2 } from "../lib/site/v2-templates.ts";

const prisma = new PrismaClient();

const slug = "aa-painting-remodeling-high-point";
const sourceRoot = "C:\\Users\\Mayco\\Music\\aapainting";
const publicDir = "public\\sites\\aa-painting-remodeling";
const publicBase = "/sites/aa-painting-remodeling";

const sourceImages = [
  "assets\\img\\Pintura\\WhatsApp Image 2026-05-25 at 11.15.50 AM (2).jpeg",
  "assets\\img\\Pintura\\WhatsApp Image 2026-05-25 at 11.15.50 AM (5).jpeg",
  "assets\\img\\Pintura\\WhatsApp Image 2026-05-25 at 11.15.51 AM (3).jpeg",
  "assets\\img\\projects\\bath-tub-surround.jpg",
  "assets\\img\\projects\\bathroom-floor-coating.jpg",
  "assets\\img\\projects\\ceiling-drywall.jpg",
  "assets\\img\\projects\\commercial-accent-wall.jpg",
  "assets\\img\\projects\\commercial-hallway-prep.jpg",
  "assets\\img\\projects\\drywall-finish-taping.jpg",
  "assets\\img\\projects\\drywall-install-crew.jpg",
  "assets\\img\\projects\\wall-drywall-repair.jpg",
  "assets\\img\\REMODELACIÓN\\REMODELACIÓN\\WhatsApp Image 2026-05-25 at 11.04.39 AM (1).jpeg",
  "assets\\img\\REMODELACIÓN\\REMODELACIÓN\\contenido dentro de la carpeta\\WhatsApp Image 2026-05-25 at 11.15.41 AM (3).jpeg",
  "assets\\img\\REMODELACIÓN\\REMODELACIÓN\\contenido dentro de la carpeta\\WhatsApp Image 2026-05-25 at 11.15.41 AM.jpeg",
  "assets\\img\\REMODELACIÓN\\REMODELACIÓN\\contenido dentro de la carpeta\\WhatsApp Image 2026-05-25 at 11.15.43 AM (2).jpeg",
  "assets\\img\\REMODELACIÓN\\REMODELACIÓN\\contenido dentro de la carpeta\\WhatsApp Image 2026-05-25 at 11.15.44 AM (3).jpeg",
];

function safeName(index, source) {
  const ext = extname(source).toLowerCase() || ".jpg";
  const raw = basename(source, ext).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  return `${String(index + 1).padStart(2, "0")}-${raw.slice(0, 52)}${ext === ".jpeg" ? ".jpg" : ext}`;
}

async function copyAssets() {
  await mkdir(publicDir, { recursive: true });
  const logoTarget = "logo.png";
  await copyFile(join(sourceRoot, "logo.png"), join(publicDir, logoTarget));

  const media = [];
  for (const [index, relative] of sourceImages.entries()) {
    const target = safeName(index, relative);
    await copyFile(join(sourceRoot, relative), join(publicDir, target));
    media.push({ url: `${publicBase}/${target}`, alt: altFor(relative) });
  }

  return { logo: `${publicBase}/${logoTarget}`, media };
}

function altFor(relative) {
  const value = relative.toLowerCase();
  if (value.includes("drywall")) return "Drywall repair and finishing work by AA Painting & Remodeling";
  if (value.includes("bath")) return "Bathroom remodeling project by AA Painting & Remodeling";
  if (value.includes("commercial")) return "Commercial painting and wall preparation project";
  if (value.includes("pintura")) return "Interior painting project by AA Painting & Remodeling";
  if (value.includes("remodel")) return "Home remodeling work by AA Painting & Remodeling";
  return "Completed home repair and remodeling project";
}

function withImage(items, media, offset = 0) {
  return items.map((item, index) => ({ ...item, image: media[(index + offset) % media.length]?.url || "" }));
}

try {
  const { logo, media } = await copyAssets();
  const heroImage = media[10]?.url || media[0]?.url || "";

  const content = {
    business: {
      name: "AA Painting & Remodeling",
      type: "Home Repair & Renovation Services",
      location: "908 Carter St, High Point, NC 27260",
      phone: "+1 (336) 560-9847",
      email: "quotes@aapaintingremodeling.com",
      logo,
    },
    hero: {
      title: "Expert Home Repair & Renovation Services in High Point",
      subtitle: "Reliable home repair solutions for lasting quality",
      body: "AA Painting & Remodeling helps homeowners refresh, repair, and improve their spaces with careful painting, drywall, flooring, bathroom updates, and remodeling work.",
      ctaText: "Request a Free Quote",
      ctaLink: "#contact",
      media: heroImage,
    },
    about: {
      title: "Trusted Home Repair Experts",
      subtitle: "Transform your space with expert home repairs",
      body: "At AA Painting & Remodeling, we specialize in high-quality home repair and remodeling services. Our experienced team is dedicated to transforming your property with professionalism and precision, ensuring lasting results. Whether it is an interior update or an exterior enhancement, every project is handled with care, clean communication, and dependable workmanship.",
      media: media[3]?.url || heroImage,
      highlights: [
        { title: "Free quotes", description: "Clear estimates before work begins." },
        { title: "Local service", description: "Serving High Point and nearby North Carolina communities." },
        { title: "Careful repairs", description: "Painting, drywall, remodeling, and finish work handled with precision." },
        { title: "Direct communication", description: "We stay in touch until the job is done." },
      ],
    },
    services: withImage([
      { title: "Interior Painting", description: "Clean wall preparation, careful masking, smooth finishes, and color updates that make rooms feel renewed." },
      { title: "Exterior Painting", description: "Durable exterior painting and touch-ups designed to protect curb appeal against weather and daily wear." },
      { title: "Drywall Repair & Finishing", description: "Patch, tape, skim, texture, and finish drywall so damaged walls and ceilings look ready for paint." },
      { title: "Bathroom Remodeling", description: "Practical bathroom updates, tub surrounds, floor coatings, surface repairs, and detail work for a cleaner space." },
      { title: "Home Repair Services", description: "Reliable repair support for walls, trim, surfaces, and small renovation needs around the home." },
      { title: "Commercial Painting Prep", description: "Wall preparation, hallway updates, accent walls, and finish work for small businesses and commercial spaces." },
      { title: "Floor & Surface Coatings", description: "Protective coatings and surface updates for bathrooms, utility spaces, and high-use interior areas." },
      { title: "Ceiling Repair", description: "Ceiling drywall, patching, smoothing, and paint-ready finishing for water damage or renovation work." },
      { title: "Project Prep & Cleanup", description: "Careful preparation, masking, sanding, and cleanup support so the finished work looks professional." },
    ], media, 0),
    benefits: [
      { title: "Free quote first", description: "Share the project details and receive a clear next step before committing." },
      { title: "Painting and remodeling in one place", description: "One team can handle surface repair, paint, drywall, and finish improvements." },
      { title: "Clean communication", description: "Customers stay informed from the first message until the job is complete." },
      { title: "Built for lasting quality", description: "The focus is not just making it look good today, but helping the repair hold up." },
      { title: "Residential and commercial", description: "Support for homes, rental properties, offices, hallways, and small commercial spaces." },
      { title: "Appointment-ready", description: "Easy quote requests and direct phone contact for faster scheduling." },
    ],
    reviews: [],
    faqs: [
      { question: "How do I request a free quote?", answer: "Use the contact form or call +1 (336) 560-9847 with your project details, address, and preferred schedule." },
      { question: "What information should I send before an estimate?", answer: "Send the type of work, photos if available, the property address, and any deadline or special request." },
      { question: "Do you handle both painting and remodeling?", answer: "Yes. AA Painting & Remodeling supports painting, drywall, bathroom updates, home repairs, and related renovation tasks." },
      { question: "What are the business hours?", answer: "The usual schedule is 9:00 a.m. to 5:00 p.m. Contact the team to confirm current availability." },
    ],
    contact: {
      title: "Get a Free Quote",
      body: "Better yet, see us in person. To get a free quote, or if you have questions or special requests, send your details and the team will contact you.",
      ctaText: "Send Request",
    },
    media,
    social: {},
    seo: {
      title: "AA Painting & Remodeling | Home Repair Services in High Point NC",
      description: "Painting, drywall repair, bathroom remodeling, commercial prep, and home repair services from AA Painting & Remodeling in High Point, North Carolina.",
      keyword: "home repair remodeling High Point NC",
    },
  };

  content.media = content.media.slice(0, 9);

  const document = instantiateTemplateV2("local", content);
  document.template.theme = {
    ...document.template.theme,
    primary: "#18298C",
    secondary: "#30478C",
    accent: "#D90404",
    background: "#F2F2F2",
    text: "#10201c",
    muted: "#4b5d58",
    headingFont: "Arial, Helvetica, sans-serif",
    bodyFont: "Arial, Helvetica, sans-serif",
    headingCase: "none",
    radius: "lg",
    motion: "stagger",
  };

  const setWidgetVariant = (sectionKey, type, variant) => {
    for (const section of document.sections) {
      if (section.key !== sectionKey) continue;
      for (const row of section.rows) for (const column of row.columns) for (const widget of column.widgets) {
        if (widget.type === type) widget.variant = variant;
      }
    }
  };
  const setBrandVariant = () => {
    for (const section of document.sections) for (const row of section.rows) for (const column of row.columns) for (const widget of column.widgets) {
      if (widget.type === "brand") widget.variant = "aa";
    }
  };
  const newId = () => crypto.randomUUID();
  const widget = (type, slot, variant, data, style) => ({ id: newId(), type, ...(slot ? { slot } : {}), ...(variant ? { variant } : {}), ...(data ? { data } : {}), ...(style ? { style } : {}) });
  const column = (desktop, widgets, tablet = desktop > 6 ? 12 : desktop) => ({ id: newId(), span: { desktop, tablet, mobile: 12 }, widgets });
  const row = (...columns) => ({ id: newId(), columns });
  const section = (key, name, rows, style = {}) => ({ schemaVersion: 2, id: newId(), key, name, region: "main", rows, style });

  setBrandVariant();
  setWidgetVariant("services", "list", "aa-services");
  setWidgetVariant("about", "list", "aa-benefits");
  setWidgetVariant("contact", "form", "card");

  const services = document.sections.find((item) => item.key === "services");
  if (services) {
    services.name = "Servicios";
    services.style = { desktop: { background: "#F2F2F2", padding: "xl" } };
    services.rows = [
      row(column(12, [
        widget("text", undefined, undefined, { value: "SERVICIOS DE REPARACIÓN Y REMODELACIÓN" }, { desktop: { fontSize: "sm", fontWeight: "bold", color: "#D90404" } }),
        widget("heading", undefined, "h2", { value: "Home Repair & Renovation Services" }, { desktop: { fontSize: "2xl", fontWeight: "bold" } }),
        widget("list", "services", "aa-services"),
      ])),
    ];
  }

  const gallerySection = section("gallery", "Galería de trabajos", [
    row(column(7, [
      widget("text", undefined, undefined, { value: "GALERÍA DE PROYECTOS" }, { desktop: { fontSize: "sm", fontWeight: "bold", color: "#D90404" } }),
      widget("heading", undefined, "h2", { value: "Painting, Drywall & Remodeling Work" }, { desktop: { fontSize: "2xl", fontWeight: "bold" } }),
    ]), column(5, [
      widget("text", undefined, undefined, { value: "A real 3x3 gallery using AA Painting & Remodeling project images. Each image includes a visible caption so visitors understand the work shown." }, { desktop: { fontSize: "lg" } }),
    ])),
    row(column(12, [widget("gallery", "media", "aa-grid")])),
  ], { desktop: { background: "#ffffff", padding: "xl" } });

  const faqSection = section("faq", "Preguntas frecuentes", [
    row(column(4, [
      widget("text", undefined, undefined, { value: "FAQ" }, { desktop: { fontSize: "sm", fontWeight: "bold", color: "#F2F2F2" } }),
      widget("heading", undefined, "h2", { value: "Questions Before Your Free Quote" }, { desktop: { fontSize: "2xl", fontWeight: "bold", color: "#F2F2F2" } }),
      widget("text", undefined, undefined, { value: "Clear answers for homeowners before scheduling painting, drywall, or remodeling work." }),
    ]), column(8, [widget("accordion", "faqs", "aa")])),
  ], { desktop: { background: "#730202", color: "#ffffff", padding: "xl" } });

  const contactIndex = document.sections.findIndex((item) => item.key === "contact");
  const insertAt = contactIndex >= 0 ? contactIndex : Math.max(0, document.sections.length - 1);
  document.sections.splice(insertAt, 0, gallerySection, faqSection);
  const owner = await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });

  const site = await prisma.$transaction(async (tx) => {
    const saved = await tx.site.upsert({
      where: { publicSlug: slug },
      create: {
        userId: owner?.id,
        businessName: content.business.name,
        businessType: content.business.type,
        location: content.business.location,
        phone: content.business.phone,
        email: content.business.email,
        goal: "quote_forms",
        visualStyle: "local",
        builderVersion: 2,
        templateId: document.template.id,
        contentJson: document.content,
        designJson: document.template.theme,
        publicSlug: slug,
        status: "PUBLISHED",
        publishedAt: new Date(),
        primaryColor: document.template.theme.primary,
        secondaryColor: document.template.theme.secondary,
        accentColor: document.template.theme.accent,
        logoUrl: logo,
        coverUrl: heroImage,
      },
      update: {
        userId: owner?.id,
        businessName: content.business.name,
        businessType: content.business.type,
        location: content.business.location,
        phone: content.business.phone,
        email: content.business.email,
        visualStyle: "local",
        builderVersion: 2,
        templateId: document.template.id,
        contentJson: document.content,
        designJson: document.template.theme,
        status: "PUBLISHED",
        publishedAt: new Date(),
        primaryColor: document.template.theme.primary,
        secondaryColor: document.template.theme.secondary,
        accentColor: document.template.theme.accent,
        logoUrl: logo,
        coverUrl: heroImage,
      },
    });
    await tx.siteSection.deleteMany({ where: { siteId: saved.id } });
    await tx.siteSection.createMany({ data: document.sections.map((section, order) => ({
      id: section.id,
      siteId: saved.id,
      type: "canvas",
      title: section.key,
      content: section,
      order,
      isVisible: true,
      settingsJson: {},
    })) });
    return saved;
  });

  console.log(JSON.stringify({
    id: site.id,
    templateId: site.templateId,
    status: site.status,
    publicUrl: `/s/${site.publicSlug}`,
    builderUrl: `/builder/${site.id}`,
    mediaCount: media.length,
  }, null, 2));
} finally {
  await prisma.$disconnect();
}
