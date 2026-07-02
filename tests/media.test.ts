import assert from "node:assert/strict";
import test from "node:test";

import {
  IMAGE_MAX_BYTES,
  IMAGE_MEDIA_TYPES,
  isSiteMediaUrl,
  siteMediaPrefix,
  VIDEO_MAX_BYTES,
  VIDEO_MEDIA_TYPES,
} from "../lib/site/media";
import { normalizeSectionLayout } from "../lib/site/section-layout";

test("los medios quedan aislados por sitio y con límites seguros", () => {
  assert.equal(siteMediaPrefix("site-1"), "sites/site-1/");
  assert.equal(IMAGE_MAX_BYTES, 8 * 1024 * 1024);
  assert.equal(VIDEO_MAX_BYTES, 60 * 1024 * 1024);
  assert.deepEqual(IMAGE_MEDIA_TYPES, ["image/jpeg", "image/png", "image/webp"]);
  assert.deepEqual(VIDEO_MEDIA_TYPES, ["video/mp4", "video/webm"]);
  assert.equal(isSiteMediaUrl("site-1", "https://example.public.blob.vercel-storage.com/sites/site-1/photo.webp"), true);
  assert.equal(isSiteMediaUrl("site-1", "https://example.public.blob.vercel-storage.com/sites/site-2/photo.webp"), false);
  assert.equal(isSiteMediaUrl("site-1", "data:image/png;base64,abc"), false);
});

test("el layout solo acepta opciones que no rompen el preset", () => {
  assert.deepEqual(normalizeSectionLayout({ width: "wide", align: "center", background: "tonal", spacing: "compact" }), {
    width: "wide", align: "center", background: "tonal", spacing: "compact",
  });
  assert.deepEqual(normalizeSectionLayout({ width: "100vw", align: "absolute", background: "url(x)", spacing: "999px" }), {
    width: "standard", align: "left", background: "plain", spacing: "normal",
  });
});
