import { prisma } from "@/lib/db";

export async function trackSiteView(siteId: string): Promise<void> {
  const date = new Date().toISOString().slice(0, 10); // "YYYY-MM-DD"
  try {
    await prisma.siteView.upsert({
      where: { siteId_date: { siteId, date } },
      update: { views: { increment: 1 } },
      create: { siteId, date, views: 1 },
    });
  } catch {
    // Non-blocking: view tracking failures must not break the page render.
  }
}
