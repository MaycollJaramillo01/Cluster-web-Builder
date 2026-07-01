-- CreateTable
CREATE TABLE "SiteView" (
    "siteId" TEXT NOT NULL,
    "date" TEXT NOT NULL,
    "views" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "SiteView_pkey" PRIMARY KEY ("siteId","date")
);

-- CreateIndex
CREATE INDEX "SiteView_siteId_idx" ON "SiteView"("siteId");

-- AddForeignKey
ALTER TABLE "SiteView" ADD CONSTRAINT "SiteView_siteId_fkey" FOREIGN KEY ("siteId") REFERENCES "Site"("id") ON DELETE CASCADE ON UPDATE CASCADE;
