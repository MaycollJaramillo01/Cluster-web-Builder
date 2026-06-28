import Stripe from "stripe";

export function stripeClient() {
  return process.env.STRIPE_SECRET_KEY ? new Stripe(process.env.STRIPE_SECRET_KEY) : null;
}
