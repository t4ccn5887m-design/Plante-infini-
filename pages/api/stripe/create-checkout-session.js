import { recordCgvConsentServer } from "@/lib/consentServer";
import { resolveAuthUser } from "@/lib/apiAuth";
import { getAuthUserEmail } from "@/lib/authUser";
import { resolveScanIdentity } from "@/lib/scanQuotaServer";
import {
  getSiteUrl,
  getStripeClient,
  getStripeConfigDiagnostics,
  resolveStripePriceId,
} from "@/lib/stripeServer";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ erreur: "method_not_allowed", message: "POST requis" });
  }

  const stripe = await getStripeClient();
  if (!stripe) {
    const diag = getStripeConfigDiagnostics();
    console.error("[Wilder] create-checkout-session: STRIPE_SECRET_KEY manquant", diag);
    return res.status(503).json({
      erreur: "stripe_unavailable",
      message: "STRIPE_SECRET_KEY non configurée sur le serveur",
      diagnostics: diag,
    });
  }

  const user = await resolveAuthUser(req);
  if (!user) {
    return res.status(401).json({
      erreur: "auth_required",
      needsAuth: true,
      message: "Compte permanent requis (email + connexion)",
    });
  }

  const identity = await resolveScanIdentity(req);
  if (!identity.ok) {
    return res.status(400).json({
      erreur: "missing_identity",
      message: "Identifiant visiteur manquant (header X-Wilder-Visitor-Id)",
    });
  }

  const { plan } = req.body || {};
  const planInput = plan === "yearly" ? "yearly" : "monthly";

  const cgv = await recordCgvConsentServer(user.id);
  if (!cgv.ok) {
    console.error("[Wilder] create-checkout-session: CGV consent failed", cgv);
    return res.status(503).json({
      erreur: "cgv_consent_failed",
      message: cgv.error || "Impossible d'enregistrer le consentement CGV",
      code: cgv.code,
    });
  }

  const priceResult = await resolveStripePriceId(stripe, planInput);
  if (!priceResult.ok) {
    console.error("[Wilder] create-checkout-session: price resolution failed", priceResult);
    return res.status(422).json({
      erreur: priceResult.error,
      message: priceResult.message,
      plan: priceResult.plan,
      priceId: priceResult.priceId,
      diagnostics: getStripeConfigDiagnostics(),
    });
  }

  const siteUrl = getSiteUrl(req);
  const customerEmail = getAuthUserEmail(user);
  const planKey = priceResult.plan;

  const sessionParams = {
    mode: "subscription",
    line_items: [{ price: priceResult.priceId, quantity: 1 }],
    success_url: `${siteUrl}/?stripe=success`,
    cancel_url: `${siteUrl}/?stripe=cancel`,
    client_reference_id: user.id,
    metadata: {
      user_id: user.id,
      visitor_key: identity.visitorKey,
      plan: planKey,
    },
    subscription_data: {
      metadata: {
        user_id: user.id,
        visitor_key: identity.visitorKey,
        plan: planKey,
      },
    },
  };

  if (customerEmail) {
    sessionParams.customer_email = customerEmail;
  }

  try {
    const session = await stripe.checkout.sessions.create(sessionParams);
    if (!session?.url) {
      console.error("[Wilder] create-checkout-session: Stripe returned no url", {
        sessionId: session?.id,
        plan: planKey,
      });
      return res.status(500).json({
        erreur: "checkout_no_url",
        message: "Stripe n'a pas retourné une URL de checkout",
      });
    }

    console.info("[Wilder] create-checkout-session: ok", {
      sessionId: session.id,
      plan: planKey,
      priceId: priceResult.priceId,
      userId: user.id,
    });

    return res.status(200).json({ url: session.url, sessionId: session.id, plan: planKey });
  } catch (e) {
    console.error("[Wilder] create-checkout-session Stripe error:", {
      message: e.message,
      type: e.type,
      code: e.code,
      statusCode: e.statusCode,
      plan: planKey,
      priceId: priceResult.priceId,
      diagnostics: getStripeConfigDiagnostics(),
    });

    return res.status(e.statusCode || 500).json({
      erreur: "checkout_failed",
      message: e.message || "Échec création session Stripe Checkout",
      stripeCode: e.code,
      plan: planKey,
      priceId: priceResult.priceId,
    });
  }
}
