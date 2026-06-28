CREATE TYPE "PlanStatus" AS ENUM ('FREE', 'ACTIVE', 'PAST_DUE', 'CANCELED');

ALTER TABLE "User"
ADD COLUMN "planStatus" "PlanStatus" NOT NULL DEFAULT 'FREE',
ADD COLUMN "stripeCustomerId" TEXT,
ADD COLUMN "stripeSubscriptionId" TEXT;

CREATE UNIQUE INDEX "User_stripeCustomerId_key" ON "User"("stripeCustomerId");
CREATE UNIQUE INDEX "User_stripeSubscriptionId_key" ON "User"("stripeSubscriptionId");

ALTER TABLE "Site"
ADD COLUMN "customDomain" TEXT,
ADD COLUMN "domainVerifiedAt" TIMESTAMP(3);

CREATE UNIQUE INDEX "Site_customDomain_key" ON "Site"("customDomain");
