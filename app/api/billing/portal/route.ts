import { NextRequest, NextResponse } from "next/server";

import { getUserBySessionToken, SESSION_COOKIE } from "@/lib/auth";
import { stripeClient } from "@/lib/stripe";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  const user = await getUserBySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (!user) return NextResponse.redirect(new URL("/login?from=/billing", request.url), 303);
  const stripe = stripeClient();
  if (!stripe || !user.stripeCustomerId) return NextResponse.redirect(new URL("/billing", request.url), 303);
  const session = await stripe.billingPortal.sessions.create({ customer: user.stripeCustomerId, return_url: `${request.nextUrl.origin}/billing` });
  return NextResponse.redirect(session.url, 303);
}
