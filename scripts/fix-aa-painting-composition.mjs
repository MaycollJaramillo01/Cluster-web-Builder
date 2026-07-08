import crypto from "node:crypto";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();
const slug = "aa-painting-remodeling-high-point";

const id = () => crypto.randomUUID();
const widget = (type, slot, variant, data, style) => ({ id: id(), type, ...(slot ? { slot } : {}), ...(variant ? { variant } : {}), ...(data ? { data } : {}), ...(style ? { style } : {}) });
const column = (desktop, widgets, tablet = desktop > 6 ? 12 : desktop) => ({ id: id(), span: { desktop, tablet, mobile: 12 }, widgets });
const row = (...columns) => ({ id: id(), columns });
const section = (key, name, region, rows, style = {}) => ({ schemaVersion: 2, id: id(), key, name, region, rows, style });

try {
  const site = await prisma.site.findUnique({ where: { publicSlug: slug } });
  if (!site) throw new Error(`No existe /s/${slug}`);

  const current = site.contentJson ?? {};
  const media = Array.isArray(current.media) ? current.media.slice(0, 9) : [];
  const logo = current.business?.logo || site.logoUrl || "";
  const heroMedia = media[1]?.url || current.hero?.media || site.coverUrl || "";
  const aboutMedia = media[3]?.url || current.about?.media || heroMedia;

  const content = {
    business: {
      name: "AA Painting & Remodeling",
      type: "Expert Home Repair & Renovation Services",
      location: "908 Carter St, High Point, NC 27260",
      phone: "+1 (336) 560-9847",
      email: "quotes@aapaintingremodeling.com",
      logo,
    },
    hero: {
      title: "Expert Home Repair & Renovation Services",
      subtitle: "Reliable home repair solutions for lasting quality",
      body: "AA Painting & Remodeling helps homeowners in High Point repair, repaint, and renovate their spaces with careful workmanship, direct communication, and clean results.",
      ctaText: "Request a Free Quote",
      ctaLink: "#contact",
      media: heroMedia,
    },
    about: {
      title: "Trusted Home Repair Experts",
      subtitle: "About AA Painting & Remodeling",
      body: "At AA Painting & Remodeling, we specialize in high-quality home repair and remodeling services. Our team is dedicated to transforming your property with professionalism and precision, whether the job is an interior update, drywall repair, bathroom improvement, or exterior enhancement.",
      media: aboutMedia,
      highlights: [
        { title: "Free quote first", description: "Share the project details and receive a clear next step before committing." },
        { title: "Direct communication", description: "We stay in constant communication until the job is done." },
        { title: "Painting and remodeling", description: "One team for painting, drywall, repairs, and finish improvements." },
      ],
    },
    services: [],
    benefits: [
      { title: "Book an appointment", description: "Send your project details, address, and preferred schedule." },
      { title: "See the work clearly", description: "Project photos are shown with titles so visitors understand the result." },
      { title: "Local presence", description: "Address, phone, hours, and map are visible before the contact form." },
    ],
    media: media.map((item, index) => ({
      url: item.url,
      alt: [
        "Interior painting preparation",
        "Commercial repaint project",
        "Drywall and surface repair",
        "Bathroom surround remodeling",
        "Floor coating and bathroom finish",
        "Ceiling drywall repair",
        "Commercial accent wall painting",
        "Hallway prep and repaint",
        "Drywall finish and taping",
      ][index] || item.alt || "AA Painting & Remodeling project",
    })),
    reviews: [],
    faqs: [
      { question: "How do I request a free quote?", answer: "Use the form or call +1 (336) 560-9847 with your project details, address, and preferred schedule." },
      { question: "What information should I send?", answer: "Send the type of work, photos if available, the property address, and any deadline or special request." },
      { question: "Do you handle both painting and remodeling?", answer: "Yes. AA Painting & Remodeling supports painting, drywall, bathroom updates, home repairs, and related renovation tasks." },
      { question: "Where is AA Painting & Remodeling located?", answer: "The business is located at 908 Carter St, High Point, NC 27260." },
    ],
    contact: {
      title: "Get a Free Quote",
      body: "Better yet, see us in person. To get a free quote, or if you have questions or special requests, send your details and the team will contact you.",
      ctaText: "Send Request",
    },
    social: {},
    seo: current.seo ?? {
      title: "AA Painting & Remodeling | Home Repair Services in High Point NC",
      description: "Painting, drywall repair, bathroom remodeling, and home repair services from AA Painting & Remodeling in High Point, North Carolina.",
      keyword: "home repair remodeling High Point NC",
    },
  };

  const sections = [
    section("global-header", "Header", "header", [
      row(
        column(4, [widget("brand", "business.name", "aa")], 12),
        column(8, [widget("nav", undefined, "horizontal", { items: [
          { label: "About", href: "#about" },
          { label: "Gallery", href: "#gallery" },
          { label: "Quote", href: "#contact" },
          { label: "Location", href: "#location" },
        ] })], 12),
      ),
    ], { desktop: { width: "full", padding: "sm", background: "#F2F2F2" } }),
    section("hero", "Hero", "main", [
      row(
        column(6, [
          widget("text", undefined, "eyebrow", { value: "AA PAINTING & REMODELING" }, { desktop: { color: "#D90404", fontSize: "sm", fontWeight: "bold" } }),
          widget("heading", "hero.title", "h1", undefined, { desktop: { fontSize: "display", fontWeight: "bold" } }),
          widget("text", "hero.subtitle", undefined, undefined, { desktop: { fontSize: "xl", fontWeight: "medium" } }),
          widget("text", "hero.body", undefined, undefined, { desktop: { fontSize: "lg" } }),
          widget("button", "hero.ctaText", "solid", { linkSlot: "hero.ctaLink" }),
        ], 12),
        column(6, [widget("image", "hero.media", "rounded", { alt: "AA Painting & Remodeling project" })], 12),
      ),
    ], { desktop: { padding: "xl", background: "#F2F2F2" } }),
    section("about", "About", "main", [
      row(
        column(5, [widget("image", "about.media", "rounded")], 12),
        column(7, [
          widget("text", "about.subtitle", undefined, undefined, { desktop: { color: "#D90404", fontSize: "sm", fontWeight: "bold" } }),
          widget("heading", "about.title", "h2", undefined, { desktop: { fontSize: "2xl", fontWeight: "bold" } }),
          widget("text", "about.body", undefined, undefined, { desktop: { fontSize: "lg" } }),
          widget("list", "about.highlights", "aa-benefits"),
        ], 12),
      ),
    ], { desktop: { padding: "xl", background: "#ffffff" } }),
    section("gallery", "Gallery", "main", [
      row(
        column(7, [
          widget("text", undefined, undefined, { value: "PROJECT GALLERY" }, { desktop: { color: "#D90404", fontSize: "sm", fontWeight: "bold" } }),
          widget("heading", undefined, "h2", { value: "Real painting and remodeling work" }, { desktop: { fontSize: "2xl", fontWeight: "bold" } }),
        ], 12),
        column(5, [widget("text", undefined, undefined, { value: "A 3x3 gallery using project images, each with a visible title/caption." }, { desktop: { fontSize: "lg" } })], 12),
      ),
      row(column(12, [widget("gallery", "media", "aa-grid")], 12)),
    ], { desktop: { padding: "xl", background: "#F2F2F2" } }),
    section("contact", "Contact", "main", [
      row(
        column(5, [
          widget("heading", "contact.title", "h2", undefined, { desktop: { fontSize: "2xl", fontWeight: "bold" } }),
          widget("text", "contact.body", undefined, undefined, { desktop: { fontSize: "lg" } }),
          widget("business_info", undefined, "stacked"),
        ], 12),
        column(7, [widget("form", undefined, "card", { buttonSlot: "contact.ctaText" })], 12),
      ),
    ], { desktop: { padding: "xl", background: "#ffffff" } }),
    section("location", "Location", "main", [
      row(
        column(5, [
          widget("text", undefined, undefined, { value: "LOCATION" }, { desktop: { color: "#F2F2F2", fontSize: "sm", fontWeight: "bold" } }),
          widget("heading", undefined, "h2", { value: "Visit or contact AA Painting & Remodeling" }, { desktop: { color: "#ffffff", fontSize: "2xl", fontWeight: "bold" } }),
          widget("text", undefined, undefined, { value: "908 Carter St, High Point, NC 27260" }, { desktop: { color: "#F2F2F2", fontSize: "lg" } }),
        ], 12),
        column(7, [widget("map", "business.location", "card")], 12),
      ),
    ], { desktop: { color: "#ffffff", padding: "xl", background: "#18298C" } }),
    section("faq", "FAQ", "main", [
      row(
        column(4, [
          widget("text", undefined, undefined, { value: "FAQ" }, { desktop: { color: "#D90404", fontSize: "sm", fontWeight: "bold" } }),
          widget("heading", undefined, "h2", { value: "Questions before your free quote" }, { desktop: { fontSize: "2xl", fontWeight: "bold" } }),
        ], 12),
        column(8, [widget("accordion", "faqs", "aa")], 12),
      ),
    ], { desktop: { padding: "xl", background: "#F2F2F2" } }),
    section("global-footer", "Footer", "footer", [
      row(
        column(5, [widget("brand", "business.name", "aa"), widget("text", "business.type")], 12),
        column(4, [widget("business_info", undefined, "compact")], 12),
        column(3, [widget("button", undefined, "outline", { value: "Request a Free Quote", link: "#contact" })], 12),
      ),
    ], { desktop: { width: "full", padding: "lg", background: "#F2F2F2" } }),
  ];

  await prisma.$transaction(async (tx) => {
    await tx.siteSection.deleteMany({ where: { siteId: site.id } });
    await tx.site.update({
      where: { id: site.id },
      data: {
        builderVersion: 2,
        templateId: "custom-aa-sections",
        visualStyle: "custom-aa-sections",
        primaryColor: "#18298C",
        secondaryColor: "#30478C",
        accentColor: "#D90404",
        logoUrl: logo,
        coverUrl: heroMedia,
        contentJson: content,
        designJson: {
          templateId: "custom-aa-sections",
          theme: {
            primary: "#18298C",
            secondary: "#30478C",
            accent: "#D90404",
            background: "#F2F2F2",
            text: "#10201c",
            muted: "#4b5d58",
            headingFont: "Inter, system-ui, sans-serif",
            bodyFont: "Inter, system-ui, sans-serif",
            headingCase: "none",
            radius: "lg",
            motion: "stagger",
          },
        },
        sections: {
          create: sections.map((canvas, order) => ({
            type: "canvas",
            title: canvas.key,
            order,
            isVisible: true,
            content: canvas,
            settingsJson: {},
          })),
        },
      },
    });
  });

  console.log(JSON.stringify({ siteId: site.id, slug, sections: sections.map((s) => s.key), galleryItems: content.media.length }, null, 2));
} finally {
  await prisma.$disconnect();
}
