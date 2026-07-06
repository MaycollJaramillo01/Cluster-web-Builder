import { PrismaClient } from "@prisma/client";

import { instantiateTemplateV2 } from "../lib/site/v2-templates.ts";

const prisma = new PrismaClient();
const slug = "hvac-premium-phoenix";
const hero = "/templates/v2/assets/hvac-premium-hero.png";

const content = {
  business: {
    name: "HVAC Premium",
    type: "Residential Heating & Cooling",
    location: "Phoenix, Arizona",
    phone: "(123) 456-7890",
    email: "contact@hvacpremium.example",
    logo: "",
  },
  hero: {
    title: "Fast, Reliable Heating & Cooling Services",
    subtitle: "Trusted HVAC Contractor in Phoenix, AZ",
    body: "Expert HVAC installation, repair, and maintenance for homes across Phoenix and surrounding areas.",
    ctaText: "Schedule Service",
    ctaLink: "#contact",
    media: hero,
  },
  about: {
    title: "Trusted by Homeowners Across Phoenix",
    subtitle: "See how we've helped homeowners improve comfort, efficiency, and peace of mind.",
    body: "Delivering reliable heating and cooling solutions backed by experience, quality workmanship, and customer satisfaction.",
    media: "",
    highlights: [
      { title: "5000+", description: "Projects Completed" },
      { title: "15+", description: "Years of Experience" },
      { title: "4.9", description: "Google Rating" },
      { title: "24/7", description: "Emergency Availability" },
    ],
  },
  services: [
    { title: "Air Conditioning Repair", description: "Fast diagnostics and dependable AC repairs to restore cooling performance, airflow, and comfort.", image: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1000&q=85" },
    { title: "Heating System Repair", description: "Professional furnace and heat pump repairs that keep your home warm, safe, and efficient.", image: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1000&q=85" },
    { title: "HVAC Installation", description: "Complete HVAC replacement and installation services for year-round heating and cooling.", image: "https://images.unsplash.com/photo-1585129777188-94600bc7b4b3?auto=format&fit=crop&w=1000&q=85" },
    { title: "Emergency HVAC Service", description: "Urgent heating and cooling support when breakdowns or comfort issues cannot wait.", image: "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?auto=format&fit=crop&w=1000&q=85" },
    { title: "Commercial HVAC", description: "Reliable commercial HVAC maintenance, repair, and installation for offices, retail spaces, and facilities.", image: "https://images.unsplash.com/photo-1586023492125-27b2c045efd7?auto=format&fit=crop&w=1000&q=85" },
  ],
  benefits: [
    { title: "Licensed & Insured", description: "Qualified professionals you can trust to work safely in your home." },
    { title: "Upfront Pricing", description: "Clear estimates with no hidden fees or unexpected surprises." },
    { title: "Same-Day Service", description: "Fast scheduling to restore your comfort as quickly as possible." },
    { title: "Quality Work Guaranteed", description: "Reliable workmanship backed by our commitment to your satisfaction." },
    { title: "Experienced Technicians", description: "Skilled professionals trained to service all major HVAC brands." },
    { title: "24/7 Emergency Support", description: "Available when unexpected heating or cooling problems can't wait." },
  ],
  reviews: [
    { name: "Michael R", role: "Homeowner", quote: "Our furnace stopped working during a cold week, and they had it fixed the same day. Friendly team, honest pricing, and no surprises.", rating: 5, source: "Google" },
    { name: "David M", role: "Homeowner", quote: "We needed a complete system replacement and the entire process was smooth and professional. The new system works perfectly.", rating: 5, source: "Google" },
    { name: "Jason T", role: "Homeowner", quote: "The team arrived on time, explained every step clearly, and completed the installation with great attention to detail.", rating: 5, source: "Google" },
    { name: "Robert K", role: "Homeowner", quote: "The technician was thorough, answered all our questions, and helped us improve efficiency without pushing unnecessary upgrades.", rating: 5, source: "Google" },
    { name: "Jasper", role: "Homeowner", quote: "Excellent service from start to finish. Our AC was running again the same day.", rating: 5, source: "Google" },
    { name: "David W", role: "Homeowner", quote: "Fast response, fair pricing, and outstanding workmanship. I highly recommend them.", rating: 5, source: "Google" },
  ],
  faqs: [
    { question: "How often should I schedule HVAC maintenance?", answer: "Most residential systems should be inspected twice a year, before the cooling and heating seasons." },
    { question: "Do you offer emergency HVAC services?", answer: "Yes. Emergency appointments are available for urgent heating and cooling failures." },
    { question: "How do I know if I should repair or replace my HVAC system?", answer: "We compare system age, repair cost, efficiency, and comfort performance before recommending the most practical option." },
    { question: "How long does a new HVAC installation take?", answer: "Most residential replacements are completed in one day after equipment and access are confirmed." },
    { question: "Do you provide financing options?", answer: "Yes. Flexible financing options are available for qualifying replacement and installation projects." },
  ],
  contact: {
    title: "Ready to Restore Your Home Comfort?",
    body: "Get expert heating and cooling solutions from a team you can trust. Contact us today for a free estimate or immediate assistance.",
    ctaText: "Schedule Service",
  },
  media: [
    { url: "https://images.unsplash.com/photo-1621905252507-b35492cc74b4?auto=format&fit=crop&w=1400&q=85", alt: "Outdoor HVAC installation" },
    { url: "https://images.unsplash.com/photo-1581092160562-40aa08e78837?auto=format&fit=crop&w=1400&q=85", alt: "HVAC system project" },
  ],
  social: { Instagram: "https://instagram.com", YouTube: "https://youtube.com", LinkedIn: "https://linkedin.com" },
  seo: {
    title: "HVAC Premium | Heating & Cooling Services in Phoenix",
    description: "Reliable HVAC repair, installation, maintenance, and emergency service for Phoenix homeowners.",
    keyword: "HVAC services Phoenix",
  },
};

try {
  const owner = await prisma.user.findFirst({ where: { role: "ADMIN", username: "Maycolljaramillo" } })
    || await prisma.user.findFirst({ where: { role: "ADMIN" }, orderBy: { createdAt: "asc" } });
  if (!owner) throw new Error("No existe un administrador para asignar el sitio.");

  const document = instantiateTemplateV2("hvac-premium", content);
  const site = await prisma.$transaction(async (tx) => {
    const saved = await tx.site.upsert({
      where: { publicSlug: slug },
      create: {
        userId: owner.id, businessName: content.business.name, businessType: content.business.type,
        location: content.business.location, phone: content.business.phone, email: content.business.email,
        goal: "Conseguir solicitudes de servicio", visualStyle: "hvac-premium", builderVersion: 2,
        templateId: document.template.id, contentJson: document.content, designJson: document.template.theme,
        publicSlug: slug, status: "PUBLISHED", publishedAt: new Date(),
        primaryColor: document.template.theme.primary, secondaryColor: document.template.theme.secondary,
        accentColor: document.template.theme.accent, coverUrl: hero,
      },
      update: {
        userId: owner.id, businessName: content.business.name, businessType: content.business.type,
        location: content.business.location, phone: content.business.phone, email: content.business.email,
        visualStyle: "hvac-premium", builderVersion: 2, templateId: document.template.id,
        contentJson: document.content, designJson: document.template.theme, status: "PUBLISHED", publishedAt: new Date(),
        primaryColor: document.template.theme.primary, secondaryColor: document.template.theme.secondary,
        accentColor: document.template.theme.accent, coverUrl: hero,
      },
    });
    await tx.siteSection.deleteMany({ where: { siteId: saved.id } });
    await tx.siteSection.createMany({ data: document.sections.map((section, order) => ({
      id: section.id, siteId: saved.id, type: "canvas", title: section.key,
      content: section, order, isVisible: true, settingsJson: {},
    })) });
    return saved;
  });
  console.log(JSON.stringify({ id: site.id, templateId: site.templateId, status: site.status, url: `/s/${site.publicSlug}` }, null, 2));
} finally {
  await prisma.$disconnect();
}
