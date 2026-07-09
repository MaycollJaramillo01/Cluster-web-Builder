import { resolveDesignStyleId } from "@/lib/site/design";
import { sectionImageUrl } from "@/lib/site/images";
import { composeSiteSectionsV2 } from "@/lib/site/section-composer";
import { LEGACY_TEMPLATE_MIGRATION } from "@/lib/site/v2-templates";
import { normalizeCanvasSectionsV2, normalizeSiteContentV2, type CanvasSectionV2, type SiteContentV2, type V2TemplateId } from "@/lib/site/v2-schema";

type LegacySectionRow = { type: string; title: string | null; content: unknown; settingsJson: unknown; order: number };
type LegacySite = {
  businessName: string; businessType: string; location: string | null; phone: string | null; email: string | null;
  logoUrl: string | null; coverUrl: string | null; visualStyle: string | null; blueprintJson: unknown;
  primaryColor: string | null; secondaryColor: string | null; accentColor: string | null;
};

const record = (value: unknown): Record<string, unknown> => value && typeof value === "object" ? value as Record<string, unknown> : {};
const text = (value: unknown) => typeof value === "string" ? value : "";
const items = (section: LegacySectionRow | undefined) => {
  const value = record(section?.settingsJson).items;
  return Array.isArray(value) ? value.filter((item): item is Record<string, unknown> => Boolean(item) && typeof item === "object") : [];
};
const contentOf = (section: LegacySectionRow | undefined) => record(section?.content);

export function contentFromLegacySite(site: LegacySite, sections: LegacySectionRow[]): SiteContentV2 {
  const byType = (type: string) => sections.find((section) => section.type === type);
  const hero = byType("hero");
  const about = byType("about_us") ?? byType("about");
  const contact = byType("contact");
  const gallery = byType("gallery");
  const blueprint = record(record(site.blueprintJson).site);
  const seo = record(blueprint.seo);
  const social = record(blueprint.socialLinks);
  const heroMedia = text(contentOf(hero).mediaUrl) || site.coverUrl || sectionImageUrl({ prompt: text(contentOf(hero).imagePrompt), businessType: site.businessType, seed: `${site.businessName}:hero`, width: 1600, height: 1000, section: "hero" });
  const aboutMedia = text(contentOf(about).mediaUrl) || sectionImageUrl({ prompt: text(contentOf(about).imagePrompt), businessType: site.businessType, seed: `${site.businessName}:about`, width: 1200, height: 900, section: "about" });
  const toItem = (item: Record<string, unknown>) => ({ title: text(item.title ?? item.name ?? item.label), description: text(item.description ?? item.body ?? item.text), meta: text(item.price ?? item.value), image: text(item.image ?? item.url) });
  const galleryItems = items(gallery).map((item) => ({ url: text(item.url ?? item.image), alt: text(item.alt ?? item.title) })).filter((item) => item.url);
  if (!galleryItems.length && gallery) for (let index = 0; index < 3; index++) galleryItems.push({ url: sectionImageUrl({ prompt: text(contentOf(gallery).imagePrompt), businessType: site.businessType, seed: `${site.businessName}:gallery:${index}`, width: 900, height: 700, section: "gallery" }), alt: `${site.businessName} — galería ${index + 1}` });
  const rawHighlights = items(about).length
    ? items(about)
    : Array.isArray(record(about?.settingsJson).highlights)
      ? record(about?.settingsJson).highlights as unknown[]
      : [];
  return normalizeSiteContentV2({
    business: { name: site.businessName, type: site.businessType, location: site.location, phone: site.phone, email: site.email, logo: site.logoUrl },
    hero: { title: hero?.title || site.businessName, subtitle: contentOf(hero).subtitle, body: contentOf(hero).body, ctaText: contentOf(hero).ctaText, ctaLink: contentOf(hero).ctaLink, media: heroMedia },
    about: { title: about?.title || `Sobre ${site.businessName}`, subtitle: contentOf(about).subtitle, body: contentOf(about).body, media: aboutMedia, highlights: rawHighlights.map((item) => toItem(record(item))) },
    services: items(byType("services")).map(toItem), benefits: items(byType("benefits")).map(toItem),
    reviews: items(byType("testimonials")).map((item) => ({ name: text(item.name), role: text(item.role), quote: text(item.quote ?? item.text), rating: item.rating, source: text(item.source) })),
    faqs: items(byType("faq")).map((item) => ({ question: text(item.question ?? item.title), answer: text(item.answer ?? item.description) })),
    contact: { title: contact?.title || "Contacto", body: contentOf(contact).body, ctaText: contentOf(contact).ctaText || "Enviar mensaje" },
    media: [{ url: site.coverUrl || "", alt: site.businessName }, ...galleryItems].filter((item) => item.url), social,
    seo: { title: seo.title || site.businessName, description: seo.metaDescription || `${site.businessName} — ${site.businessType}`, keyword: seo.mainKeyword || site.businessType },
  });
}

