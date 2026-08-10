import assert from "node:assert/strict";
import test from "node:test";

import { siteAccessWhere } from "../lib/site/site-access-where";

test("siteAccessWhere permite admin sin OR de ownership", () => {
  assert.deepEqual(
    siteAccessWhere("site-1", { user: { id: "admin", role: "ADMIN" }, guestTokenHash: null }),
    { id: "site-1" },
  );
});

test("siteAccessWhere une owner y guest cuando ambos existen", () => {
  const where = siteAccessWhere(
    "site-1",
    { user: { id: "user-1", role: "USER" }, guestTokenHash: "guest-hash" },
    { allowGuest: true },
  );
  assert.equal(where.id, "site-1");
  assert.ok(Array.isArray(where.OR));
  assert.equal(where.OR!.length, 2);
});

test("siteAccessWhere con allowGuest false excluye guest", () => {
  const where = siteAccessWhere(
    "site-1",
    { user: { id: "user-1", role: "USER" }, guestTokenHash: "guest-hash" },
    { allowGuest: false },
  );
  assert.deepEqual(where, { id: "site-1", OR: [{ userId: "user-1" }] });
});
