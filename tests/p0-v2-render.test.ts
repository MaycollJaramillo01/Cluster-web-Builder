import assert from "node:assert/strict";
import test from "node:test";

import { renderSiteV2 } from "../lib/site/v2-render";

test("renderer V2 bloquea data URLs, mantiene formulario y usa la misma salida para preview/public", () => {
  const content = {
    business: {
      name: "AA Painting & Remodeling",
      type: "Home Repair",
      location: "High Point, NC",
      phone: "+13365609847",
      email: "hello@example.com",
      logo: "data:image/png;base64,aGVsbG8=",
    },
    hero: {
      title: "Expert Home Repair & Renovation Services",
      subtitle: "Reliable home repair solutions for lasting quality",
      body: "Painting, remodeling and drywall repair for homeowners.",
      ctaText: "Request a Free Quote",
      ctaLink: "#contact",
      media: "data:image/png;base64,aGVsbG8=",
    },
    contact: { title: "Get a Free Quote", body: "Tell us what you need.", ctaText: "Send" },
    media: [{ url: "https://cdn.example.com/project.webp", alt: "Completed remodeling project" }],
  };

  const sections = [
    {
      schemaVersion: 2,
      id: "header",
      key: "header",
      name: "Header",
      region: "header",
      rows: [{ id: "row-header", columns: [{ id: "col-header", span: { desktop: 12, tablet: 12, mobile: 12 }, widgets: [{ id: "brand", type: "brand", slot: "business.name" }] }] }],
    },
    {
      schemaVersion: 2,
      id: "main",
      key: "hero",
      name: "Hero",
      region: "main",
      rows: [{
        id: "row-main",
        columns: [{
          id: "col-main",
          span: { desktop: 12, tablet: 12, mobile: 12 },
          widgets: [
            { id: "title", type: "heading", slot: "hero.title", variant: "h1" },
            { id: "image", type: "image", slot: "hero.media" },
            { id: "form", type: "form", data: { titleSlot: "contact.title", bodySlot: "contact.body", buttonSlot: "contact.ctaText" } },
          ],
        }],
      }],
    },
    {
      schemaVersion: 2,
      id: "footer",
      key: "footer",
      name: "Footer",
      region: "footer",
      rows: [{ id: "row-footer", columns: [{ id: "col-footer", span: { desktop: 12, tablet: 12, mobile: 12 }, widgets: [{ id: "info", type: "business_info" }] }] }],
    },
  ];

  const rendered = renderSiteV2({
    content,
    design: { primary: "#18298c", secondary: "#30478c", accent: "#d90404", background: "#f2f2f2", text: "#111827" },
    sections,
    leadEndpoint: "/api/public/sites/aa-painting/leads",
    publicUrl: "https://cluster-web-builder.vercel.app/s/aa-painting",
    indexable: true,
  });

  assert.match(rendered.html, /Expert Home Repair/);
  assert.match(rendered.html, /data-cluster-form/);
  assert.match(rendered.html, /\/api\/public\/sites\/aa-painting\/leads/);
  assert.doesNotMatch(rendered.html, /data:image\//);
  assert.doesNotMatch(rendered.html, /<img[^>]+src=""/);
});