export function chooseV2Template(visualStyle: string | null | undefined): V2TemplateId {
  const canonical = resolveDesignStyleId(visualStyle) || "Service";
  return LEGACY_TEMPLATE_MIGRATION[canonical]?.template || "conversion";
}

// El rubro del negocio decide la plantilla de mejor ajuste entre las nuevas; sin esto
// el generador solo alcanzaba las 6 plantillas originales del mapeo por estilo visual.
// Cada entrada es [plantilla, patrón sobre el tipo de negocio en minúsculas].
const BUSINESS_TEMPLATE_RULES: Array<[V2TemplateId, RegExp]> = [
  ["gastro", /restaurant|comida|cafeter|cafe|café|bar |bistr|cocina|gastro|panader|reposter|taquer|pizzer|menu|menú/],
  ["metro", /gimnasio|gym|fitness|entrenamiento|crossfit|deporte|box(?:eo)?|yoga|pilates/],
  ["astre", /joyer|joya|belleza|salon|salón|spa|estetic|estétic|maquilla|uñas|peluquer|barber|lujo|boutique|moda/],
  ["terminal", /software|desarrollo|programaci|tecnolog|app\b|saas|startup|datos|ciberseg|devops|api\b|nube|it\b/],
  ["horizonte", /turismo|viaje|expedici|aventura|hotel|hosped|hostal|monta|ecoturismo|tour|senderis|camping|naturaleza/],
  ["assurance", /legal|abogad|bufete|jurídic|juridic|notari|contabil|conta\b|fiscal|asesor|consultor|complian|financ|seguro|clínica|clinica|médic|medic|salud|dental|dentist/],
  ["impact", /agencia|marketing|publicidad|creativ|branding|diseño|diseno|estudio|comunicaci|producci|audiovisual|fotograf/],
  ["nordic", /interior|arquitect|mueble|decorac|inmobili|bienes raíces|bienes raices|construc|reforma|carpinter/],
  ["hvac-premium", /techo|roofing|pintura|painting|jardin|landscap|limpieza|cleaning|plomer|electric|clima|hvac|fontaner|mantenimien|instalaci|reparaci/],
];

export function chooseTemplateForBusiness(businessType: string | null | undefined, visualStyle: string | null | undefined): V2TemplateId {
  const label = (businessType || "").toLowerCase();
  if (label) {
    const match = BUSINESS_TEMPLATE_RULES.find(([, pattern]) => pattern.test(label));
    if (match) return match[0];
  }
  return chooseV2Template(visualStyle);
}

export function migrateLegacySiteDocument(site: LegacySite, sections: LegacySectionRow[]) {
  const templateId = chooseTemplateForBusiness(site.businessType, site.visualStyle);
  const content = contentFromLegacySite(site, sections);
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
  // ponytail: templateId queda como metadato legacy; las secciones guardadas mandan el render.
  return { templateId, content: composed.content, design: composed.design, sections: composed.sections };
}

export function canvasSectionsFromRows(rows: Array<{ content: unknown }>): CanvasSectionV2[] {
  return normalizeCanvasSectionsV2(rows.map((row) => row.content));
}
