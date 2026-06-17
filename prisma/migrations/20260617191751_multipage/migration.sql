-- AlterTable
ALTER TABLE "Site" ADD COLUMN     "navPages" JSONB;

-- AlterTable
ALTER TABLE "SiteSection" ADD COLUMN     "pageSlug" TEXT NOT NULL DEFAULT 'home';
