import assert from "node:assert/strict";
import test from "node:test";

import { composeSiteSectionsV2 } from "../lib/site/section-composer";
import { DESIGN_LANGUAGE_IDS } from "../lib/site/design-language-types";
import { SITE_RECIPES } from "../lib/site/site-recipes";
import { getSectionRegistryEntryV2 } from "../lib/site/v2-section-registry";
import { renderSiteV2 } from "../lib/site/v2-render";

const baseContent = {
  business: { name: "AA Painting", type: "Painting and remodeling", location: "High Point, NC", phone: "+1 336 560 9847", email: "hello@example.com" },
  hero: { title: "Expert home repair and renovation services", subtitle: "AA Painting & Remodeling", body: "Reliable home repair solutions for lasting quality.", ctaText: "Request a Free Quote", ctaLink: "#contact", media: "https://cdn.example.com/cover.webp" },
  about: { title: "Trusted home repair experts", subtitle: "About us", body: "We handle painting, drywall, bathroom updates, and practical repair work with direct communication.", media: "https://cdn.example.com/about.webp", highlights: [{ title: "Free quote first", description: "Clear next steps before committing." }] },
  services: [{ title: "Interior painting", description: "Careful wall preparation, masking, finishes, and color updates." }],
  benefits: [{ title: "Built for lasting quality", description: "Repair work that holds up." }],
  reviews: [{ name: "Sarah M.", role: "Homeowner", quote: "Clean work and fast communication.", rating: 5, source: "Customer" }],
  faqs: [{ question: "Do you handle painting and remodeling?", answer: "Yes, we handle both small repairs and larger updates." }],
  contact: { title: "Get a free quote", body: "Send your project details and we will contact you.", ctaText: "Send request" },
  media: [{ url: "https://cdn.example.com/cover.webp", alt: "Project cover" }, { url: "https://cdn.example.com/gallery.webp", alt: "Finished room" }],
  seo: { title: "AA Painting & Remodeling in High Point", description: "Painting and remodeling services in High Point, NC.", keyword: "painting remodeling" },
};

test("section composer builds a complete editable page without template seeds", () => {
  const document = composeSiteSectionsV2({ content: baseContent, businessType: "Painting and remodeling", theme: { primary: "#19298c", secondary: "#730202", accent: "#d90404" } });
  assert.equal(document.design.primary, "#19298c");
  assert.equal(document.sections[0].region, "header");
  assert.equal(document.sections.at(-1)?.region, "footer");
  assert.ok(document.sections.some((section) => section.key.includes("contact")));
  assert.ok(document.sections.some((section) => section.key.includes("gallery")));
  assert.equal(new Set(document.sections.map((section) => section.id)).size, document.sections.length);

  const rendered = renderSiteV2({ content: document.content, design: document.design, sections: document.sections, leadEndpoint: "/api/leads" });
  assert.match(rendered.body, /data-cluster-form/);
  assert.match(rendered.body, /AA Painting/);
});

test("section composer varies structure by business context", () => {
  const service = composeSiteSectionsV2({ content: baseContent, businessType: "Painting and remodeling", visualStyle: "Service" });
  const software = composeSiteSectionsV2({ content: { ...baseContent, business: { ...baseContent.business, type: "Software" } }, businessType: "Software", visualStyle: "Mono" });
  const serviceFingerprint = service.sections.map((section) => section.key).join(">");
  const softwareFingerprint = software.sections.map((section) => section.key).join(">");
  assert.notEqual(serviceFingerprint, softwareFingerprint);
});

test("section composer respeta el orden funcional del blueprint", () => {
  const document = composeSiteSectionsV2({
    content: baseContent,
    businessType: "Architecture",
    blueprint: ["hero", "gallery", "services", "about_us", "contact", "cta", "footer"],
  });
  const stages = document.sections.map((section) => section.key).map((key) => {
    if (key.includes("hero")) return "hero";
    if (key.includes("gallery")) return "gallery";
    if (key.includes("services")) return "services";
    if (key.includes("about")) return "about";
    if (key.includes("contact")) return "contact";
    if (key.includes("cta")) return "cta";
    if (key.includes("footer")) return "footer";
    return null;
  }).filter(Boolean);

  assert.deepEqual(stages, ["hero", "gallery", "services", "about", "contact", "cta", "footer"]);
  const nav = document.sections[0].rows[0].columns[1].widgets[0];
  assert.deepEqual(nav.data?.items, [
    { label: "Proyectos", href: `#${document.sections[2].key}` },
    { label: "Servicios", href: `#${document.sections[3].key}` },
    { label: "Nosotros", href: `#${document.sections[4].key}` },
    { label: "Contacto", href: `#${document.sections[5].key}` },
  ]);
});

test("la matriz de recetas y lenguajes produce documentos válidos desde el registro", () => {
  for (const recipe of Object.values(SITE_RECIPES)) {
    for (const language of DESIGN_LANGUAGE_IDS) {
      const document = composeSiteSectionsV2({
        content: baseContent,
        businessType: baseContent.business.type,
        designLanguage: language,
        blueprint: recipe.sections,
      });
      assert.equal(document.design.language, language);
      assert.equal(document.sections[0].region, "header");
      assert.equal(document.sections.at(-1)?.region, "footer");
      for (const section of document.sections.filter((item) => item.region !== "header")) {
        const entry = getSectionRegistryEntryV2(section.key);
        assert.ok(entry, `${recipe.id}:${language} generó un bloque no registrado: ${section.key}`);
        assert.ok(entry.supportedLanguages.includes(language));
      }
    }
  }
});
