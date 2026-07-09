import assert from "node:assert/strict";
import test from "node:test";

import { hasProAccess } from "@/lib/entitlements";
import { hashPassword, verifyPassword } from "@/lib/password";
import { appOrigin } from "@/lib/site/public-url";
import { onboardingSchema } from "@/lib/validators/site-onboarding";
import { onboardingFixture } from "./site-fixture";

test("solo Pro y administradores acceden a acciones comerciales", () => {
  assert.equal(hasProAccess({ role: "EDITOR", planStatus: "FREE" }), false);
  assert.equal(hasProAccess({ role: "EDITOR", planStatus: "ACTIVE" }), true);
  assert.equal(hasProAccess({ role: "ADMIN", planStatus: "FREE" }), true);
});

test("las contraseñas se guardan con sal y se verifican", async () => {
  const hash = await hashPassword("ClusterSeguro2026");
  assert.notEqual(hash, "ClusterSeguro2026");
  assert.equal(await verifyPassword("ClusterSeguro2026", hash), true);
  assert.equal(await verifyPassword("incorrecta", hash), false);
});

test("logo y portada válidos viajan con el onboarding", () => {
  const image = `data:image/png;base64,${Buffer.from("cluster").toString("base64")}`;
  const parsed = onboardingSchema.parse({ ...onboardingFixture, assets: { logoDataUrl: image, coverDataUrl: image } });
  assert.equal(parsed.assets?.logoDataUrl, image);
  assert.throws(() => onboardingSchema.parse({ ...onboardingFixture, assets: { logoDataUrl: "https://example.com/logo.png" } }));
});

test("un placeholder de URL no rompe enlaces comerciales", () => {
  const previous = process.env.NEXT_PUBLIC_APP_URL;
  process.env.NEXT_PUBLIC_APP_URL = "{{APP_URL}}";
  assert.equal(appOrigin("https://cluster.example.com/path"), "https://cluster.example.com");
  if (previous === undefined) delete process.env.NEXT_PUBLIC_APP_URL;
  else process.env.NEXT_PUBLIC_APP_URL = previous;
});
