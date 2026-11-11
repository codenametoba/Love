import "server-only";
import Stripe from "stripe";
export function stripe() {
  if (!process.env.STRIPE_SECRET_KEY)
    throw new Error(
      "Secure payments are not configured. Please contact management.",
    );
  return new Stripe(process.env.STRIPE_SECRET_KEY, { maxNetworkRetries: 2 });
}
