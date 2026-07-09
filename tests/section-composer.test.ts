import assert from "node:assert/strict";
import test from "node:test";

import { composeSiteSectionsV2 } from "../lib/site/section-composer";
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
