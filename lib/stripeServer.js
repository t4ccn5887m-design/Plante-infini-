const STRIPE_API_VERSION = "2024-06-20";

/**
 * IDs de prix Stripe pour les deux tarifs Wilder Premium.
 * Mensuel : STRIPE_PRICE_ID_MONTHLY ou STRIPE_PRICE_ID (legacy)
 * Annuel  : STRIPE_PRICE_ID_YEARLY (obligatoire pour le tarif annuel)
 */
export function getStripePriceIds() {
  const monthlyFallback = process.env.STRIPE_PRICE_ID || "";
  return {
    monthly: process.env.STRIPE_PRICE_ID_MONTHLY || monthlyFallback,
    yearly: process.env.STRIPE_PRICE_ID_YEARLY || "",
  };
}

export function getStripeSecretKey() {
  return process.env.STRIPE_SECRET_KEY || "";
}

export function isStripeTestMode() {
  const key = getStripeSecretKey();
  return key.startsWith("sk_test_");
}

export function getStripeConfigDiagnostics() {
  const key = getStripeSecretKey();
  const prices = getStripePriceIds();
  return {
    hasSecretKey: Boolean(key),
    keyMode: key.startsWith("sk_test_")
      ? "test"
      : key.startsWith("sk_live_")
        ? "live"
        : key
          ? "unknown"
          : "missing",
    priceMonthly: prices.monthly || null,
    priceYearly: prices.yearly || null,
    hasMonthlyPrice: Boolean(prices.monthly),
    hasYearlyPrice: Boolean(prices.yearly),
  };
}

export async function getStripeClient() {
  const key = getStripeSecretKey();
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

/** Résout le price ID pour monthly | yearly et vérifie la cohérence test/live. */
export async function resolveStripePriceId(stripe, plan) {
  const prices = getStripePriceIds();
  const planKey = plan === "yearly" ? "yearly" : "monthly";
  const priceId = planKey === "yearly" ? prices.yearly : prices.monthly;

  if (!priceId) {
    const envHint =
      planKey === "yearly"
        ? "STRIPE_PRICE_ID_YEARLY"
        : "STRIPE_PRICE_ID_MONTHLY ou STRIPE_PRICE_ID";
    return {
      ok: false,
      plan: planKey,
      error: "stripe_price_missing",
      message: `Variable d'environnement manquante : ${envHint}`,
    };
  }

  const isTestKey = isStripeTestMode();

  try {
    const price = await stripe.prices.retrieve(priceId);
    const priceIsTest = !price.livemode;
    if (isTestKey !== priceIsTest) {
      return {
        ok: false,
        plan: planKey,
        priceId,
        error: "stripe_price_mode_mismatch",
        message: `Le price ${priceId} est en mode ${priceIsTest ? "test" : "live"} mais la clé Stripe est en mode ${isTestKey ? "test" : "live"}.`,
      };
    }
    return { ok: true, plan: planKey, priceId, price };
  } catch (e) {
    return {
      ok: false,
      plan: planKey,
      priceId,
      error: "stripe_price_invalid",
      message: e.message || "Price Stripe invalide",
      stripeCode: e.code,
    };
  }
}
