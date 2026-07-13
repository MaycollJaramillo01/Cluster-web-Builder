import assert from "node:assert/strict";
import test from "node:test";

import { getLaunchReadinessV2, getSiteLaunchReadiness } from "../lib/site/launch-readiness";

const formSection = {
  schemaVersion: 2,
  id: "main",
  key: "contact",
  name: "Contact",
  region: "main",
  rows: [{
    id: "row",
    columns: [{
      id: "column",
      span: { desktop: 12, tablet: 12, mobile: 12 },
      widgets: [{ id: "form", type: "form" }],
    }],
  }],
};

const headerSection = {
  schemaVersion: 2,
  id: "header",
  key: "header",
  name: "Header",
  region: "header",
  rows: [{ id: "header-row", columns: [{ id: "header-column", span: { desktop: 12, tablet: 12, mobile: 12 }, widgets: [{ id: "brand", type: "brand" }] }] }],
};

const footerSection = {
  schemaVersion: 2,
  id: "footer",
  key: "footer",
  name: "Footer",
  region: "footer",
  rows: [{ id: "footer-row", columns: [{ id: "footer-column", span: { desktop: 12, tablet: 12, mobile: 12 }, widgets: [{ id: "info", type: "business_info" }] }] }],
};

const validContent = {
  business: { name: "AA Painting", type: "Painting", phone: "+13365609847", email: "", location: "High Point", logo: "" },
  hero: { title: "Expert Home Repair", subtitle: "Reliable home repair", body: "", ctaText: "Request a Quote", ctaLink: "#contact", media: "" },
  about: { title: "", subtitle: "", body: "", media: "", highlights: [] },
  services: [],
  benefits: [],
  reviews: [],
  faqs: [],
  contact: { title: "Get a Free Quote", body: "Tell us what you need.", ctaText: "Send" },
  media: [],
  social: {},
  seo: { title: "", description: "", keyword: "" },
};

test("readiness V2 blocks publishing without a real lead form", () => {
  const readiness = getLaunchReadinessV2({
    content: validContent,
    sections: [headerSection, footerSection],
    status: "DRAFT",
  });

  assert.equal(readiness.canPublish, false);
  assert.deepEqual(readiness.missingForPublish, ["Formulario activo"]);
  assert.equal(readiness.canDownload, false);
});

test("readiness V2 allows publishing with content, contact and form, but download requires published status", () => {
  const draft = getLaunchReadinessV2({
    content: validContent,
    sections: [headerSection, formSection, footerSection],
    status: "DRAFT",
  });
  assert.equal(draft.canPublish, true);
  assert.equal(draft.canDownload, false);
  assert.deepEqual(draft.missingForDownload, ["Sitio publicado"]);

  const published = getLaunchReadinessV2({
    content: validContent,
    sections: [headerSection, formSection, footerSection],
    status: "PUBLISHED",
  });
  assert.equal(published.canPublish, true);
  assert.equal(published.canDownload, true);
});

test("readiness supports legacy sites through the same contract", () => {
  const readiness = getSiteLaunchReadiness({
    builderVersion: 1,
    status: "PUBLISHED",
    businessName: "Legacy Painter",
    phone: "+13365609847",
    logoUrl: "",
    coverUrl: "",
    sections: [
      { type: "hero", title: "Legacy Painter", isVisible: true, content: { body: "Painting and remodeling." } },
      { type: "contact", title: "Contact", isVisible: true, content: { body: "Send a quote request." } },
    ],
  });

  assert.equal(readiness.canPublish, true);
  assert.equal(readiness.canDownload, true);
});
