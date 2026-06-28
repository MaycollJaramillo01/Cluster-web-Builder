import { NextRequest, NextResponse } from "next/server";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { stripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.redirect(new URL("/login?from=/billing", request.url), 303);
  const stripe = stripeClient();
  const price = process.env.STRIPE_PRICE_ID;
  if (!stripe || !price) return NextResponse.json({ error: "Stripe no está configurado." }, { status: 503 });
  if (user.planStatus === "ACTIVE") return NextResponse.redirect(new URL("/billing", request.url), 303);

  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    line_items: [{ price, quantity: 1 }],
    client_reference_id: user.id,
    customer: user.stripeCustomerId || undefined,
    customer_email: user.stripeCustomerId ? undefined : user.email || undefined,
    success_url: `${request.nextUrl.origin}/billing?success=1`,
    cancel_url: `${request.nextUrl.origin}/billing?canceled=1`,
    allow_promotion_codes: true,
    subscription_data: { metadata: { userId: user.id } },
  });
  return NextResponse.redirect(session.url!, 303);
}
