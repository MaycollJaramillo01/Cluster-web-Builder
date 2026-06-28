ALTER TABLE "Site"
ADD COLUMN "publicSlug" TEXT,
ADD COLUMN "publishedAt" TIMESTAMP(3),
ADD COLUMN "downloadedAt" TIMESTAMP(3);

UPDATE "Site" SET "publicSlug" = 'site-' || LOWER(SUBSTRING("id", 1, 10));
ALTER TABLE "Site" ALTER COLUMN "publicSlug" SET NOT NULL;
CREATE UNIQUE INDEX "Site_publicSlug_key" ON "Site"("publicSlug");

CREATE TABLE "Lead" (
    "id" TEXT NOT NULL,
    "siteId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "message" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Lead_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "Lead_siteId_createdAt_idx" ON "Lead"("siteId", "createdAt");
ALTER TABLE "Lead" ADD CONSTRAINT "Lead_siteId_fkey"
FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
