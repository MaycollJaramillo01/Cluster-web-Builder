ALTER TABLE "Site" ALTER COLUMN "userId" DROP NOT NULL;
ALTER TABLE "Site" ADD COLUMN "guestTokenHash" TEXT;
ALTER TABLE "Site" ADD COLUMN "guestExpiresAt" TIMESTAMP(3);

CREATE INDEX "Site_guestTokenHash_idx" ON "Site"("guestTokenHash");
CREATE INDEX "Site_guestExpiresAt_idx" ON "Site"("guestExpiresAt");
