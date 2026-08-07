import { NextRequest, NextResponse } from "next/server";
import type Stripe from "stripe";

import { prisma } from "@/lib/db";
import { stripeClient } from "@/lib/stripe";
import { trackProductEvent } from "@/lib/product-events";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const stripe = stripeClient();
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  const signature = request.headers.get("stripe-signature");
  if (!stripe || !secret || !signature) return NextResponse.json({ error: "Webhook no configurado." }, { status: 503 });

  let event: Stripe.Event;
  try {
    event = stripe.webhooks.constructEvent(await request.text(), signature, secret);
  } catch {
    return NextResponse.json({ error: "Firma inválida." }, { status: 400 });
  }

  // Idempotency via unique RateLimit key — duplicates return early; failures release the key so Stripe can retry.
  const eventKey = `stripe-event:${event.id}`;
  try {
    await prisma.rateLimit.create({
      data: {
        key: eventKey,
        count: 1,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
      },
    });
  } catch {
    return NextResponse.json({ received: true, duplicate: true });
  }

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;
      if (session.client_reference_id) {
        await prisma.user.update({ where: { id: session.client_reference_id }, data: {
          planStatus: "ACTIVE",
          stripeCustomerId: typeof session.customer === "string" ? session.customer : null,
          stripeSubscriptionId: typeof session.subscription === "string" ? session.subscription : null,
        } });
        await trackProductEvent("subscription_activated", { userId: session.client_reference_id });
      }
    }
    if (event.type === "customer.subscription.updated" || event.type === "customer.subscription.deleted") {
      const subscription = event.data.object;
      const planStatus = subscription.status === "active" || subscription.status === "trialing" ? "ACTIVE"
        : subscription.status === "past_due" || subscription.status === "unpaid" ? "PAST_DUE" : "CANCELED";
      const user = await prisma.user.findFirst({ where: { OR: [
        { stripeSubscriptionId: subscription.id },
        { stripeCustomerId: typeof subscription.customer === "string" ? subscription.customer : "" },
      ] }, select: { id: true } });
      if (user) {
        await prisma.$transaction([
          prisma.user.update({ where: { id: user.id }, data: { planStatus, stripeSubscriptionId: subscription.id } }),
          ...(planStatus === "ACTIVE" ? [] : [prisma.site.updateMany({ where: { userId: user.id }, data: { status: "GENERATED", publishedAt: null, domainVerifiedAt: null } })]),
        ]);
        await trackProductEvent("subscription_changed", { userId: user.id, metadata: { planStatus } });
      }
    }
  } catch (error) {
    await prisma.rateLimit.delete({ where: { key: eventKey } }).catch(() => undefined);
    throw error;
  }

  return NextResponse.json({ received: true });
}
