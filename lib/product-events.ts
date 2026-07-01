import { prisma } from "@/lib/db";

export type ProductEventName =
  | "user_registered"
  | "password_reset_requested"
  | "password_reset_completed"
  | "site_generated"
  | "checkout_started"
  | "subscription_activated"
  | "subscription_changed"
  | "site_published"
  | "site_downloaded"
  | "domain_connected"
  | "lead_received";

export async function trackProductEvent(name: ProductEventName, data: {
  userId?: string | null;
  siteId?: string | null;
  metadata?: Record<string, string | number | boolean | null>;
} = {}) {
  try {
    await prisma.productEvent.create({
      data: {
        name,
        userId: data.userId ?? null,
        siteId: data.siteId ?? null,
        metadata: data.metadata ?? undefined,
      },
    });
  } catch (error) {
    console.error("product_event_failed", { name, error: error instanceof Error ? error.message : "unknown" });
  }
}
