const STRIPE_API_VERSION = "2024-06-20";

export function getStripePriceIds() {
  const fallback = process.env.STRIPE_PRICE_ID || "";
  return {
    monthly: process.env.STRIPE_PRICE_ID_MONTHLY || fallback,
    yearly: process.env.STRIPE_PRICE_ID_YEARLY || "",
  };
}

export async function getStripeClient() {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  const Stripe = (await import("stripe")).default;
  return new Stripe(key, { apiVersion: STRIPE_API_VERSION });
}

export function getStripeWebhookSecret() {
  return process.env.STRIPE_WEBHOOK_SECRET || "";
}

export function getSiteUrl(req) {
  const env = process.env.NEXT_PUBLIC_SITE_URL;
  if (env) return env.replace(/\/$/, "");
  const host = req?.headers?.host;
  if (!host) return "http://localhost:3000";
  const proto = req.headers["x-forwarded-proto"] === "https" ? "https" : "http";
  return `${proto}://${host}`;
}
