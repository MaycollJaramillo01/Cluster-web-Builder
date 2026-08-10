import { sectionImageUrl } from "@/lib/site/images";
import { composeSiteSectionsV2 } from "@/lib/site/section-composer";
import { normalizeSiteContentV2, type SiteContentV2 } from "@/lib/site/v2-schema";

type GeneratedSectionRow = {
  type: string;
  title: string | null;
  content: unknown;
  settingsJson: unknown;
  order: number;
};

type GeneratedSiteSeed = {
  businessName: string;
  businessType: string;
  location: string | null;
  phone: string | null;
  email: string | null;
  logoUrl: string | null;
  coverUrl: string | null;
  visualStyle: string | null;
  blueprintJson: unknown;
  primaryColor: string | null;
  secondaryColor: string | null;
  accentColor: string | null;
};

const record = (value: unknown): Record<string, unknown> =>
  value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value : "";
const items = (section: GeneratedSectionRow | undefined) => {
  const value = record(section?.settingsJson).items;
  return Array.isArray(value)
    ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object")
    : [];
};
const contentOf = (section: GeneratedSectionRow | undefined) => record(section?.content);

export function composeGeneratedSiteDocument(site: GeneratedSiteSeed, sections: GeneratedSectionRow[]) {
  const content = contentFromGeneratedSite(site, sections);
  const composed = composeSiteSectionsV2({
    content,
    businessType: site.businessType,
    visualStyle: site.visualStyle,
    theme: {
      primary: site.primaryColor || undefined,
      secondary: site.secondaryColor || undefined,
      accent: site.accentColor || undefined,
    },
  });
  return { content: composed.content, design: composed.design, sections: composed.sections };
}

function contentFromGeneratedSite(site: GeneratedSiteSeed, sections: GeneratedSectionRow[]): SiteContentV2 {
  const byType = (type: string) => sections.find((section) => section.type === type);
  const hero = byType("hero");
  const about = byType("about_us") ?? byType("about");
  const contact = byType("contact");
  const gallery = byType("gallery");
  const blueprint = record(record(site.blueprintJson).site);
  const seo = record(blueprint.seo);
  const social = record(blueprint.socialLinks);
  const heroMedia = text(contentOf(hero).mediaUrl) || site.coverUrl || sectionImageUrl({
    prompt: text(contentOf(hero).imagePrompt), businessType: site.businessType,
    seed: `${site.businessName}:hero`, width: 1600, height: 1000, section: "hero",
  });
  const aboutMedia = text(contentOf(about).mediaUrl) || sectionImageUrl({
    prompt: text(contentOf(about).imagePrompt), businessType: site.businessType,
    seed: `${site.businessName}:about`, width: 1200, height: 900, section: "about",
  });
  const toItem = (item: Record<string, unknown>) => ({
    title: text(item.title ?? item.name ?? item.label),
    description: text(item.description ?? item.body ?? item.text),
    meta: text(item.price ?? item.value),
    image: text(item.image ?? item.url),
  });
  const galleryItems = items(gallery)
    .map((item) => ({ url: text(item.url ?? item.image), alt: text(item.alt ?? item.title) }))
    .filter((item) => item.url);
  if (!galleryItems.length && gallery) {
    for (let index = 0; index < 3; index++) {
      galleryItems.push({
        url: sectionImageUrl({
          prompt: text(contentOf(gallery).imagePrompt), businessType: site.businessType,
          seed: `${site.businessName}:gallery:${index}`, width: 900, height: 700, section: "gallery",
        }),
        alt: `${site.businessName} — galería ${index + 1}`,
      });
    }
  }
  const rawHighlights = items(about).length
    ? items(about)
    : Array.isArray(record(about?.settingsJson).highlights)
      ? record(about?.settingsJson).highlights as unknown[]
      : [];

  return normalizeSiteContentV2({
    business: {
      name: site.businessName, type: site.businessType, location: site.location,
      phone: site.phone, email: site.email, logo: site.logoUrl,
    },
    hero: {
      title: hero?.title || site.businessName, subtitle: contentOf(hero).subtitle,
      body: contentOf(hero).body, ctaText: contentOf(hero).ctaText,
      ctaLink: contentOf(hero).ctaLink, media: heroMedia,
    },
    about: {
      title: about?.title || `Sobre ${site.businessName}`, subtitle: contentOf(about).subtitle,
      body: contentOf(about).body, media: aboutMedia,
      highlights: rawHighlights.map((item) => toItem(record(item))),
    },
    services: items(byType("services")).map(toItem),
    benefits: items(byType("benefits")).map(toItem),
    reviews: items(byType("testimonials")).map((item) => ({
      name: text(item.name), role: text(item.role), quote: text(item.quote ?? item.text),
      rating: item.rating, source: text(item.source),
    })),
    faqs: items(byType("faq")).map((item) => ({
      question: text(item.question ?? item.title), answer: text(item.answer ?? item.description),
    })),
    contact: {
      title: contact?.title || "Contacto", body: contentOf(contact).body,
      ctaText: contentOf(contact).ctaText || "Enviar mensaje",
    },
    media: [{ url: site.coverUrl || "", alt: site.businessName }, ...galleryItems].filter((item) => item.url),
    social,
    seo: {
      title: seo.title || site.businessName,
      description: seo.metaDescription || `${site.businessName} — ${site.businessType}`,
      keyword: seo.mainKeyword || site.businessType,
    },
  });
}
