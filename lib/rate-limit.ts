import { createHash } from "node:crypto";

import { prisma } from "@/lib/db";

export async function consumeRateLimit(
  scope: string,
  identifier: string,
  limit: number,
  windowMs: number
): Promise<boolean> {
  const { bucket, key } = rateLimitKey(scope, identifier, windowMs);
  const expiresAt = new Date((bucket + 1) * windowMs);
  const record = await prisma.rateLimit.upsert({
    where: { key },
    create: { key, count: 1, expiresAt },
    update: { count: { increment: 1 } },
  });
  return record.count <= limit;
}

export async function clearRateLimit(scope: string, identifier: string, windowMs: number) {
  await prisma.rateLimit.deleteMany({ where: { key: rateLimitKey(scope, identifier, windowMs).key } });
}

function rateLimitKey(scope: string, identifier: string, windowMs: number) {
  const bucket = Math.floor(Date.now() / windowMs);
  const digest = createHash("sha256").update(identifier).digest("hex").slice(0, 24);
  return { bucket, key: `${scope}:${digest}:${bucket}` };
}
