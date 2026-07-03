-- Builder V2 is additive. Existing sites keep builderVersion=1 and continue
-- through the legacy renderer until their owner explicitly creates a V2 copy.
ALTER TABLE "Site"
  ADD COLUMN "builderVersion" INTEGER NOT NULL DEFAULT 1,
  ADD COLUMN "templateId" TEXT,
  ADD COLUMN "contentJson" JSONB,
  ADD COLUMN "designJson" JSONB,
  ADD COLUMN "replacesSiteId" TEXT;

CREATE UNIQUE INDEX "Site_replacesSiteId_key" ON "Site"("replacesSiteId");

ALTER TABLE "Site"
  ADD CONSTRAINT "Site_replacesSiteId_fkey"
  FOREIGN KEY ("replacesSiteId") REFERENCES "Site"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;

CREATE TABLE "SiteRevision" (
  "id" TEXT NOT NULL,
  "siteId" TEXT NOT NULL,
  "reason" TEXT NOT NULL,
  "snapshotJson" JSONB NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "SiteRevision_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "SiteRevision_siteId_createdAt_idx" ON "SiteRevision"("siteId", "createdAt");

ALTER TABLE "SiteRevision"
  ADD CONSTRAINT "SiteRevision_siteId_fkey"
  FOREIGN KEY ("siteId") REFERENCES "Site"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
