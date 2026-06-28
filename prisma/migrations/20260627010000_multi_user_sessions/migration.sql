CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "tokenHash" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "RateLimit" (
    "key" TEXT NOT NULL,
    "count" INTEGER NOT NULL DEFAULT 1,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "RateLimit_pkey" PRIMARY KEY ("key")
);

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM "Site" WHERE "userId" IS NULL)
     AND NOT EXISTS (SELECT 1 FROM "User") THEN
    RAISE EXCEPTION 'Create an admin user before applying the multi-user migration';
  END IF;
END $$;

UPDATE "Site"
SET "userId" = (
  SELECT "id" FROM "User"
  ORDER BY CASE WHEN "role" = 'ADMIN' THEN 0 ELSE 1 END, "createdAt"
  LIMIT 1
)
WHERE "userId" IS NULL;

ALTER TABLE "Site" ALTER COLUMN "userId" SET NOT NULL;

CREATE UNIQUE INDEX "Session_tokenHash_key" ON "Session"("tokenHash");
CREATE INDEX "Session_userId_idx" ON "Session"("userId");
CREATE INDEX "Session_expiresAt_idx" ON "Session"("expiresAt");
CREATE INDEX "RateLimit_expiresAt_idx" ON "RateLimit"("expiresAt");

ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "Site" DROP CONSTRAINT IF EXISTS "Site_userId_fkey";
ALTER TABLE "Site" ADD CONSTRAINT "Site_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
