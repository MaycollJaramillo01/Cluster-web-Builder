import type { Prisma } from "@prisma/client";

/** Public map data must never include work that has not been published. */
export const publishedMapSiteWhere = {
  status: "PUBLISHED",
  location: { not: null },
} satisfies Prisma.SiteWhereInput;
